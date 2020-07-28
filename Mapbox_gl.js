const mapboxgl = require('mapbox-gl');
const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const log = require('electron-log');
const remote = require('electron').remote;
const area = require('@turf/area');
const Chart = require('chart.js');
const fs = require('fs');
const com = require('@turf/center-of-mass');

var canvas, canvas_container;
var first_start = false;
var drawing = false;
var isSomethingSelected = false;
var drawing_focus = false;
var cntrl_pressed = false;
var showDescBox = false;
var object_selection_count = 0;
var road_selection_count = 0;
var draw_id = 0;
var features = [];
var search_features = [];
var draw_object_list = [];
var objects_layer = [];
var all_list = [];
var objects_list = [];
var roads_list = [];
var profile_list = ["any", "prof1", "prof2"];
var tmp_drawn_list = [];
var type_stats = [];
var altered_list = [];
var draw_buttons = [];
var random_points = [];
var map_bounds = {};
var tmp_drawn_obj = {};
var tmp_focus_obj = {};
var source_stats = {};
var selected_obj = {};
var selected_objs = [];
var all_info = {};
var current_view = "Normal";
var selection_object_features = { type: "FeatureCollection", features: [] };
var selection_road_features = { type: "FeatureCollection", features: [] };
var heatmap_features = {
    type: "FeatureCollection",
    features: []
};
var heatmap_circles = {
    type: 'FeatureCollection',
    features: []
};
var heatmap_fill_features = {
    type: "FeatureCollection",
    features: []
};

mapboxgl.accessToken = 'pk.eyJ1IjoiZHVhcnRlOTYiLCJhIjoiY2sxbmljbHp0MGF3djNtbzYwY3FrOXFldiJ9._f9pPyMDRXb1sJdMQZmKAQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
    center: [-9.134152829647064, 38.73655900843423],
    zoom: 12,
    preserveDrawingBuffer: true
    /*style: 'mapbox://styles/mapbox/dark-v10',
    center: [-79.999732, 40.4374],
    zoom: 11*/
});
var draw = new MapboxDraw({
    drawing: true,
    displayControlsDefault: false,
    controls: {
        polygon: true,
        //line_string: true,
        trash: true
    }
    
});
var nav = new mapboxgl.NavigationControl();

