const { app, BrowserWindow, BrowserView, ipcMain, ipcRenderer } = require('electron')
const path = require('path')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sample(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

const createWindow = () => {
  const master_window = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'master_preload.js'),
    },
  })
  const slave_window = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'slave_preload.js'),
    },
  })
  master_window.loadFile('index.html')
  slave_window.loadURL('https://inven.co.kr')
  if (!app.isPackaged) {
    master_window.openDevTools();
    slave_window.openDevTools();
  }
  ipcMain.handle('login', () => {
    slave_window.loadURL('https://member.inven.co.kr/user/scorpio/mlogin')
  });
  ipcMain.handle('logout', () => {
    slave_window.loadURL('https://member.inven.co.kr/user/scorpio/logout')
  });

  ipcMain.handle('run_macro', async () => {
    inven_list = await master_window.webContents.executeJavaScript("document.getElementById('inven_list').value.trim().split(/\\s+/)");
    console.log(inven_list, typeof(inven_list))

    pre_exp = await slave_window.loadURL('https://www.inven.co.kr/member/skill/').then(
      () => slave_window.webContents.executeJavaScript('preload.get_exp()')
    ).catch(console.log);
    console.log('pre_exp: ' + pre_exp)
    if (pre_exp < 0) {
      return;
    }

    while (true) {
      await sleep(1000);
      inven = sample(inven_list);
      device = sample(['inven', 'minven'])
      url = 'https://zicf.inven.co.kr/RealMedia/ads/adstream_sx.ads/' + device + '/' + inven;
      console.log('Main: %s', url);

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
      ).catch(() => null)

      console.log('exp: ' + exp)
      if (exp < 0) {
        return;
      }

      if (pre_exp < exp) {
        master_window.webContents.send('append_exp_log', [pre_exp, exp])
      }
      pre_exp = exp;
    }
  });
}

app.whenReady().then(createWindow)