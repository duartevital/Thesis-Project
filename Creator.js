const cvs = document.getElementById("creator_graph");
const remote = require('electron').remote;
const path = require('path');
let ctx = cvs.getContext("2d"); 
const Chart = require('chart.js');

//html stuff
document.querySelectorAll('#creator_table input').forEach(e => e.addEventListener('input', function () { inputHandler(this) }));
var table = document.getElementById("creator_table");
var graph_name = document.getElementById("graph_name");
var profile_section = document.getElementById("profile_section");
var creator_slider_div = document.getElementById("creator_slider_div");
var creator_header = document.getElementById("creator_header");
graph_name.addEventListener('input', function () { nameInputHandler(this) });


/**********/
var graph_info = JSON.parse(localStorage.getItem('graph_info'));
var profile_stuff = JSON.parse(localStorage.getItem('profile_stuff'));
var profile_list = profile_stuff.profile_list;
var graph_list = profile_stuff.graph_list;
//graph stuff
var current_graph = graph_info.info;

var labels_array = current_graph.labels;
var labels_names = [], labels_values = [];
setNames_Values();
if (!graph_info.edit) {
    graph_list.push(current_graph);
    profile_list[0].graphs.push(current_graph);
    document.getElementById("delete_btn").disabled = true;
} 

var default_graph_list_length = graph_list.length;

var creator_chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels_names,
        datasets: [{
            label: "undefined",
            borderColor: "rgb(250, 0, 0)",
            data: labels_values
        }]
    },
    options: {
        aspectRatio: 1.6, 
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0,
                    max: 10

                }
            }]
        }
    }
});

//if edit == true
setEditInfo()

function setEditInfo() {
    if (!graph_info.edit)
        return;
    
    graph_name.value = current_graph.name;
    var val = "";
    for (var i in current_graph.profile)
        val += current_graph.profile[i] + ", ";
    profile_section.querySelector("#input").value = val;
    creator_slider_div.querySelector("input").value = current_graph.weight
    creator_slider_div.querySelector("#slider_value").textContent = current_graph.weight
    //table recreation
    table.deleteRow(0); table.deleteRow(0);
    labels_names = []; labels_values = [];
    var row, cell1, cell2, input1, input2, row_index;
    for (var i in current_graph.labels) {
        row = table.insertRow(-1);
        cell1 = row.insertCell(0); cell2 = row.insertCell(1);
        row_index = table.rows.length - 1;
        input1 = document.createElement('input');
        input2 = document.createElement('input');
        input1.type = "text"; input1.value = current_graph.labels[i].name; input1.id = row_index;
        input2.type = "number"; input2.value = current_graph.labels[i].value; input2.id = row_index;
        input1.addEventListener('input', function () { inputHandler(this) });
        input2.addEventListener('input', function () { inputHandler(this) });
        cell1.appendChild(input1); cell2.appendChild(input2);

        labels_names.push(current_graph.labels[i].name);
        labels_values.push(current_graph.labels[i].value);
    }
    creator_chart.data.labels = labels_names;
    creator_chart.data.datasets[0].data = labels_values;
    creator_chart.update();
}

function setNames_Values() {
    for (var i in labels_array) {
        labels_names.push(labels_array[i].name);
        labels_values.push(labels_array[i].value);
    }
}

