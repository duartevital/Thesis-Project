const { BrowserWindow } = require('electron');


const defaultProps = {
    width: 1000,
    height: 600,
    center: true,
    show: false,

    webPreferences: {
        nodeIntegration: true
    }
}

class Window extends BrowserWindow {
    constructor({ file, ...windowSettings }) {
        super({ ...defaultProps, ...windowSettings })
        //this.maximize();
        this.loadFile(file);

        this.once('ready-to-show', () => {
            this.show()
        })
    }
}

module.exports = Window;