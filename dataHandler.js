//JSON functions
function writeToJSON(info) {
    const jsonString = JSON.stringify(info, null, 2);

    fs.writeFile("./Saves/info_" + (info.id) + ".json", jsonString, err => {
        if (err)
            log.info("Error writing to file", err);
        else
            log.info("Successfully wrote to file");
    });
}

function loadFromJSON(save_id) {
    return JSON.parse(fs.readFileSync("./Saves/info_" + save_id + ".json", "utf8"));
}

function loadFromGeoJson(path) {

}

function saveToGeoJson(info, path) {

}

//CSV functions
