const path = require('path');
//const Window = require('./Window');

const cvs = document.getElementById("line_graph");
let ctx = cvs.getContext("2d");
var avg_polution = 0.0001;
var avg_1 = avg_2 = avg_3 = avg_4 = avg_5 = avg_6 = avg_7 = avg_polution;
var weight_sum = 10;
var error_active = false;

var graph_list = [];
var graph = {
    title: "weekday",
    weight: 10,
    profile: ["any"],
    labels: [
        { name: 'standart', value: avg_polution },
        { name: 'monday', value: avg_1 },
        { name: 'tuesday', value: avg_2 },
        { name: 'wednesday', value: avg_3 },
        { name: 'thursday', value: avg_4 },
        { name: 'friday', value: avg_5 },
        { name: 'saturday', value: avg_6 },
        { name: 'sunday', value: avg_7 }
    ]
}
graph_list.push(graph);
var selected_row = 0;
var labels_array = graph.labels;
var labels_names, labels_values;
setNames_Values();


//Inner graph stuff
let current = labels_array[0]; 
var valueBeforeDrag = 0.0001;
var ondrag_value = 0.0001;

var line_chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels_names,
        datasets: [{
            label: "polution level",
            borderColor: "rgb(255, 0, 0)",
            data: labels_values
        }]
    },    
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0.0001,
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
        //////onDrag: function (e, datasetIndex, index, value) { enableListUpdate(index, value) },
        onDragEnd: function (e, datasetIndex, index, value) { updateList(index, value) }
    }
});

//addWeightSlider(document.getElementById("weight_sliders_container"));

function updateChart() {
    var avg = getAveragePolution(all_list);
    var new_avg = 0.0001;
    if (avg > 0) 
        new_avg = (avg / 100) * 2;
    
    var data = line_chart.data.datasets[0].data;
    current.value = new_avg;
    for (var i in labels_array) {
        if (current.name == labels_array[i].name) {
            data[i] = new_avg;
            break;
        }
    }
    
    line_chart.update();
}

function updateList(index, value) {
    var after_value = 0.0001;
    if (value > 0.0001)
        after_value = (value / 2) * 100;
    var before_value = (valueBeforeDrag / 2) * 100;
    var new_value = Math.abs(after_value - before_value);
    if (line_chart.data.labels[index] == current.name) {
        changePolutionValues(before_value, after_value, new_value);
    }
    labels_array[index].value = value;
}

function storeValueBeforeDrag(element) {
    valueBeforeDrag = line_chart.data.datasets[0].data[element._index];
    ondrag_value = valueBeforeDrag;
}

function changePolutionValues(before_value, after_value, new_value) {
    var same_profile;
    for (var i in all_list) {
        same_profile = false;
        for (var j in all_list[i].profile) {
            for (var k in graph.profile) {
                if (all_list[i].profile[j] == graph.profile[k]) {
                    same_profile = true;
                    break; break;
                }
            }
        }

        if (all_list[i].altered && same_profile) {
            if (after_value > before_value) {
                //let tmp = all_list[i].polution + (new_value * (graph.weight / 10));
                let tmp = all_list[i].polution + (new_value * (graph.weight / weight_sum));
                if (tmp > 500) all_list[i].polution = 500;
                else all_list[i].polution = tmp;
            } else if (after_value < before_value) {
                let tmp = all_list[i].polution - (new_value * (graph.weight / weight_sum));
                //let tmp = all_list[i].polution - (new_value * (graph.weight / 10));
                if (tmp < 0) all_list[i].polution = 0;
                else all_list[i].polution = tmp;
            }
            addHeatFeature(all_list[i]);
        }
    }
}

function enableListUpdate(index, value) {
    if (value != ondrag_value)
        updateList(index, value);
    ondrag_value = value;
}

function changeGraph(elem) {
    graph = graph_list[elem.selectedIndex];
    updateParams();
    setLabelsDropdown();

    console.log(graph);
    //line_chart.update();
}

//change function name
function changeDay(elem) {
    var before_value = current.value;
    current = labels_array[elem.selectedIndex];
    var after_value = current.value;
    if (before_value != after_value) {
        var new_value = Math.abs(after_value - before_value);
        changePolutionValues(before_value, after_value, new_value);
    }

}

/*function changeProfile(elem) {
    graph.profile = elem.value;
}*/

