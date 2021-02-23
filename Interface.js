
var pieChart = "";
var tmp_profile_list = [];
importHistoryEntries();
var drawn_profile = false;
var dropdown_visible = false;
var id_tog = true, source_tog = false, type_tog = false, area_length_tog = false;
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

function openTab(tabName) {
    var i, tabContent, tabLinks;

    tabContent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    tabLink = document.getElementsByClassName("tabLinks");
    for (i = 1; i < tabLink.length; i++) {
        tabLink[i].className = tabLink[i].className.replace(" active", "");
        tabLink[i].style.backgroundColor = "#e0e0e0";
        tabLink[i].style.color = "#000000";
        tabLink[i].style.borderBottomRightRadius = "0px";
        tabLink[i].style.borderBottomLeftRadius = "0px";
    }
    //estilizar botões das tabs
    tabLink[0].style.borderBottomRightRadius = "0px";
    var radius = "12px", index = 1;
    switch (tabName) {
        case "features_tab":
            index = 1;
            break;
        case "curves_tab":
            index = 2;
            break;
        case "history_tab":
            index = 3;
            break;

    }
    tabLink[index].style.backgroundColor = "#dbdbdb";
    tabLink[index].style.color = "#ffffff";
    tabLink[index - 1].style.borderBottomRightRadius = radius;
    if (tabLink[index + 1])
        tabLink[index + 1].style.borderBottomLeftRadius = radius;

    tabLink[index].classList.toggle("not_selected_tabs", false);
    if (index == 1) {
        tabLink[index + 1].classList.toggle("not_selected_tabs", true);
        tabLink[index + 2].classList.toggle("not_selected_tabs", true);
    } else if (index == 2) {
        tabLink[index - 1].classList.toggle("not_selected_tabs", true);
        tabLink[index + 1].classList.toggle("not_selected_tabs", true);
    } else if (index == 3) {
        tabLink[index - 1].classList.toggle("not_selected_tabs", true);
        tabLink[index - 2].classList.toggle("not_selected_tabs", true);
    }

    var tab = document.getElementById(tabName);
    tab.style.display = "block";
    tab.className.className += " active";
}

