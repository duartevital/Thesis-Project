const mapboxgl = require('mapbox-gl');
const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const log = require('electron-log');
const area = require('@turf/area');
const Chart = require('chart.js');
const fs = require('fs');
const com = require('@turf/center-of-mass');


var first_start = false;
var drawing = false;
var isSomethingSelected = false;
var drawing_focus = false;
var object_selection_count = 0;
var road_selection_count = 0;
var draw_id = 0;
var features = [];
var draw_object_list = [];
var objects_layer = [];
var all_list = [];
var objects_list = [];
var roads_list = [];
var tmp_drawn_list = [];
var type_stats = [];
var draw_buttons = [];
var tmp_drawn_obj = {};
var tmp_focus_obj = {};
var source_stats = {};
var selected_obj = {};
var all_info = {};
var current_view = "Normal";
var selection_object_features = { type: "FeatureCollection", features: [] };
var selection_road_features = { type: "FeatureCollection", features: [] };

mapboxgl.accessToken = 'pk.eyJ1IjoiZHVhcnRlOTYiLCJhIjoiY2sxbmljbHp0MGF3djNtbzYwY3FrOXFldiJ9._f9pPyMDRXb1sJdMQZmKAQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
    center: [-9.134152829647064, 38.73655900843423],
    zoom: 12
    /*style: 'mapbox://styles/mapbox/dark-v10',
    center: [-79.999732, 40.4374],
    zoom: 11*/
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
        "minzoom": 16,
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
        "minzoom": 16,
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
        "minzoom": 16,
        "source": {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        //"class": "grass",
        "source-layer": "landuse",
        "paint": {
            "fill-color": "rgba(57, 241, 35, 0.4)",
            "fill-outline-color": "rgba(57, 241, 35, 0.5)"
        }
    });
    map.addLayer({
        "id": "roads_layer",
        "type": "line",
        "minzoom": 16,
        "source": {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        "source-layer": "road",
        "paint": {
            "line-width": 8,
            "line-color": "rgba(255,100,251, 0.5)"
        }
    });

    map.addSource("selection_object_source", {
        type: "geojson",
        data: selection_object_features
    });
    map.addLayer({
        id: "selection_object_layer",
        type: "fill",
        source: "selection_object_source",
        layout: {},
        paint: {
            'fill-color': ["get", "color"]
        }
    });
    map.addSource("selection_road_source", {
        type: "geojson",
        data: selection_road_features
    });
    map.addLayer({
        id: "selection_road_layer",
        type: "line",
        source: "selection_road_source",
        layout: {},
        paint: {
            "line-width": 8,
            'line-color': ["get", "color"]
        }
    });
    
});
map.on('click', function (e) {
    features = map.queryRenderedFeatures(e.point)[0];
    if (drawing == false && typeof features !== 'undefined') {
        log.info("herere ");
        document.getElementById("editButton").style.visibility = "visible";
        var tmp_props = features;
        id = findObjId(tmp_props);
        selected_obj = all_list[id];
        if (selected_obj.drawn) {
            //tratar aqui do botão delete
            draw_buttons[2].disabled = false;
            draw_buttons[2].classList.remove("disabled-control-button");
        }
        createPropertiesTable("propsTable", selected_obj);
        if (!isSomethingSelected)
            addSelectionColor();
        else {
            if (features.sourceLayer == "road") {
                selection_road_features.features.splice(road_selection_count-1, 1);
                map.getSource("selection_road_source").setData(selection_road_features);
                road_selection_count--;
            } else {
                selection_object_features.features.splice(object_selection_count-1, 1);
                map.getSource("selection_object_source").setData(selection_object_features);
                object_selection_count--;
            }
            if (features.source != "selection_object_source") {
                addSelectionColor();
            } else
                document.getElementById("propsTable").innerHTML = "";
        }   
    }
});
map.on('dragend', function (e) {
    if (first_start) {
        startAll();
    }
});
map.on('zoomend', function () {
    log.info("zoom = " + map.getZoom());
});

