
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

function addObjectToTable(tableName, array) {
    var table = document.getElementById(tableName);
    var row = table.insertRow(-1);
    var cell = row.insertCell(0);

    cell.innerHTML = array.type;
    cell.setAttribute("contenteditable", "false");
    cell.onclick = function () {
        createPropertiesTable("propsTable", array);
    };
}

function changeObjectInTable(tableName, propsArray) {
    var table = document.getElementById(tableName);
    var row = table.rows[propsArray.id];
    var cell = row.cells[0];
    cell.innerHTML = propsArray.type;
    cell.setAttribute("contenteditable", "false");
    cell.onclick = function () {
        createPropertiesTable("propsTable", propsArray);
    };
}

function setPropsTableEditable(button) {
    button.style.visibility = "hidden";
    document.getElementById("saveButton").style.visibility = "visible";
    var elems = document.getElementsByClassName("cell2");
    if (elems[0].getAttribute("contenteditable") == "false") {
        for (var i = 1; i < elems.length - 2; i++) {
            elems[i].setAttribute("contenteditable", "true");
        }
        autocomplete(elems[1], elems[2], all_results_array);
    } else {
        for (var i in elems) {
            elems[i].setAttribute("contenteditable", "false");
        }
    }
}

//Extrai todas as filas, menos as ultimas 2 (coords, drawn)
function extractTableContents(tableName) {
    var array = {};
    var table = document.getElementById("propsTable");
    for (var i = 0; i < table.rows.length-2; i++) {
        array[table.rows[i].cells[0].innerHTML] = table.rows[i].cells[1].innerHTML;
    }
    return array;
}

function autocomplete(inp, cell_spot, arr) {
    //O segundo argumento (cell_spot) serve apenas para posicionar a lista de resultados.
    var currentFocus;

    inp.addEventListener("input", function (e) {
        var a, b, val = inp.innerHTML;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", cell_spot.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        cell_spot.parentNode.appendChild(a);

        for (var i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function (e) {
                    inp.innerHTML = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) { log.info("!x no addActive"); return false; }
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elem) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elem != x[i] && elem != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    a.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
   