function createPropertiesTable(props, drawn) {
    var top_section = document.getElementById("top_section");
    var source_placeholder, area_length_placeholder, id_placeholder, type_placeholder, name_placeholder, one_way_placeholder, polution_placeholder, range_placeholder, profile_placeholder, focus_placeholder;
    source_placeholder = top_section.querySelector("#source_placeholder"); area_length_placeholder = top_section.querySelector("#area_length_placeholder"); id_placeholder = top_section.querySelector("#id_placeholder"); 
    type_placeholder = top_section.querySelector("#type_placeholder"); name_placeholder = top_section.querySelector("#name_placeholder"); one_way_placeholder = top_section.querySelector("#one_way_placeholder"); 
    polution_placeholder = top_section.querySelector("#polution_placeholder"); range_placeholder = top_section.querySelector("#range_placeholder"); profile_placeholder = top_section.querySelector("#profile_placeholder"); focus_placeholder = top_section.querySelector("#focus_placeholder");
    var placeholders = top_section.querySelectorAll(".placeholders");
    for (var i in placeholders)
        placeholders[i].innerHTML = "";
    var template_elem = document.getElementById("editor_template");
    var entry_div = template_elem.content.querySelector(".editor_div");
    top_section.querySelector("h4").style.visibility = "hidden";

    var placeholder, ac_arr, input, hint_div;
    if (!drawn) {
        for (var i in placeholders)
            placeholders[i].innerHTML = "";
        in_props_table = true;
        //uneditable table creation
        for (var key in props) {
            
            var parent_node = document.importNode(entry_div, true);
            input = parent_node.querySelector("input");
            hint_div = parent_node.querySelector(".hint_div");
            switch (key) {
                case "source":
                    placeholder = source_placeholder;
                    parent_node.querySelector("#key").textContent = "Source";
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    switch (props[key]) {
                        case "building":
                            ac_arr = building_array;
                            break;
                        case "landuse":
                            ac_arr = landuse_array;
                            break;
                        case "road":
                            ac_arr = road_array;
                            break;
                    }
                    placeholder.appendChild(parent_node);
                    break;
                case "area":
                    if (props[key] == -1) continue;
                    placeholder = area_length_placeholder;
                    parent_node.querySelector("#key").textContent = "Area";
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    placeholder.appendChild(parent_node);
                    break;
                case "length":
                    if (props[key] == -1) continue;
                    placeholder = area_length_placeholder;
                    parent_node.querySelector("#key").textContent = "Length";
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    placeholder.appendChild(parent_node);
                    break;
                case "id":
                    placeholder = id_placeholder;
                    parent_node.querySelector("#key").textContent = "Id";
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    placeholder.appendChild(parent_node);
                    break;
                case "type":
                    placeholder = type_placeholder;
                    parent_node.querySelector("#key").textContent = "Tag";
                    //input.addEventListener("blur", function () { selection_obj.type = this.value });
                    var options = "";
                    if (ac_arr)
                        for (var i in ac_arr)
                            options += '<option value="' + ac_arr[i] + '" />';
                    //autocomplete(input, undefined, ac_arr);
                    input.remove();
                    var editor_input = parent_node.querySelector("#editor_input");
                    addTypeDropdownMenu(editor_input, options, props[key]);
                    editor_input.querySelector("input").oninput = function () { selection_obj.type = this.value };
                    placeholder.appendChild(parent_node);
                    break;
                case "name":
                    placeholder = name_placeholder;
                    parent_node.querySelector("#key").textContent = "Name";
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    placeholder.appendChild(parent_node);
                    break;
                case "one_way":
                    placeholder = one_way_placeholder;
                    parent_node.querySelector("#key").textContent = "One Way";
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    placeholder.appendChild(parent_node);
                    break;
                case "polution":
                    placeholder = polution_placeholder;
                    parent_node.querySelector("#key").textContent = "Polution Magnitude (0-500)";
                    input.addEventListener("input", function () {
                        if (this.value > 500) this.value = 500;
                        else if (this.value < 0) this.value = 0;
                        selection_obj.polution = this.value
                    });
                    input.type = "number"; input.min = 0;
                    placeholder.appendChild(parent_node);
                    break;
                case "range":
                    placeholder = range_placeholder;
                    parent_node.querySelector("#key").textContent = "Polution Range";
                    input.addEventListener("input", function () { selection_obj.range = this.value });
                    input.type = "number"; input.min = 0;
                    placeholder.appendChild(parent_node);
                    break;
                case "focus":
                    placeholder = focus_placeholder;
                    parent_node.querySelector("#key").textContent = "Extra Polut. Sources";
                    hint_div.style.display = "block";
                    hint_div.querySelector("p").textContent = "Add additional sources of polution on any elected Entity";

                    var focus_val = props[key].length + " (";
                    for (var i in props[key])
                        focus_val += props[key][i].polution + ", ";
                    focus_val += ")";
                    input.value = focus_val;
                    input.readOnly = true;
                    input.style.backgroundColor = "#ccc";
                    var button = document.createElement("button");
                    button.innerHTML = "<i class='far fa-dot-circle'></i>";
                    button.onclick = function () { addFocus(); map.dragPan.disable(); map.scrollZoom.disable(); };
                    button.title = "Add an extra polution source";
                    parent_node.querySelector("#editor_input").appendChild(button);
                    placeholder.appendChild(parent_node);
                    break;
            }
            if ((!input.value || input.value == "") && key != "Profile")
                input.value = props[key];
            input.setAttribute("title", input.value);
        }

        //Handle Profile
        var parent_node = document.importNode(entry_div, true);
        input = parent_node.querySelector("input");
        //button = parent_node.querySelector("#editor_input").querySelector("button");
        hint_div = parent_node.querySelector(".hint_div");
        placeholder = profile_placeholder;
        parent_node.querySelector("#key").textContent = "Polution Profile(s)";
        hint_div.style.display = "block";
        hint_div.querySelector("p").textContent = "Check the profiles that affect this Entity or open Profile Manager.";

        let val_arr; var val = "No profile selected";
        if (!drawn_profile) {
            val_arr = [];
            for (var i in profile_list) {
                profile_loop_break:
                for (var j in selected_objs) {
                    if (selected_objs[j])
                        for (var k in selected_objs[j].profile)
                            if (profile_list[i].name == selected_objs[j].profile[k]) {
                                val_arr.push(profile_list[i].name);
                                break profile_loop_break;
                            }
                }
            }
            val_arr = Array.from(new Set(val_arr));
            val = "";
            for (var i in val_arr)
                val += val_arr[i] + ", ";
        }
        drawn_profile = false;
        if (val == "") val = "No profile selected";
        input.value = val;
        input.readOnly = true;
        input.style.backgroundColor = "#ccc";
        var button = document.createElement("button");
        button.innerHTML = "<i class='far fa-edit'></i>";
        button.onclick = function () { editProfile() };
        button.title = "Open Profile Manager";
        parent_node.querySelector("#editor_input").appendChild(button);
        placeholder.appendChild(parent_node);

        var btns = document.getElementById("editor_btns_div").querySelectorAll("button");
        btns[0].style.visibility = "visible";
        btns[1].style.visibility = "visible";

    } else {
        draw_trash.disabled = true;
        draw_trash.classList.toggle("disabled_draw", true);
        drawn_profile = true;

        var parent_node = document.importNode(entry_div, true);
        var editor_input = parent_node.querySelector("#editor_input");
        editor_input.querySelector("input").remove();
        placeholder = top_section.querySelector("#source_placeholder");
        parent_node.querySelector("#key").textContent = "Source";
        addSourcesDropdownMenu(editor_input);
        placeholder.style.width = "32%";
        placeholder.appendChild(parent_node);

        editor_input.querySelector("input").addEventListener("change", function (e) {
            //var inp = document.getElementById("id_source_select").options[document.getElementById("id_source_select").selectedIndex].value;
            var inp = e.target.value;
            placeholder.style.width = "22%";
            parent_node.remove();
            map.dragPan.enable();
            map.scrollZoom.enable();
            source_selected = true;
            var tmp_props;
            switch (inp) {
                case "building":
                    tmp_props = { id: props.id, source: inp, type: "", area: props.area, polution: 0, range: 0, profile: ["any"], focus: [], shape: props.shape, coords: props.coords, drawn: true, index: -1, draw_id: props.draw_id };
                    selected_objs.push(props);
                    selection_obj = tmp_props;
                    //tmp_props = { id: props.id, source: inp, type: "", area: props.area, polution: 0, range: 0, profile: ["any"], focus: [] };
                    createPropertiesTable(tmp_props, false);                    
                    break;
                case "landuse":
                    tmp_props = { id: props.id, source: inp, type: "", area: props.area, polution: 0, range: 0, profile: ["any"], focus: [], shape: props.shape, coords: props.coords, drawn: true, index: -1, draw_id: props.draw_id };
                    selected_objs.push(props);
                    selection_obj = tmp_props;
                    //tmp_props = { id: props.id, source: inp, type: "", area: props.area, polution: 0, range: 0, profile: ["any"], focus: [] };
                    createPropertiesTable(tmp_props, false);                    
                    break;
                //case roads...
            }
        });
    }
}

