const center = require('@turf/center-of-mass');
const along = require('@turf/along');


function dropdownClick() {
    var name = event.target.textContent;
    switch (name) {
        case "Normal":
            if (current_view == "Heatmap") {
                map.setPaintProperty("buildings_layer", "fill-opacity", 1);
                map.setPaintProperty("water_layer", "fill-opacity", 1);
                map.setPaintProperty("landuse_layer", "fill-opacity", 1);

                map.setLayoutProperty("roads_layer", "visibility", "visible");

                map.setLayoutProperty("polution_heat", "visibility", "none");
                map.setLayoutProperty("polution_heat_fill", "visibility", "none");
                current_view = "Normal";
                showDescBox = false;
            }
            break;
        case "Heatmap":
            clearSelections();
            if (current_view == "Normal") {
                map.setPaintProperty("buildings_layer", "fill-opacity", 0);
                map.setPaintProperty("water_layer", "fill-opacity", 0);
                map.setPaintProperty("landuse_layer", "fill-opacity", 0);

                map.setLayoutProperty("roads_layer", "visibility", "none");

                map.setLayoutProperty("polution_heat", "visibility", "visible");
                map.setLayoutProperty("polution_heat_fill", "visibility", "visible");
                current_view = "Heatmap";

                showDescBox = true;
            }
            break;
    }
}

function addHeatFeature(info) {
    //Creation of heatmap points
    var feature = {
        type: "Feature",
        properties: {},
        geometry: {
            type: "MultiPoint",
            //type: "Point",
            coordinates: []
        }
    };
    var properties = feature.properties;
    var geometry = feature.geometry;

    properties.id = info.id;
    properties.level = info.polution;
    //properties.intensity_level = info.polution / 10;
    properties.range_1 = info.range * 0.1;
    properties.range_2 = info.range * 0.4;
    //properties.range_2 = properties.range_3 * 0.85;
    //properties.range_3 = properties.range_base * 0.85;
    properties.range_base = info.range;

    //insert heat on polygon's centroid
    var tmp_feat = {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Polygon",
            coordinates: info.coords
        }
    };
    //geometry.type = "Point";
    var center_coord = center.default(tmp_feat).geometry.coordinates;

    //insert heat over the entirity of the polygon
    //geometry.type = "MultiPoint";
    if (info.shape == "LineString")
        geometry.coordinates = getEdgesFeatureCoordinates(info.coords, 2 * Math.log(info.range));
    else if (info.shape == "MultiLineString")
        geometry.coordinates = getEdgesFeatureCoordinates(getMuliLineStringCoords(info.coords), 2 * Math.log(info.range));
    else if (info.shape == "Polygon") {
        var new_coords = getEdgesFeatureCoordinates(info.coords[0], 4 * Math.log(info.range));
        if (new_coords.length > 3)
            geometry.coordinates = new_coords;
        else {
            geometry.coordinates = center_coord;
            geometry.type = "Point";
        }
    }

    var feature_exists = false;
    for (var i in heatmap_features.features) {
        if (heatmap_features.features[i].properties.id == properties.id) {
            heatmap_features.features[i] = feature;
            feature_exists = true;
            break;
        }
    }
    if (!feature_exists)
        heatmap_features.features.push(feature);
    map.getSource("polution").setData(heatmap_features);

    //Painting "poluted" polygons
    /*var fill_feature = {
        type: "Feature",
        properties: {},
        geometry: {}
    }

    fill_feature.properties.id = info.id;

    if (info.polution <= 50) 
        fill_feature.properties.color = 'rgba(0, 228, 0, 0.9)';
    else if (info.polution <= 100)
        fill_feature.properties.color = 'rgba(255, 255, 0, 0.9)';
    else if (info.polution <= 150)
        fill_feature.properties.color = 'rgba(255, 126, 0, 0.9)';
    else if (info.polution <= 200)
        fill_feature.properties.color = 'rgba(255, 0, 0, 0.9)';
    else if (info.polution <= 300)
        fill_feature.properties.color = 'rgba(143, 63, 151 , 0.9)';
    else if (info.polution <= 500)
        fill_feature.properties.color = 'rgba(126, 0, 35, 0.9)';

    fill_feature.geometry.type = info.shape;
    fill_feature.geometry.coordinates = info.coords;

    heatmap_fill_features.features.push(fill_feature);
    map.getSource("polution_fill").setData(heatmap_fill_features);*/
}

function removeHeatFeature(info) {
    var feats = heatmap_features.features
    for (var i in feats) {
        if (feats[i].properties.id == info.id) {
            feats.splice(i, 1);
            map.getSource("polution").setData(heatmap_features);
            break;
        }
    }
}

function getEdgesFeatureCoordinates(coords, space) {
    var line, length, new_coords = [];
    line = turf.lineString(coords);
    length = line_length.default(line, { units: 'meters' });
    for (var step = space; step < length; step += space) {
        new_coords.push(along.default(line, step, { units: 'meters' }).geometry.coordinates);
    }
    return new_coords;
}
