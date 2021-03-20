## cloudswitcher-desktop
The desktop application for BICBT cloud switcher service,
which is inspired by [streamlabs-obs](https://github.com/stream-labs/streamlabs-obs).

### Technique stack
1. [Typescript](https://www.typescriptlang.org/)
1. [Electron](https://www.electronjs.org/)
1. [ReactJS](https://reactjs.org/)
1. [Antd](https://ant.design/)

### Project setup
This project is setup powered by **create-react-app** and **electron**, 
mostly follows this [instruction](https://www.codementor.io/@randyfindley/how-to-build-an-electron-app-using-create-react-app-and-electron-builder-ss1k0sfer).

### Local development
1. Install fabricjs build dependencies (Windows Only):
   - Download http://ftp.gnome.org/pub/gnome/binaries/win64/gtk+/2.22/gtk+-bundle_2.22.1-20101229_win64.zip
   - Unzip to `C:\\GTK` directory
1. `npm i`
1. `npm run dev`

### Release new version
1. `npm run release`

### Windows message exchange
There are four BrowserWindows (Main, External, Dialog, Worker) in the application , to keep all windows shared with same data,
we only keep and change state in the Worker BrowserWindow, Other windows will send messages and subscribe events from Worker BrowserWindow.
Look into `windows-message-exchange.puml` for detail.