map.on('draw.create', function () {
    if (drawing_focus)
        handleFocusDraw();
    else
        handleDraw();
});
map.on('draw.update', handleUpdate);
map.on('draw.delete', function (e) {
    var id = findObjId(features);
    deleteDrawnObject(id);
});

map.addControl(nav);
map.addControl(draw);
toggleDrawButtons(false);
fetchTags();

function startAll() {
    var zoom = map.getZoom();
    log.info("====================================================");
    //if (zoom >= 18) {
    if(!first_start) first_start = true;
    enable_save = true;
    objects_layer = [];
    all_list = [];
    objects_list = [];
    roads_list = [];
    source_stats = { building_area: 0, landuse_area: 0, road_length: 0 };
    if (draw_object_list.length > 0) {
        draw_object_list = [];
        tmp_drawn_list = []; 
        resetEveryList();
        draw.deleteAll();
    }
    draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    document.getElementById("propsTable").innerHTML = "";
    document.getElementById("objTable").innerHTML = "";
    getAllObjects();
    updateDrawObjectsInViewport();
    openTab(event, 'features_tab');

    //Calculate statistics and create graphs
    resetStats();

    /*} else {
        alert("Zoom level is to low - " + zoom);
    }*/
}

function getAllObjects() {
    objects_layer = map.queryRenderedFeatures();
    var id = 0;
    var props = {};
    for (var i in objects_layer) {
        if (objects_layer[i].layer.source != "mapbox-gl-draw-cold") {
            source = objects_layer[i].layer["source-layer"];
            type = objects_layer[i].properties.type;
            shape = objects_layer[i].geometry.type;
            coords = objects_layer[i].geometry.coordinates;
            
            //Different attributes for different sources of features
            if (source == "road") {
                name = objects_layer[i].properties.name;
                surface = objects_layer[i].properties.surface;
                one_way = objects_layer[i].properties.oneway;
                if(shape == "LineString")
                    length = Math.round(getVisibleRoadPortion(coords, true) * 1000000) / 1000; //conversion km - m
                else if (shape == "MultiLineString")
                    length = Math.round(getVisibleRoadPortion(coords, false) * 1000000) / 1000; //conversion km - m

                original_id = objects_layer[i].id;
                index = roads_list.length;
                props = { id: id, source: source, type: type, name: name, length: length, surface: surface, one_way: one_way, polution: 0, range: 0, focus: [], shape: shape, coords: coords, original_id: original_id, index: index };
                roads_list.push(props);
                all_list.push(props);
                source_stats.road_length += length;
            } else {
                var tmp_area = 0;
                if (shape == "Polygon")
                    tmp_area = Math.round(area.default(getVisiblePolygonPortion(coords, true)) * 1000) / 1000;
                else if(shape == "MultiPolygon")
                    tmp_area = Math.round(area.default(getVisiblePolygonPortion(coords, false)) * 1000) / 1000;
                
                if (source == "building") {
                    height = objects_layer[i].properties.height;
                    under = objects_layer[i].properties.underground;
                    index = objects_list.length;
                    props = { id: id, source: source, type: type, area: tmp_area, polution: 0, range: 0, focus: [], shape: shape, coords: coords, drawn: false, index: index };
                    objects_list.push(props);
                    all_list.push(props);
                }
                if (source == "landuse") {
                    index = objects_list.length;
                    props = { id: id, source: source, type: type, area: tmp_area, polution: 0, range: 0, focus: [], shape: shape, coords: coords, drawn: false, index: index };
                    objects_list.push(props);
                    all_list.push(props);
                }
                if (source == "water") {
                    index = objects_list.length;
                    props = { id: id, source: source, type: source, area: tmp_area, shape: shape, coords: coords, drawn: false, index: index };
                    objects_list.push(props);
                    all_list.push(props);
                }
            }
                id++;
        }
    }
    //Filter off duplicate objects in roads_list (with same orignal id)
    roads_list = Array.from(new Set(roads_list.map(a => a.original_id)))
        .map(id => {
            return roads_list.find(a => a.original_id === id);
        });

    //Filter off duplicate roads in all_list...
}

