import { get_auth_token, sleep } from "./libcommon";

async function load_item_count() {
  let request = await fetch("/api/database/get/");
  if (request.status != 200) {
    if (request.status == 429) {
      let retry_after = request.headers.get("retry-after");
      show_popup(format("Ratelimited! Retry after {0}s", retry_after), true, 10000);
      return;
    }
    show_popup(format("Error fetching data!\nHTTP{0}: {1}", request.status, await request.text()), true, 10000);
    return
  }
  let info = await request.json();
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