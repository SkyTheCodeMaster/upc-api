from __future__ import annotations

import asyncio
import logging

import aiohttp
import asyncpg

from handlers import all_handlers, get_local
from utils.item import Item

LOG = logging.getLogger()


async def get_upc(
  conn: asyncpg.Connection,
  cs: aiohttp.ClientSession,
  upc: str | int,
  *,
  local_only: bool = False,
) -> False | Item:
  # First we should try to get it from local cache
  item = None
  try:
    conn: asyncpg.Connection
    LOG.info(f"[LOCAL] Getting {upc}...")
    item = await get_local(conn, upc)
  except Exception:
    LOG.exception("Local cache fail!")

  # If not, run through the handlers and try to get it from there.
  if item:
    return item
  if local_only:
    return False

  async def _run_handler(handler, cs, upc):
    try:
      async with asyncio.timeout(0.5):
        LOG.info(
          f"[EXTERNAL] Attempting to get {upc} from {handler.__name__}..."
        )
        print("trying to run handler", handler.__name__)
        result = await handler(cs, upc)
        if result:
          LOG.info(f"[EXTERNAL] Got result from {handler.__name__}!")
          return result
        else:
          LOG.info(f"[EXTERNAL] Failed to get {upc} from {handler.__name__}!")
          return None
    except Exception:
      LOG.exception(f"{handler.__name__} fail!")
      return None

  tasks: list[asyncio.Task] = [
    asyncio.create_task(_run_handler(handler, cs, upc))
    for handler in all_handlers
  ]
  await asyncio.gather(*tasks)

  for task in tasks:
    if task.done():
      result = task.result()
      if result:
        item = result
        break

  if item:
    # We're gonna try to insert into the database
    try:
      await conn.execute(
        """
          INSERT INTO
            Items (type, upc, name, quantity, quantityunit)
          VALUES
            ($1, $2, $3, $4, $5)
          ON CONFLICT (upc)
          DO
            UPDATE SET
              type = $1,
              name = $3,
              quantity = $4,
              quantityunit = $5;
          """,
        item.type,
        item.upc,
        item.name,
        item.quantity,
        item.quantity_unit,
      )
    except Exception:
      LOG.exception("[DB INSERT] Failed!")

    return item
  return False
