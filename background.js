// Background service worker for Chrome Extension
console.log('🔌 Background service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // Automatically open the trading page when extension is installed/updated
  chrome.tabs.create({ url: 'https://pocketoption.com/en/cabinet/demo-quick-high-low/' });
});

// Store bot state
let botState = {
  active: false,
  config: {}
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBotState') {
    sendResponse(botState);
  } else if (request.action === 'setBotState') {
    botState = request.state;
    sendResponse({ success: true });
  }
  return true;
});
