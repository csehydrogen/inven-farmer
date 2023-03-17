const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('preload', {
  get_exp: get_exp,
  get_adlink: get_adlink,
  find_dom_by_xpath: find_dom_by_xpath,
})

function find_dom_by_xpath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function get_exp() {
  dom_exp = find_dom_by_xpath('//dt[text()="경험치"]/following-sibling::dd');
  if (dom_exp == null) {
    return -1;
  }
  exp = parseInt(dom_exp.innerHTML.replace(/\,/g, ''), 10);
  return exp;
}

function get_adlink() {
  dom_ad = find_dom_by_xpath('//a[contains(@href,"zicf.inven.co.kr")]')
  if (dom_ad == null) {
    return null
  }
  adlink = dom_ad.href
  if (adlink.indexOf('empty') != -1) {
    console.log('Skipping: %s', adlink);
    return null
  }
  toks = adlink.split('/')
  console.log(toks);
  for (var i of [6, 7, 8, 9, 10, 14]) {
    toks[i] = '0';
  }
  console.log(toks);
  adlink = toks.join('/');
  console.log('Case 1: %s', adlink);
  return adlink;
}