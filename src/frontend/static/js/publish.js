"use strict";

import { format_element_text, get_auth_token, request } from "./libcommon.js";
import { show_popup } from "./libpopup.js";

async function lookup(upc) {
  let resp = await request("/api/upc/" + upc);
  if (resp.status == 200) {
    return await resp.json();
  } else if (resp.status == 404) {
    return "Not Found"
  } else {
    return `HTTP${resp.status}: ${await resp.text()}`
  }
}

async function fill_details() {
  const upc_submit = document.getElementById("upc_submit");

  
  upc_submit.classList.add("is-loading");
  upc_submit.setAttribute("disabled", true);

  const upc_input = document.getElementById("upc_input");
  let upc = upc_input.value;

  const upc_details_upc = document.getElementById("upc_details_upc");
  const upc_details_name = document.getElementById("upc_details_name");
  const upc_details_quan = document.getElementById("upc_details_quan");
  const upc_details_quan_unit = document.getElementById("upc_details_quan_unit");

  let result = await lookup(upc);
  if (typeof result === "string") {
    if (result == "Not Found") {
      upc_details_upc.value = upc;
      upc_details_name.value = "Not Found";
      upc_details_quan.value = "";
      upc_details_quan_unit.value = "";
      show_popup("UPC Not Found! Try creating the entry?", "is-danger", 2500);
    } else {
      upc_details_upc.value = upc;
      upc_details_name.value = "Error Encountered...";
      upc_details_quan.value = "";
      upc_details_quan_unit.value = "";
      show_popup(result, "is-danger", 2500);
    }
  } else {
    upc_details_upc.value = result["upc"];
    upc_details_name.value = result["name"];
    upc_details_quan.value = result["quantity"];
    upc_details_quan_unit.value = result["quantity_unit"];
  }

  upc_submit.classList.remove("is-loading");
  upc_submit.removeAttribute("disabled");
}

async function publish() {
  const upc_publish = document.getElementById("upc_publish");
  const upc_details_upc = document.getElementById("upc_details_upc");
  const upc_details_name = document.getElementById("upc_details_name");
  const upc_details_quan = document.getElementById("upc_details_quan");
  const upc_details_quan_unit = document.getElementById("upc_details_quan_unit");

  upc_publish.classList.add("is-loading");
  upc_publish.setAttribute("disabled", true);

  if (["Not Found","Error Encountered..."].includes(upc_details_name.value)) {
    show_popup("Invalid name!", "is-danger", 2500);

    upc_publish.classList.remove("is-loading");
    upc_publish.removeAttribute("disabled");
    return;
  }

  let token = await get_auth_token(false);
  if (!token) {
    show_popup("Please authenticate!", "is-danger", 2500);

    upc_publish.classList.remove("is-loading");
    upc_publish.removeAttribute("disabled");
    return;
  }

  let body = {
    "upc": upc_details_upc.value,
    "name": upc_details_name.value,
    "quantity": upc_details_quan.value,
    "quantity_unit": upc_details_quan_unit.value
  };

  let response = await request("/api/upc/", {
    "method": "POST",
    "body": JSON.stringify(body),
    "headers": {
      "Authorization": token
    }
  });

  if (response.status === 200) {
    show_popup("Updated UPC info!", "is-primary", 2500);
  } else {
    show_popup(`HTTP${response.status}:\n${await response.text()}`, "is-danger", 2500);
  }

  upc_publish.classList.remove("is-loading");
  upc_publish.removeAttribute("disabled");
}

async function setup() {
  const upc_submit = document.getElementById("upc_submit");
  const upc_input = document.getElementById("upc_input");
  const upc_publish = document.getElementById("upc_publish");

  upc_input.onclick = fill_details;
  upc_publish.onclick = publish;

  upc_input.addEventListener("keypress", function(e) {
    if (e.code === "Enter") {
      upc_submit.click();
    }
  })

  if (window.location.hash != "") {
    // Stick the hash into the input box and push the button.
    upc_input.value = window.location.hash.substring(1);
    upc_submit.click();
  }
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}