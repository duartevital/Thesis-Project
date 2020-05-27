
var pieChart = "";

importHistoryEntries();
window.onclick = function (event) {
    if (!event.target.matches('.dropdown_btn')) {
        var dropdowns = this.document.getElementsByClassName("dropdown_content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
            }
        }
    }
}

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

function createPropertiesTable(tableName, props, drawn) {
    var table = document.getElementById(tableName);
    table.innerHTML = "";
    var row;
    var cell1, cell2;
    if (!drawn) {
        for (var key in props) {
            switch (key) {
                case "source": case "type": case "name": case "area": case "length": case "polution": case "range": case "surface": case "one_way":
                    row = table.insertRow(-1);
                    cell1 = row.insertCell(0); cell2 = row.insertCell(1);
                    cell1.innerText = key; cell2.innerText = props[key];
                    cell1.classList.add("cell1"); cell2.classList.add("cell2");
                    cell2.setAttribute("contenteditable", "false");
                    break;
            }
        }
        //add focus button
        if (props.id) {
            var btn = document.createElement('input');
            btn.type = "button"; btn.className = "focus_btn"; btn.value = "Add focus";
            btn.onclick = function () { addFocus() };
            row = table.insertRow(-1);
            row.appendChild(btn);
        }

        //popup logic
        var parent_div = document.getElementById("features");
        var template = document.getElementById("type_popup_template");
        var popup_text = template.content.querySelector(".popuptext");
        var parent_node = document.importNode(popup_text, true);
        parent_div.classList.add("popup");
        parent_div.appendChild(parent_node);
    } else {
        //only show id and source fields
        row = table.insertRow(-1);
        cell1 = row.insertCell(0); cell2 = row.insertCell(1);
        //cell1.innerText = "id"; cell2.innerText = props.id;
        //row = table.insertRow(-1);
        //cell1 = row.insertCell(0); cell2 = row.insertCell(1);
        cell1.innerText = "source"; cell2.innerText = props.source;
        cell1.classList.add("cell1"); cell2.classList.add("cell2");
        addSourcesDropdownMenu(cell2);
        cell2.addEventListener("input", function (e) {
            //var inp = cell2.innerText;
            var inp = document.getElementById("id_source_select").options[document.getElementById("id_source_select").selectedIndex].value;
            switch (inp) {
                case "building":
                    props = { id: props.id, source: inp, type: "", area: props.area, polution: 0, range: 0, shape: props.shape, coords: props.coords, drawn: true, index: -1 };
                    createPropertiesTable("propsTable", props, false);
                    setPropsTableEditable(document.getElementById("editButton"));
                    break;
                case "landuse":
                    props = { id: props.id, source: inp, type: "", area: props.area, polution: 0, range: 0, shape: props.shape, coords: props.coords, drawn: true, index: -1 };
                    createPropertiesTable("propsTable", props, false);
                    setPropsTableEditable(document.getElementById("editButton"));
                    break;
                //case roads...
            }
        });
    }
}

function createObjectsTable(list) {
    var table = document.getElementById("objTable");
    table.innerHTML = "";

    var header = table.createTHead();
    var header_row = header.insertRow(0);
    header_row.insertCell(0).innerHTML = "<b>Object  Type<b>";
    header_row.insertCell(1).innerHTML = "<b>Area<b>";

    var row, cell1, cell2;
    for (var i in list) {
        row = table.insertRow(-1);
        cell1 = row.insertCell(0); cell2 = row.insertCell(1);
        cell1.innerText = list[i].type; cell2.innerText = list[i].area;

    }

    table.addEventListener("click", function (e) {
        var clicked_row = e.target.parentNode;
        for (var i in list) {
            if (list[i].type == clicked_row.cells[0].innerText && list[i].area == parseFloat(clicked_row.cells[1].innerText)) {
                createPropertiesTable("propsTable", list[i], false);
                document.getElementById("editButton").style.visibility = "visible";
                break;
            }
        }
    });

    sortTableByNumber(table, 1);
}

function createRoadsTable(list) {
    var table = document.getElementById("roadsTable");
    table.innerHTML = "";
    //Table header
    var header = table.createTHead();
    var header_row = header.insertRow(0);
    header_row.insertCell(0).innerHTML = "<b>Road  Name<b>";
    header_row.insertCell(1).innerHTML = "<b>Type<b>";
    header_row.insertCell(2).innerHTML = "<b>Length<b>";

    for (var i in list) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0); var cell2 = row.insertCell(1); var cell3 = row.insertCell(2);
        cell1.innerText = list[i].name; cell2.innerText = list[i].type; cell3.innerText = list[i].length;
        cell1.id = list[i].id;
        cell1.style.maxWidth = "50px"; cell2.style.maxWidth = "30px"; cell3.style.maxWidth = "15px";    
        cell1.style.textOverflow = "elipsis";
    }

    table.addEventListener("click", function (e) {
        var row = e.target.parentNode;
        for (var i in list) {
            if (list[i].name == row.cells[0].innerText && list[i].length == parseFloat(row.cells[2].innerText)) {
                //selected_obj = list[i];
                createPropertiesTable("propsTable", list[i], false);
                document.getElementById("editButton").style.visibility = "visible";
                break;
            }
        }
    });

    sortTableByNumber(table, 2);
}

