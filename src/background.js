'use strict'

import { app, protocol, BrowserWindow, Tray, Menu, screen } from 'electron'

// 剪贴板功能
import { clip } from './main/clip'

// 添加新窗口功能
import addWindow from './main/add'
import {
  createProtocol
  /* installVueDevtools */
} from 'vue-cli-plugin-electron-builder/lib'

const path = require('path')
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null

let tray = null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // 获取主窗口尺寸
  const size = screen.getPrimaryDisplay().size

  // Create the browser window.
  win = new BrowserWindow({
    width: size.width,
    // width: 1875,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    },
    // 窗口是否总是显示在其他窗口之前
    alwaysOnTop: true,
    // 是否可全屏
    fullscreen: false,
    // 全屏化按钮是否可用
    fullscreenable: false,
    // 标题
    title: 'Skywalker',
    // 窗口标题栏样式
    titleBarStyle: 'hidden',
    // 是否可以改变窗口size
    resizable: false
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'clip')
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./clip.html')
  }

  win.on('closed', () => {
    win = null
  })

  // 执行 clip
  clip(win, app)
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }
  createWindow()

  // 系统托盘
  tray = new Tray(path.resolve(__dirname, './icon_48x48@3x.png'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示面板',
      click: () => {
        win.show()
        win.focus()
      }
    },
    {
      label: '添加面板',
      click: () => {
        const addWin = addWindow()
        addWin.show()
        addWin.focus()
      }
    },
    {
      label: '退出 Skywalker',
      click: () => app.exit()
    }
  ])
  tray.setContextMenu(contextMenu)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
