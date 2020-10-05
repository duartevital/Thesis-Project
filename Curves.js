const path = require('path');
//const Window = require('./Window');

var map_info_bg = map_info.querySelector(".map_info_bg");
var graph_dropdown = document.getElementById("graph_dropdown");
var weight_table = document.getElementById("weight_table");
var curves_graph = document.getElementById("curves_graph");
const cvs = document.getElementById("line_graph");
let ctx = cvs.getContext("2d");
var avg_polution = 0;
var avg_1 = avg_2 = avg_3 = avg_4 = avg_5 = avg_6 = avg_7 = avg_polution;
var weight_sum = 10;

var graph_list = [];
var graph = {
    id: 0,
    name: "weekday",
    weight: 10,
    profile: ["any"],
    labels: [
        { name: 'monday', value: 5, selected: true },
        { name: 'tuesday', value: 5 },
        { name: 'wednesday', value: 5 },
        { name: 'thursday', value: 5 },
        { name: 'friday', value: 5 },
        { name: 'saturday', value: 5 },
        { name: 'sunday', value: 5 }
    ]
}
addGraphs();
var selected_row = 0;
var labels_array = graph.labels;
var labels_names, labels_values;
setNames_Values();
setProfilesInput();
setItemsInfo();

//Inner graph stuff
let current = labels_array[0]; 
var valueBeforeDrag = 0;

var saved_graph_state = [];
for (var i in graph.labels) 
    saved_graph_state.push({ name: graph.labels[i].name, value: graph.labels[i].value });

var saved_current = saved_graph_state[0];

var line_chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels_names,
        datasets: [{
            label: "polution magnitude",
            borderColor: "rgb(255, 0, 0)",
            data: labels_values
        }]
    },    
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0,
                    max: 10
                    
                }
            }]
        },
        dragData: true,
        dragDataRound: 0,
        dragOptions: {
            showTooltip: true
        },
        onDragStart: function (e, element) { storeValueBeforeDrag(element) },
        onDragEnd: function (e, datasetIndex, index, value) { updateList(index, value) },
        hover: {
            onHover: function (e) {
                const point = this.getElementAtEvent(e)
                if (point.length) e.target.style.cursor = 'grab'
                else e.target.style.cursor = 'default'
            }
        }
    }
});

function addGraphs() {
    graph_list.push(graph);
    graph_list.push({
        id: 1,
        name: "traffic",
        weight: 10,
        profile: ["any"],
        labels: [
            { name: 'low', value: 5, selected: true },
            { name: 'medium', value: 5 },
            { name: 'high', value: 5 }
        ]
    });
}

function setProfilesInput() {
    var val = "";
    for (var i in graph.profile)
        val += graph.profile[i] + ", ";

    if (val == "") val = "No profile selected";
    document.getElementById("profile_info_div").querySelector("input").value = val;
}

function updateChart() {
    var avg = getAveragePolution(all_list);
    var new_avg = (avg / 100) * 2;

    var data = line_chart.data.datasets[0].data;
    current.value = new_avg;
    //saved_current.value = new_avg;
    for (var i in labels_array) {
        if (current.name == labels_array[i].name) {
            data[i] = new_avg;
            saved_graph_state[i].value = new_avg;
            break;
        }
    }
    
    line_chart.update();
}

function updateList(index, value) {
    map_info_bg.classList.toggle("pulse_animation", true);
    var after_value = (value / 2) * 100;
    var before_value = (valueBeforeDrag / 2) * 100;
    var new_value = Math.abs(after_value - before_value);
    if (line_chart.data.labels[index] == current.name) {
        changePolutionValues(before_value, after_value, new_value);
    }
    labels_array[index].value = value;
}

function storeValueBeforeDrag(element) {
    if (map_info_bg.classList.contains("pulse_animation"))
        map_info_bg.classList.toggle("pulse_animation", false);
    valueBeforeDrag = line_chart.data.datasets[0].data[element._index];
}