function addObjectToTable(tableName, array) {
    var table = document.getElementById(tableName);
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0), cell2 = row.insertCell(1);

    cell1.innerText = array.type;
    cell2.innerText = array.number;
    /*cell1.setAttribute("contenteditable", "false");
    cell1.onclick = function () {
        createPropertiesTable("propsTable", array);
    };*/
}

function addDrawnObjectToTable(tableName, array) {
    var table = document.getElementById(tableName);
    var exists = false;
    for (var i = 0; i < table.rows.length; i++) {
        if (table.rows[i].cells[0].innerText == array.type) {
            exists = true;
            incObjectNumber(array.type);
            break;
        }
    }
    if (!exists) {
        addObjectToTable(tableName, { type: array.type, number: 1 });
    }
}

function incObjectNumber(type) {
    var table = document.getElementById("objTable");
    for (var i = 0; i < table.rows.length; i++) {
        if (type == table.rows[i].cells[0].innerText) {
            var num = parseInt(table.rows[i].cells[1].innerText);
            table.rows[i].cells[1].innerText = num + 1;
        }
    }
}

function changeObjectInTable(props, old_type) {
    var table = document.getElementById("objTable");
    var found_type = false;
    var found_old_type = false;
    if (table.rows.length > 0) {
        for (var i = 0; i < table.rows.length - 1; i++) {
            var tmp_type = table.rows[i].cells[0].innerText;
            var tmp_number = parseInt(table.rows[i].cells[1].innerText);
            if (tmp_type == props.type) {
                tmp_number++;
                table.rows[i].cells[1].innerText = tmp_number;
                found_type = true;
                break;
            }
            if (tmp_type == old_type) {
                found_old_type = true;
            }
        }
    }
    if (!found_type) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0), cell2 = row.insertCell(1);
        cell1.innerText = props.type;
        cell2.innerText = 1;
    }
    if (found_old_type) {
        for (var i = 0; i < table.rows.length - 1; i++) {
            var tmp_type = table.rows[i].cells[0].innerText;
            var tmp_number = parseInt(table.rows[i].cells[1].innerText);
            if (tmp_type == old_type) {
                if (tmp_number == 1) {
                    table.deleteRow(i);
                } else {
                    tmp_number--;
                    table.rows[i].cells[1].innerText = tmp_number;
                    break;
                }
            }
        }
    }
    

    /*var row = table.rows[props.id];
    var cell = row.cells[0];
    cell.innerHTML = props.type;
    cell.setAttribute("contenteditable", "false");
    cell.onclick = function () {
        createPropertiesTable("propsTable", props);
    };*/
}

function setPropsTableEditable(button) {
    button.style.visibility = "hidden";
    document.getElementById("saveButton").style.visibility = "visible";
    var elems_1 = document.getElementsByClassName("cell1");
    var elems_2 = document.getElementsByClassName("cell2");
    var autocomplete_array = [];

    for (var i = 0; i < elems_1.length; i++) {
        switch (elems_1[i].innerText) {
            case "source":
                switch (elems_2[i].innerText) {
                    case "building":
                        autocomplete_array = building_array;
                        break;
                    case "landuse":
                        autocomplete_array = landuse_array;
                        break;
                    case "road":
                        autocomplete_array = highway_array;
                        break;
                };
                break;
            case "type":
                elems_2[i].setAttribute("contenteditable", "true");
                elems_2[i].onkeydown = function () { return alphabetKeyPressed(event) };
                autocomplete(elems_2[i], elems_2[i + 1], autocomplete_array);
                break;
            case "polution": case "range":
                elems_2[i].setAttribute("contenteditable", "true");
                elems_2[i].onkeydown = function () { return numericKeyPressed(event) };
                break;
        }
    };
}

//Extrai todas as filas, menos as ultimas 2 (coords, drawn)
function extractTableContents() {
    var props = {};
    var table = document.getElementById("propsTable");
    for (var i = 0; i < table.rows.length; i++) {
        //log.info("cell 0 = " + table.rows[i].cells[0]);
        if (typeof table.rows[i].cells[0] !== 'undefined') {
            switch (table.rows[i].cells[0].innerText) {
                case "id": case "area": case "height":
                    props[table.rows[i].cells[0].innerHTML] = parseInt(table.rows[i].cells[1].innerText);
                    break;
                case "length": case "polution": case "range":
                    props[table.rows[i].cells[0].innerHTML] = parseFloat(table.rows[i].cells[1].innerText);
                    break;
                case "one_way": case "underground":
                    var val = (table.rows[i].cells[0].innerText === "true");
                    props[table.rows[i].cells[0].innerHTML] = val;
                    break;
                default:
                    props[table.rows[i].cells[0].innerHTML] = table.rows[i].cells[1].innerText;
            }
        }
    }

    return props;
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

    /*a.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });*/
}

