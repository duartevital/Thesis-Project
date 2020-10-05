function toggleMapInfo(btn) {
    var elem = btn.parentNode.querySelector("#map_info_content");
    if (elem.style.display == "none") {
        elem.style.display = "block";
        dropdown_visible = true;
    } else {
        elem.style.display = "none";
        dropdown_visible = false;
    }
}

function setPopup(message, parent) {
    if (document.getElementsByClassName("popuptext").length > 0)
        return;
    var popup_text = document.createElement("span");
    popup_text.classList = "popuptext";
    popup_text.textContent = message;
    parent.classList.add("popup");
    parent.appendChild(popup_text);

    popup_text.classList.toggle("show");
    setTimeout(function () {
        popup_text.classList.toggle("show");
        popup_text.remove();
    }, 3000);
}

function setMapPopup(message, time) {
    var popup = document.getElementById("universal_warning");
    popup.textContent = message;
    popup.style.display = "table";
    setTimeout(function () {
        popup.style.display = "none";
    }, time);
}

function toggleMapPopup(message, toggle) {
    var popup = document.getElementById("universal_warning");
    if (toggle) {
        popup.textContent = message;
        popup.style.display = "table";
    } else {
        popup.style.display = "none";
    }
}

function addHint(btn) {
    var parent_node = btn.parentNode;
    var hint = parent_node.querySelector(".hint")
    if (hint.style.display == "block") {
        hint.style.display = "none";
        dropdown_visible = false;
    } else {
        hint.style.display = "block";
        dropdown_visible = true;
    }
}