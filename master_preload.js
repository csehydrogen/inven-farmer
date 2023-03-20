const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('preload', {
  login: () => ipcRenderer.invoke('login'),
  logout: () => ipcRenderer.invoke('logout'),
  run_macro: () => ipcRenderer.invoke('run_macro'),
  test: () => ipcRenderer.invoke('test'),
})

window.addEventListener('DOMContentLoaded', () => {
  const last_scan = document.getElementById('last_scan');
  const last_exp = document.getElementById('last_exp');
  ipcRenderer.on('update_last_scan', (_event, data) => {
    url = data[0]
    line = new Date().toLocaleString('ko-KR') + ' @ ' + url
    last_scan.textContent = line
  })
  ipcRenderer.on('update_last_exp', (_event, data) => {
    pre_exp = data[0]
    exp = data[1]
    adlink = data[2]
    line = new Date().toLocaleString('ko-KR') + ' : ' + pre_exp + ' -> ' + exp + ' @ ' + adlink
    last_exp.textContent = line
  })
  ipcRenderer.on('update_text_content', async (_event, data) => {
    id = data[0]
    str = data[1] + ' @ ' + new Date().toLocaleString('ko-KR')
    document.getElementById(id).textContent = str
  })
})