"use strict";

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

function fill_page_selector(data) {
  let current_page = Number(window.location.hash.slice(1));
  let visible_page = current_page+1; // This is for showing the user.
  let total_pages = Math.ceil(data["total"]/50);
  let pagination_list = document.getElementById("pagination_list");
  let pagination_next = document.getElementById("pagination_next");
  let pagination_previous = document.getElementById("pagination_previous");
  let pagination_list_bottom = document.getElementById("pagination_list_bottom");
  let pagination_next_bottom = document.getElementById("pagination_next_bottom");
  let pagination_previous_bottom = document.getElementById("pagination_previous_bottom");

  async function go_to_page(pg) {
    window.location.hash = pg;
    //window.location.reload();
    await fill_all();
  }

  // Clear old data
  remove_children(pagination_list);
  remove_children(pagination_list_bottom);

  // Make buttons work.
  pagination_previous.onclick = async function() { await go_to_page(current_page-1); }
  pagination_next.onclick = async function() { await go_to_page(current_page+1); }
  pagination_previous_bottom.onclick = async function() { await go_to_page(current_page-1); }
  pagination_next_bottom.onclick = async function() { await go_to_page(current_page+1); }

  if (current_page == 0) {
    // We don't need a previous if the page is 0.
    pagination_previous.classList.add("is-disabled");
    pagination_previous.setAttribute("disabled", true);
    pagination_previous.onclick = function() {};
    pagination_previous_bottom.classList.add("is-disabled");
    pagination_previous_bottom.setAttribute("disabled", true);
    pagination_previous_bottom.onclick = function() {};
  }
  if (current_page == total_pages-1) {
    pagination_next.classList.add("is-disabled");
    pagination_next.setAttribute("disabled", true)
    pagination_next.onclick = function() {};
    pagination_next_bottom.classList.add("is-disabled");
    pagination_next_bottom.setAttribute("disabled", true)
    pagination_next_bottom.onclick = function() {};
  }

  // For the list, we want to show:
  // 1 ... current_page-1, current_page, current_page+1 ... total_pages
  // and hide the (... current_page+-1) if that is 1 or total_pages.
  // Build the two end elements.
  let button_goto_one = create_element("a", {
    "classes":[
      "pagination-link"
    ],
    "inner_text":"1",
    "listeners": {
      "click": async function() { await go_to_page(0); }
    }
  });
  let li_goto_one = create_element("li", {"children":[button_goto_one]});

  let span_ellipsis = create_element("span", {"classes":["pagination-ellipsis"],"inner_html":"&hellip;"});
  let li_ellipsis = create_element("li", {"children":[span_ellipsis]});

  let button_goto_end = create_element("a", {
    "classes":[
      "pagination-link"
    ],
    "inner_text":total_pages,
    "listeners": {
      "click": async function() { await go_to_page(total_pages-1); }
    }
  });
  let li_goto_end = create_element("li", {"children":[button_goto_end]});

  let button_previous_page = create_element("a", {
    "classes":[
      "pagination-link"
    ],
    "inner_text":visible_page-1,
    "listeners": {
      "click": async function() { await go_to_page(current_page-1); }
    }
  });
  let li_previous_page = create_element("li", {"children":[button_previous_page]});

  let button_current_page = create_element("a", {"classes":["pagination-link","is-current"],"inner_text":visible_page});
  let li_current_page = create_element("li", {"children":[button_current_page]});

  let button_next_page = create_element("a", {
    "classes":[
      "pagination-link"
    ],
    "inner_text":visible_page+1,
    "listeners": {
      "click": async function() {await go_to_page(current_page+1); }
    }
  });
  let li_next_page = create_element("li", {"children":[button_next_page]});

  if (current_page != 0) {
    // Also, if the current page is 0, no sense in showing the first button.
    pagination_list.appendChild(li_goto_one.recreate(true));
    pagination_list_bottom.appendChild(li_goto_one.recreate(true));
  }
  if (current_page != 0 && current_page-1 != 0) {
    // The previous page is not the first, so show the side.
    pagination_list.appendChild(li_ellipsis.recreate(true));
    pagination_list.appendChild(li_previous_page.recreate(true));
    pagination_list_bottom.appendChild(li_ellipsis.recreate(true));
    pagination_list_bottom.appendChild(li_previous_page.recreate(true));
  }

  pagination_list.appendChild(li_current_page.recreate(true));
  pagination_list_bottom.appendChild(li_current_page.recreate(true));

  if (current_page != total_pages-1) {
    pagination_list.appendChild(li_next_page.recreate(true));
    pagination_list_bottom.appendChild(li_next_page.recreate(true));
  }
  if (current_page+1 != total_pages && current_page+1 != total_pages-1) {
    pagination_list.appendChild(li_ellipsis.recreate(true));
    pagination_list.appendChild(li_goto_end.recreate(true));
    pagination_list_bottom.appendChild(li_ellipsis.recreate(true));
    pagination_list_bottom.appendChild(li_goto_end.recreate(true));
  }
}

async function fill_all() {
  let page = Number(window.location.hash.slice(1));
  let offset = page*50;

  let backups_request = await fetch("/api/database/backups/list/?offset="+offset);
  let backups_data = await backups_request.json();
  
  let backups = backups_data["backups"];
  fill_table(backups);
  // Fill the showing_x_of_y_backups_p element.
  format_element_text("showing_x_of_y_backups_h1", backups_data["returned"], backups_data["total"]);
  let current_page = page+1;
  let total_pages = Math.ceil(backups_data["total"]/50);
  format_element_text("page_x_of_y_backups_h1", current_page, total_pages);

  fill_page_selector(backups_data)

  let db_request = await fetch("/api/database/get/");
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