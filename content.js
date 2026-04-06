// Pocket Option OTC Algo Trading Bot - Content Script
console.log('🚀 OTC Algo Bot loaded');

let botActive = false;
let priceHistory = [];
let config = { timeframe: 30, confidenceThreshold: 60, tradeAmount: 1, autoExecute: true, telegramBot: '', telegramChat: '' };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startBot') {
    botActive = true;
    config = { ...config, ...request.config };
    console.log('✅ Bot started', config);
    sendResponse({ status: 'started' });
  } else if (request.action === 'stopBot') {
    botActive = false;
    console.log('🛑 Bot stopped');
    sendResponse({ status: 'stopped' });
  } else if (request.action === 'getStatus') {
    sendResponse({ active: botActive, priceHistory: priceHistory.slice(-50) });
  }
});

function getCurrentPrice() {
  const selectors = ['[class*="current-price"]', '[class*="price-"]', '[data-id="price"]', '.chart-price', '.asset-price'];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const price = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && price > 0) return price;
    }
  }
  return null;
}

function calculateRSI(prices, period) {
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function analyzeMarket(prices) {
  if (prices.length < 50) return { signal: 'WAIT', confidence: 0 };
  const rsi = calculateRSI(prices, 14);
  const ema5 = calculateEMA(prices, 5);
  const ema20 = calculateEMA(prices, 20);
  let score = 0;
  if (rsi < 35) score++;
  else if (rsi > 65) score--;
  if (ema5 > ema20) score++;
  else if (ema5 < ema20) score--;
  const confidence = Math.abs(score) / 7 * 100;
  let signal = 'WAIT';
  if (score >= 3) signal = 'BUY';
  else if (score <= -3) signal = 'SELL';
  return { signal, confidence };
}

function executeTrade(signal) {
  const buttons = {
    buy: document.querySelector('[data-dir="call"], .btn-call, [class*="call-btn"]'),
    sell: document.querySelector('[data-dir="put"], .btn-put, [class*="put-btn"]')
  };
  const targetButton = signal === 'BUY' ? buttons.buy : buttons.sell;
  if (targetButton && config.autoExecute) {
    targetButton.click();
    console.log(`✅ Executed ${signal} trade`);
    return true;
  }
  return false;
}

setInterval(() => {
  if (!botActive) return;
  const price = getCurrentPrice();
  if (price) {
    priceHistory.push(price);
    if (priceHistory.length > 100) priceHistory.shift();
    if (priceHistory.length >= 50) {
      const analysis = analyzeMarket(priceHistory);
      if (analysis.signal !== 'WAIT' && analysis.confidence >= config.confidenceThreshold) {
        console.log('📊 Signal:', analysis);
        executeTrade(analysis.signal);
      }
    }
  }
}, config.timeframe * 1000);
