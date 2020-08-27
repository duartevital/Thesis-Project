const mapboxgl = require('mapbox-gl');
const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const log = require('electron-log');
const remote = require('electron').remote;
const area = require('@turf/area');
const flatten = require('@turf/flatten');
const simplify = require('@turf/simplify');
const pip = require('@turf/boolean-point-in-polygon');
const Chart = require('chart.js');
const fs = require('fs');
const com = require('@turf/center-of-mass');
const Menu = require('electron').remote.Menu
setMenuBar();

var canvas, canvas_container;
var zoom = 12;
var first_start = false;
var drawing = false;
var isSomethingSelected = false;
var do_reset = true;
var drawing_focus = false;
var cntrl_pressed = false;
var showDescBox = false;
var enable_save = false;
var propsAltered = false;
var zoom_end = false;
var load_info = false;
var found_point = false;
var in_props_table = false;
var object_selection_count = 0;
var road_selection_count = 0;
var draw_id = 0;
var heatmap_opacity = 0;
var features = [];
var search_features = [];
var drawn_features = [];
var drawn_point_features = [];
var draw_object_list = [];
var objects_layer = [];
var all_list = [];
var objects_list = [];
var roads_list = [];
var profile_list = [{ name: "any", objs: [], graphs: [] }, { name: "prpof1", objs: [], graphs: []} ];
var tmp_drawn_list = [];
var type_stats = [];
var altered_list = [];
var draw_buttons = [];
var draw_polygon, draw_trash, draw_point;
var random_points = [];
var map_bounds = {};
var tmp_drawn_obj = {};
var tmp_focus_obj = {};
var focus_father_obj = {};
var source_stats = {};
var selected_obj = {};
var selected_objs = [];
var all_info = {};
var profile_stuff = {};
var selected_focus = {};
var current_view = "Normal";
var current_style = "satellite";
var map_info = document.getElementById("map_info");
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
        point: false,
        polygon: true,
        trash: true
    },    
    
});
var nav = new mapboxgl.NavigationControl();

map.on('load', function () {
    addMapLayers();  
    toggleMapPopup("Zoom in to begin", true);
});

map.on('styledata', function () {
    addMapLayers();
});

