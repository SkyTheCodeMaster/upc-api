"use strict";

import { format_element_text, request } from "./libcommon.js";
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

  let result = await lookup(upc);
  if (typeof result === "string") {
    if (result == "Not Found") {
      upc_details_upc.innerText = upc;
      upc_details_name.innerText = "Not Found";
      upc_details_quan.innerText = "";
      show_popup("UPC Not Found! Try creating the entry?", "is-danger", 2500);
    } else {
      upc_details_upc.innerText = upc;
      upc_details_name.innerText = "Error Encountered...";
      upc_details_quan.innerText = "";
      show_popup(result, "is-danger", 2500);
    }
  } else {
    format_element_text(upc_details_upc, result["upc"]);
    format_element_text(upc_details_name, result["name"]);
    format_element_text(upc_details_quan, `${result["quantity"]}${result["quantity_unit"]}`);
  }

  upc_submit.classList.remove("is-loading");
  upc_submit.removeAttribute("disabled");
}

async function setup() {
  const upc_submit = document.getElementById("upc_submit");
  const upc_input = document.getElementById("upc_input");

  upc_submit.onclick = fill_details;

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