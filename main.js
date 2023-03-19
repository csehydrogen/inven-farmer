const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

console.log(process.argv)

if (handleSquirrelEvent()) {
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }
  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      setTimeout(app.quit, 1000);
      return true;
    case '--squirrel-uninstall':
      setTimeout(app.quit, 1000);
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sample(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function createSlaveWindow() {
  return new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'slave_preload.js'),
    },
  })
}

const createWindow = () => {
  const master_window = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'master_preload.js'),
    },
  })
  slave_window = createSlaveWindow()
  master_window.loadFile('index.html')
  slave_window.loadURL('https://inven.co.kr')
  if (!app.isPackaged) {
    master_window.openDevTools();
    slave_window.openDevTools();
  }
  ipcMain.handle('login', () => {
    if (slave_window.isDestroyed()) {
      slave_window = createSlaveWindow()
    }
    slave_window.loadURL('https://member.inven.co.kr/user/scorpio/mlogin')
  });
  ipcMain.handle('logout', () => {
    if (slave_window.isDestroyed()) {
      slave_window = createSlaveWindow()
    }
    slave_window.loadURL('https://member.inven.co.kr/user/scorpio/logout')
  });

  ipcMain.handle('run_macro', async () => {
    if (slave_window.isDestroyed()) {
      slave_window = createSlaveWindow()
    }
    inven_list = await master_window.webContents.executeJavaScript("document.getElementById('inven_list').value.trim().split(/\\s+/)");

    pre_exp = await slave_window.loadURL('https://www.inven.co.kr/member/skill/').then(
      () => slave_window.webContents.executeJavaScript('preload.get_exp()')
    ).catch(() => -1);
    console.log('pre_exp: ' + pre_exp)
    if (pre_exp < 0) {
      return;
    }

    while (true) {
      await sleep(2000);
      inven = sample(inven_list);
      device = sample(['inven', 'minven'])
      url = 'https://zicf.inven.co.kr/RealMedia/ads/adstream_sx.ads/' + device + '/' + inven;
      master_window.webContents.send('update_last_scan', [url])

      adlink = await slave_window.loadURL(url).then(() => 
        slave_window.webContents.executeJavaScript('preload.get_adlink()')
      ).catch(() => null)

      if (adlink == null) {
        continue;
      }

      exp = await slave_window.loadURL(adlink).then(() => 
        slave_window.loadURL('https://www.inven.co.kr/member/skill/')
      ).then(() =>
        slave_window.webContents.executeJavaScript('preload.get_exp()')
      ).catch(() => -1)

      if (exp < 0) {
        continue;
      }

      if (pre_exp < exp) {
        master_window.webContents.send('update_last_exp', [pre_exp, exp, adlink])
      }
      pre_exp = exp;
    }
  });
}

app.whenReady().then(createWindow)