function changePolutionValues(before_value, after_value, new_value) {
    if (graph.weight == 0)
        return;
    var same_profile;
    for (var i in altered_list) {
        same_profile = false;
        heat_break:
        for (var j in altered_list[i].profile) {
            for (var k in graph.profile) {
                if (altered_list[i].profile[j] == graph.profile[k]) {
                    same_profile = true;
                    break heat_break; 
                }
            }
        }
        //if (altered_list[i].altered == true && same_profile == true && altered_list[i].heat_index > -1) {
        if (same_profile == true && altered_list[i].heat_index > -1) {
            /*if (after_value == 0) {
                altered_list[i].polution = 0;
            } else */if (after_value > before_value) {
                let tmp = altered_list[i].polution + (new_value * (graph.weight / 10));
                //let tmp = altered_list[i].polution + (new_value * (graph.weight / weight_sum));
                if (tmp > 500) altered_list[i].polution = 500;
                else altered_list[i].polution = tmp;
            } else if (after_value < before_value) {
                //let tmp = altered_list[i].polution - (new_value * (graph.weight / weight_sum));
                let tmp = altered_list[i].polution - (new_value * (graph.weight / 10));
                if (tmp < 0) altered_list[i].polution = 0;
                else altered_list[i].polution = tmp;
            }
            addHeatFeature(altered_list[i]);
        }
    }
}
function changePolutionValues_(before_value, after_value, new_value, graph_found) {
    if (graph_found.weight == 0)
        return;
    var same_profile;
    for (var i in altered_list) {
        same_profile = false;
        heat_break:
        for (var j in altered_list[i].profile) {
            for (var k in graph_found.profile) {
                if (altered_list[i].profile[j] == graph_found.profile[k]) {
                    same_profile = true;
                    break heat_break;
                }
            }
        }
        //if (altered_list[i].altered == true && same_profile == true && altered_list[i].heat_index > -1) {
        if (same_profile == true && altered_list[i].heat_index > -1) {
            if (after_value > before_value) {
                let tmp = altered_list[i].polution + (new_value * (graph_found.weight / 10));
                if (tmp > 500) altered_list[i].polution = 500;
                else altered_list[i].polution = tmp;
            } else if (after_value < before_value) {
                let tmp = altered_list[i].polution - (new_value * (graph_found.weight / 10));
                if (tmp < 0) altered_list[i].polution = 0;
                else altered_list[i].polution = tmp;
            }
            addHeatFeature(altered_list[i]);
        }
    }
}

function changeGraph(elem) {
    graph = graph_list[elem.selectedIndex];
    updateParams();
    //setLabelsDropdown();
    setProfilesInput();
    
    var selected_item;
    for (var i in graph.labels)
        if (graph.labels[i].selected) {
            selected_item = graph.labels[i];
            changeDay({ value: graph.labels[i].name, selectedIndex: i });
            break;
        }
    if (selected_item)
        document.getElementsByClassName("item_dropdown")[graph.id].value = selected_item.name;
}

//change function name
function changeDay(elem) {
    var before_value = (current.value / 2) * 100;
    current = labels_array[elem.selectedIndex];
    var after_value = (current.value / 2) * 100;
    if (before_value != after_value) {
        var new_value = Math.abs(after_value - before_value);
        changePolutionValues(before_value, after_value, new_value);
    }
    for (var i in graph.labels) {
        if (graph.labels[i].selected) 
            graph.labels[i].selected = false;
        if (graph.labels[i].name == elem.value)
            graph.labels[i].selected = true;
    }
}
function changeDay_(elem) {
    var graph_found, previous_label, new_label;

    for (var i in graph_list)
        if (graph_list[i].name == elem.id) {
            graph_found = graph_list[i];
            for (var j in graph_list[i].labels) {
                if (graph_list[i].labels[j].selected)
                    previous_label = graph_list[i].labels[j];

            }
            new_label = graph_list[i].labels[elem.selectedIndex];
            break;
        }

    var before_value = (previous_label.value / 2) * 100;
    var after_value = (new_label.value / 2) * 100;
    if (before_value != after_value) {
        var new_value = Math.abs(after_value - before_value);
        changePolutionValues_(before_value, after_value, new_value, graph_found);
    }
    for (var i in graph_found.labels) {
        if (graph_found.labels[i].selected)
            graph_found.labels[i].selected = false;
        if (graph_found.labels[i].name == elem.value)
            graph_found.labels[i].selected = true;
    }
}

function reset_graph_values() {
    var before_value = (current.value / 2) * 100;

    //graph.labels = saved_graph_state;
    for (var i in graph.labels) {
        graph.labels[i].value = saved_graph_state[i].value;
    }
    updateParams();

    var after_value = (saved_current.value / 2) * 100;
    if (before_value != after_value) {
        var new_value = Math.abs(after_value - before_value);
        changePolutionValues(before_value, after_value, new_value);
    }
}

