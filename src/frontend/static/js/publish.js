function run_upc(button) {
  // This adds the existing information to the table.
  button.classList.add("is-loading");
  button.setAttribute("disabled", true);
  var upc = document.getElementById("upc-input").value;
  // Now we want to try and get it from the API.
  var URL = "/api/upc/" + upc;

  var request = new XMLHttpRequest();
  request.open("GET", URL);
  request.send();
  request.onload = function() {
    if (request.status == 200) {
      var data = JSON.parse(request.responseText);
      // Now we have 'upc', 'name', 'quantity', and 'quantity_unit' fields.
      document.getElementById("upc-details-upc").innerText = "UPC:  " + data["upc"];
      document.getElementById("upc-details-name").value = data["name"];
      if (data["quantity"]) {
        document.getElementById("upc-details-quan").value = data["quantity"];
        document.getElementById("upc-details-quan-unit").value = data["quantity_unit"];
      } else {
        document.getElementById("upc-details-quan").value = "";
        document.getElementById("upc-details-quan-unit").value = "";
      }
      button.classList.remove("is-loading");
      button.removeAttribute("disabled");
      document.getElementById("upc-input").value = "";
    } else if (request.status == 404) {
      document.getElementById("upc-details-upc").innerText = "UPC:  " + upc;
      button.classList.remove("is-loading");
      button.removeAttribute("disabled");
      document.getElementById("upc-input").value = "";
    } else {
      create_popup("HTTP" + request.status + ": " + request.responseText, true);
      button.classList.remove("is-loading");
      button.removeAttribute("disabled");
      document.getElementById("upc-input").value = "";
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function submit(button) {
  button.classList.add("is-loading");
  button.setAttribute("disabled", true);
  var upc = document.getElementById("upc-details-upc").innerText.substring(5);
  var name = document.getElementById("upc-details-name").value;
  var quantity = document.getElementById("upc-details-quan").value;
  var quantity_unit = document.getElementById("upc-details-quan-unit").value;
  // Now we want to try and get it from the API.
  var URL = "/api/upc/";

  var packet = {
    "upc": upc,
    "name": name,
    "quantity": quantity,
    "quantity_unit": quantity_unit
  }

  let token;
  if (window.sessionStorage.getItem("auth")) {
    let auth = JSON.parse(window.sessionStorage.getItem("auth"))
    token = "Bearer " + auth["token"];
  } else {
    show_popup("Please log in to use this functionality!", true, 2500);
    button.classList.remove("is-loading");
    button.classList.remove("is-link");
    button.classList.remove("is-success");
    button.classList.add("is-danger");
    sleep(1000).then(function() {
      button.removeAttribute("disabled");
      button.classList.remove("is-danger");
      button.classList.add("is-link");
    });
    return;
  }

  var request = new XMLHttpRequest();
  request.open("POST", URL);
  request.setRequestHeader("Authorization", token);
  request.send(JSON.stringify(packet));
  request.onload = function() {
    if (request.status == 200) {
      button.classList.remove("is-link");
      button.classList.remove("is-loading");
      button.classList.remove("is-danger");
      button.classList.add("is-success");
      button.removeAttribute("disabled");
      sleep(1000).then(function() {
        button.classList.remove("is-success");
        button.classList.add("is-link");
      });
    } else {
      create_popup("HTTP" + request.status + ": " + request.responseText, true);
      button.classList.remove("is-loading");
      button.classList.remove("is-link");
      button.classList.remove("is-success");
      button.classList.add("is-danger");
      button.removeAttribute("disabled");
      sleep(1000).then(function() {
        button.classList.remove("is-danger");
        button.classList.add("is-link");
      });
    }
  }
}



async function setup() {
  // Make enter press the submit button too
  document.getElementById("upc-input").addEventListener("keypress", function(e) {
    if (e.keyCode == 13) {
      document.getElementById("upc-submit").click();
    }
  })
  
  if (window.location.hash != "") {
    // Stick the hash into the input box and push the button.
    document.getElementById("upc-input").value = window.location.hash.substring(1);
    document.getElementById("upc-submit").click();
  }


}

if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup().catch(error => {
    console.error("Setup failed:", error);
  });
}