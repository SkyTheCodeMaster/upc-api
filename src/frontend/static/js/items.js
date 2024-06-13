"use strict";


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
  remove_children(table_body);

  for (let item of items) {
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
  } else {
    pagination_previous.classList.remove("is-disabled");
    pagination_previous.removeAttribute("disabled");
    pagination_previous_bottom.classList.remove("is-disabled");
    pagination_previous_bottom.removeAttribute("disabled");
  }
  if (current_page == total_pages-1) {
    pagination_next.classList.add("is-disabled");
    pagination_next.setAttribute("disabled", true)
    pagination_next.onclick = function() {};
    pagination_next_bottom.classList.add("is-disabled");
    pagination_next_bottom.setAttribute("disabled", true)
    pagination_next_bottom.onclick = function() {};
  } else {
    pagination_next.classList.remove("is-disabled");
    pagination_next.removeAttribute("disabled");
    pagination_next_bottom.classList.remove("is-disabled");
    pagination_next_bottom.removeAttribute("disabled");
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

  let request = await fetch("/api/upc/list/?offset="+offset);
  if (request.status != 200) {
    if (request.status == 429) {
      let retry_after = request.headers.get("retry-after");
      show_popup(format("Ratelimited! Retry after {0}s", retry_after), true, 10000);
      return;
    }
    show_popup(format("Error fetching data!\nHTTP{0}: {1}", request.status, await request.text()), true, 10000);
    return
  }
  let data = await request.json();

  let items = data["items"];
  fill_table(items);
  // Fill the showing_x_of_y_items_p element.
  let showing_x_of_y_items_h1 = document.getElementById("showing_x_of_y_items_h1");
  showing_x_of_y_items_h1.innerText = format(showing_x_of_y_items_h1.innerText, data["returned"], data["total"]);
  let page_x_of_y_items_h1 = document.getElementById("page_x_of_y_items_h1");
  let current_page = page+1;
  let total_pages = Math.ceil(data["total"]/50);
  page_x_of_y_items_h1.innerText = format(page_x_of_y_items_h1.innerText, current_page, total_pages);

  fill_page_selector(data)
}

async function setup() {
  let current_page = Number(window.location.hash.slice(1));
  if (isNaN(current_page)) {
    window.location.hash = "0";
    window.location.reload();
  }
  await fill_all();
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}