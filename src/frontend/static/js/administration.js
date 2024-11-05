"use strict";

import { get_auth_token, request } from "./libcommon.js";
import { show_popup } from "./libpopup.js";

async function backup() {
  let token = await get_auth_token();
  let resp = await request("/api/admin/backup/", {
    "method": "POST",
    "headers": {
      "Authorization": token
    }
  });

  if (resp.status == 200) {
    show_popup("Backed up database!");
    setTimeout(function() { window.location = "/database"; }, 1000);
  }
}

async function clear_misses() {
  let token = await get_auth_token();
  let resp = await request("/api/admin/clearmisses/", {
    "method": "POST",
    "headers": {
      "Authorization": token
    }
  });

  if (resp.status == 204) {
    show_popup("Cleared misses!");
    setTimeout(function() { window.location = "/misses"; }, 1000);
  }
}

async function setup() {
  const button_backup = document.getElementById("button_backup");
  const button_clearmisses = document.getElementById("button_clearmisses");

  button_backup.onclick = backup;
  button_clearmisses.onclick = clear_misses;
}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}