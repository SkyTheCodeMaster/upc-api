from __future__ import annotations

import datetime
import math
import tomllib
import urllib.parse
from typing import TYPE_CHECKING

from aiohttp import web
from aiohttp.web import Response
from aiohttplimiter import Limiter, default_keyfunc
from asyncpg.exceptions import UniqueViolationError

from handlers.local import get_local
from utils.get_item import get_upc
from utils.item import Item
from utils.validate import validate

if TYPE_CHECKING:
  from utils.extra_request import Request

with open("config.toml") as f:
  config = tomllib.loads(f.read())
  exempt_ips = config["srv"]["ratelimit_exempt"]
  local_only = config["data-source"]["local_only"]

limiter = Limiter(default_keyfunc, exempt_ips)

routes = web.RouteTableDef()


@routes.get("/upc/bulk/")
@limiter.limit("30/minute")
async def get_upc_bulk_aiohttp(request: Request) -> Response:
  upc_raw = request.query["upcs"]
  total_requested = 0
  good = []
  try:
    upc_list = upc_raw.split(",")
    upc_list = list(set(upc_list))
    total_requested = len(upc_list)
    for upc in upc_list:
      if upc.isdigit():
        code, guess = validate(upc)
        if code is not False:
          good.append(code)
  except Exception:
    return Response(status=400, body="error in parsing upc list")

  if len(good) > 50:
    return Response(status=400, body="More than 50 UPCs requested!")

  records = await request.conn.fetch(
    "SELECT * FROM Items WHERE upc = ANY($1);", good
  )  # This is horrible and I hate it.
  total_found = len(records)
  upc_dict: dict[str, str] = {}
  for record in records:
    item = Item.from_record(record)
    upc_dict[item.upc] = item.dump

  misses = [upc for upc in good if upc not in upc_dict]
  if misses:
    try:
      # Build the misses into a query
      timestamp = math.floor(datetime.datetime.utcnow().timestamp())
      code, guess = validate(upc)
      args = [
        (guess["guess"], upc, guess["upce.converted"], timestamp)
        for upc in misses
      ]
      await request.conn.executemany(
        """INSERT INTO Misses (Type, UPC, Converted, Date) VALUES $1;""", args
      )
    except Exception:
      pass
  packet = {
    "requested": total_requested,
    "found": total_found,
    "items": upc_dict,
  }
  return web.json_response(packet)


@routes.get("/upc/list/")
@limiter.limit("30/minute")
async def get_upc_list(request: Request) -> Response:
  query = request.query

  try:
    offset = int(query.get("offset", "0"))
  except ValueError:
    return Response(status=400, text="offset must be integer!")
  try:
    limit = int(query.get("limit", "50"))
  except ValueError:
    return Response(status=400, text="limit must be integer!")

  item_records = await request.conn.fetch(
    "SELECT * FROM Items LIMIT $1 OFFSET $2;", limit, offset
  )
  items = [Item.from_record(record).dump for record in item_records]
  count_record = await request.conn.fetchrow("SELECT COUNT(*) FROM Items;")
  count = count_record.get("count")

  out = {"total": count, "returned": len(items), "items": items}

  return web.json_response(out)


@routes.post("/upc/")
@limiter.limit("10/minute")
async def post_upc(request: Request) -> Response:
  if not request.app.config["api"]["uploading"]["enabled"]:
    return web.Response(status=403, text="Uploading disabled.")

  data: dict = await request.json()
  if "upc" not in data:
    return web.Response(status=400, body="upc not passed")
  upc = data["upc"]
  code, guess = validate(upc)
  if code is False:
    return Response(status=400, body=f"Invalid {guess}")

  local_item = await get_local(request.conn, data["upc"])
  if local_item:
    await request.conn.execute(
      """
        INSERT INTO
          Items (type, upc, name, quantity, quantityunit)
        VALUES
          ($1, $2, $3, $4, $5)
        ON CONFLICT (upc)
        DO
          UPDATE SET
            type = $2,
            name = $3,
            quantity = $4,
            quantityunit = $5;
        """,
      guess["guess"],
      data["upc"],
      data.get("name", local_item.name),
      data.get("quantity", local_item.quantity),
      data.get("quantity_unit", local_item.quantity_unit),
    )
    return web.Response(status=200)
  else:
    await request.conn.execute(
      """
        INSERT INTO
          Items (type, upc, name, quantity, quantityunit)
        VALUES
          ($1, $2, $3, $4, $5)
        ON CONFLICT (upc)
        DO
          UPDATE SET
            type = $2,
            name = $3,
            quantity = $4,
            quantityunit = $5;
        """,
      guess["guess"],
      data["upc"],
      data.get("name", None),
      data.get("quantity", None),
      data.get("quantity_unit", None),
    )
    return web.Response(status=200)