function findObjId(selected_props) {
    var id = -1;
    //if (selected_props.length > 0) {
    if (!isObjEmpty(selected_props)) {
        if (selected_props.layer.source != "mapbox-gl-draw-cold") {
            if (selected_props.geometry.type == "MultiPolygon") {
                var selectedCoords = selected_props.geometry.coordinates[0][0];
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords[0][0];
                    if (selectedCoords.length == iterCoords.length) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            } else if (selected_props.geometry.type == "Polygon" || selected_props.geometry.type == "MultiLineString") {
                var selectedCoords = selected_props.geometry.coordinates[0];
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords[0];
                    if (selectedCoords.length == iterCoords.length) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            } else if (selected_props.geometry.type == "LineString") {
                var selectedCoords = selected_props.geometry.coordinates;
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords;
                    if (selectedCoords.length == iterCoords.length) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            }
        } else if (id == -1) {
            id = selectedDrawObject(selected_props.properties.id);
        }
    }
    return id;
}

function savePropsChanges(button) {
    var extracted_props = extractTableContents();
    var objTable = document.getElementById("objTable");
    if (extracted_props.type != "") {
        button.style.visibility = "hidden";
        //document.getElementById("editButton").style.visibility = "hidden";
        var elems = document.getElementsByClassName("cell2");
        for (var i = 0; i < elems.length; i++) {
            elems[i].setAttribute("contenteditable", "false");
        }
        toggleDrawButtons(false);
        //Guardar as alterações no objeto do array com o mesmo id:
        //var extracted_props = extractTableContents();
        var objTable = document.getElementById("objTable");
        if (drawing) {
            var tmp = extracted_props;
            tmp.coords = tmp_drawn_obj.coords; tmp.shape = tmp_drawn_obj.shape; tmp.drawn = true; tmp.index = objects_list.length;
            all_list[extracted_props.id] = tmp;
            objects_list[tmp.index] = tmp;
            resetStats();
            var draw_obj = { id: extracted_props.id, draw_id: draw_id };
            draw_object_list.push(draw_obj);
            tmp_drawn_list.push(tmp);
            draw_id = 0;
            //add heat points
            addHeatFeature(tmp);
            var newButton = document.getElementById("newButton");
            newButton.style.visibility = "visible";
            newButton.innerText = "new";
            draw.changeMode('simple_select');
        } else {
            if (selected_obj.source == "road") {
                //selected_obj.id = extracted_props.id;
                selected_obj.type = extracted_props.type;
                selected_obj.name = extracted_props.name;
                selected_obj.length = extracted_props.length;
                selected_obj.surface = extracted_props.surface;
                selected_obj.one_way = extracted_props.one_way;
                selected_obj.polution = extracted_props.polution;
                selected_obj.range = extracted_props.range;

                all_list[selected_obj.id] = selected_obj;
                roads_list[selected_obj.index] = selected_obj;
                resetStats();
                addHeatFeature(selected_obj);
                //incluir uma função igual á seguinte mas para a table das roads
                /*if (old_type != selected_obj.type)
                    changeObjectInTable(selected_obj, old_type);*/
            } else if (selected_obj.source == "building") {
                //selected_obj.id = extracted_props.id;
                selected_obj.type = extracted_props.type;
                //selected_obj.height = extracted_props.height;
                selected_obj.area = extracted_props.area;
                selected_obj.polution = extracted_props.polution;
                selected_obj.range = extracted_props.range;
                //selected_obj.underground = extracted_props.underground;
                all_list[selected_obj.id] = selected_obj;
                objects_list[selected_obj.index] = selected_obj;
                resetStats();
                addHeatFeature(selected_obj);
            } else if (selected_obj.source == "landuse") {
                //selected_obj.id = extracted_props.id;
                selected_obj.type = extracted_props.type;
                selected_obj.area = extracted_props.area;
                selected_obj.polution = extracted_props.polution;
                selected_obj.range = extracted_props.range;

                all_list[selected_obj.id] = selected_obj;
                objects_list[selected_obj.index] = selected_obj;
                resetStats();
                addHeatFeature(selected_obj);
            }
        }
        drawing = false;
        enable_save = true;

    } else {
        document.getElementById("type_popup").classList.toggle("show");
        setTimeout(function () {
            document.getElementById("type_popup").classList.toggle("show");
        }, 3000);
    }
}

