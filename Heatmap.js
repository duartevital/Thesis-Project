const center = require('@turf/center-of-mass');
const chunk = require('@turf/line-chunk');

var heatmap_features = {
    type: "FeatureCollection",
    features: []
}
var heatmap_fill_features = {
    type: "FeatureCollection",
    features: []
};

map.addSource('polution', {
    type: 'geojson',
    data: heatmap_features
    //data: JSON.parse(fs.readFileSync("./Data/polution.geojson", "utf8"))
});
map.addSource('polution_fill', {
    type: 'geojson',
    data: heatmap_fill_features
});

map.on('load', () => {
    const waiting = () => {
        if (!map.isStyleLoaded()) {
            setTimeout(waiting, 200);
        } else {
            map.addLayer({
                id: 'polution_heat',
                type: 'heatmap',
                source: 'polution',
                minzoom: 12,
                maxzoom: 24,
                paint: {
                    
                    'heatmap-weight': [
                        'interpolate', ['exponential', 1], ['get', 'level'],
                        0, 0,
                        500, 1
                    ],

                    //'heatmap-intensity': 1,
                    'heatmap-intensity': [
                        'interpolate', ['exponential', 1], ['zoom'],
                        12, 0.2,
                        13, 0.4,
                        14, 0.95,
                        14.5, 0.95,
                        15, 0.98,
                        15.5, 1,
                        16, 1.25,
                        17, 1.95,
                        19, 2.95
                    ],

                    // assign color values be applied to points depending on their density
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0, 255, 0, 0)',
                        0.1, 'rgb(0, 228, 0)', //green
                        0.15, 'rgb(0, 228, 0)', //green
                        0.2, 'rgb(255,255,0)', //yellow
                        0.4, 'rgb(255,255,0)', //yellow
                        0.5, 'rgb(255, 126, 0)', //orange
                        0.6, 'rgb(255, 126, 0)', //orange
                        0.7, 'rgb(255, 0, 0)', //red
                        0.8, 'rgb(255, 0, 0)', //red
                        0.9, 'rgb(143, 63, 151)', //purple
                        1.1, 'rgb(126, 0, 35)' //maroon
                    ],
                    /*'heatmap-radius': [
                        'interpolate', ['exponential', 1], ['zoom'],
                        14, 25,
                        20, 250
                    ],*/
                    'heatmap-radius': [
                        'interpolate', ['exponential', 2], ['zoom'],
                        14, ['get', 'range_1'],
                        18, ['get', 'range_base']
                    ],
                    'heatmap-opacity': 0.9
                }
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
        }
    };
    waiting();
});

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
            }
            break;
        case "Heatmap":
            removeAllSelections();
            if (current_view == "Normal") {
                map.setPaintProperty("buildings_layer", "fill-opacity", 0);
                map.setPaintProperty("water_layer", "fill-opacity", 0);
                map.setPaintProperty("landuse_layer", "fill-opacity", 0);

                map.setLayoutProperty("roads_layer", "visibility", "none");

                map.setLayoutProperty("polution_heat", "visibility", "visible");
                map.setLayoutProperty("polution_heat_fill", "visibility", "visible");
                current_view = "Heatmap";
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
            //type: "MultiPoint",
            type: "Point",
            coordinates: []
        }
    };
    var properties = feature.properties;
    var geometry = feature.geometry;

    properties.id = info.id;
    properties.level = info.polution;
    //properties.intensity_level = info.polution / 10;
    properties.range_1 = info.range * 0.1;
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
    geometry.type = "MultiPoint";
    if (info.shape == "LineString")
        geometry.coordinates = getEdgesFeatureCoordinates(info.coords, 2 * Math.log(info.range));
    else if (info.shape == "MultiLineString")
        geometry.coordinates = getEdgesFeatureCoordinates(getMuliLineStringCoords(info.coords), 2 * Math.log(info.range));
    else if (info.shape == "Polygon") {
        var new_coords = getEdgesFeatureCoordinates(info.coords[0], 5 * Math.log(info.range));
        if (new_coords.length > 3)
            geometry.coordinates = new_coords;
        else {
            geometry.coordinates = center_coord;
            geometry.type = "Point";
        }
    }

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

function getEdgesFeatureCoordinates(coords, space) {
    var line, chunks;
    var new_coords = [];
    //for (var i = 0; i < coords[0].length - 1; i++) {
    line = turf.lineString(coords);
    //var tmp = line_length.default(line);
    //log.info("space before = " + space);
        //line = turf.lineString([coords[0][i], coords[0][i+1]]);
    //space *= (tmp / 0.04);
    chunks = chunk.default(line, space, { units: 'meters' });
    log.info("# chunks = " + chunks.features.length);
        for (var j = 0; j < chunks.features.length; j++) {
            new_coords.push(chunks.features[j].geometry.coordinates[1]);
        }
    //}

    return new_coords;
}