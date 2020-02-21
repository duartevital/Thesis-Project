
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

function createPropertiesTable(tableName, propsArray) {
    var table = document.getElementById(tableName);
    table.innerHTML = "";
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

function addObjectToTable(tableName, propsArray) {
    var table = document.getElementById(tableName);
    var row = table.insertRow(-1);
    var cell = row.insertCell(0);

    cell.innerHTML = propsArray.type;
    cell.setAttribute("contenteditable", "false");
    cell.onclick = function() {
        createPropertiesTable("propsTable", propsArray);
    };
}

function setPropsTableEditable(button) {
    button.style.visibility = "hidden";
    document.getElementById("saveButton").style.visibility = "visible";
    var elems = document.getElementsByClassName("cell2");
    if (elems[0].getAttribute("contenteditable") == "false") {
        for (var i = 0; i < elems.length; i++) {
            elems[i].setAttribute("contenteditable", "true");
        }
    } else {
        for (var i in elems) {
            elems[i].setAttribute("contenteditable", "false");
        }
    }
}

function extractTableContents(tableName, array) {
    var table = document.getElementById("propsTable");
    for (var i = 0; i < table.rows.length; i++) {
        array[table.rows[i].cells[0].innerHTML] = table.rows[i].cells[1].innerHTML;
    }
}