map.on('load', function () {

    //Objects layers
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

    //Object selection sources and layers
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

    //Heatmap sources and layers
    map.addSource('polution', {
        type: 'geojson',
        data: heatmap_features
        //data: JSON.parse(fs.readFileSync("./Data/polution.geojson", "utf8"))
    });
    map.addLayer({
        id: 'polution_heat',
        type: 'heatmap',
        source: 'polution',
        minzoom: 12,
        maxzoom: 19,
        paint: {

            'heatmap-weight': [
                'interpolate', ['exponential', 1], ['get', 'level'],
                0, 0,
                250, 0.15,
                500, 1
            ],

            //'heatmap-intensity': 1,
            'heatmap-intensity': [
                'interpolate', ['exponential', 1], ['zoom'],
                12, 1,
                19, 3
                /*12, 0.2,
                13, 0.4,
                14, 0.95,
                14.5, 0.95,
                15, 0.98,
                15.5, 1,
                16, 1.25,
                17, 1.95,
                19, 2.95*/
            ],

            // assign color values be applied to points depending on their density
            'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0, 255, 0, 0)',
                0.0125, 'rgb(0, 228, 0)', //green
                //0.01875, 'rgb(0, 228, 0)', //green
                //0.03125, 'rgb(255,255,0)', //yellow
                0.05, 'rgb(255,255,0)', //yellow
                //0.0625, 'rgb(255, 126, 0)', //orange
                0.075, 'rgb(255, 126, 0)', //orange
                //0.0875, 'rgb(255, 0, 0)', //red
                0.1, 'rgb(255, 0, 0)', //red
                0.225, 'rgb(143, 63, 151)', //purple
                1, 'rgb(126, 0, 35)' //maroon
            ],

            'heatmap-radius': [
                'interpolate', ['linear'], ['zoom'],
                12, 0,
                19, ['get', 'range_base']
            ],
            'heatmap-opacity': 0.5
        }
    });
    map.addSource('polution_fill', {
        type: 'geojson',
        data: heatmap_fill_features
    });
    map.addLayer({
        id: 'polution_heat_fill',
        type: 'fill',
        source: 'polution_fill',
        layout: {},
        paint: {
            'fill-color': ['get', 'color']
        }
    });
    map.setLayoutProperty("polution_heat", "visibility", "none");
    map.setLayoutProperty("polution_heat_fill", "visibility", "none");
});
var selection_obj = { source: "-", type: "-", area: -1, length: -1 };
map.on('click', function (e) {
    features = map.queryRenderedFeatures(e.point, {
        layers: [
            'buildings_layer',
            'landuse_layer',
            'roads_layer',
            'selection_object_layer',
            'selection_road_layer'
        ]
    })[0];
    search_features = map.queryRenderedFeatures(e.point, {
        layers: [
            'buildings_layer',
            'landuse_layer',
            'roads_layer'
        ]
    })[0];
    clearSelectionCheckboxes();
    if (typeof features == 'undefined') {
        clearSelections();
        document.getElementById("propsTable").innerHTML = "";
    } else if (drawing == false) {
        document.getElementById("editButton").style.visibility = "visible";
        var tmp_props = features;
        var id = findObjId(search_features);
        openTab('features_tab');
        var event = e.originalEvent;
        //DEVE SER REORGANIZADO...
        if (!event.ctrlKey && !event.shiftKey) {
            //props table creation
            if (id > -1) {
                clearSelections();
                selected_objs = []; selected_objs.push(all_list[id]);
                //selection_obj
                if (all_list[id].area)
                    selection_obj.area = all_list[id].area;
                else if (all_list[id].length)
                    selection_obj.length = all_list[id].length;
                selection_obj.range = all_list[id].range;
                selection_obj.polution = all_list[id].polution;

                if (selected_objs[0].drawn) {
                    //tratar aqui do botão delete
                    draw_buttons[2].disabled = false;
                    draw_buttons[2].classList.remove("disabled-control-button");
                    createPropertiesTable("propsTable", selected_objs[0], true);
                } else
                    createPropertiesTable("propsTable", selected_objs[0], false);
            }
            if (features.source != "selection_object_source" && features.source != "selection_road_source")
                addSelectionColor();
            else
                document.getElementById("propsTable").innerHTML = "";

        } else if (event.ctrlKey && !event.shiftKey) {
            var area_counter = 0, length_counter = 0;
            
            if (features.source != "selection_object_source" && features.source != "selection_road_source") {
                addSelectionColor();
                selected_objs.push(all_list[id]);
            } else {
                var feat_id = features.properties.id;
                for (var i in selected_objs) {
                    if (selected_objs[i].id == id) {
                        selected_objs.splice(i, 1);
                        break;
                    }
                }
                if (features.source == "selection_object_source") {
                    for (var i in selection_object_features.features) {
                        if (selection_object_features.features[i].properties.id == feat_id) {
                            selection_object_features.features.splice(i, 1);
                            break;
                        }
                    }                    
                    map.getSource("selection_object_source").setData(selection_object_features);
                    object_selection_count--;
                    //decrease area
                    if (object_selection_count > 0)
                        for (var i in selected_objs) {
                            if (selected_objs[i].area)
                                area_counter += selected_objs[i].area;
                        }
                    
                    selection_obj.area = area_counter;
                    selection_obj.range = getAverageRange(selected_objs);
                    selection_obj.polution = getAveragePolution(selected_objs);
                    createPropertiesTable("propsTable", selection_obj, false);
                    return;
                } else if (features.source == "selection_road_source") {
                    for (var i in selection_road_features.features) {
                        if (selection_road_features.features[i].properties.id == feat_id) {
                            selection_road_features.features.splice(i, 1);
                            break;
                        }
                    }
                    map.getSource("selection_road_source").setData(selection_road_features);
                    road_selection_count--;
                    //decrease length
                    if (road_selection_count > 0)
                        for (var i in selected_objs) {
                            if (selected_objs[i].length)
                                length_counter += selected_objs[i].length;
                        }
                    selection_obj.length = length_counter;
                    selection_obj.range = getAverageRange(selected_objs);
                    selection_obj.polution = getAveragePolution(selected_objs);
                    createPropertiesTable("propsTable", selection_obj, false);
                    return;
                }
            }

            //props table creation
            selection_obj.polution = getAveragePolution(selected_objs);
            selection_obj.range = getAverageRange(selected_objs);
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

            createPropertiesTable("propsTable", selection_obj, false)

        }
    }
});

