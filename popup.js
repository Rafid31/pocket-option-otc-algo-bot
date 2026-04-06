// Popup.js - Extension control panel logic
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');

startBtn.addEventListener('click', async () => {
  const config = {
    timeframe: parseInt(document.getElementById('timeframe').value),
    confidenceThreshold: parseInt(document.getElementById('confidence').value),
    tradeAmount: parseInt(document.getElementById('amount').value),
    autoExecute: true,
    telegramBot: document.getElementById('telegram-bot').value,
    telegramChat: document.getElementById('telegram-chat').value
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'startBot', config }, (response) => {
    if (response && response.status === 'started') {
      status.textContent = '🟢 Bot Active';
      status.className = 'status active';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    }
  });
});

stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stopBot' }, (response) => {
    if (response && response.status === 'stopped') {
      status.textContent = '⚪ Bot Inactive';
      status.className = 'status inactive';
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });
});

// Check bot status on popup open
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response) => {
    if (response && response.active) {
      status.textContent = '🟢 Bot Active';
      status.className = 'status active';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    }
  });
})();
