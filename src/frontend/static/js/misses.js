"use strict";

import { format_element_text, walk_paginator, create_element } from "./libcommon.js";

/*
<tr>
  <td>{{ row.upc }}</td>
  <td>{{ row.name }}</td>
  <td>{{ row.quantity }}{{ row.quantity_unit }}</td>
  <td><button class="button is-success is-small" onclick="window.location='/lookup#{{ row.upc }}'">View</button></td>
  <td><button class="button is-link is-small" onclick="window.location='/publish#{{ row.upc }}'">Edit</button></td>
</tr>
*/

function generate_table_row(miss) {
  // Take in object of upc, name, quanity, and quantity_unit (output from API)
  // Create all the elements

  let td_type = create_element("td",{"inner_text":miss["type"]});
  let td_upc = create_element("td",{"inner_text":miss["upc"]});
  let td_converted = create_element("td",{"inner_text":miss["converted"]});
  let td_date = create_element("td",{"inner_text":miss["date"]});

  let button_create = create_element("button",{"classes":["button","is-link","is-small"],"inner_text":"Create"});
  button_create.onclick = function() {window.location="/publish#"+miss["upc"];}
  let td_button_create = create_element("td",{"children":[button_create]});

  let button_google = create_element("a",{
    "classes": [
      "button",
      "is-success",
      "is-small"
    ],
    "inner_text":"Google",
    "attributes": {
      "href": format("https://www.google.com/search?q={0}", miss["upc"]),
      "target": "_blank"
    }
  });
  let td_button_google = create_element("td",{"children":[button_google]});

  let tr = create_element("tr",{"children":[
    td_type,
    td_upc,
    td_converted,
    td_date,
    td_button_create,
    td_button_google
  ]})

  return tr;
}

function fill_table(misses) {
  // This is the resp["misses"] part of API response.
  let table_body = document.getElementById("miss_table_tbody");
  remove_children(table_body);

  for (let miss of misses) {
    let tr = generate_table_row(miss);
    table_body.appendChild(tr);
  }
}

async function fill_all() {
  let misses = await walk_paginator("misses", "/api/upc/misses/");
  fill_table(misses);
  format_element_text("showing_x_items_h1", misses.length);
}

async function setup() {
  fill_all();
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}