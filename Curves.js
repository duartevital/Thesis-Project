
const cvs = document.getElementById("line_graph");
let ctx = cvs.getContext("2d");
var avg_polution = 0.0001;

var avg_1 = avg_2 = avg_3 = avg_4 = avg_5 = avg_6 = avg_7 = avg_polution;

const days = {
    STANDART: { name: 'standart', chart_name: 'Standart', avg: avg_polution },
    MONDAY: { name: 'monday', chart_name: 'Monday', avg: avg_1 },
    TUESDAY: { name: 'tuesday', chart_name: 'Tuesday', avg: avg_2 },
    WEDNESDAY: { name: 'wednesday', chart_name: 'Wednesday', avg: avg_3 },
    THURSDAY: { name: 'thursday', chart_name: 'Thursday', avg: avg_4 },
    FRIDAY: { name: 'friday', chart_name: 'Friday', avg: avg_5 },
    SATURDAY: { name: 'saturday', chart_name: 'Saturday', avg: avg_6 },
    SUNDAY: { name: 'sunday', chart_name: 'Sunday', avg: avg_7 }
}

let day = days.STANDART;
 
var valueBeforeDrag = 0.0001;
var ondrag_value = 0.0001;

var line_chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ["Standart", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        datasets: [{
            label: "polution level",
            borderColor: "rgb(255, 0, 0)",
            data: [avg_polution, avg_polution, avg_polution, avg_polution, avg_polution, avg_polution, avg_polution, avg_polution]
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
        //onDrag: function (e, datasetIndex, index, value) { enableListUpdate(index, value) },
        onDragEnd: function (e, datasetIndex, index, value) { updateList(index, value) }
    }
});

function updateChart() {
    var avg = getAveragePolution(all_list);
    var new_avg = 0.0001;
    if (avg > 0) 
        new_avg = (avg / 100) * 2;
    
    var data = line_chart.data.datasets[0].data;
    day.avg = avg;
    switch (day.name) {
        case days.STANDART.name:
            //for (var i in data) data[i] = new_avg;
            data[0] = new_avg;
            break;
        case days.MONDAY.name:
            data[1] = new_avg;
            break;
        case days.TUESDAY.name:
            data[2] = new_avg;
            break;
        case days.WEDNESDAY.name:
            data[3] = new_avg;
            break;
        case days.THURSDAY.name:
            data[4] = new_avg;
            break;
        case days.FRIDAY.name:
            data[5] = new_avg;
            break;
        case days.SATURDAY.name:
            data[6] = new_avg;
            break;
        case days.SUNDAY.name:
            data[7] = new_avg;
            break;
    }
    line_chart.update();
}

function updateList(index, value) {
    for (var i in all_list) {
        console.log(all_list[i]);
    }
    var after_value = 0.0001;
    if (value > 0.0001)
        after_value = (value / 2) * 100;
    var before_value = (valueBeforeDrag / 2) * 100;
    var new_value = Math.abs(after_value - before_value);
    if (line_chart.data.labels[index] == day.chart_name) {
        changePolutionValues(before_value, after_value, new_value);
    }
    switch (index) {
        case 0:
            days.STANDART.avg = after_value; //after_value pq dps faço a diferença com valores de outros dias, não com o valor anterior no chart
            break;
        case 1:
            days.MONDAY.avg = after_value;
            break;
        case 2:
            days.TUESDAY.avg = after_value;
            break;
        case 3:
            days.WEDNESDAY.avg = after_value;
            break;
        case 4:
            days.THURSDAY.avg = after_value;
            break;
        case 5:
            days.FRIDAY.avg = after_value;
            break;
        case 6:
            days.SATURDAY.avg = after_value;
            break;
        case 7:
            days.SUNDAY.avg = after_value;
            break;
    }
}

function storeValueBeforeDrag(element) {
    valueBeforeDrag = line_chart.data.datasets[0].data[element._index];
    ondrag_value = valueBeforeDrag;
}

function changeDay(elem) {
    var before_value = day.avg;
    day = days[elem.value];
    var after_value = day.avg;
    if (before_value != after_value) {
        var new_value = Math.abs(after_value - before_value);
        changePolutionValues(before_value, after_value, new_value);
    }
    
}

function changePolutionValues(before_value, after_value, new_value) {
    for (var i in all_list) {
        let pol = all_list[i].polution;
        //if (pol > 0 && pol <= 500) { //resolver dexer para 0 e voltar a subir
        if (all_list[i].altered) {
            console.log("before = " + all_list[i].polution);
            if (after_value > before_value) {
                let tmp = all_list[i].polution + new_value
                if (tmp > 500) all_list[i].polution = 500;
                else all_list[i].polution = tmp;
            } else if (after_value < before_value) {
                let tmp = all_list[i].polution - new_value
                if (tmp < 0) all_list[i].polution = 0;
                else all_list[i].polution = tmp;
            }
            console.log("after = " + all_list[i].polution);
            addHeatFeature(all_list[i]);
        }
    }
}

function enableListUpdate(index, value) {
    if (value != ondrag_value)
        updateList(index, value);
    ondrag_value = value;
}