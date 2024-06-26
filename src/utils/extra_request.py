from __future__ import annotations

from typing import TYPE_CHECKING

from aiohttp.web import Application as BaseApplication
from aiohttp.web import Request as BaseRequest

if TYPE_CHECKING:
  from logging import Logger
  from aiohttp import ClientSession

  from asyncpg import Connection, Pool
  from utils.limiter import Limiter


class Application(BaseApplication):
  pool: Pool
  LOG: Logger
  cs: ClientSession
  limiter: Limiter


class Request(BaseRequest):
  app: Application
  conn: Connection
  pool: Pool
  LOG: Logger
  session: ClientSession
