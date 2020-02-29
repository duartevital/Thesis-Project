const mapboxgl = require('mapbox-gl');
const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const log = require('electron-log');
const turf = require('@turf/area');
var first_start = false;
var drawing = false;
var features = [];
var draw_id = 0;
var draw_object_list = [];
var objects_layer = [];
var objects_list = [];
var tmp_drawn_list = [];
var tmp_drawn_obj = {};

mapboxgl.accessToken = 'pk.eyJ1IjoiZHVhcnRlOTYiLCJhIjoiY2sxbmljbHp0MGF3djNtbzYwY3FrOXFldiJ9._f9pPyMDRXb1sJdMQZmKAQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [-9.134152829647064, 38.73655900843423],
    zoom: 12,
});
var draw = new MapboxDraw({
    drawing: true,
    displayControlsDefault: false,
    controls: {
        polygon: true,
        line_string: true,
        trash: true
    }
});
var nav = new mapboxgl.NavigationControl();

map.on('load', function () {
    map.addLayer({
        "id": "buildings_layer",
        "type": "fill",
        "minzoom": 17,
        "source": {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        "source-layer": "building",
        "paint": {
            "fill-color": "rgba(66,100,251, 0.4)",
            "fill-outline-color": "rgba(66,100,251, 0.5)"
        }
    });
    map.addLayer({
        "id": "water_layer",
        "type": "fill",
        "minzoom": 17,
        "source": {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        "source-layer": "water",
        "paint": {
            "fill-color": "rgba(25, 22, 234, 0.4)",
            "fill-outline-color": "rgba(25, 22, 234, 0.5)"
        }
    });
    map.addLayer({
        "id": "landuse_layer",
        "type": "fill",
        "minzoom": 17,
        "source": {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        "class": "grass",
        "source-layer": "landuse",
        "paint": {
            "fill-color": "rgba(57, 241, 35, 0.4)",
            "fill-outline-color": "rgba(57, 241, 35, 0.5)"
        }
    });
    map.addLayer({
        "id": "traffic_layer",
        "type": "line",
        "line-offset": true,
        "minzoom": 17,
        "source": {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-traffic-v1',
        },
        "source-layer": "traffic",
        "paint": {
            "line-width": 3,
            "line-color": [
                "case",
                [
                    "==",
                    "low",
                    [
                        "get",
                        "congestion"
                    ]
                ],
                "#aab7ef",
                [
                    "==",
                    "moderate",
                    [
                        "get",
                        "congestion"
                    ]
                ],
                "#4264fb",
                [
                    "==",
                    "heavy",
                    [
                        "get",
                        "congestion"
                    ]
                ],
                "#ee4e8b",
                [
                    "==",
                    "severe",
                    [
                        "get",
                        "congestion"
                    ]
                ],
                "#b43b71",
                "#000000"
            ]
        }
    });
});
map.on('click', function (e) {
   if (drawing == false) {
       features = map.queryRenderedFeatures(e.point)[0];
       var props = features.properties;
       var geo = features.geometry;

       log.info("props.id = " + props.id);
       id = findObjId(props.id);
       type = objects_list[id].type;
       height = objects_list[id].height;
       under = objects_list[id].underground;
       shape = objects_list[id].shape;
       coords = objects_list[id].coords;
       drawn = objects_list[id].drawn;

       if (objects_list[id].drawn) {
           var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
           draw_buttons[2].disabled = false;
           draw_buttons[2].classList.remove("disabled-control-button");
       }
       log.info("here 3");
       var propsArray = { id: id, type: type, height: height, underground: under, shape: shape, coords: coords, drawn: drawn };
       createPropertiesTable("propsTable", propsArray);
       log.info(propsArray);
   }
});
map.on('dragend', function (e) {
    if (first_start) {
        startAll();
    }
});

map.on('draw.create', handleDraw);
map.on('draw.update', handleDraw);
map.on('draw.delete', function (e) {
    var id = findObjId(features.properties.id);
    deleteDrawnObject(id);
});

map.addControl(nav);
map.addControl(draw);
toggleDrawButtons(false);

function startAll() {
    var zoom = map.getZoom();
    if (zoom >= 18) {
        first_start = true;
        objects_layer = [];
        objects_list = [];
        document.getElementById("objTable").innerHTML = "";
        getAllObjects();
        updateDrawObjectsInViewport();
        //insert all visible manual objects in objects_list and obj_table
        openTab(event, 'features_tab');
    } else {
        alert("Zoom level is to low - " + zoom);
    }
}

function getAllObjects() {
    objects_layer = map.queryRenderedFeatures();
    var tmp = 0;
    for (var i in objects_layer) {
        if (objects_layer[i].layer.source != "mapbox-gl-draw-cold") {
            type = objects_layer[i].properties.type;
            height = objects_layer[i].properties.height;
            under = objects_layer[i].properties.underground;
            shape = objects_layer[i].geometry.type;
            coords = objects_layer[i].geometry.coordinates;
            var propsArray = { id: tmp, type: type, height: height, underground: under, shape: shape, coords: coords, drawn: false };

            addObjectToTable("objTable", propsArray);
            objects_list.push(propsArray);
            tmp++;
        }
    }
}

function findObjId(draw_id) {
    var id = -1;
    var selectedCoords = features.geometry.coordinates[0];
    for (var i in objects_layer) {
        var iterCoords = objects_layer[i].geometry.coordinates[0];
        if (selectedCoords.length == iterCoords.length) {
            if (selectedCoords[0][0] == iterCoords[0][0]) {
                id = i;
            }
        }
    }
    if (id == -1) {
        id = selectedDrawObject(draw_id);
    }
    return id;
}

function savePropsChanges(button) {
    button.style.visibility = "hidden";
    document.getElementById("editButton").style.visibility = "visible";
    var elems = document.getElementsByClassName("cell2");
    for (var i = 0; i < elems.length; i++) {
        elems[i].setAttribute("contenteditable", "false");
    }
    toggleDrawButtons(false);

    //Guardar as alterações no objeto do array com o mesmo id:
    var extracted_props = extractTableContents("propsTable");
    var objTable = document.getElementById("objTable");
    if (drawing == true) {
        var tmp = { id: extracted_props.id, type: extracted_props.type, height: extracted_props.height, underground: extracted_props.underground, shape: extracted_props.shape, coords: tmp_drawn_obj.coords, drawn: tmp_drawn_obj.drawn };
        objects_list[extracted_props.id] = tmp;
        var draw_obj = { id: extracted_props.id, draw_id: draw_id };
        draw_object_list.push(draw_obj);
        tmp_drawn_list.push(tmp);
        addObjectToTable("objTable", tmp);
        draw_id = 0;
        document.getElementById("newButton").style.visibility = "visible";
        draw.changeMode('simple_select');
    } else {
        if (objTable.rows.length >= objects_list.length) {
            changeObjectInTable("objTable", propsArray);
        }
    }
    drawing = false;
}

function addDrawTools(button) {
    button.style.visibility = "hidden";
    document.getElementById("propsTable").innerHTML = "";
    toggleDrawButtons(true);
    drawing = true;
}

function handleDraw() {
    log.info("here handleDraw");
    var data = draw.getAll();
    var polygonCoords = data.features[data.features.length - 1].geometry.coordinates;
    draw_id = data.features[data.features.length - 1].id;
    var id = objects_list.length;

    //log.info(data.features[0].id);

    tmp_drawn_obj = { id: id, type: "insert type", height: "", underground: "", shape: "", coords: polygonCoords, drawn: true };
    createPropertiesTable("propsTable", tmp_drawn_obj);
    setPropsTableEditable(document.getElementById("editButton"));
}

function selectedDrawObject(draw_id) {
    var id = -1;
    var data = draw.getAll();
    for (var i = 0; i < draw_object_list.length; i++) {
        if (draw_object_list[i].draw_id == draw_id) {
            id = draw_object_list[i].id;
        }
    }

    return id;
}

function toggleDrawButtons(enable) {
    var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    log.info("here 1.1");
    if (enable == false) {
        draw_buttons[0].disabled = true;
        draw_buttons[1].disabled = true;
        draw_buttons[2].disabled = true;
        draw_buttons[0].classList.add("disabled-control-button");
        draw_buttons[1].classList.add("disabled-control-button");
        draw_buttons[2].classList.add("disabled-control-button");
    } else {
        log.info("here 1.2");
        draw_buttons[0].disabled = false;
        draw_buttons[1].disabled = false;
        draw_buttons[2].disabled = false;
        log.info("here 1.3");
        draw_buttons[0].classList.remove("disabled-control-button");
        draw_buttons[1].classList.remove("disabled-control-button");
        draw_buttons[2].classList.remove("disabled-control-button");
        log.info("here 1.4");
    }
    log.info("here 1.5");
}

function updateDrawObjectsInViewport() {
    var bounds = map.getBounds();
    var ne_bounds = bounds._ne;
    var sw_bounds = bounds._sw;

    for (var i = 0; i < tmp_drawn_list.length; i++) {
        var coords = tmp_drawn_list[i].coords[0];
        var is_inside = false;
        for (var j = 0; j < coords.length; j++) {
            if (coords[j][0] > sw_bounds.lng && coords[j][0] < ne_bounds.lng && coords[j][1] > sw_bounds.lat && coords[j][1] < ne_bounds.lat) {
                //Pelo menos uma das coordenadas está dentro do polígono.
                tmp_drawn_list[i].id = objects_list.length;
                objects_list.push(tmp_drawn_list[i]);
                addObjectToTable("objTable", tmp_drawn_list[i]);
                break;
            }
        }
    }
}

function deleteDrawnObject(id) {
    if (objects_list[id].drawn) {
        objects_list.splice(id, 1);
    }
    for (var i in draw_object_list) {
        if (draw_object_list.id == id) {
            draw_object_list.splice(i, 1);
        }
        if (tmp_drawn_list.id == id) {
            tmp_drawn_list.splice(i, 1);
        }
    }
    document.getElementById("objTable").innerHTML = "";
    for (var i in objects_list) {
        objects_list[i].id = i;
        addObjectToTable("objTable", objects_list[i]);
    }
    var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    draw_button[2].disabled = true;
    draw_buttons[2].classList.add("disabled-control-button");
}


function dumbFunction() {
    for (var i in objects_list) {
        log.info(objects_list[i].id);
    }
}