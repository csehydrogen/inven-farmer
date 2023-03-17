const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('preload', {
  login: () => ipcRenderer.invoke('login'),
  logout: () => ipcRenderer.invoke('logout'),
  run_macro: () => ipcRenderer.invoke('run_macro'),
})

window.addEventListener('DOMContentLoaded', () => {
  const exp_log = document.getElementById('exp_log')
  ipcRenderer.on('append_exp_log', (_event, data) => {
    pre_exp = data[0]
    exp = data[1]
    line = new Date().toLocaleString('ko-KR') + ' ' + pre_exp + ' -> ' + exp + '\n'
    exp_log.value += line
  })
})