/*map.on("mousemove", e => {
    var rgb = [];
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (gl) {
        const point = e.point;
        const x = point.x; const y = point.y;
        const data = new Uint8Array(4);
        const canvasX = x - canvas.offsetLeft;
        const canvasY = canvas.height - y - canvas.offsetTop;
        gl.readPixels(canvasX, canvasY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
        rgb.push(data[0]); rgb.push(data[1]), rgb.push(data[2]);
    }

    var p = { r: rgb[0], g: rgb[1], b: rgb[2] };
    var p1, p2, tmp, index, min = 1000, obj;
    for (var i in heatmap_color_vectors) {
        p1 = { r: heatmap_color_vectors[i].vec[0][0], g: heatmap_color_vectors[i].vec[0][1], b: heatmap_color_vectors[i].vec[0][2] };
        p2 = { r: heatmap_color_vectors[i].vec[1][0], g: heatmap_color_vectors[i].vec[1][1], b: heatmap_color_vectors[i].vec[1][2] };
        tmp = pointToLineDist(p, p1, p2);
        
        if (tmp.dist < min) {
            min = tmp.dist;
            obj = tmp;
            index = i;
        }
    }
    //fazer interpolação em [index]-[index+1] com weight t;
    var top = heatmap_color_vectors[index].pol1;
    var bottom = heatmap_color_vectors[index].pol2;
    var distance = bottom - top;
    var result = top + (obj.weight * distance);

    //console.log(result);
    if (showDescBox) {
        var el = document.getElementById("desc_box");
        el.innerText = "polution: " + Math.round(result);
        el.style.left = e.point.x + "px";
        el.style.top = e.point.y + "px";
        el.style.visibility = "visible";
    }
});*/

map.on('dragend', function (e) {
    if (first_start) {
        startAll();
        clearSelectionCheckboxes();
    }
});
map.on('zoomend', function () {
    log.info("zoom = " + map.getZoom());
    clearSelectionCheckboxes();
});

map.on('draw.create', function () {
    if (drawing_focus)
        handleFocusDraw();
    else
        handleDraw();
});
map.on('draw.update', handleUpdate);
map.on('draw.delete', function (e) {
    var id = findObjId(search_features);
    deleteDrawnObject(id);
});

var heatmap_color_range = [
    { name: 'c0', rgb: [0, 255, 0], polution: 0 }, //light green
    { name: 'c1', rgb: [0, 228, 0], polution: 50 }, //dark green
    { name: 'c2', rgb: [255, 255, 0], polution: 100 }, //yellow
    { name: 'c3', rgb: [255, 126, 0], polution: 200 }, //orange
    { name: 'c4', rgb: [255, 0, 0], polution: 300 }, //red
    { name: 'c5', rgb: [143, 63, 151], polution: 400 }, //purple
    { name: 'c6', rgb: [126, 0, 35], polution: 500 } //maroon
];