function addDrawTools(button) {
    if (button.innerText == "new") {
        button.innerText = "cancel";
        document.getElementById("propsTable").innerHTML = "";
        toggleDrawButtons(true);
        drawing = true;
        document.getElementById("editButton").style.visibility = "hidden";
        document.getElementById("saveButton").style.visibility = "hidden";
        if (object_selection_count > 0) {
            selection_object_features.features.splice(object_selection_count - 1, 1);
            map.getSource("selection_object_source").setData(selection_object_features);
            object_selection_count--;
        }
    } else {
        var id = draw.getSelectedIds();
        draw.delete(id);
        deleteDrawnObject(findObjId(features));
        button.innerText = "new";
        toggleDrawButtons(false);
        drawing = false;
        //document.getElementById("saveButton").onclick = function () { savePropsChanges(this) }; //nãi tenho a certeza se o this funciona aqui
    }
}

function selectedDrawObject(draw_id) {
    var id = -1;
    for (var i = 0; i < draw_object_list.length; i++) {
        if (draw_object_list[i].draw_id == draw_id) {
            id = draw_object_list[i].id;
        }
    }

    return id;
}

function toggleDrawButtons(enable) {
    var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    if (enable == false) {
        draw_buttons[0].disabled = true;
        draw_buttons[1].disabled = true;
        draw_buttons[2].disabled = true;
        draw_buttons[0].classList.add("disabled-control-button");
        draw_buttons[1].classList.add("disabled-control-button");
        draw_buttons[2].classList.add("disabled-control-button");
    } else {
        draw_buttons[0].disabled = false;
        draw_buttons[1].disabled = false;
        draw_buttons[2].disabled = false;
        draw_buttons[0].classList.remove("disabled-control-button");
        draw_buttons[1].classList.remove("disabled-control-button");
        draw_buttons[2].classList.remove("disabled-control-button");
    }
}

function updateDrawObjectsInViewport() {
    var bounds = map.getBounds();
    var ne_bounds = bounds._ne;
    var sw_bounds = bounds._sw;

    for (var i = 0; i < tmp_drawn_list.length; i++) {
        var coords = tmp_drawn_list[i].coords[0];
        for (var j = 0; j < coords.length; j++) {
            if (coords[j][0] > sw_bounds.lng && coords[j][0] < ne_bounds.lng && coords[j][1] > sw_bounds.lat && coords[j][1] < ne_bounds.lat) {
                //Pelo menos uma das coordenadas está dentro do polígono.
                tmp_drawn_list[i].id = all_list.length;
                tmp_drawn_list[i].index = objects_list.length;
                all_list.push(tmp_drawn_list[i]);
                objects_list.push(tmp_drawn_list[i]);
                resetStats();
                break;
            }
        }
    }
}

function handleDraw() {
    var data = draw.getAll();
    var polygonCoords = data.features[data.features.length - 1].geometry.coordinates;
    draw_id = data.features[data.features.length - 1].id;
    var id = all_list.length;
    var tmp_area = Math.round(area.default(getVisiblePolygonPortion(polygonCoords, true)) * 1000) / 1000;
    tmp_drawn_obj = { id: id, source: "insert source", area: tmp_area, shape: "Polygon", coords: polygonCoords, drawn: true, index: objects_list.length };
    createPropertiesTable("propsTable", tmp_drawn_obj, true);
}

