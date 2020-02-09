

function openTab(evt, tabName) {
    var i, tabContent, tabLinks;

    tabContent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    tabLink = document.getElementsByClassName("tabLinks");
    for (i = 0; i < tabLink.length; i++) {
        tabLink[i].className = tabLink[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function addPropertiesTable(propsArray) {
    var table = document.getElementById("propsTable");
    var row;
    var cell1, cell2;
    for (var key in propsArray) {
        row = table.insertRow(-1);
        cell1 = row.insertCell(0); cell2 = row.insertCell(1);
        cell1.innerHTML = key; cell2.innerHTML = propsArray[key];
        cell1.classList.add("cell1"); cell2.classList.add("cell2");
        cell2.setAttribute("contenteditable", "false");
    }
}

function setTableCell2Editable() {
    var elems = document.getElementsByClassName("cell2");
    if (elems[0].getAttribute("contenteditable") == "false") {
        for (var i in elems) {
            elems[i].setAttribute("contenteditable", "true");
        }
    } else {
        for (var i in elems) {
            elems[i].setAttribute("contenteditable", "false");
        }
    }
}