var heatmap_color_vectors = [
    { name: 'c0_c1', vec: [heatmap_color_range[0].rgb, heatmap_color_range[1].rgb], pol1: 0, pol2: 50 },
    { name: 'c1_c2', vec: [heatmap_color_range[1].rgb, heatmap_color_range[2].rgb], pol1: 50, pol2: 100 },
    { name: 'c2_c3', vec: [heatmap_color_range[2].rgb, heatmap_color_range[3].rgb], pol1: 100, pol2: 200 },
    { name: 'c3_c4', vec: [heatmap_color_range[3].rgb, heatmap_color_range[4].rgb], pol1: 200, pol2: 300 },
    { name: 'c4_c5', vec: [heatmap_color_range[4].rgb, heatmap_color_range[5].rgb], pol1: 300, pol2: 400 },
    { name: 'c5_c6', vec: [heatmap_color_range[5].rgb, heatmap_color_range[6].rgb], pol1: 400, pol2: 500 }
];

map.addControl(nav);
map.addControl(draw);
styleMapButtons();
toggleDrawButtons(false);   
fetchTags();

function startAll() {
    var zoom = map.getZoom(); 
    log.info("====================================================");
    canvas = map.getCanvas();
    canvas_container = map.getCanvasContainer();
    canvas_container.addEventListener('mousedown', function () { mouseDown(event, map, canvas) }, true);
    
    let tmp_bounds = map.getBounds();
    map_bounds = { ne: tmp_bounds._ne, sw: tmp_bounds._sw };
    //if (zoom >= 18) {
    if (!first_start) first_start = true;
    enable_save = true;
    objects_layer = [];
    all_list = [];
    if (altered_list.length > 0) {
        for (var i in altered_list)
            all_list.push(altered_list[i]);
    }

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
    openTab('features_tab');

    //Calculate statistics and create graphs
    resetStats();

    /*} else {
        alert("Zoom level is to low - " + zoom);
    }*/
}

//RESTRUTURAR TODA A FUNÇÃO
function getAllObjects() {
    objects_layer = map.queryRenderedFeatures({
        layers: [
            'buildings_layer',
            'landuse_layer',
            'roads_layer'
        ]
    });
    
    var id = 0;
    var props = {};
    //console.log(altered_list);
    for (var i in objects_layer) {
        var tmp_source = objects_layer[i].layer.source
        //if (tmp_source != "mapbox-gl-draw-cold" && tmp_source != "composite") {
            source = objects_layer[i].layer["source-layer"];
            type = objects_layer[i].properties.type;
            var coords = objects_layer[i].geometry.coordinates;
            var found_altered = false;
            for (var j in altered_list) {
                let shape = altered_list[j].shape;
                switch (shape) {
                    case "Polygon":
                        if (altered_list[j].coords[0][0][0] == coords[0][0][0]) {
                            found_altered = true;
                            break;
                        }
                        break;
                    case "MultiPolygon":
                        if (altered_list[j].coords[0][0][0][0] == coords[0][0][0][0]) {
                            found_altered = true;
                            break;
                        }
                        break;
                    case "LineString":
                        if (altered_list[j].coords[0][0] == coords[0][0]) {
                            found_altered = true;
                            break;
                        }
                        break;
                }
            }
            if (found_altered) {
                continue;
            }

            //Different attributes for different sources of features
            var shape = objects_layer[i].geometry.type;
            
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
                profile = ["any"];
                props = { id: id, source: source, type: type, name: name, length: length, surface: surface, one_way: one_way, polution: 0, range: 0, profile: profile, focus: [], shape: shape, coords: coords, original_id: original_id, altered: false, index: index };
                roads_list.push(props);
                //all_list.push(props);
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
                    profile = ["any"];
                    props = { id: id, source: source, type: type, area: tmp_area, polution: 0, range: 0, profile: profile, focus: [], shape: shape, coords: coords, drawn: false, altered: false, index: index };
                    objects_list.push(props);
                    all_list.push(props);
                }
                if (source == "landuse") {
                    index = objects_list.length;
                    profile = ["any"];
                    props = { id: id, source: source, type: type, area: tmp_area, polution: 0, range: 0, profile: profile, focus: [], shape: shape, coords: coords, drawn: false, altered: false, index: index };
                    objects_list.push(props);
                    all_list.push(props);
                }
                if (source == "water") {
                    index = objects_list.length;
                    props = { id: id, source: source, type: source, area: tmp_area, shape: shape, coords: coords, drawn: false, altered: false, index: index };
                    objects_list.push(props);
                    all_list.push(props);
                }
            }
                id++;
        //}
    }
    //Filter off duplicate objects in roads_list (with same orignal id)
    roads_list = Array.from(new Set(roads_list.map(a => a.original_id)))
        .map(id => {
            return roads_list.find(a => a.original_id === id);
        });

    all_list.push.apply(all_list, roads_list);
    for (var i in all_list) all_list[i].id = i;
}

