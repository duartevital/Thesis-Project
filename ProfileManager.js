const remote = require('electron').remote;
const { dialog } = require('electron').remote;
const path = require('path');

var profile_stuff = JSON.parse(localStorage.getItem('profile_stuff'));
var profile_list = profile_stuff.profile_list;

var content_div = document.getElementById("content_div");
var profile_template = document.getElementById("profile_template");
var profile_div = profile_template.content.querySelector(".profile_div");

importAllProfileInfo();

var selected_profile, btn_pressed = false;

function importAllProfileInfo() {
    var objs_string = "", graphs_string = "";
    var parent_node = document.importNode(profile_div, true);
    parent_node.id = profile_list[0].name + "_div";
    parent_node.querySelector("#profile_name").value = profile_list[0].name;
    parent_node.querySelector("#delete_btn").disabled = true;
    parent_node.querySelector("#delete_btn").style.cursor = "not-allowed";
    for (var j in profile_list[0].objs)
        objs_string += profile_list[0].objs[j].type + ", ";
    for (var j in profile_list[0].graphs)
        graphs_string += profile_list[0].graphs[j].name + ", ";

    parent_node.querySelector("#objs_input").value = objs_string;
    parent_node.querySelector("#graphs_input").value = graphs_string;

    content_div.appendChild(parent_node);

    for (var i = 1; i < profile_list.length; i++) {
        objs_string = ""; graphs_string = "";
        parent_node = document.importNode(profile_div, true);
        parent_node.id = profile_list[i].name + "_div";
        parent_node.querySelector("#profile_name").value = profile_list[i].name;
        for (var j in profile_list[i].objs)
            objs_string += profile_list[i].objs[j].type + ", ";
        for (var j in profile_list[i].graphs)
            graphs_string += profile_list[i].graphs[j].name + ", ";

        parent_node.querySelector("#objs_input").value = objs_string;
        parent_node.querySelector("#graphs_input").value = graphs_string;

        content_div.appendChild(parent_node);
    }
}

function setSelectedProfile(elem) {
    var name = elem.querySelector("#profile_name").value;
    if (!selected_profile || name != selected_profile.name) {
        if (!name) {
            selected_profile = undefined;
            return;
        }
        for (var i in profile_list)
            if (profile_list[i].name == name) {
                selected_profile = profile_list[i];
                break;
            }
    }
}

var before_value = "";
function save_before_value(elem) {
    before_value = elem.value;
}
function save_profile_input(elem) {
    if (elem.value == before_value)
        return;

    var parent_node = elem.parentNode;
    for (var i in profile_list) {
        if (profile_list[i].name == elem.value) {
            console.log("inside if");
            dialog.showMessageBox(null, { type: "error", message: "This name already exists" });
            elem.focus();
            return;
        }
        if (profile_list[i].name == before_value) {
            profile_list[i].name = elem.value;
            selected_profile.name = elem.value;
            parent_node.id = elem.value + "_div";
            btn_pressed = false;
        }
    }
    if (before_value == "") {
        selected_profile = { name: elem.value };
        profile_list.push(selected_profile);
        parent_node.id = elem.value + "_div";
        btn_pressed = false;
        return;
    }
}

function openObjSelector() {
    if (!selected_profile) {
        console.log("please name this profile");
        return;
    }

    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        parent: remote.getCurrentWindow(),
        modal: true,
        minimizable: false,
        maximizable: false,
        width: 500,
        height: 400,
        resizable: false,

        webPreferences: {
            nodeIntegration: true
        }
    }); 
    var selector_stuff = { type: "object", selected_profile: selected_profile };
    localStorage.setItem("selector_stuff", JSON.stringify(selector_stuff));
    win.loadFile(path.join('renderer', 'selector.html'));

    win.once('close', () => {
        var cancel = JSON.parse(localStorage.getItem("cancel_check"));
        if (typeof cancel != "undefined" && cancel.cancel) {
            return;
        }
        var tmp_selector_stuff = JSON.parse(localStorage.getItem("selector_stuff"));
        selected_profile.objs = tmp_selector_stuff.selected_profile.objs;
        for (var i in profile_list)
            if (profile_list[i].name == selected_profile.name) {
                profile_list[i].objs = selected_profile.objs;
                break;
            }

        var div = document.getElementById(selected_profile.name + "_div");
        var input = div.querySelector("#objs_input");
        input.value = "";
        for (var i in selected_profile.objs)
            input.value += selected_profile.objs[i].type + ", ";
    });
}

function openGraphSelector() {
    if (!selected_profile) {
        console.log("please name this profile");
        return;
    }

    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        parent: remote.getCurrentWindow(),
        modal: true,
        minimizable: false,
        maximizable: false,
        width: 500,
        height: 400,
        resizable: false,

        webPreferences: {
            nodeIntegration: true
        }
    });
    var selector_stuff = { type: "graph", selected_profile: selected_profile };
    localStorage.setItem("selector_stuff", JSON.stringify(selector_stuff));
    win.loadFile(path.join('renderer', 'selector.html'));

    win.once('close', () => {
        var tmp_selector_stuff = JSON.parse(localStorage.getItem("selector_stuff"));
        selected_profile.graphs = tmp_selector_stuff.selected_profile.graphs;
        for (var i in profile_list)
            if (profile_list[i].name == selected_profile.name) {
                profile_list[i].graphs = selected_profile.graphs;
                break;
            }

        var div = document.getElementById(selected_profile.name + "_div");
        var input = div.querySelector("#graphs_input");
        input.value = "";
        for (var i in selected_profile.graphs)
            input.value += selected_profile.graphs[i].name + ", ";
    });
}

function addProfile() {
    if (btn_pressed)
        return;

    var parent_node = document.importNode(profile_div, true);
    content_div.appendChild(parent_node);
    parent_node.querySelector("#profile_name").focus();

    btn_pressed = true;
}

function deleteProfile(elem) {
    var parent_elem = elem.parentNode;
    parent_elem.remove();

    var input_elem = elem.parentNode.querySelector("#profile_name");
    if (!input_elem.value)
        return;

    for (var i in profile_list) {
        if (profile_list[i].name == input_elem.value) {
            profile_list.splice(i, 1);
            selected_profile = undefined;
            break;
        }
    }

}

function save() {
    localStorage.setItem('cancel_check', JSON.stringify({ cancel: false }));
    localStorage.setItem('profile_stuff', JSON.stringify(profile_stuff));
    window.close();
}

function cancel() {
    localStorage.setItem('cancel_check', JSON.stringify({ cancel: true }));
    window.close();
}


function addHint(btn) {
    var parent_node = btn.parentNode;
    var hint = parent_node.querySelector(".hint")
    if (hint.style.display == "block")
        hint.style.display = "none"
    else
        hint.style.display = "block"
        
}