function createFocusTable(props) {
    var top_section = document.getElementById("top_section");
    var placeholders = top_section.querySelectorAll(".placeholders");
    for (var i in placeholders)
        placeholders[i].innerHTML = "";
    
    var template_elem = document.getElementById("editor_template");
    var entry_div = template_elem.content.querySelector(".editor_div");
    
    var parent_node_1 = document.importNode(entry_div, true);
    parent_node_1.querySelector("#key").textContent = "Polution Magnitude";
    var input_1 = parent_node_1.querySelector("input");
    input_1.value = props.polution;
    input_1.type = "number"; input_1.min = 0; input_1.max = 500;
    input_1.focus();

    var parent_node_2 = document.importNode(entry_div, true);
    parent_node_2.querySelector("#key").textContent = "Polution Range";
    var input_2 = parent_node_2.querySelector("input");
    input_2.value = props.range;
    input_2.type = "number";

    top_section.querySelector("#polution_placeholder").appendChild(parent_node_1);
    top_section.querySelector("#range_placeholder").appendChild(parent_node_2);
    var btns = document.getElementById("editor_btns_div").querySelectorAll("button");
    btns[0].onclick = function () { saveFocus(this) };
    btns[1].onclick = function () { cancelFocus(this) };
    btns[1].textContent = "cancel";
    btns[0].style.visibility = "visible";
    btns[1].style.visibility = "visible";
}