function findObjId(search_features) {
    var id = -1;
    if (!isObjEmpty(search_features)) {
        if (search_features.layer.source != "mapbox-gl-draw-cold") {
            if (search_features.geometry.type == "MultiPolygon") {
                var selectedCoords = search_features.geometry.coordinates[0][0];
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords[0][0];
                    if (selectedCoords.length == iterCoords.length) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            } else if (search_features.geometry.type == "Polygon") {
                var selectedCoords = search_features.geometry.coordinates[0];
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords[0];
                    if (selectedCoords.length == iterCoords.length) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            } else if (search_features.geometry.type == "MultiLineString") {
                var selectedCoords;
                //if (selected_road.length > 1)
                //    selectedCoords = selected_road[1].geometry.coordinates[0];
                //else
                //    selectedCoords = selected_road[0].geometry.coordinates[0];
                selectedCoords = search_features.geometry.coordinates[0];
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords[0];
                    if (selectedCoords.length == iterCoords.length) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            } else if (search_features.geometry.type == "LineString") {
                var selectedCoords;
                //if (selected_road.length > 1)
                //    selectedCoords = selected_road[1].geometry.coordinates;
                //else
                //    selectedCoords = selected_road[0].geometry.coordinates;
                selectedCoords = search_features.geometry.coordinates;
                for (var i in all_list) {
                    var iterCoords = all_list[i].coords;
                    if (iterCoords[0][0]) {
                        if (selectedCoords[0][0] == iterCoords[0][0]) {
                            id = i;
                        }
                    }
                }
            }
        } else if (id == -1) {
            id = selectedDrawObject(search_features.properties.id);
        }
    }
    return id;
}