function addMapLayers() {
    //Objects layers
    /*if (!map.getLayer("water_layer")) {
        map.addLayer({
            "id": "water_layer",
            "type": "fill",
            "minzoom": 15,
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
    }*/
    if (!map.getLayer("landuse_layer")) {
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
    }
    if (!map.getLayer("roads_layer")) {
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
    }
    if (!map.getLayer("buildings_layer")) {
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
    }

    //Object selection sources and layers
    if (!map.getSource("selection_object_source")) {
        map.addSource("selection_object_source", {
            type: "geojson",
            data: selection_object_features
        });
    }
    if (!map.getLayer("selection_object_layer")) {
        map.addLayer({
            id: "selection_object_layer",
            type: "fill",
            source: "selection_object_source",
            layout: {},
            paint: {
                'fill-color': ["get", "color"]
            }
        });
    }
    if (!map.getSource("selection_road_source")) {
        map.addSource("selection_road_source", {
            type: "geojson",
            data: selection_road_features
        });
    }
    if (!map.getLayer("selection_road_layer")) {
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
    }
    //Heatmap sources and layers
    if (!map.getSource("polution_fill")) {
        map.addSource('polution_fill', {
            type: 'geojson',
            data: heatmap_fill_features
        });
    }
    if (!map.getLayer("polution_heat_fill")) {
        map.addLayer({
            id: 'polution_heat_fill',
            type: 'fill',
            source: 'polution_fill',
            layout: {},
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': heatmap_opacity
            }
        });
    }
    if (!map.getSource("polution")) {
        map.addSource('polution', {
            type: 'geojson',
            data: heatmap_features
            //data: JSON.parse(fs.readFileSync("./Data/polution.geojson", "utf8"))
        });
    }
    if (!map.getLayer("polution_heat")) {
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
                'heatmap-opacity': heatmap_opacity
            }
        });
    }
    
    //map.setPaintProperty("polution_heat_fill", "fill-opacity", 0);
}
var selection_obj = { source: "-", type: "-", area: -1, length: -1 };
map.on('click', function (e) {
    /*if (!first_start && (zoom >= 16 && zoom <= 19 )) {
        startAll();
        return;
    }*/
    if (drawing && !drawing_focus) {
        if (in_props_table)
            setPopup("Save changes made to Entity first", document.getElementById("accept_btn"));
        return;
    }

    features = map.queryRenderedFeatures(e.point, {
        layers: [
            'buildings_layer',
            'landuse_layer',    
            'roads_layer',
            'selection_object_layer',
            'selection_road_layer',
            'gl-draw-polygon-fill-inactive.cold'
        ]
    })[0];
    search_features = map.queryRenderedFeatures(e.point, {
        layers: [
            'buildings_layer',
            'landuse_layer',
            'roads_layer',
            'gl-draw-polygon-fill-inactive.cold',
            "gl-draw-polygon-fill-active.cold"
        ]
    })[0];
    drawn_features = map.queryRenderedFeatures(e.point, {
        layers: [
            'gl-draw-polygon-fill-inactive.cold'
        ]
    });
    drawn_point_features = map.queryRenderedFeatures(e.point, {
        layers: [
            'gl-draw-point-inactive.cold',
            'gl-draw-point-active.hot',
            'gl-draw-point-point-stroke-inactive.cold'
        ]
    });
    
    var id = findObjId(search_features);
    if (drawing_focus) {
        var set_trash = false;
        if (!drawing) {
            if (typeof features == 'undefined' || id != focus_father_obj.id)
                set_trash = true;
        } else {
            if (typeof features == 'undefined' || id || (search_features.properties.id && focus_father_obj.draw_id && search_features.properties.id != focus_father_obj.draw_id)) {
                set_trash = true;
            }
        }

        if (set_trash) {
            setMapPopup("Point must be placed inside selected entity", 2000);
            draw.trash();
            draw.changeMode("draw_point");
            return;
        }
        draw.changeMode("simple_select");
        return;
    }
    //draw.changeMode("simple_select");
    clearSelectionCheckboxes();
    if (typeof features == 'undefined') {
        clearSelections();
        document.getElementById("propsTable").innerHTML = "";
        return;
    }

    openTab('features_tab');
    var event = e.originalEvent;
    if ((!event.ctrlKey && !event.shiftKey) || (event.ctrlKey && selected_objs.length == 0)) {
        //props table creation
        if (id > -1) {
            clearSelections();
            selected_objs = []; selected_objs.push(all_list[id]);
            //selection_obj
            selection_obj.id = id;
            selection_obj.source = all_list[id].source;
            selection_obj.type = all_list[id].type;
            if (all_list[id].area)
                selection_obj.area = all_list[id].area;
            else if (all_list[id].length) {
                selection_obj.name = all_list[id].name;
                selection_obj.length = all_list[id].length;
                selection_obj.one_way = all_list[id].one_way;
            }
            selection_obj.range = all_list[id].range;
            selection_obj.polution = all_list[id].polution;
            selection_obj.focus = all_list[id].focus;

            createPropertiesTable(selection_obj, false);
        }
        if (features.source != "selection_object_source" && features.source != "selection_road_source")
            addSelectionColor();
        else if (drawn_point_features.length == 0) {
            clearSelections();
        }
        if (drawn_point_features.length > 0) {
            found_point = true;
            findFocus();
        }
        console.log({ selected_focus: selected_focus });

    } else if (event.ctrlKey && !event.shiftKey) {
        var area_counter = 0, length_counter = 0;
        selection_obj = { id: "-", source: "-", type: "-", area: -1, length: -1 };
        if (features.source != "selection_object_source" && features.source != "selection_road_source") {
            selected_objs.push(all_list[id]);
            addSelectionColor();
            //selection_obj.source = all_list[id].source; selection_obj.type = all_list[id].type;
            
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
                var focus_arr = [];
                if (object_selection_count > 0) {
                    for (var i in selected_objs) {
                        for (var j in selected_objs[i].focus)
                            focus_arr.push(selected_objs[i].focus[j]);
                        if (selected_objs[i].area)
                            area_counter += selected_objs[i].area;
                    }
                }

                selection_obj.area = area_counter;
                selection_obj.range = getAverageRange(selected_objs);
                selection_obj.polution = getAveragePolution(selected_objs);
                selection_obj.focus = focus_arr;

                createPropertiesTable(selection_obj, false);
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
                var focus_arr = [];
                if (road_selection_count > 0) {
                    for (var i in selected_objs) {
                        for (var j in selected_objs[i].focus)
                            focus_arr.push(selected_objs[i].focus[j]);
                        if (selected_objs[i].length)
                            length_counter += selected_objs[i].length;
                    }
                }
                selection_obj.length = length_counter;
                selection_obj.range = getAverageRange(selected_objs);
                selection_obj.polution = getAveragePolution(selected_objs);
                selection_obj.focus = focus_arr;

                createPropertiesTable(selection_obj, false);
                return;
            }
        }

        //props table creation
        //if (object_selection_count > 1 || road_selection_count > 1) {
        var focus_btn_enabled = true;
        if (selected_objs.length > 1) {
            selection_obj.source = "-"; selection_obj.type = "-";
            focus_btn_enabled = false;
        } else if (selected_objs.length == 1) {
            focus_btn_enabled = true;
        }
        selection_obj.polution = getAveragePolution(selected_objs);
        selection_obj.range = getAverageRange(selected_objs);
        //var focus_val = all_list[id].focus.length + " (";
        var focus_arr = [];
        for (var i in selected_objs) {
            if (selected_objs[i].area)
                area_counter += selected_objs[i].area;
            else if (selected_objs[i].length)
                length_counter += selected_objs[i].length;
            for (var j in selected_objs[i].focus) {
                focus_arr.push(selected_objs[i].focus[j]);
            }
        }
        selection_obj.focus = focus_arr;
        if (area_counter > 0)
            selection_obj.area = area_counter;
        if (length_counter > 0)
            selection_obj.length = length_counter;
        
        createPropertiesTable(selection_obj, false);
        var focus_ph = document.getElementById("focus_placeholder").querySelector("#editor_input").querySelector("button");
        if (focus_btn_enabled) {
            focus_ph.disabled = false;
            //focus_ph.style.cursor = "pointer";
        } else {
            focus_ph.disabled = true;
            focus_ph.classList.toggle("disabled");
            //focus_ph.style.cursor = "not-allowed";
        }
    }
});

map.on('dragend', function (e) {
    if (first_start) {
        startAll();
        if (selection_obj.area != -1 || selection_obj.length != -1)
            createPropertiesTable(selection_obj, false);
        clearSelectionCheckboxes();
    }
});
map.on('zoomend', function () {
    if (zoom < 16) {
        toggleMapPopup("Zoom in to begin", true);
        clearSelections();
        toggleMapButtons(false);
        return;
    }
    if (!load_info) {
        if (zoom >= 16 && zoom <= 19) {
            toggleMapPopup("", false);
            if (!first_start) openTab('features_tab');
            startAll();
        }
        return;
    }
    toggleMapButtons(true);
    simplifiedStartAll();
    loadGraphInfo()
    setItemsInfo();
    for (var i in altered_list) {
        addHeatFeature(altered_list[i]);
        if (altered_list[i].focus.length > 0)
            for (var j in altered_list[i].focus)
                addHeatFeature(altered_list[i].focus[j]);
    }
    updateChart();
    zoom_end = true;
    load_info = false;
});
map.on("zoom", function () {
    zoom = map.getZoom();
    map_info.querySelector("#zoom").innerHTML = "<b>zoom:</b> " + (Math.round(zoom * 100) / 100);
});