function setLabelsDropdown() {
    //var elem = document.getElementsByClassName("item_dropdown")[graph.id];
    var elem = document.createElement("select");
    elem.innerHTML = "<select class='item_dropdown' onchange='changeDay(this)'></select>";
    var tmp_option;
    
    for (var i in labels_names) {
        tmp_option = document.createElement('option');
        tmp_option.value = labels_names[i];
        tmp_option.text = labels_names[i];
        elem.add(tmp_option);
    }
}

function setNames_Values() {
    labels_names = [];
    labels_values = [];
    for (var i in labels_array) {
        labels_names.push(labels_array[i].name);
        labels_values.push(labels_array[i].value);
    }
}

function updateParams() {
    labels_array = graph.labels;
    setNames_Values();

    current = labels_array[0];
    valueBeforeDrag = 0;

    line_chart.data.labels = labels_names;
    line_chart.data.datasets[0].data = labels_values;
    line_chart.update();
}

function getSelectedGraph(elem) {
    //graph = graph_list[elem.rowIndex];
    selected_row = elem.rowIndex;
}

function loadGraphInfo() {
    graph_dropdown.innerHTML = ""; weight_table.innerHTML = "";
    var row, cell1, cell2, cell3;
    graph = graph_list[0];
    let new_option = document.createElement("option");
    new_option.text = graph.name; new_option.value = graph.name;
    graph_dropdown.add(new_option); new_option.selected = true;

    row = weight_table.insertRow(-1);
    row.addEventListener("mousedown", function () { getSelectedGraph(this) });
    cell1 = row.insertCell(0); cell1.textContent = graph.name;
    cell2 = row.insertCell(1);
    cell2.innerHTML = '<td><input type="range" min="0" max="10" value="' + graph.weight + '" class="weight_slider" oninput="updateSum(this)"/></td>';
    cell3 = row.insertCell(2); cell3.textContent = cell2.querySelector("input").value;
    for (var i = 1; i < graph_list.length; i++) {
        new_option = document.createElement("option");
        new_option.text = graph_list[i].name; new_option.value = graph_list[i].name;
        graph_dropdown.add(new_option);

        row = weight_table.insertRow(-1);
        row.addEventListener("mousedown", function () { getSelectedGraph(this) });
        cell1 = row.insertCell(0); cell1.textContent = graph_list[i].name;
        cell2 = row.insertCell(1);
        cell2.innerHTML = '<td><input type="range" min="0" max="10" value="' + graph_list[i].weight + '" class="weight_slider" oninput="updateSum(this)"/></td>';
        cell3 = row.insertCell(2); cell3.textContent = cell2.querySelector("input").value;
    }
    updateParams()
}

function updateSum(elem) {
    graph_list[selected_row].weight = parseInt(elem.value);
    graph.weight = parseInt(elem.value);
    weight_sum = 0;
    for (var i in graph_list) {
        weight_sum += graph_list[i].weight;
    }

    var row = document.getElementById("weight_table").rows[selected_row];
    row.cells[2].innerText = row.cells[1].querySelector("input").value;
}

function toggleInteractions(enable) {
    if (enable)
        document.getElementById("disabler").style.visibility = "hidden";
    else
        document.getElementById("disabler").style.visibility = "visible";
    /*var div1, div2, nodes1, nodes2;
    div1 = document.getElementById("curves_top");
    nodes1 = div1.childNodes;
    for (var i in nodes1)
        nodes1[i].style.opacity = 0.3;

    div2 = document.getElementById("curves_graph");
    nodes2 = div2.childNodes;
    for (var i in nodes2)
        nodes2[i].style.opacity = 0.3;*/
}

function toggleElemsVisibility(visible) {
    var att = "", att2 = "";
    if (visible) {
        att = "visible";
        att2 = "hidden";
    } else {
        att = "hidden";
        att2 = "visible";
    }

    curves_graph.querySelector("#line_graph").style.visibility = att;
    curves_graph.querySelector("h4").style.visibility = att2;
    document.getElementById("weights_div").style.visibility = att;
    document.getElementById("profile_info_div").style.visibility = att;
    document.getElementById("graph_edit_btn").style.visibility = att;

}

