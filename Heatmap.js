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
                minzoom: 15,
                maxzoom: 20,
                paint: {
                    // increase weight as diameter breast height increases
                    'heatmap-weight': {
                        property: 'level',
                        type: 'exponential',
                        stops: [
                            [0, 0],
                            //[100, 1],
                            //[150, 1],
                            //[250, 1],
                            //[350, 7],
                            //[300, 1.5],
                            [500, 2]
                        ]
                    },

                    'heatmap-intensity': 1,

                    // assign color values be applied to points depending on their density
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0, 255, 0, 0)',
                        0.167, 'rgb(0, 228, 0)',
                        0.27, 'rgb(255,255,0)',
                        0.38, 'rgb(255, 126, 0)',
                        0.5, 'rgb(255, 0, 0)',
                        0.6, 'rgb(143, 63, 151)',
                        1, 'rgb(126, 0, 35)'
                    ],
                    //'heatmap-radius': ['get', 'range'],
                    'heatmap-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        15, ['get', 'range_1'],
                        17, ['get', 'range_2'],
                        19, ['get', 'range_3'],
                        20, ['get', 'range_base']
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
            type: "",
            coordinates: []
        }
    };
    var properties = feature.properties;
    var geometry = feature.geometry;

    getEdgesFeatureCoordinates(info.coords, 4);

    properties.id = info.id;
    properties.level = info.polution;
    properties.intensity_level = info.polution / 10;
    properties.range_1 = info.range / 10;
    properties.range_2 = info.range / 6;
    properties.range_3 = info.range / 2;
    properties.range_base = info.range;

    //insert heat on polygon's centroid
    /*var tmp_feat = {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Polygon",
            coordinates: info.coords
        }
    };
    geometry.coordinates = center.default(tmp_feat).geometry.coordinates;*/

    geometry.type = info.shape;
    geometry.coordinates = [getEdgesFeatureCoordinates(info.coords, info.range / 32)]; 

    heatmap_features.features.push(feature);
    map.getSource("polution").setData(heatmap_features);

    //Painting "poluted" polygons
    var fill_feature = {
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
    map.getSource("polution_fill").setData(heatmap_fill_features);
}

function getEdgesFeatureCoordinates(coords, space) {
    var line, chunks;
    var new_coords = [];
    for (var i = 0; i < coords[0].length - 1; i++) {
        //line = turf.lineString(coords[0]);
        line = turf.lineString([coords[0][i], coords[0][i+1]]);
        chunks = chunk.default(line, space, { units: 'meters' });
        for (var j = 0; j < chunks.features.length-1; j++) {
            new_coords.push(chunks.features[j].geometry.coordinates[1]);
        }
    }

    return new_coords;
}