function savePropsChanges(button) {
    var extracted_props = extractTableContents();
    let final_props = extracted_props;
    
    if (extracted_props.type == "") {
        document.getElementById("type_popup").classList.toggle("show");
        setTimeout(function () { document.getElementById("type_popup").classList.toggle("show") }, 3000);
        return;
    }
    //handle buttons' visibility and table editable
    button.style.visibility = "hidden";
    toggleDrawButtons(false);
    var elems = document.getElementsByClassName("cell2");
    for (var i = 0; i < elems.length; i++) elems[i].setAttribute("contenteditable", "false");
    //save drawed objects
    if (drawing) {
        final_props.id = all_list.length; final_props.coords = tmp_drawn_obj.coords; final_props.shape = tmp_drawn_obj.shape;
        final_props.drawn = true; final_props.index = objects_list.length;
        all_list[extracted_props.id] = tmp;
        objects_list[tmp.index] = tmp;
        resetStats();
        var draw_obj = { id: extracted_props.id, draw_id: draw_id };
        draw_object_list.push(draw_obj);
        tmp_drawn_list.push(tmp);
        draw_id = 0;
        //handle heatmap
            //addHeatFeature(tmp);
        //handle buttons' style
        var newButton = document.getElementById("newButton");
        newButton.style.visibility = "visible";
        newButton.innerText = "new";
        draw.changeMode('simple_select');
        drawing = false;
        return;
    }
    //console.log("altered list 1 = "); console.log(altered_list);

    //handle empty objects
    var altered = true;
    if (final_props.polution == 0 && final_props.range == 0) {
        altered = false;
        /*log.info("inside that one function");
        for (var i in selected_objs) {
            let tmp_id = selected_objs[i].id;
            all_list[tmp_id].altered = false;
            for (var j in altered_list) {
                if (altered_list[j].id == tmp_id) {
                    altered_list.splice(j, 1);
                    break;
                }
            }
            removeHeatFeature(selected_objs[i]);
        }
        return;*/
    }

    //console.log("altered list 2 = "); console.log(altered_list);
    for (var i in selected_objs) {
        selected_objs[i].altered = altered;
        selected_objs[i].polution = final_props.polution; selected_objs[i].range = final_props.range;
        //selected_objs[i].profile = final_props.profile;
        if (final_props.type != "-") selected_objs[i].type = final_props.type;

        let tmp_id = selected_objs[i].id;
        all_list[tmp_id] = selected_objs[i];
        switch (selected_objs[i].type) {
            case "road":
                roads_list[selected_objs[i].index] = selected_objs[i];
                break;
            case "building": case "landuse":
                objects_list[selected_objs[i].index] = selected_objs[i];
                break;
        }

        if (altered) {
            altered_list.push(selected_objs[i]);
            addHeatFeature(selected_objs[i]);
        } else {
            for (var j in altered_list) {
                if (altered_list[j].id == selected_objs[i].id) {
                    altered_list.splice(j, 1);
                    break;
                }
            }
            removeHeatFeature(selected_objs[i]);
        }
        
    }
    enable_save = true;
    updateChart();
    resetStats();
}


