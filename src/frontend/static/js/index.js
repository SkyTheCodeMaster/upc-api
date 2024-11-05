import { get_auth_token, request, format_element_text } from "./libcommon.js";
import { show_popup } from "./libpopup.js";

async function load_item_count() {
  let token = await get_auth_token();

  let response = await request("/api/database/get/", {"headers": {"Authorization": token}});
  if (response.status != 200) {
    show_popup(`Error fetching data!\nHTTP${response.status}: ${await response.text()}`, true, 10000);
    return
  }
  let info = await response.json();
  format_element_text("item_count_title", info["items"]);
}

async function setup() {
  await load_item_count();
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}