function createObjectsTable(list) {
    var table = document.getElementById("objTable");
    table.innerHTML = "";

    var header = table.createTHead();
    var header_row = header.insertRow(0);
    header_row.insertCell(0).innerHTML = "<b style='cursor: pointer'>Id<b>";
    header_row.insertCell(1).innerHTML = "<b style='cursor: pointer'>Source<b>";
    header_row.insertCell(2).innerHTML = "<b style='cursor: pointer'>Type<b>";
    header_row.insertCell(3).innerHTML = "<b style='cursor: pointer'>Area/Length<b>";

    header_row.cells[0].addEventListener("click", function () { sortTable("id", true) });
    header_row.cells[1].addEventListener("click", function () { sortTable("source", false) });
    header_row.cells[2].addEventListener("click", function () { sortTable("type", false) });
    header_row.cells[3].addEventListener("click", function () { sortTable("area", true) });

    var row, cell0, cell1, cell2, cell3;
    for (var i in list) {
        row = table.insertRow(-1);
        cell0 = row.insertCell(0); cell1 = row.insertCell(1);
        cell2 = row.insertCell(2); cell3 = row.insertCell(3);
        cell0.innerText = list[i].id; cell1.innerText = list[i].source;
        cell2.innerText = list[i].type;
        if (list[i].area)
            cell3.innerText = list[i].area;
        else if (list[i].length)
            cell3.innerText = list[i].length;
    }

    table.addEventListener("click", function (e) {
        if (e.target.parentNode.parentNode.rowIndex && e.target.parentNode.parentNode.rowIndex == -1)
            return;
        var clicked_row = e.target.parentNode;
        var id = parseInt(clicked_row.cells[0].innerText);
        var feature_color, isRoad = false;
        switch (all_list[id].source) {
            case 'building':
                feature_color = "rgba(66, 100, 251, 0.8)";
                break;
            case 'landuse':
                feature_color = "rgba(57, 241, 35, 0.8)";
                break;
            case 'road':
                feature_color = "rgba(255,100,251, 0.8)";
                isRoad = true;
                break;
            case 'water':
                feature_color = "rgba(25, 22, 234, 0.8)";
                break;
        }
        if (!e.ctrlKey || (event.ctrlKey && selected_objs.length == 0)) {
            clearSelections();
            selected_objs = []; selected_objs.push(all_list[id]);
            selection_obj = all_list[id];
            addSelectionsColors(feature_color, all_list[id].source, selected_objs.length-1, isRoad);
            map.getSource("selection_road_source").setData(selection_road_features);
            map.getSource("selection_object_source").setData(selection_object_features);
            createPropertiesTable(all_list[id], false);
            return;
        }
        //if ctrlKey is pressed
        var area_counter = 0, length_counter = 0;
        selection_obj = { id: "-", source: "-", type: "-", area: -1, length: -1 };
        selected_objs.push(all_list[id]);
        addSelectionsColors(feature_color, all_list[id].source, selected_objs.length - 1, isRoad);
        map.getSource("selection_road_source").setData(selection_road_features);
        map.getSource("selection_object_source").setData(selection_object_features);

        for (var i in selected_objs) {
            if (selected_objs[i].area)
                area_counter += selected_objs[i].area;
            else if (selected_objs[i].length)
                length_counter += selected_objs[i].length;
        }

        if (area_counter > 0)
            selection_obj.area = area_counter;
        if (length_counter > 0)
            selection_obj.length = length_counter;

        selection_obj.polution = getAveragePolution(selected_objs);
        selection_obj.range = getAverageRange(selected_objs);
        createPropertiesTable(selection_obj, false);
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
                createPropertiesTable(list[i], false);
                //document.getElementById("editButton").style.visibility = "visible";
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

function sortTable(table, n, isNumber) {
    var rows, switching, i, x, y, dir, shouldSwitch, switchcount = 0;
    switching = true;
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].querySelectorAll("td")[n];
            y = rows[i + 1].querySelectorAll("td")[n];
            //check if the two rows should switch place:
            if (dir == "asc") {
                if (isNumber) {
                    if (parseInt(x.innerHTML) > parseInt(y.innerHTML)) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            } else if (dir == "desc") {
                if (isNumber) {
                    if (parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

function sortTable(prop, isNumber) {
    var tog;
    switch (prop) {
        case "id":
            tog = id_tog;
            id_tog = !id_tog;
            break;
        case "source":
            tog = source_tog;
            source_tog = !source_tog;
            break;
        case "type":
            tog = type_tog;
            type_tog = !type_tog;
            break;
        case "area":
            tog = area_length_tog;
            area_length_tog = !area_length_tog;
            break;
    }

    function compare(a, b) {
        var propA, propB;
        if (isNumber) {
            if (prop == "area") {
                if (a.area) propA = a.area;
                else if (a.length) propA = a.length;
                if (b.area) propB = b.area;
                else if (b.length) propB = b.length;
            } else {
                propA = +a[prop];
                propB = +b[prop];
            }
        } else {
            propA = a[prop].toUpperCase();
            propB = b[prop].toUpperCase();
        }

        let comparison = 0;
        if (propA > propB) {
            comparison = 1;
        } else if (propA < propB) {
            comparison = -1;
        }

        if (tog) return comparison * -1;
        else return comparison;
    }

    var sorted_list = [...all_list].sort(compare);

    createObjectsTable(sorted_list);
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
            case "profile":
                //Não precisa de ficar editable devido ao botao 'edit profile'
                /*if (profile_list == []) break;
                var select, opt;
                select = document.createElement("select");
                for (var j in profile_list) {
                    opt = document.createElement("option");
                    opt.textContent = profile_list[j];
                    opt.value = profile_list[j];
                    select.appendChild(opt);
                }
                select.setAttribute("class", "table_dropdown");
                elems_2[i].innerText = "";
                elems_2[i].appendChild(select);*/
                break;
        }
    };
}

//Extrai todas as filas, menos as ultimas 2 (coords, drawn)
function extractTableContents() {
    var props = {};

    props.type = document.getElementById("type_placeholder").querySelector("input").value;
    props.polution = parseInt(document.getElementById("polution_placeholder").querySelector("input").value);
    props.range = parseInt(document.getElementById("range_placeholder").querySelector("input").value);

    var prof_string = document.getElementById("profile_placeholder").querySelector("input").value;
    props.profile = prof_string.split(", ");
    //tratar do focus
    var focus_str = document.getElementById("focus_placeholder").querySelector("input").value;
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(focus_str);
    props.focus = [];
    if (matches)
        props.focus = matches[1].split(", ");

    return props;
}

function autocomplete(inp, cell_spot, arr) {
    //O segundo argumento (cell_spot) serve apenas para posicionar a lista de resultados.
    var currentFocus;

    inp.addEventListener("input", function (e) {
        var a, b, val = inp.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", inp.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        inp.parentNode.parentNode.parentNode.appendChild(a);

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

        a.addEventListener("click", function (e) {
            setChosen(e.target);
        });
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
    function setChosen(elem) {
        inp.value = elem.querySelector("input").value;
        inp.focus();
    }
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

function addSourcesDropdownMenu(elem) {
    var select = "<form class='editor_datalist'>"
        + "<input list='id_source_select'>"
        + "<datalist id='id_source_select' > "
        + "<option disabled selected value> -- select a source -- </option>"
        + "<option value='building'>building</option>"
        + "<option value='landuse'>landuse</option>"
        + "</datalist>"
        + "</form>";

    elem.innerHTML = select;
}
function addTypeDropdownMenu(elem, options, type) {
    var select = "<form class='editor_datalist'>"
        + "<input list='id_source_select' value='" + type + "'>"
        + "<datalist id='id_source_select' >"
        + options
        + "</datalist>"
        + "</form>"

    elem.innerHTML = select;
}

function setPieGraph(type_stats) {
    if (pieChart != "") {
        pieChart.destroy();
    }
    var labels = type_stats.map(obj => obj.type);
    var values = type_stats.map(obj => obj.percentage);
    var ctx = document.getElementById('pieChart').getContext('2d');
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

function listPieHandler(elem) {
    var bottom_section = document.getElementById("bottom_section");
    if (elem.checked) {
        bottom_section.querySelector("#pieChart").style.visibility = "visible";
        bottom_section.querySelector("#objTable").style.visibility = "hidden";
        //bottom_section.querySelector(".title_text").textContent = "Entity Areas(%)";
    } else {
        bottom_section.querySelector("#pieChart").style.visibility = "hidden";
        bottom_section.querySelector("#objTable").style.visibility = "visible";
        //bottom_section.querySelector(".title_text").textContent = "Entity List";
    }
}

// History related functions //

function addEntryToHistory(info) {
    var template_elem = document.getElementById("entry_template");
    var entry_div = template_elem.content.querySelector(".entry");
    var parent_node = document.importNode(entry_div, true);

    var round_coords = [Math.round(info.map_center[0] * 10000) / 10000, Math.round(info.map_center[1] * 10000) / 10000];
    parent_node.querySelector("#id").textContent = info.id;
    parent_node.querySelector("#timestamp").textContent = info.timestamp;
    parent_node.querySelector("#location_coords").textContent = round_coords;
    parent_node.querySelector("#n_altered").textContent = info.altered_list.length;
    parent_node.querySelector("#n_graphs").textContent = info.graphs.length;
    parent_node.querySelector("#n_profiles").textContent = info.profiles.length;
    /*parent_node.querySelector("#building_area").textContent = Math.round(info.source_stats.building_area * 100) / 100;
    parent_node.querySelector("#landuse_area").textContent = Math.round(info.source_stats.landuse_area * 100) / 100;
    parent_node.querySelector("#road_length").textContent = Math.round(info.source_stats.road_length * 100) / 100;*/
    parent_node.querySelector("#avg_polution").textContent = Math.round(info.avg_polution);

    var entries_section = document.getElementsByClassName("entries_section")[0];
    entries_section.appendChild(parent_node);
}

function loadSelectedEntry(sub_entry) {
    var id = parseInt(sub_entry.querySelector("#id").textContent);
    loadAllInfo(id);
}

function importHistoryEntries() {
    var files = [];
    try {
        files = fs.readdirSync("./Saves/");
    } catch (err) {
        console.log("Could NOT read the folder");
        return;
    }

    if (files.length > 0)
        document.getElementById("empty_history").style.visibility = "hidden";

    for (var i = 0; i < files.length; i++) {
        var info = loadFromJSON(i);
        info.timestamp = new Date(info.timestamp).toLocaleString();
        addEntryToHistory(info);
    }
}

// ********** //
function bodyClick(elem) {
    var map_info_content = map_info.querySelector("#map_info_content");
    if (!elem.target.classList.contains("info_container")) {
        log.info("no contains map_info_content");
        map_info_content.style.display = "none";
    }
}

var input_before = -1;
function inputFocus(elem) {
    input_before = elem.value;
}
function inputChange(elem) {
    var c = document.getElementById("accept_btn").classList;
    if (!c || c == "")
        c.add("advocate_click");

    if (elem.value != input_before)
        propsAltered = true;
}
/*
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
    var template = document.getElementById("type_popup_template");
    var popup_text = template.content.querySelector(".popuptext");
    popup_text.textContent = message;
    var parent_node = document.importNode(popup_text, true);
    parent.classList.add("popup");
    parent.appendChild(parent_node);

    parent_node.classList.toggle("show");
    setTimeout(function () {
        parent_node.classList.toggle("show");
        parent_node.remove();
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
*/
function bodyMouseDown(e) {
    if (!dropdown_visible) return;
    var elems = document.getElementsByClassName("dropdown");
    for (var i = 0; i < elems.length; i++) 
        if (!elems[i].parentNode.contains(e.target))
            elems[i].style.display = "none";
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
    if (document.getElementById("dropdown_content").style.display == "block")
        document.getElementById("dropdown_content").style.display = "none";
    else
        document.getElementById("dropdown_content").style.display = "block";
}

function addFocus() {
    focus_father_obj = selected_objs[0];
    
    drawing_focus = true;
    /*draw_point = document.createElement("button");
    draw_point.className = "mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_point";
    draw_point.title = "Draw point";
    draw_point.onclick = function () { draw.changeMode("draw_point"); };
    draw_buttons.insertBefore(draw_point, draw_polygon);*/

    //draw_polygon.onclick = function () { drawing = true; };
    draw_polygon.classList.toggle("disabled_draw");
    draw.changeMode("draw_point"); 
    setMapPopup("Place a polution focus point on top of the selected entity", 3000);
}

function editProfile() {
    in_profile_manager = true;
    if (drawing) 
        savePropsChanges();
    if (drawing)
        return;
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        parent: remote.getCurrentWindow(),
        modal: true,
        minimizable: false,
        maximizable: false,
        width: 400,
        height: 600,
        resizable: false,

        webPreferences: {
            nodeIntegration: true
        }
    });

    setProfileStuff();    
    localStorage.setItem('profile_stuff', JSON.stringify(profile_stuff));
    win.loadFile(path.join('renderer', 'profiles.html'));

    win.once('close', () => {
        var cancel = JSON.parse(localStorage.getItem("cancel_check"));
        if (typeof cancel != "undefined" && cancel.cancel) {
            return;
        }
        updateProfilesInfo();
        in_profile_manager = false;
    });
}

function layerAction(bool, elem, event) {
    if (bool)
        elem.querySelector("#layer_dropdown").style.display = "block";
    else {
        var tmp = event.topElement || event.relatedTarget;
        if (!tmp.closest("#layer_dropdown_btn")) 
            elem.querySelector("#layer_dropdown").style.display = "none";
    }
}
function filterAction(bool, elem) {
    if (bool) {
        elem.querySelector("#filter_form").style.display = "block";
    } else {
        elem.querySelector("#filter_form").style.display = "none";
    }
}

//Selection related functions

var start, currentt, box, canvas, map;
function mouseDown(e, _map, _canvas) {
    canvas = _canvas;
    map = _map;

    if (e.shiftKey)
        rectMouseDown(e);
    else if (e.ctrlKey) {
        //cenas ctrl
    }

}

function toggleCntrlPress(e, canvas) {
    if (e.keyCode == 17 && !e.repeat) {
        if (cntrl_pressed)
            cntrl_pressed = false;
        else
            cntrl_pressed = true;
    }
}


function mousePos(e) {
    var rect = canvas.getBoundingClientRect();
    return new mapboxgl.Point(
        e.clientX - rect.left - canvas.clientLeft,
        e.clientY - rect.top - canvas.clientTop
    );
}

function finish(bbox) {
    document.removeEventListener('mousemove', rectMouseMove);
    document.removeEventListener('keydown', rectKeyDown);
    document.removeEventListener('mouseup', rectMouseUp);

    if (box) {
        box.parentNode.removeChild(box);
        box = null;
    }

    // If bbox exists. use this value as the argument for `queryRenderedFeatures`
    if (bbox) {
        var search_features = map.queryRenderedFeatures(bbox, {
            layers: ['buildings_layer', 'landuse_layer', 'roads_layer', 'gl-draw-polygon-fill-inactive.cold']
        });
        if (search_features.length == 0)
            return;
        var tmp_drawn_features = [];
        for (var i = 0; i < search_features.length; i++)
            if (search_features[i].layer.id === "gl-draw-polygon-fill-inactive.cold") {
                tmp_drawn_features.push(search_features[i]);
                search_features.splice(i, 1);
                i--;
            }
        tmp_drawn_features = Array.from(new Set(tmp_drawn_features.map(a => a.properties.id)))
            .map(id => {
                return tmp_drawn_features.find(a => a.properties.id === id);
            });
        search_features.push.apply(search_features, tmp_drawn_features);

        clearSelections();
        draw.changeMode("simple_select");
        var id, color;
        var area_counter = 0, length_counter = 0, focus_arr = [], isRoad = false;
        object_selection_count = 0;
        road_selection_count = 0;
        for (var i in search_features) {
            id = findObjId(search_features[i]);

            if (!id || id == -1) {
                console.log("object ID not found!");
                continue;
            }
            selected_objs.push(all_list[id]);
            for (var j in all_list[id].focus)
                focus_arr.push(all_list[id].focus[j]);
            switch (all_list[id].source) {
                case "building":
                    isRoad = false;
                    //selection_props = { source: "-", type: "-" };
                    area_counter += all_list[id].area;
                    color = "rgba(66, 100, 251, 0.8)";
                    break;
                case "landuse":
                    isRoad = false;
                    //selection_props = { source: "-", type: "-" };
                    area_counter += all_list[id].area;
                    color = "rgba(57, 241, 35, 0.8)";
                    break;
                case "road":
                    isRoad = true;
                    //selection_props = { source: "-", type: "-", name: "-"};
                    length_counter += all_list[id].length;
                    color = "rgba(255,100,251, 0.8)";
                    break;
            }
            addSelectionsColors(color, all_list[id].source, i, isRoad);
        }

        map.getSource("selection_road_source").setData(selection_road_features);
        map.getSource("selection_object_source").setData(selection_object_features);

        if (area_counter > 0)
            selection_obj.area = Math.round(area_counter * 100) / 100;
        if (length_counter > 0)
            selection_obj.length = Math.round(length_counter * 100) / 100;

        selection_obj.polution = getAveragePolution(selected_objs);
        selection_obj.range = getAverageRange(selected_objs);
        selection_obj.profile = ["any"];
        selection_obj.focus = focus_arr;
        selection_obj.id = "-";

        //document.getElementById("editButton").style.visibility = "visible";
        createPropertiesTable(selection_obj, false);
        var focus_ph = document.getElementById("focus_placeholder").querySelector("#editor_input").querySelector("button");
        if (selected_objs.length == 1) {
            focus_ph.disabled = false;
            //focus_ph.style.cursor = "pointer";
        } else if (selected_objs.length > 1){
            focus_ph.disabled = true;
            focus_ph.classList.toggle("disabled");
            //focus_ph.style.cursor = "not-allowed";
        }
    }

    map.dragPan.enable();
}

function rectMouseDown(e, _map, _canvas) {
    //canvas = _canvas;
    //map = _map;

    if (!e.shiftKey) return;

    map.dragPan.disable();

    document.addEventListener('mousemove', rectMouseMove);
    document.addEventListener('mouseup', rectMouseUp);
    document.addEventListener('keydown', rectKeyDown);

    start = mousePos(e);
}

function rectMouseMove(e) {
    currentt = mousePos(e, canvas);

    if (!box) {
        box = document.createElement('div');
        box.classList.add('boxdraw');
        canvas.appendChild(box);
    }

    var minX = Math.min(start.x, currentt.x),
        maxX = Math.max(start.x, currentt.x),
        minY = Math.min(start.y, currentt.y),
        maxY = Math.max(start.y, currentt.y);

    // Adjust css width and xy position of the box element ongoing
    var pos = 'translate(' + minX + 'px,' + minY + 'px)';
    box.style.transform = pos;
    box.style.WebkitTransform = pos; //Potential error here
    box.style.width = maxX - minX + 'px';
    box.style.height = maxY - minY + 'px';
}

function rectMouseUp(e) {
    finish([start, mousePos(e)]);
}

function rectKeyDown(e) {
    if (e.keyCode === 27) finish();
}

function mouseDescriptionBox(coords) {
    var div = document.createElement("div");
}


function openTutorial() {
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        parent: remote.getCurrentWindow(),
        //modal: true,
        minimizable: false,
        maximizable: false,
        width: 1000,
        height: 1000,
        resizable: true,

        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile(path.join('renderer', 'tutorial.html'));
}