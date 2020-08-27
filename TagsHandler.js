var aeroway_array = [];
var amenity_array = [];
var building_array = [];
var road_array = [];
var landuse_array = [];

var all_results_array = [];
var sources_array = ["building", "roads", "landuse", "water"];

var test = [];
async function fetchTags() {
    /*let response1 = await fetch('https://taginfo.openstreetmap.org/api/4/key/values?key=aeroway&page=1&rp=30sortname=count_ways&sortorder=desc');
    let data1 = await response1.json()
        .then(function (data1) {
            handle_data(data1.data, aeroway_array);
            all_results_array = all_results_array.concat(aeroway_array);
        });

    let response2 = await fetch('https://taginfo.openstreetmap.org/api/4/key/values?key=amenity&page=1&rp=30&sortname=count_ways&sortorder=desc');
    let data2 = await response2.json()
        .then(function (data2) {
            handle_data(data2.data, amenity_array);
            all_results_array = all_results_array.concat(amenity_array);
        });*/

    let response3 = await fetch('https://taginfo.openstreetmap.org/api/4/key/values?key=building&page=1&rp=30&sortname=count_ways&sortorder=desc');
    let data3 = await response3.json()
        .then(function (data3) {
            handle_data(data3.data, building_array);
            //all_results_array = all_results_array.push.apply(building_array);
        });

    let response4 = await fetch('https://taginfo.openstreetmap.org/api/4/key/values?key=highway&page=1&rp=30&sortname=count_ways&sortorder=desc');
    let data4 = await response4.json()
        .then(function (data4) {
            handle_data(data4.data, road_array);
            //all_results_array = all_results_array.push.apply(highway_array);
        });

    let response5 = await fetch('https://taginfo.openstreetmap.org/api/4/key/values?key=landuse&page=1&rp=30&sortname=count_ways&sortorder=desc');
    let data5 = await response5.json()
        .then(function (data5) {
            handle_data(data5.data, landuse_array);
            //all_results_array = all_results_array.push.apply(landuse_array);
        });
}


function handle_data(from , to) {
    for (var i in from) {
        to.push(from[i].value);
    }
}