function setLabelsDropdown() {
    var elem = document.getElementById("item_dropdown");
    elem.innerHTML = "<select id='item_dropdown' onchange='changeDay(this)'></select>";
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
    valueBeforeDrag = 0.0001;
    ondrag_value = 0.0001;

    line_chart.data.labels = labels_names;
    line_chart.data.datasets[0].data = labels_values;
    line_chart.update();
}

function getSelectedGraph(elem) {
    //graph = graph_list[elem.rowIndex];
    selected_row = elem.rowIndex;
}

function addWeightSum(val) {
    /*weight_sum += val;
    document.getElementById("weight_sum").innerText = weight_sum;
    if ((weight_sum > 10 || weight_sum < 10) && !error_active) {
        toggleInteractions(false);
        document.getElementById("error_holder").style.visibility = "visible";
        return;
    }// else {
        toggleInteractions(true);
        document.getElementById("error_holder").style.visibility = "hidden";
    //}*/
}

function updateSum(elem) {
    //console.log(elem.parentElement.parentElement.querySelectorAll("td")[2]);
    //elem.parentElement.parentElement.querySelectorAll("td")[2].innerText = elem.value;
    graph_list[selected_row].weight = parseInt(elem.value);
    weight_sum = 0;
    for (var i in graph_list) {
        weight_sum += graph_list[i].weight;
    }
    //document.getElementById("weight_sum").innerText = weight_sum;
    var row = document.getElementById("weight_table").rows[selected_row];
    row.cells[2].innerText = row.cells[1].querySelector("input").value;
    /*if ((weight_sum > 10 || weight_sum < 10) && !error_active) {
        toggleInteractions(false);
        document.getElementById("error_holder").style.visibility = "visible";
    } else {
        toggleInteractions(true);
        document.getElementById("error_holder").style.visibility = "hidden";
    }*/
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

function updateProfileInfo(name) { //atualiza info. de profiles no 'profile_info'
    //dropdown
    /*var profile = document.getElementById("profile_dropdown");
    for (var i = 0; i < profile.length; i++) {
        if (profile[i].innerText == name)
            return;
    }
    var new_opt = document.createElement("option");
    new_opt.textContent = name;
    new_opt.value = name;
    profile.appendChild(new_opt);
    profile.value = new_opt.text;
    
    //local var
    graph.profile = name;
    //profile_list -> Mapbox_gl.js
    profile_list.push(graph.profile);*/
}

function editGraph() {
    
}

function profile_handler() {
    var tmp_stuff = [];
    for (var i in profile_list)
        tmp_stuff.push({ name: profile_list[i], selected: false });
    localStorage.setItem('profile_stuff', JSON.stringify(tmp_stuff));

    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        width: 200,
        height: 300,
        resizable: false,

        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile(path.join('renderer', 'profiles.html'));

    win.once('close', () => {
        graph.profile = JSON.parse(localStorage.getItem('selected_profiles'));
        var profile_info_div = document.getElementById("profile_info");
        for (var i in graph.profile) {
            profile_info_div.innerText += graph.profile[i] + ", ";
        }
    });
}

function openGraphCreationWindow() {
    //const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        width: 770,
        height: 600,
        resizable: false,


        webPreferences: {
            nodeIntegration: true
        }
    });
    var tmp_stuff = [];
    for (var i in profile_list)
        tmp_stuff.push({ name: profile_list[i], selected: false });

    localStorage.setItem('profile_stuff', JSON.stringify(tmp_stuff));

    win.loadFile(path.join('renderer', 'creator.html'));

    //get saved created graph
    win.once('close', () => {
        graph = JSON.parse(localStorage.getItem('creator_graph'));
        console.log(graph);
        graph_list.push(graph);
        //addWeightSum(graph.weight);
        //Update graph list dropdown
        let select = document.getElementById("graph_dropdown");
        let new_option = document.createElement("option"); new_option.text = graph.title;
        select.add(new_option); select.value = new_option.text;
        //Update profile dropdown
        updateProfileInfo(graph.profile);
        //Update graph weight table
        let table = document.getElementById("weight_table");
        var row = table.insertRow(-1);
        row.addEventListener("mousedown", function () { getSelectedGraph(this) });
        row.style = 'background-color: #ffffff';
        var cell1, cell2, cell3;
        cell1 = row.insertCell(0); cell1.textContent = graph.title;
        cell2 = row.insertCell(1);
        cell2.innerHTML = '<td><input type="range" min="1" max="10" value="' + graph.weight +'" class="slider" oninput="updateSum(this)"/></td>';
        cell3 = row.insertCell(2); cell3.textContent = cell2.querySelector("input").value;

        updateParams();
        setLabelsDropdown();
    });

}