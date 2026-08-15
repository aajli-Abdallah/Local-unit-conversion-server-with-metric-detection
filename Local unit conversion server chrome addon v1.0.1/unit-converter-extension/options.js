// options.js
const DEFAULT_SERVER_URL = 'http://localhost:3000';
const urlInput = document.getElementById('url');
const status = document.getElementById('status');

chrome.storage.sync.get(['serverUrl'], (result) => {
  urlInput.value = result.serverUrl || DEFAULT_SERVER_URL;
});

document.getElementById('save').addEventListener('click', () => {
  let value = urlInput.value.trim() || DEFAULT_SERVER_URL;
  value = value.replace(/\/+$/, '');
  chrome.storage.sync.set({ serverUrl: value }, () => {
    status.textContent = 'Saved.';
    setTimeout(() => (status.textContent = ''), 1800);
  });
});
