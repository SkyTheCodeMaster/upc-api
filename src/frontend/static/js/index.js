async function load_item_count() {
  let request = await fetch("/api/database/get/");
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