function openGraphCreationWindow(edit) {
    //const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        parent: remote.getCurrentWindow(),
        modal: true,
        minimizable: false,
        maximizable: false,
        width: 770,
        height: 600,
        resizable: false,


        webPreferences: {
            nodeIntegration: true
        }
    });
    var tmp_graph;
    if (edit)
        tmp_graph = graph;
    else {
        tmp_graph = {
            id: graph_list.length,
            name: "unsaved graph",
            weight: 5,
            profile: ["any"],
            labels: [
                { name: 'item0', value: 5 },
                { name: 'item1', value: 5 }
            ]
        }
    }
    localStorage.setItem("graph_info", JSON.stringify(tmp_graph));
    localStorage.graph_edit = edit;
    setProfileStuff();
    localStorage.setItem('profile_stuff', JSON.stringify(profile_stuff));

    win.loadFile(path.join('renderer', 'creator.html'));

    //get saved created graph
    win.once('close', () => {
        //If cancel or close
        var cancel = JSON.parse(localStorage.getItem("cancel_check"));
        if (typeof cancel != "undefined" && cancel.cancel) 
            return;
        
        var tmp_name = graph.name;
        graph = JSON.parse(localStorage.getItem('graph_info'));
        graph.labels[0].selected = true;

        console.log({ graph: graph });
        //If delete button pressed
        if (graph.delete && graph.delete == true) {
            graph_list.splice(graph.id, 1);
            updateProfilesInfo();
            updateProfilesGraphs();
            var options = graph_dropdown.querySelectorAll("option");
            for (var i in options) 
                if (options[i].innerText == tmp_name) {
                    options[i].remove();
                    break;
                }
            
            options = graph_dropdown.querySelectorAll("option");
            if (options.length == 0) {
                toggleElemsVisibility(false);
            } else if (options.length > 0) {
                options[0].selected = true;
                changeGraph(graph_dropdown);
            }
            //Update weight table
            for (var i = 0; i < weight_table.rows.length; i++)
                if (weight_table.rows[i].cells[0].textContent == tmp_name) {
                    weight_table.deleteRow(i);
                    break;
                }
            //delete row from map info table
            var tmp_table = map_info.querySelector("table");
            for (var i = 0; i < tmp_table.rows.length; i++)
                if (tmp_table.rows[i].cells[0].textContent == tmp_name) {
                    tmp_table.deleteRow(i);
                    break;
                }
            return;
        }

        //Edit or create usecases
        toggleElemsVisibility(true);
        var row, cell1, cell2, cell3;
        if (!edit) { //if create
            graph.id = graph_list.length;
            graph_list.push(graph);

            //Update graph list dropdown
            let new_option = document.createElement("option");
            new_option.text = graph.name; new_option.value = graph.name;
            graph_dropdown.add(new_option); new_option.selected = true;

            //Add row to weight table
            row = weight_table.insertRow(-1);
            row.addEventListener("mousedown", function () { getSelectedGraph(this) });
            cell1 = row.insertCell(0); cell1.textContent = graph.name;
            cell2 = row.insertCell(1);
            cell2.innerHTML = '<td><input type="range" min="0" max="10" value="' + graph.weight + '" class="weight_slider" oninput="updateSum(this)"/></td>';
            cell3 = row.insertCell(2); cell3.textContent = cell2.querySelector("input").value;
            
        } else { //if edit
            graph_list[graph.id] = graph;
            updateProfilesGraphs();
            if (tmp_name != graph.name) {
                var options = graph_dropdown.querySelectorAll("option");
                for (var i in options) {
                    if (options[i].innerText == tmp_name) {
                        options[i].innerText = graph.name;
                        break;
                    }
                }
            }
            //Update weight table
            for (var i = 0; i < weight_table.rows.length; i++)
                if (weight_table.rows[i].cells[0].textContent == tmp_name) {
                    row = weight_table.rows[i];
                    break;
                }
            row.cells[0].textContent = graph.name;
            row.cells[1].innerHTML = '<td><input type="range" min="0" max="10" value="' + graph.weight + '" class="weight_slider" oninput="updateSum(this)"/></td>';
            row.cells[2].textContent = row.cells[1].querySelector("input").value;
            //delete row from map info table
            var tmp_table = map_info.querySelector("table");
            for (var i = 0; i < tmp_table.rows.length; i++) 
                if (tmp_table.rows[i].cells[0].textContent == tmp_name) {
                    tmp_table.deleteRow(i);
                    break;
                }
        }

        //Update profile info
        updateProfilesInfo();
        setProfilesInput();
        //add graph (and labels) to map_info
        addToItemsInfo(graph);

        updateParams();
        //setLabelsDropdown();
    });

}