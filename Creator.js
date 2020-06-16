const cvs = document.getElementById("creator_graph");
let ctx = cvs.getContext("2d"); 
const Chart = require('chart.js');

var labels = ["item0", "item1"];
var creator_graph = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: "undefined",
            borderColor: "rgb(250, 0, 0)",
            data: [0, 0]
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

var data = creator_graph.data.datasets[0].data;

document.querySelectorAll('#creator_table input').forEach(e => e.addEventListener('input', function () { inputHandler(this) }));

var table = document.getElementById("creator_table");
var title = document.getElementById("graph_name");
title.addEventListener('input', function () { titleInputHandler(this) })

function addWeightSlider(elem) {
    var template_elem = document.getElementById("weight_slider_template");
    var slider_div = template_elem.content.querySelector(".weight_slider");
    var parent_node = document.importNode(slider_div, true);

    parent_node.querySelector("#name").textContent = "Weight";

    elem.appendChild(parent_node);
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

    labels.push(input1.value);
    data.push(0);

    creator_graph.update();
}

function inputHandler(e) {
    var index = e.id;
    var type = e.type;
    if (type == "text") {
        labels[index] = e.value;
    } else if (type = "number") {
        /*if (isNaN(parseInt(e.value))) {
            alert("input must be a number");
            return;
        }*/
        data[index] = parseInt(e.value);
        console.log(parseInt(e.value));
    }
    creator_graph.update();
}
function titleInputHandler(e) {
    creator_graph.data.datasets[0].label = e.value;
    creator_graph.update();
}

function erase_creator() {
    title.value = "";
    table.innerHTML = "<table id='creator_table' width='100%' contenteditable='true'>" +
        "<tr>" +
        "<td><input type='text' value='item0' id='0'/></td>" +
        "<td><input type='number' value=0 id='0'/></td>" +
        "</tr>" +
        "<tr>" +
        "<td><input type='text' value='item1' id='1'/></td>" +
        "<td><input type='number' value=0 id='1'/></td>" +
        "</tr>" +
        "</table>";

    for (var i = labels.length; i > 2; i--) {
        labels.pop();
        data.pop();
    }
    labels[0] = "item0"; labels[1] = "item1";
    data[0] = 0; data[1] = 0;
    creator_graph.data.datasets[0].label = "undefined";
    creator_graph.update();
}

function save_creator() {
    console.log("before getItem");
    var test_stuff_2 = localStorage.getItem("test_stuff");
    console.log(test_stuff_2);
    test_stuff_2 = "SOMETHIN MARVELOUYS HAPPENSDEDEDDEDED!!!!";
    localStorage.setItem("test_stuff", test_stuff_2);
    console.log("after setItem");

}