map.on('draw.create', function () {
    if (drawing_focus)
        handleFocusDraw();
    else
        handleDraw();
});
map.on('draw.update', function (e) {
    handleUpdate(e);
});
map.on('draw.delete', function (e) {
    //draw_delete();
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
fetchTags();

function startAll() {
    log.info("====================================================");
    canvas = map.getCanvas();
    canvas_container = map.getCanvasContainer();
    canvas_container.addEventListener('mousedown', function () { mouseDown(event, map, canvas) }, true);

    toggleMapButtons(true);
    clearSelectionCheckboxes();
    let tmp_bounds = map.getBounds();
    map_bounds = { ne: tmp_bounds._ne, sw: tmp_bounds._sw };
    //if (zoom >= 18) {
    if (!first_start) first_start = true;
    enable_save = true;
    draw.deleteAll();
    objects_layer = [];
    all_list = [];
    if (altered_list.length > 0) {
        loadDrawnObjects();
        all_list.push.apply(all_list, altered_list);
    };

    objects_list = [];
    roads_list = [];
    source_stats = { building_area: 0, landuse_area: 0, road_length: 0 };
    for (var i in profile_list) {
        profile_list[i].objs = [];
        profile_list[i].graphs = [];
    }

    //document.getElementById("propsTable").innerHTML = "";

    getAllObjects();
    profile_list[0].graphs.push(graph);
    setProfileStuff();
    //updateDrawObjectsInViewport();
    //openTab('features_tab');

    //Calculate statistics and create graphs
    if (do_reset)
        resetStats();
    else {
        setPieGraph(type_stats);
        do_reset = true;
    }

    toggleMapPopup("", false);
}


function getAllObjects() {
    objects_layer = map.queryRenderedFeatures({
        layers: [
            'buildings_layer',
            'landuse_layer',
            'roads_layer',
            'gl-draw-polygon-fill-inactive.cold'
        ]
    });
    
    var id = 0;
    var props = {};
    var source, type, coords, shape;
    for (var i in objects_layer) {
        source = objects_layer[i].layer["source-layer"];
        type = objects_layer[i].properties.type;
        coords = objects_layer[i].geometry.coordinates;
        shape = objects_layer[i].geometry.type;
        var found_altered = false;
        for (var j in altered_list) {
            if (altered_list[j].original_id == objects_layer[i].id) {
                found_altered = true;
                if (source == "road") {
                    altered_list[j].index = roads_list.length;
                    roads_list.push(altered_list[j]);
                } else {
                    altered_list[j].index = objects_list.length;
                    objects_list.push(altered_list[j]);
                }
            }
            //let shape = altered_list[j].shape;
            /*switch (shape) {
                case "Polygon":
                    if (altered_list[j].coords[0][0][0] == coords[0][0][0]) {
                        found_altered = true;
                        altered_list[j].index = objects_list.length;
                        objects_list.push(altered_list[j]);
                        break;
                    }
                    break;
                case "MultiPolygon":
                    if (altered_list[j].coords[0][0][0][0] == coords[0][0][0][0]) {
                        found_altered = true;
                        altered_list[j].index = objects_list.length;
                        objects_list.push(altered_list[j]);
                        break;
                    }
                    break;
                case "LineString":
                    if (altered_list[j].coords[0][0] == coords[0][0]) {
                        found_altered = true;
                        altered_list[j].index = roads_list.length;
                        roads_list.push(altered_list[j]);
                        break;
                    }
                    break;
            }*/
        }
        if (found_altered) {
            continue;
        }

        if (objects_layer[i].layer.id === "gl-draw-polygon-fill-inactive.cold") {
            for (var j in draw_object_list) {
                if (draw_object_list[j].draw_id == objects_layer[i].properties.id) {
                    source = draw_object_list[j].source;
                    type = draw_object_list[j].type;
                    break;
                }
            }
        }

        //Different attributes for different sources of features

        if (source == "road") {
            name = objects_layer[i].properties.name;
            surface = objects_layer[i].properties.surface;
            one_way = objects_layer[i].properties.oneway;
            if (shape == "LineString")
                length = Math.round(line_length.default(turf.lineString(coords)) * 1000000) / 1000; //conversion km - m
            else if (shape == "MultiLineString")
                length = Math.round(line_length.default(turf.multiLineString(coords)) * 1000000) / 1000; //conversion km - m

            original_id = objects_layer[i].id;
            index = roads_list.length;
            profile = ["any"];
            props = { id: id, source: source, type: type, name: name, length: length, surface: surface, one_way: one_way, polution: 0, range: 0, profile: profile, focus: [], shape: shape, coords: coords, original_id: original_id, altered: false, index: index, heat_index: -1 };
            roads_list.push(props);
            source_stats.road_length += length;
        } else {
            var tmp_area = 0;
            if (shape == "Polygon")
                tmp_area = Math.round(area.default(turf.polygon(coords)) * 1000) / 1000;
            else if (shape == "MultiPolygon")
                tmp_area = Math.round(area.default(turf.multiPolygon(coords)) * 1000) / 1000;

            if (source == "building") {
                height = objects_layer[i].properties.height;
                under = objects_layer[i].properties.underground;
                original_id = objects_layer[i].id;
                index = objects_list.length;
                profile = ["any"];
                props = { id: id, source: source, type: type, area: tmp_area, polution: 0, range: 0, profile: profile, focus: [], shape: shape, coords: coords, original_id: original_id, drawn: false, altered: false, index: index, heat_index: -1 };
                objects_list.push(props);
                all_list.push(props);
            }
            if (source == "landuse") {
                original_id = objects_layer[i].id;
                index = objects_list.length;
                profile = ["any"];
                props = { id: id, source: source, type: type, area: tmp_area, polution: 0, range: 0, profile: profile, focus: [], shape: shape, coords: coords, original_id: original_id, drawn: false, altered: false, index: index, heat_index: -1 };
                objects_list.push(props);
                all_list.push(props);
            }
            if (source == "water") {
                original_id = objects_layer[i].id;
                index = objects_list.length;
                props = { id: id, source: source, type: source, area: tmp_area, shape: shape, coords: coords, original_id: original_id, drawn: false, altered: false, index: index };
                objects_list.push(props);
                all_list.push(props);
            }
        }
        id++;
    }
    //Filter off duplicate objects in roads_list (with same orignal id)
    roads_list = Array.from(new Set(roads_list.map(a => a.original_id)))
        .map(id => {
            return roads_list.find(a => a.original_id === id);
        });
    for (var i in roads_list)
        if (roads_list[i].altered)
            roads_list.splice(i, 1);
    all_list.push.apply(all_list, roads_list);
    for (var i in all_list) {
        all_list[i].id = i;
        if (all_list[i].focus.length > 0)
            for (var k in all_list[i].focus)
                all_list[i].focus[k].father_obj = i;
        if (all_list[i].profile.length == 1)
            profile_list[0].objs.push(all_list[i]);
        else
            for (var k in profile_list)
                for (var l in all_list[i].profile) 
                    if (profile_list[k].name == all_list[i].profile[l]) 
                        profile_list[k].objs.push(all_list[i]);
    }
    createObjectsTable();
}

function findObjId(search_features) {
    console.log({ search_features: search_features});
    var id = -1;
    if (!isObjEmpty(search_features)) {
        for (var i in all_list) {
            if ((all_list[i].original_id || search_features.id) && all_list[i].original_id == search_features.id) {
                id = all_list[i].id;
                return id;
            }
        }

        if (id == -1) {
            let tmp_obj = selectedDrawObject(search_features.properties.id);
            id = tmp_obj.id;
        }
    }
    if (id == -1) {
        console.log("id not found...");
        return;
    }
    return id;
}

function savePropsChanges() {
    var extracted_props = extractTableContents();
    let final_props = extracted_props;
    
    if (extracted_props.type == "") {
        setPopup("Entity must have a type!", document.getElementById("type_placeholder"));
        return;
    }
    
    if (extracted_props.profile.length == 0 || extracted_props.profile[0] == "") {
        alert("This Entity is not attached to a profile.\nChanges to any graphs won't affect this Entity.");
        /*var confirmation = confirm("This Entity is not attached to a profile.\nChanges to any graphs won't affect this Entity.\nContinue?");
        if (!confirmation)
            return;*/
    }
    in_props_table = false;
    draw_trash.disabled = false;
    draw_trash.classList.toggle("disabled", false);
    //handle empty objects
    var altered = true, second_altered = false, altered_to_0 = false;
    if (final_props.polution == 0 &&
        final_props.range == 0 &&
        //(final_props.profile.length > 1 || final_props.profile[0] != "any") &&
        final_props.focus.length == 0) {
        altered = false;
        altered_to_0 = true;
    }

    //save drawed objects
    if (drawing) {
        altered = true;
        final_props.source = selection_obj.source; final_props.area = selection_obj.area;
        final_props.id = all_list.length; final_props.coords = tmp_drawn_obj.coords; final_props.shape = tmp_drawn_obj.shape;
        final_props.drawn = true; final_props.index = objects_list.length; final_props.draw_id = draw_id; final_props.altered = altered;
        final_props.profile = ["any"];
        final_props.focus = selected_objs[0].focus;

        all_list[final_props.id] = final_props;
        objects_list[final_props.index] = final_props;
        resetStats();
        draw_object_list.push(final_props);
        //tmp_drawn_list.push(final_props);
        profile_list[0].objs.push(final_props);
        draw_id = 0;
        //handle heatmap
        if (altered) {
            altered_list.push(final_props);
            final_props.heat_index = heatmap_features.features.length;
            addHeatFeature(final_props);
        }

        //handle draw functionality        
        draw.changeMode('simple_select');
        drawing = false;

        return;
    }

    for (var i in selected_objs) {
        if (selected_objs[i].altered) altered = false;
        if (selected_objs[i].type != final_props.type ||
            selected_objs[i].polution != final_props.polution ||
            selected_objs[i].range != final_props.range) {
            altered = true;
        }

        selected_objs[i].altered = altered;
        selected_objs[i].polution = final_props.polution; selected_objs[i].range = final_props.range;
        //selected_objs[i].profile = final_props.profile;
        if (final_props.type != "-") selected_objs[i].type = final_props.type;

        let tmp_id = selected_objs[i].id;
        all_list[tmp_id] = selected_objs[i];
        switch (selected_objs[i].source) {
            case "road":
                roads_list[selected_objs[i].index] = selected_objs[i];
                break;
            case "building": case "landuse":
                objects_list[selected_objs[i].index] = selected_objs[i];
                break;
        }
        if (selected_objs[i].heat_index == -1)
            selected_objs[i].heat_index = heatmap_features.features.length;

        if (propsAltered)
            addHeatFeature(selected_objs[i]);
        if (altered) {
            var in_selected_list = false;
            for (var j in altered_list) {
                if (altered_list[j].id == selected_objs[i].id) {
                    altered_list[j] = selected_objs[i];
                    in_selected_list = true;
                    break;
                }
            }
            if (!in_selected_list) 
                altered_list.push(selected_objs[i]);
            //addHeatFeature(selected_objs[i]);
        } else if (altered_to_0) {
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
    document.getElementById("accept_btn").classList.remove("advocate_click");
}

function cancelPropsChanges() {
    var tmp_selection_obj = selection_obj;

    document.getElementById("type_placeholder").innerHTML = "";
    document.getElementById("polution_placeholder").innerHTML = "";
    document.getElementById("range_placeholder").innerHTML = "";
    document.getElementById("profile_placeholder").innerHTML = "";
    document.getElementById("focus_placeholder").innerHTML = "";

    createPropertiesTable(tmp_selection_obj, false);
}

function loadDrawnObjects() {
    let tmp_feat = {
        type: 'Feature',
        properties: {},
        geometry: {}
    };
    for (var i in draw_object_list) {
        tmp_feat.id = draw_object_list[i].draw_id;
        tmp_feat.geometry.type = draw_object_list[i].shape;
        tmp_feat.geometry.coordinates = draw_object_list[i].coords;
        draw.add(tmp_feat);
    }
}

function layerCheckInput(elem) {
    var slider_value = 0, opacity = 0;
    if (event.target.checked) {
        slider_value = 100;
        opacity = 1;
    }

    if (event.target.value == "Entities") {
        elem.querySelector("#entities_slider").value = slider_value;

        map.setPaintProperty("buildings_layer", "fill-opacity", opacity);
        map.setPaintProperty("water_layer", "fill-opacity", opacity);
        map.setPaintProperty("landuse_layer", "fill-opacity", opacity);
        map.setPaintProperty("roads_layer", "line-opacity", opacity);
    } else if (event.target.value == "Heatmap") {
        elem.querySelector("#heatmap_slider").value = slider_value;

        map.setPaintProperty("polution_heat", "heatmap-opacity", opacity);
        map.setPaintProperty("polution_heat_fill", "fill-opacity", opacity);
    }
}
function layerSliderInput(elem) {
    var cb, opacity = 0;
    opacity = elem.value / 100;
    if (elem.id == "entities_slider") {
        cb = elem.parentNode.querySelector("#entities_check");        
        if (!cb.checked && elem.value > 0)
            cb.checked = true;
        else if (cb.checked && elem.value == 0)
            cb.checked = false;

        map.setPaintProperty("buildings_layer", "fill-opacity", opacity);
        map.setPaintProperty("water_layer", "fill-opacity", opacity);
        map.setPaintProperty("landuse_layer", "fill-opacity", opacity);
        map.setPaintProperty("roads_layer", "line-opacity", opacity);
    } else if (elem.id == "heatmap_slider") {
        cb = elem.parentNode.querySelector("#heatmap_check");
        if (!cb.checked && elem.value > 0)
            cb.checked = true;
        else if (cb.checked && elem.value == 0)
            cb.checked = false;

        map.setPaintProperty("polution_heat", "heatmap-opacity", opacity);
        map.setPaintProperty("polution_heat_fill", "fill-opacity", opacity);
    }
}

function selectedDrawObject(draw_id) {
    var obj = {};
    console.log({ draw_object_list: draw_object_list, draw_id: draw_id });
    for (var i in draw_object_list) {
        if (draw_object_list[i].draw_id == draw_id) {
            obj = draw_object_list[i];
            break;
        }
    }
    return obj;
}

function styleMapButtons() {
    var map_buttons = document.getElementsByClassName("mapboxgl-ctrl-group");
    map_buttons[0].style.backgroundColor = "#4caf50";

    //draw_buttons = document.getElementsByClassName("mapbox-gl-draw_ctrl-draw-btn");
    draw_buttons = document.getElementsByClassName("mapboxgl-ctrl-top-right")[0].querySelectorAll(".mapboxgl-ctrl-group")[1];
    draw_polygon = draw_buttons.querySelector(".mapbox-gl-draw_polygon");
    draw_trash = draw_buttons.querySelector(".mapbox-gl-draw_trash");

    draw_polygon.onclick = function () { drawing = true; clearSelections(); };
    draw_trash.onclick = function () {
        drawing = false; drawing_focus = false;
        draw_delete();
    };
    //draw_polygon.style.backgroundImage = "url('../Media/polygon_plus.svg')"
    //draw_trash.style.backgroundImage = "url('../Media/polygon_minus.svg')"
    draw_polygon.style.backgroundColor = "#4caf50";
    draw_trash.style.backgroundColor = "#4caf50";
    draw_polygon.style.backgroundSize = "23px 23px";
    draw_trash.style.backgroundSize = "23px 23px";
    draw_polygon.title = "Draw polygon";
    draw_trash.title = "Delete selected drawn polygon";

    toggleMapButtons(false);    
}
function toggleMapButtons(toggle) {
    draw_polygon.disabled = !toggle;
    draw_trash.disabled = !toggle;
    draw_polygon.classList.toggle("disabled", !toggle);
    draw_trash.classList.toggle("disabled", !toggle);

    var filter_div = document.getElementById("filter_div");
    filter_div.querySelector("button").disabled = !toggle;
    filter_div.querySelector("button").classList.toggle("disabled", !toggle);
    if (toggle) 
        filter_div.onmousemove = function () { filterAction(true, this) };
    else 
        filter_div.onmousemove = function () { return };
    
}

function toggleMapStyle() {
    heatmap_opacity = map.getPaintProperty("polution_heat", "heatmap-opacity");
    var style = document.getElementById("map_style_div");
    if (current_style == "satellite") {
        map.setStyle('mapbox://styles/mapbox/streets-v11', { diff: false });
        current_style = "street";
        style.querySelector("img").src = "../Media/satellite.png";
    } else if (current_style == "street") {
        map.setStyle('mapbox://styles/mapbox/satellite-streets-v11', { diff: false });
        current_style = "satellite";
        style.querySelector("img").src = "../Media/street.png";
    }
}

function setItemsInfo() {
    var row, cell, table, select, option;
    table = map_info.querySelector("table");
    table.innerHTML = "";
    for (var i in graph_list) {
        select = document.createElement("select");
        for (var j in graph_list[i].labels) {
            option = document.createElement('option');
            option.value = graph_list[i].labels[j].name;
            option.text = graph_list[i].labels[j].name;
            select.add(option);
        }
        select.className = "item_dropdown info_container";
        select.onchange = function () { changeDay(this) };
        row = table.insertRow(-1);
        cell = row.insertCell(0);
        cell.appendChild(select);
    }
}

function addToItemsInfo(labels) {
    var row, cell, table, select, option;
    table = map_info.querySelector("table");
    select = document.createElement("select");
    for (var i in labels) {
        option = document.createElement('option');
        option.value = labels[i].name;
        option.text = labels[i].name;
        select.add(option);
    }
    select.className = "item_dropdown";
    select.onchange = function () { changeDay(this) };
    row = table.insertRow(-1);
    cell = row.insertCell(0);
    cell.appendChild(select);
}

function handleDraw() {
    var data = draw.getAll();
    var polygonCoords = data.features[data.features.length - 1].geometry.coordinates;
    draw_id = data.features[data.features.length - 1].id;
    var id = all_list.length;
    //var tmp_area = Math.round(area.default(getVisiblePolygonPortion(polygonCoords, true)) * 1000) / 1000;
    var tmp_area = Math.round(area.default(turf.polygon(polygonCoords)) * 1000) / 1000
    tmp_drawn_obj = { id: id, source: "insert source", area: tmp_area, shape: "Polygon", coords: polygonCoords, drawn: true, altered: false,  index: objects_list.length, draw_id: draw_id, heat_index: -1 };
    createPropertiesTable(tmp_drawn_obj, true);

    selection_obj = { source: "", type: "", area: tmp_area };
}

function handleFocusDraw() {
    var data = draw.getAll();
    var feature = data.features[data.features.length - 1];
    var polygonCoords = feature.geometry.coordinates;
    var shape = feature.geometry.type;
    var draw_id = feature.id;

    tmp_focus_obj = { polution: 0, range: 0, shape: shape, coords: polygonCoords, draw_id: draw_id, drawn: true, altered: false, father_obj: focus_father_obj.id };
    createFocusTable({ polution: 0, range: 0 });
    // reset original onclick;
    draw_polygon.onclick = function () { drawing = true; clearSelections(); };
}

function handleUpdate(e) {
    var data = draw.getSelected().features[0];
    var polygonCoords = data.geometry.coordinates;
    var tmp_query, id, wanted_obj = {}, tmp_focus;
    let tmp_feat = {
        id: -1,
        type: 'Feature',
        properties: {},
        geometry: {}
    };

    if (data.geometry.type == "Point") {
        tmp_query = map.queryRenderedFeatures(map.project(data.geometry.coordinates), {
            layers: [
                'buildings_layer',
                'landuse_layer',
                'roads_layer',
                'gl-draw-polygon-fill-inactive.cold'
            ]
        });
        id = findObjId(tmp_query[0]);
        
        if (id || id != -1) {
            for (var i in draw_object_list) {
                if (draw_object_list[i].draw_id == data.id) {
                    tmp_focus = draw_object_list[i];
                    wanted_obj = all_list[draw_object_list[i].father_obj];
                    break; break;
                }
            }
            if (id != wanted_obj.id) { //if outside entity
                setMapPopup("Focus point must be placed inside chosen Entity", 2000);
                draw.delete(tmp_focus.draw_id);
                tmp_feat.id = tmp_focus.draw_id;
                tmp_feat.geometry.type = tmp_focus.shape;
                tmp_feat.geometry.coordinates = tmp_focus.coords;
                draw.add(tmp_feat);
                return;
            }
            //if inside entity
            if (tmp_focus.polution > 0) {
                tmp_focus.coords = data.geometry.coordinates;
                for (var i in wanted_obj.focus) {
                    if (wanted_obj.focus[i].draw_id == tmp_focus.draw_id)
                        wanted_obj.focus[i].coords = tmp_focus.coords;
                }
                addHeatFeature(tmp_focus);
            }
        } else {
            loadDrawnObjects();
        }
        return;
    }

    var tmp_area = Math.round(area.default(turf.multiPolygon(polygonCoords)) * 1000) / 1000;
    var id = selectedDrawObject(data.id).id;
    all_list[id].coords = polygonCoords;
    all_list[id].area = tmp_area;
    selected_objs[0] = all_list[id];
    createPropertiesTable(all_list[id], false);

    for (var i in selection_object_features.features) {
        if (selection_object_features.features[i].properties.obj_id == id) {
            selection_object_features.features.splice(i, 1);
            map.getSource("selection_object_source").setData(selection_object_features);
            break;
        }
    }
    addSelectionColor();
    if (all_list[id].polution > 0) {
        for (var i in heatmap_fill_features.features)
            if (heatmap_fill_features.features[i].properties.id == all_list[id].heat_index) {
                heatmap_fill_features.features.splice(i, 1);
                map.getSource("polution_fill").setData(heatmap_fill_features);
                break;
            }
        addHeatFeature(all_list[id]);
    }
}

function deleteDrawnObject(id) {
    if (id != -1) {
        if (all_list[id].drawn) {
            if (all_list[id].focus.length > 0) {
                for (var i in all_list[id].focus) {
                    found_point = true;
                    removeHeatFeature(all_list[id].focus[i]);
                    for (var j in draw_object_list) 
                        if (draw_object_list[j].draw_id == all_list[id].focus[i].draw_id) {
                            draw_object_list.splice(j, 1);
                            break
                        }
                    draw.delete(all_list[id].focus[i].draw_id);
                }
                all_list[id].focus = [];
            }
            removeHeatFeature(all_list[id]);
            var tmp_index = all_list[id].index;
            all_list.splice(id, 1);
            objects_list.splice(tmp_index, 1);
        }

        for (var i in draw_object_list) 
            if (draw_object_list[i].id == id) {
                draw_object_list.splice(i, 1);
                break;
            }
    }
    document.getElementById("propsTable").innerHTML = "";
    drawing = false;
    clearSelections();
    resetEveryList();
}

function draw_delete() {
    if (drawing && !drawing_focus) {
        clearSelections();
        return;
    }
    if (drawing_focus) {
        createPropertiesTable(selection_obj, false);
        return;
    }
    var id = findObjId(search_features);
    if (found_point) {
        break_point_1:
        for (var i in heatmap_features.features) {
            if (heatmap_features.features[i].properties.id == selected_focus.heat_index) {
                removeHeatFeature(selected_focus);
                for (var j in all_list[id].focus) {
                    if (all_list[id].focus[j].draw_id == selected_focus.draw_id) {
                        all_list[id].focus.splice(j, 1);
                        break break_point_1;
                    }
                }
                break break_point_1;
            }
        }
                
        break_point_2:
        for (var i in heatmap_features.features) {
            for (var j in draw_object_list) {
                if (draw_object_list[j].heat_index == heatmap_features.features[i].properties.id) {
                    draw_object_list.splice(j, 1);
                    break break_point_2;
                }
            }
        }
        var focus_val = "", focus_arr = [];
        for (var i in selected_objs)
            focus_arr.push.apply(focus_arr, selected_objs[i].focus);

        focus_val = focus_arr.length + " (";
        for (var i in focus_arr)
            focus_val += focus_arr[i].polution + ", ";
        focus_val += ")";
        document.getElementById("focus_placeholder").querySelector("input").value = focus_val;
        found_point = false;
        return;
    } else {
        deleteDrawnObject(id);
    }
}

function addSelectionColor() {
    var feature_color;
    var isRoad = false;
    var feature = {
        type: "Feature",
        properties: {},
        geometry: {}
    };
    
    switch (selected_objs[selected_objs.length-1].source) {
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
    geometry.coordinates = selected_objs[selected_objs.length - 1].coords;

    properties.color = feature_color; 
    properties.source = features.sourceLayer;
    if (!isRoad) {
        properties.id = object_selection_count;
        properties.obj_id = selected_objs[selected_objs.length - 1].id;
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

function saveFocus(button) { //add focus must be disabled if multiple objcts are selected
    var props_details_div = document.getElementById("props_details_div");
    tmp_focus_obj.polution = parseInt(props_details_div.querySelector("#polution_placeholder").querySelector("input").value);
    tmp_focus_obj.range = parseInt(props_details_div.querySelector("#range_placeholder").querySelector("input").value);
    //tmp_focus_obj.id = heatmap_features.features.length;
    if (tmp_focus_obj.polution == 0) {
        setPopup("polution value must be greater than 0", document.getElementById("polution_placeholder"));
        return;
    }
    tmp_focus_obj.heat_index = heatmap_features.features.length;
    var focus_val = "", focus_arr = [];
    /*for (var i in selected_objs) {
        selected_objs[i].focus.push(tmp_focus_obj);
        focus_arr.push(tmp_focus_obj);
        all_list[selected_objs[i].id].focus = selected_objs[i].focus;
        addHeatFeature(tmp_focus_obj);
    }*/
    selected_objs[0].focus.push(tmp_focus_obj);
    draw_object_list.push(tmp_focus_obj);
    if (!drawing)
        all_list[selected_objs[0].id].focus = selected_objs[0].focus;
    addHeatFeature(tmp_focus_obj);
    selected_objs[0].altered = true;
    var in_selected_list = false;
    for (var j in altered_list) 
        if (altered_list[j].id == selected_objs[0].id) {
            altered_list[j] = selected_objs[0];
            in_selected_list = true;
            break;
        }
    
    if (!in_selected_list)
        altered_list.push(selected_objs[0]);

    createPropertiesTable(selection_obj, false);
    //document.getElementById("focus_placeholder").querySelector("input").value = focus_val;
    draw.changeMode('simple_select');
    drawing_focus = false;
    //drawing = false;
    button.onclick = function () { savePropsChanges() };
    //button.style.visibility = "hidden";
    button.parentNode.querySelector("#cancel_btn").onclick = function () { cancelPropsChanges() };
    button.parentNode.querySelector("#cancel_btn").textContent = "reset";
    draw_polygon.classList.toggle("disabled");
}

function cancelFocus(button) {
    button.onclick = function () { cancelPropsChanges() };
    button.textContent = "reset";
    button.parentNode.querySelector("#accept_btn").onclick = function () { savePropsChanges() };
    draw.delete(tmp_focus_obj.draw_id);
    draw_trash.click();
    draw_polygon.classList.toggle("disabled");
    createPropertiesTable(selection_obj, false);
}

function findFocus() {
    break_point:
    for (var i in altered_list) 
        for (var j in altered_list[i].focus) 
            if (altered_list[i].focus[j].draw_id == drawn_point_features[0].properties.id) {
                selected_focus = altered_list[i].focus[j];
                break break_point;
            }
}

function checkSelect() {
    //clearSelections();
    var target = ""; var color = "";
    var area_counter = 0, length_counter = 0, area_len_counter = 0, focus_arr = [], length_area, selections_props, isRoad = false;
    
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
        for (var j in selected_objs[i].focus)
            focus_arr.push(selected_objs[i].focus[j]);
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
    selection_obj.focus = focus_arr;

    //document.getElementById("editButton").style.visibility = "visible";
    createPropertiesTable(selection_obj, false);
}

function setProfileStuff() {
    profile_stuff = {};
    profile_stuff.profile_list = profile_list;
    profile_stuff.all_list = all_list;
    profile_stuff.graph_list = graph_list;
    profile_stuff.selected_objs = selected_objs;
}

function updateProfilesInfo() {
    profile_stuff = JSON.parse(localStorage.getItem("profile_stuff"));
    profile_list = profile_stuff.profile_list;

    //handle objects' profiles
    for (var i in all_list) {
        all_list[i].profile = [];
        for (var k in profile_list) {
            for (var l in profile_list[k].objs) {
                if (profile_list[k].objs[l].id == all_list[i].id) {
                    all_list[i].profile.push(profile_list[k].name);
                    //EM CASO DE ERRO RELACIONADO COM OBJETOS VERIFICAR AQUI
                    /*if (!all_list[i].altered) {
                        all_list[i].altered = true;
                        altered_list.push(all_list[i]);
                    }*/
                    break;
                }
            }
        }
    }
    if (selected_objs.length > 0)
        createPropertiesTable(selection_obj, false);

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
    setProfilesInput();
}

function setMenuBar() {
    const template = [
        {
            label: "File",
            submenu: [
                {
                    label: 'New',
                    click: function () { location.reload() }
                },
                {
                    label: 'Save current document',
                    click: function () { saveAllInfo() }
                },
                {
                    label: 'Generate Points to CSV',
                    click: function () { generateRandomPoints(1000) }
                },
                {
                    role: "close"
                }
            ]
        },
        /*{
            label: "Edit",
            submenu: []
        },*/
        {
            label: "View",
            submenu: [
                {
                    label: 'Restart App',
                    role: "reload"
                },
                {
                    role: "toggleDevTools"
                    //label: 'Toggle Developer Tools',
                    //click: function () {  }
                },
                {
                    role: "togglefullscreen"
                    //label: 'Toggle Full Screen',
                    //click: function () {  }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

//resets and clears
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
    //createObjectsTable(objects_list);
    //createRoadsTable(roads_list);
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

    document.getElementById("top_section").querySelector("#props_title").style.visibility = "hidden";
    document.getElementById("features").style.visibility = "hidden";
    document.getElementById("type_placeholder").innerHTML = "";
    document.getElementById("polution_placeholder").innerHTML = "";
    document.getElementById("range_placeholder").innerHTML = "";
    document.getElementById("profile_placeholder").innerHTML = "";
    document.getElementById("focus_placeholder").innerHTML = "";

    var btns = document.getElementById("editor_btns_div").querySelectorAll("button");
    btns[0].style.visibility = "hidden";
    btns[1].style.visibility = "hidden";

    document.getElementById("top_section").querySelector("h4").style.visibility = "visible";
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
function simplifiedStartAll() {
    toggleMapPopup("", false);
    zoom = map.getZoom();
    log.info("====================================================");
    canvas = map.getCanvas();
    canvas_container = map.getCanvasContainer();
    canvas_container.addEventListener('mousedown', function () { mouseDown(event, map, canvas) }, true);

    let tmp_bounds = map.getBounds();
    map_bounds = { ne: tmp_bounds._ne, sw: tmp_bounds._sw };
    enable_save = true;
    draw.deleteAll();

    if (altered_list.length > 0)
        loadDrawnObjects();

    document.getElementById("propsTable").innerHTML = "";
    createObjectsTable();
    setProfileStuff();
    openTab('features_tab');
    setPieGraph(type_stats);
    do_reset = true;
}

function saveAllInfo() {
    var files, dir = "./Saves";
    try {
        if (!fs.existsSync(dir)) 
            fs.mkdirSync(dir);
        files = fs.readdirSync(dir);
    } catch (err) {
        log.info("Could NOT read the folder");
        return;
    }
    var id = files.length;
    var timestamp = new Date();
    var map_center = map.getCenter().toArray();
    var zoom = map.getZoom();
    var avg_polution = getAveragePolution(all_list);

    var infoToHistory = {
        id: id,
        timestamp: timestamp.toLocaleString(),
        map_center: map_center,
        zoom: zoom,
        avg_polution: avg_polution,
        all_list: all_list,
        altered_list: altered_list,
        source_stats: source_stats,
        obj_stats: type_stats,
        road_stats: roads_list
    }
    var infoToJSON = {
        id: id,
        timestamp: timestamp.toJSON(),
        map_center: map_center,
        zoom: zoom,
        avg_polution: avg_polution,
        all_list: all_list,
        altered_list: altered_list,
        draw_object_list: draw_object_list,
        source_stats: source_stats,
        obj_stats: type_stats,
        road_stats: roads_list,
        graphs: graph_list,
        profiles: profile_list
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
    load_info = true; zoom_end = false;
    var info = loadFromJSON(id);
    map.flyTo({
        center: info.map_center,
        zoom: info.zoom,
        speed: 2.3
    });

    all_list = info.all_list;
    altered_list = info.altered_list;
    source_stats = info.source_stats;
    type_stats = info.obj_stats;
    roads_list = info.road_stats;
    draw_object_list = info.draw_object_list;
    graph_list = info.graphs;
    profile_list = info.profiles;
    enable_save = false;
    do_reset = false;
    objects_list = all_list.filter((obj) => {
        return obj.source != "road";
    });
    roads_list = all_list.filter((obj) => {
        return obj.source == "road";
    });
    openTab('features_tab');

    if (zoom_end) return;

    toggleMapButtons(true);
    simplifiedStartAll();
    loadGraphInfo()
    setItemsInfo();
    for (var i in altered_list) {
        addHeatFeature(altered_list[i]);
        if (altered_list[i].focus.length > 0)
            for (var j in altered_list[i].focus)
                addHeatFeature(altered_list[i].focus[j]);
    }
    updateChart();
}

function sendInfo() {
    location.reload();
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
    /*console.log({ heatmap_features: heatmap_features.features });
    console.log({ draw_object_list: draw_object_list });
    console.log({ selected_objs: selected_objs });*/
    console.log({ selection_obj: selection_obj });
}