function handleFocusDraw() {
    var data = draw.getAll();
    var polygonCoords = data.features[data.features.length - 1].geometry.coordinates;
    var tmp_area = Math.round(area.default(getVisiblePolygonPortion(polygonCoords, true)) * 1000) / 1000;
    tmp_focus_obj = { area: tmp_area, polution: 0, range: 0, shape: "Polygon", coords: polygonCoords, drawn: true };
    createPropertiesTable("propsTable", { area: tmp_area, polution: 0, range: 0 }, false);
    setPropsTableEditable(document.getElementById("editButton"));
    document.getElementById("saveButton").onclick = function () { saveFocus(this) };
}

function deleteDrawnObject(id) {
    if (id != -1) {
        if (all_list[id].drawn) {
            var tmp_index = all_list[id].index;
            all_list.splice(id, 1);
            objects_list.splice(tmp_index, 1);
            draw_buttons[2].disabled = true;
            draw_buttons[2].classList.add("disabled-control-button");
            document.getElementById("newButton").innerText = "new";
        }

        for (var i in draw_object_list) {
            if (draw_object_list.id == id) {
                draw_object_list.splice(i, 1);
            }
            if (tmp_drawn_list.id == id) {
                tmp_drawn_list.splice(i, 1);
            }
        }
    }
    document.getElementById("propsTable").innerHTML = "";
    document.getElementById("saveButton").style.visibility = "hidden";
    document.getElementById("editButton").style.visibility = "hidden";
    drawing = false;
    resetEveryList();
    //disable trash button
    /*var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    draw_buttons[2].disabled = true;
    draw_buttons[2].classList.add("disabled-control-button");*/
}

function handleUpdate() {
    var data = draw.getSelected().features[0];
    var id = selectedDrawObject(data.id);
    var polygonCoords = data.geometry.coordinates;

    all_list[id].coords = polygonCoords;
    createPropertiesTable("propsTable", all_list[id]);
}

