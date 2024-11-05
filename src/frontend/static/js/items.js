"use strict";

import { format_element_text, walk_paginator, remove_children, create_element } from "./libcommon.js";

function generate_table_row(upc) {
  // Take in object of upc, name, quanity, and quantity_unit (output from API)
  // Create all the elements

  let td_type = create_element("td",{"inner_text":upc["type"]});
  let td_upc = create_element("td",{"inner_text":upc["upc"]});
  let td_name = create_element("td",{"inner_text":upc["name"]});
  let td_quantity = create_element("td",{"inner_text":upc["quantity"] + upc["quantity_unit"]});
  let button_lookup = create_element("button", {"classes":["button","is-success","is-small"],"inner_text":"View"});
  button_lookup.onclick = function() {window.location="/lookup#"+upc["upc"];}
  let td_button_lookup = create_element("td",{"children":[button_lookup]});
  let button_edit = create_element("button", {"classes":["button","is-link","is-small"],"inner_text":"Edit"});
  button_edit.onclick = function() {window.location="/publish#"+upc["upc"];}
  let td_button_edit = create_element("td",{"children":[button_edit]});
  
  // Nest elements
  let tr = create_element("tr",{
    "children": [
      td_type,
      td_upc,
      td_name,
      td_quantity,
      td_button_lookup,
      td_button_edit
    ]
  })

  return tr;
}

function fill_table(items) {
  // This is the resp["items"] part of API response.
  let table_body = document.getElementById("item_table_tbody");

  items.sort((a,b) => (a.upc - b.upc))
  remove_children(table_body);

  for (let item of items) {
    let tr = generate_table_row(item);
    table_body.appendChild(tr);
  }
}

async function fill_all() {
  let items = await walk_paginator("items", "/api/upc/list/");

  fill_table(items);
  // Fill the showing_x_of_y_items_p element.
  format_element_text("showing_x_items_h1", items.length);
}

async function setup() {
  await fill_all();
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}