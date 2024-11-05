"use strict";

import { walk_paginator, request, remove_children, create_element, format_element_text } from "./libcommon.js";
import { show_popup } from "./libpopup.js";

/*
<tr>
  <td>{{ row.upc }}</td>
  <td>{{ row.name }}</td>
  <td>{{ row.quantity }}{{ row.quantity_unit }}</td>
  <td><button class="button is-success is-small" onclick="window.location='/lookup#{{ row.upc }}'">View</button></td>
  <td><button class="button is-link is-small" onclick="window.location='/publish#{{ row.upc }}'">Edit</button></td>
</tr>
*/

function generate_table_row(row) {
  // Take in object of upc, name, quanity, and quantity_unit (output from API)
  // Create all the elements
  let a_paste = create_element("a", {
    "inner_text": row["paste"],
    "attributes": {
      "href": "https://paste.skystuff.cc/"+row["paste"]
    }
  });
  let td_paste = create_element("td", {
    "children": [a_paste]
  });
  let td_date = create_element("td", {
    "inner_text": row["date"]
  });
  
  // Nest elements
  let tr = create_element("tr", {
    "children": [
      td_paste,
      td_date
    ]
  })

  return tr;
}

function fill_table(backups) {
  // This is the resp["backups"] part of API response.
  let table_body = document.getElementById("backup_table_tbody");
  remove_children(table_body);

  for (let item of backups) {
    let tr = generate_table_row(item);
    table_body.appendChild(tr);
  }
}

async function fill_all() {
  let backups = await walk_paginator("backups", "/api/database/backups/list/");
  fill_table(backups);
  // Fill the showing_x_of_y_backups_p element.
  format_element_text("showing_x_of_y_backups_h1", backups.length);

  let db_request = await request("/api/database/get/");
  if (db_request.status != 200) {
    show_popup(`Error fetching data!\nHTTP${db_request.status}: ${await db_request.text()}`, "is-danger", 5000);
    return;
  }

  let db_data = await db_request.json();
  format_element_text("database_info_items", db_data["items"]);
  format_element_text("database_info_total_backups", db_data["backups"]);
  format_element_text("database_info_database_size", db_data["db_size"]);
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