function addDrawTools(button) {
    if (button.innerText == "new") {
        button.innerText = "cancel";
        document.getElementById("propsTable").innerHTML = "";
        toggleDrawButtons(true);
        drawing = true;
        document.getElementById("editButton").style.visibility = "hidden";
        document.getElementById("saveButton").style.visibility = "hidden";
        if (object_selection_count > 0 || road_selection_count > 0) {
            //selection_object_features.features.splice(object_selection_count - 1, 1);
            selection_object_features.features = [];
            map.getSource("selection_object_source").setData(selection_object_features);
            object_selection_count = 0;
            selection_road_features.features = [];
            map.getSource("selection_road_source").setData(selection_road_features);
            road_selection_count = 0;
        }
    } else {
        var id = draw.getSelectedIds();
        draw.delete(id);
        deleteDrawnObject(findObjId(search_features));
        button.innerText = "new";
        toggleDrawButtons(false);
        drawing = false;
        //document.getElementById("saveButton").onclick = function () { savePropsChanges(this) }; //não tenho a certeza se o this funciona aqui
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

function styleMapButtons() {
    var map_buttons = document.getElementsByClassName("mapboxgl-ctrl-group");
    map_buttons[0].style.backgroundColor = "#4caf50";
    map_buttons[1].style.backgroundColor = "#4caf50";

    /*var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    draw_buttons[0].style.backgroundColor = "#4caf50";
    draw_buttons[1].style.backgroundColor = "#4caf50";*/
}

function toggleDrawButtons(enable) {
    var draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    if (enable == false) {
        draw_buttons[0].disabled = true;
        draw_buttons[1].disabled = true;
        //draw_buttons[2].disabled = true;
        draw_buttons[0].classList.add("disabled-control-button");
        draw_buttons[1].classList.add("disabled-control-button");
        //draw_buttons[2].classList.add("disabled-control-button");
    } else {
        draw_buttons[0].disabled = false;
        draw_buttons[1].disabled = false;
        //draw_buttons[2].disabled = false;
        draw_buttons[0].classList.remove("disabled-control-button");
        draw_buttons[1].classList.remove("disabled-control-button");
        //draw_buttons[2].classList.remove("disabled-control-button");
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
    tmp_drawn_obj = { id: id, source: "insert source", area: tmp_area, shape: "Polygon", coords: polygonCoords, drawn: true, altered: false,  index: objects_list.length };
    createPropertiesTable("propsTable", tmp_drawn_obj, true);
}

function handleFocusDraw() {
    var data = draw.getAll();
    var polygonCoords = data.features[data.features.length - 1].geometry.coordinates;
    var tmp_area = Math.round(area.default(getVisiblePolygonPortion(polygonCoords, true)) * 1000) / 1000;
    tmp_focus_obj = { area: tmp_area, polution: 0, range: 0, shape: "Polygon", coords: polygonCoords, drawn: true, altered: false};
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
    properties.source = features.sourceLayer;
    if (!isRoad) {
        properties.id = object_selection_count;
        selection_object_features.features.push(feature);
        object_selection_count++;
        map.getSource("selection_object_source").setData(selection_object_features);
    } else {
        properties.id = road_selection_count;
        selection_road_features.features.push(feature);
        road_selection_count++;
        map.getSource("selection_road_source").setData(selection_road_features);
    }

    isSomethingSelected = true;
}

function addSelectionsColors(color, source, index, isRoad) {
    
    var feature = {
        type: "Feature",
        properties: {},
        geometry: {}
    };
    var properties = feature.properties;
    var geometry = feature.geometry;

    properties.color = color;
    properties.source = source;
    //for (var i in selected_objs) {
        geometry.type = selected_objs[index].shape;
        geometry.coordinates = selected_objs[index].coords;
        if (isRoad) {
            properties.id = road_selection_count;
            selection_road_features.features.push(feature);
            road_selection_count++;
        } else {
            properties.id = object_selection_count;
            selection_object_features.features.push(feature);
            object_selection_count++;
        }
    //}
}

function checkSelect() {
    //clearSelections();
    var target = ""; var color = "";
    var area_counter = 0, length_counter = 0, area_len_counter = 0, length_area, selections_props, isRoad = false;
    
    switch (event.target.value) {
        case "buildings":
            target = "building";
            color = "rgba(66, 100, 251, 0.8)";
            length_area = "area";
            //selections_props = { source: "-", type: "-" };
            break;
        case "roads":
            isRoad = true;
            target = "road";
            color = "rgba(255,100,251, 0.8)";
            length_area = "length";
            //selections_props = { source: "-", type: "-", name: "-" };
            break;
        case "landuse":
            target = "landuse";
            color = "rgba(57, 241, 35, 0.8)";
            length_area = "area";
            //selections_props = { source: "-", type: "-" };
            break;
    }
    clearSourceSelections(target);
    if (event.target.checked) {
        //selected_objs = [];
        for (var i in all_list) {
            if (all_list[i].source == target) {
                selected_objs.push(all_list[i]);
            }
        }
        for (var i in selected_objs) {
            if (selected_objs[i].source == target)
                addSelectionsColors(color, target, i, isRoad);
        }

    } 

    //independente do checked ou unchecked
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
    selection_obj.profile = "any";

    document.getElementById("editButton").style.visibility = "visible";
    createPropertiesTable("propsTable", selection_obj, false);
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

function clearSelections() {
    selected_objs = [];
    selection_obj = { source: "-", type: "-", area: -1, length: -1 };
    object_selection_count = 0;
    road_selection_count = 0;
    selection_object_features.features = [];
    selection_road_features.features = [];

    map.getSource("selection_object_source").setData(selection_object_features);
    map.getSource("selection_road_source").setData(selection_road_features);
}

function clearSourceSelections(source) {
    for (var i = 0; i < selected_objs.length; i++) {
        if (selected_objs[i].source == source) {
            if (selected_objs[i].source == "road") {
                selection_obj.length -= selected_objs[i].length;
                road_selection_count--;
            } else {
                selection_obj.area -= selected_objs[i].area;
                object_selection_count--;
            }   
            selected_objs.splice(i, 1);
            i--;
        }
    }

    if (source == "road")
        selection_road_features.features = [];
    else {
        for (var i = 0; i < selection_object_features.features.length; i++) {
            if (selection_object_features.features[i].properties.source == source) {
                selection_object_features.features.splice(i, 1);
                i--;
            }
        }
    }
    map.getSource("selection_object_source").setData(selection_object_features);
    map.getSource("selection_road_source").setData(selection_road_features);
}

function clearSelectionCheckboxes() {
    document.getElementById("buildings_check").checked = false;
    document.getElementById("roads_check").checked = false;
    document.getElementById("landuse_check").checked = false;
}

//JSON related functions
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

function saveFocus(button) { //add focus must be disabled if multiple objcts are selected
    button.style.visibility = "hidden";
    var extracted_props = extractTableContents();
    tmp_focus_obj.polution = extracted_props.polution;
    tmp_focus_obj.range = extracted_props.range;

    all_list[selected_objs[0].id].focus.push(tmp_focus_obj);
    objects_list[selected_objs[0].index].focus.push(tmp_focus_obj);
    addHeatFeature(tmp_focus_obj);

    var newButton = document.getElementById("newButton");
    newButton.style.visibility = "visible";
    newButton.innerText = "new";
    draw.changeMode('simple_select');
    drawing_focus = false;
    drawing = false;
    document.getElementById("saveButton").onclick = function () { savePropsChanges(this) }; //não tenho a certeza se o this funciona aqui
}

//CSV related functions
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const csvWriter = createCsvWriter({
    path: './Data/CSV/points.csv',
    header: ['COORDS(lng/lat)', 'POLUTION']
});

function writeToCSV(data) {
    csvWriter.writeRecords(random_points)
        .then(() => {
            console.log("Successfully written to file");
        });
}

function generateRandomPoints_helper(iters) {
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

    var x, y, rgb = [];
    var p1, p2, tmp, index, min, obj;
    var top = 0, bottom = 0, distance = 0, result = 0;
    for (var i = 0; i < iters; i++) {
        rgb = []; min = 1000;
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        var lngLat = map.unproject(new mapboxgl.Point(x, y));
        if (gl) {
            const data = new Uint8Array(4);
            const canvasX = x - canvas.offsetLeft;
            const canvasY = canvas.height - y - canvas.offsetTop;
            gl.readPixels(canvasX, canvasY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            rgb.push(data[0]); rgb.push(data[1]), rgb.push(data[2]);
        }
        
        var p = { r: rgb[0], g: rgb[1], b: rgb[2] };
        //procurar cores extremas mais próximas
        for (var j in heatmap_color_vectors) {
            p1 = { r: heatmap_color_vectors[j].vec[0][0], g: heatmap_color_vectors[j].vec[0][1], b: heatmap_color_vectors[j].vec[0][2] };
            p2 = { r: heatmap_color_vectors[j].vec[1][0], g: heatmap_color_vectors[j].vec[1][1], b: heatmap_color_vectors[j].vec[1][2] };
            tmp = pointToLineDist(p, p1, p2);
            if (tmp.dist < min) {
                min = tmp.dist;
                obj = tmp;
                index = j;
            }
        }
        //interpolação de valores polution com weight t;
        top = heatmap_color_vectors[index].pol1;
        bottom = heatmap_color_vectors[index].pol2;
        distance = bottom - top;
        result = top + (obj.weight * distance);
        
        random_points.push([[lngLat.lng, lngLat.lat], result]);
    }

    writeToCSV(random_points);
}

function generateRandomPoints(iters) {
    if (iters < 1) {
        console.log("Number of iterations must be greater than 0");
        return;
    }
    document.getElementById("dropdown_content").querySelectorAll("a")[1].click();
    map.setPaintProperty("polution_heat", "heatmap-opacity", 1);
    setTimeout(function () {
        generateRandomPoints_helper(iters);
    }, 1000);
}


function dumbFunction() {
    console.log(selected_objs);
    clearSourceSelections("building");
    console.log(selected_objs);
    
}