function editProfile() {
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        width: 400,
        height: 600,
        resizable: false,

        webPreferences: {
            nodeIntegration: true
        }
    });
    
    profile_stuff.graph_list = graph_list;
    for (var i in profile_list) {
        for (var j in profile_list[i].graphs) {
            if (profile_list[i].graphs[j].id == current_graph.id) {
                profile_list[i].graphs[j] = current_graph;
                break;
            }
        }
    }
    profile_stuff.profile_list = profile_list;
    localStorage.setItem('profile_stuff', JSON.stringify(profile_stuff));
    win.loadFile(path.join('renderer', 'profiles.html'));

    win.once('close', () => {
        var cancel = JSON.parse(localStorage.getItem("cancel_check"));
        if (typeof cancel != "undefined" && cancel.cancel) {
            return;
        }
        profile_stuff = JSON.parse(localStorage.getItem("profile_stuff"));
        profile_list = profile_stuff.profile_list;
        console.log(profile_stuff);
        console.log(graph_list);
        console.log(current_graph);
        //handle graphs' profiles
        for (var i in graph_list) {
            graph_list[i].profile = [];
            for (var j in profile_list) {
                if (!profile_list[j].graphs)
                    continue;
                for (var k in profile_list[j].graphs) {
                    if (profile_list[j].graphs[k].name == graph_list[i].name) {
                        graph_list[i].profile.push(profile_list[j].name);
                        break;
                    }
                }
            }
        }
        current_graph.profile = graph_list[current_graph.id].profile;
        var val = "";
        for (var i in current_graph.profile)
            val += current_graph.profile[i] + ", ";

        document.getElementById("profile_section").querySelector("input").value = val;
        
    });
}

function updateSliderValue(elem) {
    var val = document.getElementById("slider_value");
    val.innerText = elem.value;

    current_graph.weight = parseInt(elem.value);
}

function addRow() {
    var row, cell1, cell2;
    row = table.insertRow(-1);
    cell1 = row.insertCell(0); cell2 = row.insertCell(1);

    var row_index = table.rows.length - 1;

    var input1 = document.createElement('input');
    var input2 = document.createElement('input'); 
    input1.type = "text"; input1.value = "item" + row_index; input1.id = row_index;
    input2.type = "number"; input2.value = 0; input2.id = row_index;
    input1.addEventListener('input', function () { inputHandler(this) });
    input2.addEventListener('input', function () { inputHandler(this) });

    cell1.appendChild(input1); cell2.appendChild(input2);

    //current_graph.labels.push(input1.value);
    //data.push(0);
    labels_names.push(input1.value);
    labels_values.push(0);

    creator_chart.update();
}

function inputHandler(e) {
    var index = e.id;
    var type = e.type;
    if (type == "text") {
        labels_names[index] = e.value;
    } else if (type = "number") {
        /*if (isNaN(parseInt(e.value))) {
            alert("input must be a number");
            return;
        }*/
        labels_values[index] = parseInt(e.value);
    }
    creator_chart.update();
}
function nameInputHandler(e) {
    creator_chart.data.datasets[0].label = e.value;
    creator_chart.update();

    if (!e.value) {
        current_graph.name = "unsaved graph";
        return;
    }
    current_graph.name = e.value;
}

function deleteGraph() {
    var box = confirm("You're about to delete this graph and close this window");
    if (!box)
        return;

    //falta fazer o close e o campo delete no localstorage( graph_info );
    //current_graph.cancel = false;
    current_graph.delete = true;
    localStorage.setItem('graph_info', JSON.stringify(current_graph));
    window.close();
}

function cancel_creator() {
    //current_graph.cancel = true;
    localStorage.setItem('cancel_check', JSON.stringify({ cancel: true }));
    window.close();
}

function erase_creator() {
    location.reload();
}

function save_creator() {
    localStorage.setItem('cancel_check', JSON.stringify({ cancel: false }));
    if(!graph_info.edit)
        graph_list.pop();
    profile_stuff.graph_list = graph_list;
    localStorage.setItem('profile_stuff', JSON.stringify(profile_stuff));

    //current_graph.cancel = false;
    current_graph.labels = [];
    //var tmp_labels = creator_chart.data.labels; -> labels_names
    //var tmp_value = 0;
    for (var i in labels_names) {
        //tmp_value = creator_chart.data.datasets[0].data[i];
        current_graph.labels.push({ name: labels_names[i], value: labels_values[i] });
    }
    localStorage.setItem('graph_info', JSON.stringify(current_graph));
    window.close();
}