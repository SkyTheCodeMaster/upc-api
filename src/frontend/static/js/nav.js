"use strict";

import { format, format_element_text } from "./libcommon.js";

fetch("/sup/navbar")
.then(res => res.text())
.then(text => {
  let oldelem = document.querySelector("script#replace_with_navbar");
  let newelem = document.createElement("div");
  newelem.innerHTML = text;
  oldelem.replaceWith(newelem);
  get_user_area();
});
fetch("/sup/footer")
.then(res => res.text())
.then(text => {
  let oldelem = document.querySelector("div#replace_with_footer");
  let newelem = document.createElement("div");
  newelem.innerHTML = text;
  oldelem.replaceWith(newelem);

  // Now that footer exists, we can fill in the details
  if (window.sessionStorage.getItem("auth") != null) {
    let auth = JSON.parse(window.sessionStorage.getItem("auth"))
    fetch("/api/database/get/", {
      "headers": {
        "Authorization": "Bearer " + auth["token"]
      }
    })
      .then(res => {
        if (res.status == 429) {
          let retry_after = request.headers.get("retry-after");
          show_popup(format("Ratelimited! Retry after {0}s", retry_after), true, 10000);
        } else if (res.status == 200) {
          res.json().then(data => {
            format_element_text("footer_frontend_p", data["frontend_version"]);
            format_element_text("footer_backend_p", data["api_version"]);
          })
        }
      });
  }
});

// Toggle button for navbar.
function toggle_navmenu(burger) {
  let navbar_menu = document.getElementById("navbar_menu");
  navbar_menu.classList.toggle("is-active");
  burger.classList.toggle("is-active");
}

function get_user_area() {
  let auth_data = window.sessionStorage.getItem("auth")
  if (!auth_data) {
    fetch("https://auth.skystuff.cc/api/user/get/", { credentials: "include" })
      .then(res => {
        if (res.status == 200) {
          res.json().then( json => {
            window.sessionStorage.setItem("auth", JSON.stringify(json));
            const navbar_username = document.getElementById("navbar_username");
            const navbar_avatar = document.getElementById("navbar_avatar");
            const navbar_admin = document.getElementById("navbar_admin");
  
            if (json["super_admin"]) {
              navbar_admin.style.display = "";
            }
  
            navbar_username.innerText = json["name"];
            navbar_avatar.setAttribute("src", "https://avatar.skystuff.cc/avatar/" + json["name"] + "?size=48");
          });
        } else {
          // User isn't logged in
          const navbar_username = document.getElementById("navbar_username");
          const navbar_avatar = document.getElementById("navbar_avatar");
  
          navbar_username.innerText = "Log In";
          navbar_username.setAttribute("href", "https://auth.skystuff.cc/login?r="+encodeURIComponent(window.location.href));
          navbar_avatar.style.display="none";
        }
      }).catch(err => {});
  } else {
    let auth = JSON.parse(window.sessionStorage.getItem("auth"));
    const navbar_username = document.getElementById("navbar_username");
    const navbar_avatar = document.getElementById("navbar_avatar");
    const navbar_admin = document.getElementById("navbar_admin");

    if (auth["super_admin"]) {
      navbar_admin.style.display = "";
    }

    navbar_username.innerText = auth["name"];
    navbar_avatar.setAttribute("src", "https://avatar.skystuff.cc/avatar/" + auth["name"] + "?size=48");
  }
}