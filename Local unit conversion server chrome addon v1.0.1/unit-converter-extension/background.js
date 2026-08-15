// background.js — MV3 service worker

const DEFAULT_SERVER_URL = 'http://localhost:3000';
const MENU_ID = 'convert-selected-unit';

function getServerUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['serverUrl'], (result) => {
      resolve((result.serverUrl || DEFAULT_SERVER_URL).replace(/\/+$/, ''));
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Convert "%s"',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const text = info.selectionText.trim();
  const serverUrl = await getServerUrl();
  const url = `${serverUrl}/?text=${encodeURIComponent(text)}`;

  chrome.tabs.create({ url, index: tab ? tab.index + 1 : undefined });
});
