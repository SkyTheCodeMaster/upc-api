"use strict";

import { walk_paginator, request } from "./libcommon.js";
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
  let tr = document.createElement("tr");
  let td_paste = document.createElement("td");
  let a_paste = document.createElement("a");
  a_paste.href = "https://paste.skystuff.cc/"+row["paste"];
  a_paste.innerText = row["paste"];
  td_paste.appendChild(a_paste);
  let td_date = document.createElement("td");
  td_date.innerText = row["date"];
  
  // Nest elements
  tr.append(td_paste);
  tr.append(td_date);

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

  fill_page_selector(backups_data)

  let db_request = await request("/api/database/get/");
  if (db_request.status != 200) {
    show_popup(format("Error fetching data!\nHTTP{0}: {1}", db_request.status, await db_request.text()), true, 10000);
    return
  }
  let db_data = await db_request.json();
  format_element_text("database_info_items", db_data["items"]);
  format_element_text("database_info_total_backups", db_data["backups"]);
  format_element_text("database_info_database_size", db_data["db_size"]);
}

async function setup() {
  let current_page = Number(window.location.hash.slice(1));
  if (isNaN(current_page)) {
    window.location.hash = "0";
    window.location.reload();
  }
  fill_all();
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}