function addSelectionColor() {
    var feature_color;
    var isRoad = false;
    var feature = {
        type: "Feature",
        properties: {},
        geometry: {}
    };

    switch (features.sourceLayer) {
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

    var properties = feature.properties;
    var geometry = feature.geometry;

    geometry.type = features.geometry.type;
    geometry.coordinates = features.geometry.coordinates

    properties.color = feature_color;
    if (!isRoad) {
        properties.id = 'selected_object_feature_' + object_selection_count;
        selection_object_features.features.push(feature);
        object_selection_count++;
        map.getSource("selection_object_source").setData(selection_object_features);
    } else {
        properties.id = 'selected_road_feature_' + road_selection_count;
        selection_road_features.features.push(feature);
        road_selection_count++;
        map.getSource("selection_road_source").setData(selection_road_features);
    }

    /*if (!isRoad) {
        map.addLayer({
            'id': ('selected_feature_' + object_selection_count),
            'type': 'fill',
            'source': {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': feature_shape,
                        'coordinates': selection_coords
                    }
                }
            },
            'layout': {},
            'paint': {
                'fill-color': feature_color
            }
        });
    } else {
        map.addLayer({
            'id': ('selected_feature_' + object_selection_count),
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': feature_shape,
                        'coordinates': selection_coords
                    }
                }
            },
            'layout': {},
            'paint': {
                "line-width": 8,
                "line-color": feature_color
            }
        });
    }*/
    isSomethingSelected = true;
}

function resetEveryList() {
    for (var i in all_list) 
        all_list[i].id = i;
    for (var i in roads_list)
        roads_list[i].index = i;
    for (var i in objects_list)
        objects_list[i].index = i;

    resetStats();
}

function resetStats() {
    type_stats = [];
    getTypeStats(source_stats, type_stats);
    createObjectsTable(objects_list);
    createRoadsTable(roads_list);
    setPieGraph(type_stats);

    source_stats.building_area = Math.round(source_stats.building_area * 1000) / 1000;
    source_stats.landuse_area = Math.round(source_stats.landuse_area * 1000) / 1000;
    source_stats.road_length = Math.round(source_stats.road_length * 1000) / 1000;
}

function saveAllInfo() {
    var files;
    try {
        files = fs.readdirSync("./Saves/");
    } catch (err) {
        log.info("Could NOT read the folder");
    }

    var id = files.length;
    var timestamp = new Date();
    var map_center = map.getCenter().toArray();
    var zoom = map.getZoom();
    var aqi = 136; //replace by real AQI

    var infoToHistory = {
        id: id,
        timestamp: timestamp.toLocaleString(),
        map_center: map_center,
        zoom: zoom,
        aqi: aqi,
        all_list: all_list,
        source_stats: source_stats,
        obj_stats: type_stats,
        road_stats: roads_list
    }
    var infoToJSON = {
        id: id,
        timestamp: timestamp.toJSON(),
        map_center: map_center,
        zoom: zoom,
        aqi: aqi,
        all_list: all_list,
        source_stats: source_stats,
        obj_stats: type_stats,
        road_stats: roads_list 
    }

    if (enable_save) {
        addEntryToHistory(infoToHistory);
        writeToJSON(infoToJSON);
    } else
        alert("No changes were made");

    enable_save = false;
    document.getElementById("empty_history").style.visibility = "hidden";
}

function loadAllInfo(id) {
    var info = loadFromJSON(id);

    map.flyTo({
        center: info.map_center,
        zoom: info.zoom,
        speed: 2.3
    });

    all_list = info.all_list;
    source_stats = info.source_stats;
    type_stats = info.obj_stats;
    roads_list = info.road_stats;
    enable_save = false;

    map.on("zoomend", function () {
        for (var i in all_list) {
            switch (all_list[i].source) {
                case "building": case "landuse":
                    objects_list.push(all_list[i]);
            }
        }

        document.getElementById("propsTable").innerHTML = "";
        createObjectsTable(objects_list);
        createRoadsTable(roads_list);
        setPieGraph(type_stats);
    });    
    openTab(event, 'features_tab');
}

function sendInfo() {
    location.reload();
}

function removeAllSelections() {
    object_selection_count = 0;
    road_selection_count = 0;
    selection_object_features.features = [];
    selection_road_features.features = [];

    map.getSource("selection_object_source").setData(selection_object_features);
    map.getSource("selection_road_source").setData(selection_road_features);

}

function saveFocus(button) {
    button.style.visibility = "hidden";
    var extracted_props = extractTableContents();
    tmp_focus_obj.polution = extracted_props.polution;
    tmp_focus_obj.range = extracted_props.range;

    log.info("extracted_props = " + JSON.stringify(extracted_props));
    log.info("tmp_focus obj = " + JSON.stringify(tmp_focus_obj));
    all_list[selected_obj.id].focus.push(tmp_focus_obj);
    objects_list[selected_obj.index].focus.push(tmp_focus_obj);
    addHeatFeature(tmp_focus_obj);

    var newButton = document.getElementById("newButton");
    newButton.style.visibility = "visible";
    newButton.innerText = "new";
    draw.changeMode('simple_select');
    drawing_focus = false;
    drawing = false;
    document.getElementById("saveButton").onclick = function () { savePropsChanges(this) }; //não tenho a certeza se o this funciona aqui
}

function dumbFunction() {
    log.info("START");
    map.addSource("polution", {
        "type": "geojson",
        "data": "./Data/polution.geojson"
    });
    
    map.addLayer({
        'id': 'polution_heat',
        'type': 'heatmap',
        'source': 'polution',
        'paint': {
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                0,
                0,
                6,
                1
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                9,
                3
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(253,219,199)',
                0.8,
                'rgb(239,138,98)',
                1,
                'rgb(178,24,43)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                2,
                9,
                20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                9,
                0
            ]
        }
    });
    log.info("END");
}