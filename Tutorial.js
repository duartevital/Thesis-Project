var slides = [
    {
        id: 0,
        title: "Start",
        message: "Start by zooming in until all Entities polygons are loaded in.",
        path: "./../Media/tutorial_0.mp4"
    },
    {
        id: 1,
        title: "Selections",
        message: "Select a single Entitiy by clicking on it. A table with it's properties will appear at the right of the screen.<br><br>You can also multi-select Entities, either by using <b>ctrl-click</b> or by creating a selection rectangle with <b>shift-drag</b>",
        path: "./../Media/tutorial_1.mp4"
    },
    {
        id: 2,
        title: "Drawing Entities",
        message: "Not all Entities are segmented. If you want to edit a building that is not selectable just draw a polygon to represent it.<br>To do this, click on the drawing button at the right side of the map and then draw the polygon.<br><br>Once it's drawn you will have to chose a Source (first) and a Type (second).",
        path: "./../Media/tutorial_2.mp4"
    },
    {
        id: 3,
        title: "Adding Polution",
        message: "Now add a polution value between 0 and 500, as well as a range value that represents the heat radius to the Entity by filling the <b>Polution Magnitude</b> and <b>Polution Range</b> fields.<br>If the Entity is to big, you may want to specify a polution focus point. To do this, click on the <b>Additional Polution Point</b> button, then click on a point on top of the selected Entity and add Polution to it.<br><br>Once you're done, save the changes by pressing <b>accept changes</b>.<br><br>To actually see the heatmap hover over the layer button on the left side of the map and select <b>Heatmap</b>.",
        path: "./../Media/tutorial_3.mp4" 
    },
    {
        id: 4,
        title: "Graphs",
        message: "You can manipulate the polution values through graphs by interacting with them.<br>Each graph has a number of items.<br><br>In the example above these represent weekdays and the user is able to switch between them via the dropdown menu at the top of the map.",
        path: "./../Media/tutorial_4.mp4"
    },
    {
        id: 5,
        title: "Profiles",
        message: "You might have noticed the 'Polution Profile' on both the Entities' and Graphs' properties.<br>This is because the latter can be associated to profiles, 'Any' being the default one. Clicking the button next to these fields opens Profile Manager where you can create and edit profiles.<br><br>Interacting with graphs will only affect Entities associated with the same profiles",
        path: "./../Media/tutorial_5.mp4"
    },
    {
        id: 6,
        title: "Saving and Loading",
        message: "After you're done, you can save the current state of the app by clicking <b>File -> Save</b>.<br>Doing this will add a new entry to history.<br><br>To load a state, click on an entry.",
        path: "./../Media/tutorial_6.mp4"
    }
];

var image_div, video, slide_title, info_div, option_check, buttons_div;
image_div = document.getElementById("image_div");
video = image_div.querySelector("video");
slide_title = document.getElementById("slide_title");
info_div = document.getElementById("info_div");
option_check = document.getElementById("option_check");
buttons_div = document.getElementById("buttons_div");
if (localStorage.showTutorial == "false")
    option_check.checked = true;
var current_index = 0;

setSlide(0);

function setSlide(index) {
    var source = document.createElement("source");
    source.src = slides[index].path; source.type = "video/mp4";

    video.innerHTML = "";
    video.appendChild(source);   
    video.load();
    slide_title.querySelector("p").innerHTML = slides[index].title;
    info_div.querySelector("p").innerHTML = slides[index].message;
    buttons_div.querySelector("label").textContent = (current_index + 1) + "/" + slides.length;
}

function goToPrevious() {
    if (current_index == 0)
        return;
    current_index--;
    setSlide(current_index);
}

function goToNext() {
    if (current_index == slides.length - 1)
        return;
    current_index++;
    setSlide(current_index);
}

function setShowTutorial(elem) {
    console.log(elem);
    if (elem.checked)
        localStorage.showTutorial = false;
    else
        localStorage.showTutorial = true;
}