@routes.get("/validate/bulk/")
async def get_validate_bulk(request: web.Request) -> web.Response:
  upc_raw = request.query["upcs"]
  packet = {}
  try:
    upc_list = upc_raw.split(",")
    upc_list = list(set(upc_list))
    for upc in upc_list:
      if upc.isdigit():
        code, error = validate(upc)
        packet[upc] = code is not False
  except Exception:
    return Response(status=400, body="error in parsing upc list")

  return web.json_response(packet)


@routes.get("/validate/{upc:.*}")
async def get_validate(request: web.Request) -> web.Response:
  upc = request.match_info["upc"]
  code, error = validate(upc)

  packet = {
    "ok": code is not False,
    "type": error["guess"],
    "converted": error["upce.converted"],
  }

  return web.json_response(packet)


@routes.get("/upc/misses/")
async def get_upc_misses(request: Request) -> Response:
  query = request.query

  try:
    offset = int(query.get("offset", "0"))
  except ValueError:
    return Response(status=400, text="offset must be integer!")
  try:
    limit = int(query.get("limit", "50"))
  except ValueError:
    return Response(status=400, text="limit must be integer!")

  miss_records = await request.conn.fetch(
    "SELECT * FROM Misses LIMIT $1 OFFSET $2;", limit, offset
  )
  misses = [
    {
      "type": record.get("type"),
      "upc": record.get("upc"),
      "converted": record.get("converted"),
      "date": datetime.datetime.fromtimestamp(record.get("date", 0)).strftime(
        "%Y/%m/%d-%H:%M:%S"
      ),
    }
    for record in miss_records
  ]
  count_record = await request.conn.fetchrow("SELECT COUNT(*) FROM Misses;")
  count = count_record.get("count")

  out = {"total": count, "returned": len(misses), "misses": misses}

  return web.json_response(out)


@routes.get("/upc/search/")
async def get_upc_search(request: Request) -> Response:
  query = request.query

  search_text = query.get("s", None)
  if search_text is None:
    return Response(status=400, text="pass s parameter!")

  search_text = urllib.parse.unquote_plus(search_text)

  try:
    offset = int(query.get("offset", "0"))
  except ValueError:
    return Response(status=400, text="offset must be integer!")
  try:
    limit = int(query.get("limit", "50"))
  except ValueError:
    return Response(status=400, text="limit must be integer!")

  item_records = await request.conn.fetch(
    "SELECT * FROM Items WHERE Name ILIKE $1 LIMIT $2 OFFSET $3;",
    f"%{search_text}%",
    limit,
    offset,
  )
  count_record = await request.conn.fetchrow("SELECT COUNT(*) FROM Items;")
  count = count_record.get("count")

  items = [Item.from_record(record).dump for record in item_records]

  out = {"total": count, "returned": len(items), "items": items}

  return web.json_response(out)


@routes.get("/upc/{upc:\d+}")
@limiter.limit("30/minute")
async def get_upc_aiohttp(request: Request) -> Response:
  print("got request", request)
  upc = request.match_info["upc"]
  code, guess = validate(upc)
  if code is False:
    return Response(status=400, body=f"Invalid {guess}")

  item = await get_upc(
    request.pool, request.session, upc, local_only=local_only
  )
  if item:
    return web.json_response(item.dump)
  else:
    timestamp = math.floor(datetime.datetime.utcnow().timestamp())
    try:
      await request.conn.execute(
        """INSERT INTO Misses (Type, UPC, Converted, Date) VALUES ($1, $2, $3);""",
        guess["guess"],
        upc,
        guess["upce.converted"],
        timestamp,
      )
    except UniqueViolationError:
      pass  # This doesn't matter.
    return web.Response(status=404)


async def setup(app: web.Application) -> None:
  for route in routes:
    app.LOG.info(f"  ↳ {route}")
  app.add_routes(routes)
