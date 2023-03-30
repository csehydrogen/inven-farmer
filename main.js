const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const INTERVAL = 2000;

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

function ascii_to_hexa(str) {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join('');
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

async function login() {
  username = await master_window.webContents.executeJavaScript("document.getElementById('username').value");
  pass = await master_window.webContents.executeJavaScript("document.getElementById('pass').value");

  // kp: keep logged in
  await slave_window.loadURL("https://member.inven.co.kr/m/login/dispatch", {
    postData: [{
      type: 'rawData',
      bytes: Buffer.from("user_id="+username+"&password="+ascii_to_hexa(pass)+"&kp=1")
    }],
    extraHeaders: 'Content-Type: application/x-www-form-urlencoded',
  }).catch(() => null);
}

const createWindow = () => {
  master_window = new BrowserWindow({
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
  ipcMain.handle('login', async () => {
    if (slave_window.isDestroyed()) {
      slave_window = createSlaveWindow()
    }
    await login()
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
    brand_list = await master_window.webContents.executeJavaScript("document.getElementById('brand_list').value.trim().split(/\\s+/)"); 

    await sleep(INTERVAL);
    pre_exp = await slave_window.loadURL('https://www.inven.co.kr/member/skill/').then(
      () => slave_window.webContents.executeJavaScript('preload.get_exp()')
    ).catch(() => -1);
    console.log('pre_exp: ' + pre_exp)
    if (pre_exp < 0) {
      return;
    }

    for (iter=0; ; iter++) {
      if (iter % 1000 == 0) {
        // imarble
        for (i=0; i<6; i++) {
          await sleep(INTERVAL);
          await slave_window.loadURL("https://imart.inven.co.kr/imarble/index.php", {
            postData: [{
              type: 'rawData',
              bytes: Buffer.from('mode=playGame')
            }],
            extraHeaders: 'Content-Type: application/x-www-form-urlencoded'
          }).catch(() => null)
          master_window.webContents.send('update_text_content', ['imarble', 'done'])
        }

        // attendence
        var d = new Date();
        var yyyymm = [
          d.getFullYear(),
          ('0' + (d.getMonth() + 1)).slice(-2),
        ].join('');
        await sleep(INTERVAL);
        await slave_window.loadURL("https://imart.inven.co.kr/attendance/attend_apply.ajax.php", {
          postData: [{
            type: 'rawData',
            bytes: Buffer.from('attendCode='+yyyymm)
          }],
          extraHeaders: 'Content-Type: application/x-www-form-urlencoded',
          httpReferrer: 'https://imart.inven.co.kr/attendance/',
        }).catch(() => null);
        master_window.webContents.send('update_text_content', ['attendance', 'done'])

        // fire income
        // fire income only works right after re-initiating login,
        // even if user is login-ed and other functions are working
        await login()
        // then get fire income
        await sleep(INTERVAL);
        await slave_window.loadURL("https://member.inven.co.kr/user/scorpio/chk/skill/point", {
          postData: [{
            type: 'rawData',
            bytes: Buffer.from("surl=https%3A%2F%2Fwww.inven.co.kr%2F")
          }],
          extraHeaders: 'Content-Type: application/x-www-form-urlencoded',
        }).catch(() => null);
        master_window.webContents.send('update_text_content', ['fire_income', 'done'])

        // brand
        for (var brand of brand_list) {
          let brand_url = "https://" + brand + ".inven.co.kr/";
          await sleep(INTERVAL);
          await slave_window.loadURL(brand_url).catch(() => null);
          sitecode = await slave_window.webContents.executeJavaScript("Brand.Subscribe.Core.sitecode()").catch(() => 0); 
          await sleep(INTERVAL);
          await slave_window.webContents.executeJavaScript('preload.brand_subscribe('+sitecode+')').catch(() => null)
          for (let i = 0; i < 3; i++) {
            await sleep(INTERVAL);
            await slave_window.webContents.executeJavaScript('preload.brand_like('+sitecode+')').catch(() => null)
          }
        }
      }

      inven = sample(inven_list);
      device = sample(['inven', 'minven'])
      url = 'https://zicf.inven.co.kr/RealMedia/ads/adstream_sx.ads/' + device + '/' + inven;
      master_window.webContents.send('update_last_scan', [url])

      await sleep(INTERVAL);
      adlink = await slave_window.loadURL(url).then(() => 
        slave_window.webContents.executeJavaScript('preload.get_adlink()')
      ).catch(() => null)

      if (adlink == null) {
        continue;
      }

      await sleep(INTERVAL);
      exp = await slave_window.loadURL(adlink).then(async () => {
        await sleep(INTERVAL);
        slave_window.loadURL('https://www.inven.co.kr/member/skill/')
      }).then(() =>
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

  ipcMain.handle('test', async () => {
    return;
  });
}

app.whenReady().then(createWindow)