const fs = require('fs');

function writeToJSON() {
    var timestamp = new Date().toJSON();
    var map_center = map.getCenter().toArray();
    var zoom = map.getZoom();
    var aqi = 136; //replace by real AQI

    var files;
    try {
        files = fs.readdirSync("./Saves/");
    } catch (err) {
        log.info("Could NOT read the folder");
    }

    const entry = {
        timestamp: timestamp,
        map_center: map_center,
        zoom: zoom,
        aqi: aqi,
        all_list: all_list,
        obj_stats: type_stats,
        road_stats: roads_list //replace by road statistics
    }
    const jsonString = JSON.stringify(entry, null, 2);

    fs.writeFile("./Saves/info_" + (files.length + 1) + ".json", jsonString, err => {
        if (err)
            log.info("Error writing to file", err);
        else
            log.info("Successfully wrote to file");
    });
}

function loadFromJSON(save_id) {
    return JSON.parse(fs.readFileSync("./Saves/info_" + save_id + ".json", "utf8"));
}