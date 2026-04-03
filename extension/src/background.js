'use strict';

const WHATS_NEW_URL = 'https://cocola.github.io/pr-zen/whats-new.html';

chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason === 'update') {
    const version = chrome.runtime.getManifest().version;
    chrome.tabs.create({ url: `${WHATS_NEW_URL}?v=${version}&from=${previousVersion}` });
  }
});
