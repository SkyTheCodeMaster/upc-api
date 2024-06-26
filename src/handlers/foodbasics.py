from __future__ import annotations

from typing import TYPE_CHECKING

from bs4 import BeautifulSoup

from utils.item import Item
from utils.size import split_size

if TYPE_CHECKING:
  from typing import Union
  from bs4 import Tag

  from aiohttp import ClientSession


async def get_foodbasics(
  cs: ClientSession, upc: Union[str, int]
) -> False | Item:
  url = f"https://www.foodbasics.ca/aisles/a/a/a/a/p/{upc}"

  headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0"
  }

  async with cs.get(url, headers=headers) as resp:
    # We need to process the raw html. Yikes lol

    html = await resp.text()

    soup = BeautifulSoup(html, "html.parser")

    if "Something's not right!" in soup.get_text():
      return False

    # Extract all the table rows
    brand: Tag = soup.find_all("div", {"class": "pi--brand"})[0]
    name: Tag = soup.find_all("h1", {"class": "pi--title"})[0]
    weight: Tag = soup.find_all("div", {"class": "pi--weight"})[0]

    try:
      quantity, quantity_name = split_size(weight.get_text())
    except Exception:
      quantity, quantity_name = None, None

    final_name = f"{brand.get_text()} {name.get_text()}"

    i = Item(
      upc=upc, name=final_name, quantity=quantity, quantity_unit=quantity_name
    )

    return i
