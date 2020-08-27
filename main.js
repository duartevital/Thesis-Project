const path = require('path');
const { app, Menu } = require('electron');
//const { app } = require('electron');
const Window = require('./Window');

function main() {
    let mainWindow = new Window({
        file: path.join('renderer', 'index.html')
    })
}

const template = [
    {
        label: "File"
    },
    /*{
        label: "Edit"
    },*/
    {
        label: "View"
    }
];

app.on('ready', () => {
    main();
    const menu = Menu.buildFromTemplate(template);
    //Menu.setApplicationMenu(menu);
});
//app.on('ready', main);
app.on('window-all-ready', function () {
    app.quit()
});