function numericKeyPressed(e) {
    var x = e.keyCode;
    if ((x >= 48 && x <= 57) || x == 8 || (x >= 35 && x <= 40) || x == 46)
        return true;
    else {
        //Adicionar um pequeno "alerta" por baixo do text field
        return false;
    }
}

function alphabetKeyPressed(e) {
    var x = e.keyCode;
    //log.info("key pressed: " + x);
    //Os keyCodes das letras no meu teclado são diferentes dos apresentados em keycode.info
    if ((x >= 65 && x <= 90) || x == 8 || (x >= 35 && x <= 40) || x == 46) 
        return true;
    else {
        //Adicionar um pequeno "alerta" por baixo do text field
        return false;
    }
}

function addBooleanDropdownMenu(cell_spot) {
    var tmp = cell_spot.innerText;
    var html_dropdown;
    if (tmp == "true") {
        html_dropdown = "<select id='idSelect'>"
            + "<option value='true'>true</option>"
            + "<option value='false'>false</option>"
            + "</select>";
    } else {
        html_dropdown = "<select id='idSelect'>"
            + "<option value='false'>false</option>"
            + "<option value='true'>true</option>"
            + "</select>";
    }
    cell_spot.innerHTML = html_dropdown;

}

function addSourcesDropdownMenu(cell_spot) {
    var html_dropdown = "<select id='id_source_select'>"
        + "<option disabled selected value> -- select a source -- </option>"
        + "<option value='building'>building</option>"
        + "<option value='landuse'>landuse</option>"
        + "</select>";
        //+ "<option value='road'>road</option>"
        //+ "<option value='water'>water</option>"

    cell_spot.innerHTML = html_dropdown;
}

function setPieGraph(type_stats) {
    if (pieChart != "") {
        pieChart.destroy();
    }
    var labels = type_stats.map(obj => obj.type);
    var values = type_stats.map(obj => obj.percentage);
    var ctx = document.getElementById('myChart').getContext('2d');
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Area %',
                data: values,
                backgroundColor: function (context) {
                    var index = context.dataIndex;
                    var value = context.dataset.data[index];
                    var source = "";
                    for (var i in type_stats) {
                        if (type_stats[i].percentage == value) {
                            source = type_stats[i].source;
                            break;
                        }
                    }
                    switch (source) {
                        case "building":
                            return 'rgba(66,100,251, 0.4)';
                        case "landuse":
                            return 'rgba(57, 241, 35, 0.4)';
                        case "water":
                            return 'rgba(25, 22, 234, 0.4)';
                    }
                },
                //borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false
            }],
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                    display: false
                }]
            }
        }
    });

}

function addEntryToHistory(info) {
    var template_elem = document.getElementsByTagName("template")[0];
    var entry_div = template_elem.content.querySelector(".entry");
    var parent_node = document.importNode(entry_div, true);

    parent_node.querySelector("#id").textContent = info.id;
    parent_node.querySelector("#timestamp").textContent = info.timestamp;
    parent_node.querySelector("#location_coords").textContent = info.map_center;
    parent_node.querySelector("#building_area").textContent = info.source_stats.building_area;
    parent_node.querySelector("#landuse_area").textContent = info.source_stats.landuse_area;
    parent_node.querySelector("#road_length").textContent = info.source_stats.road_length;
    parent_node.querySelector("#aqi").textContent = info.aqi;

    var entries_section = document.getElementsByClassName("entries_section")[0];
    entries_section.appendChild(parent_node);
}

function loadSelectedEntry(sub_entry) {
    var id = parseInt(sub_entry.querySelector("#id").textContent);
    loadAllInfo(id);
}

function importHistoryEntries() {
    var files;
    try {
        files = fs.readdirSync("./Saves/");
    } catch (err) {
        log.info("Could NOT read the folder");
    }

    if (files.length > 0)
        document.getElementById("empty_history").style.visibility = "hidden";

    for (var i = 0; i < files.length; i++) {
        var info = loadFromJSON(i);
        info.timestamp = new Date(info.timestamp).toLocaleString();
        addEntryToHistory(info);
    }       
}

function sortTableByNumber(table, column) {
    var rows, cells, switching, i, x, y, shouldSwitch;
    //table = document.getElementById(tableName);
    switching = true;

    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < rows.length - 1; i++) {
            shouldSwitch = false;
            x = rows[i].cells[column];
            y = rows[i + 1].cells[column];
            if (parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
                shouldSwitch = true;
                break;
            }
        }

        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

function showViewOptions() {
    document.getElementById("dropdown_content").classList.toggle("show");
}

function addFocus() {
    addDrawTools(document.getElementById("newButton"));
    drawing_focus = true;
}


