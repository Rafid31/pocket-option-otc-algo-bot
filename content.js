// Pocket Option OTC Algo Trading Bot - Content Script (ENHANCED v1.3)
console.log('🚀 OTC Algo Bot loaded - v1.3 ENHANCED');

let botActive = false;
let priceHistory = [];
let config = { timeframe: 30, confidenceThreshold: 60, tradeAmount: 1, autoExecute: true, telegramBot: '', telegramChat: '' };
let intervalId = null;
let lastPrice = null;
let priceFailCount = 0;

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startBot') {
    botActive = true;
    config = { ...config, ...request.config };
    console.log('✅ Bot started', config);
    startBotLoop();
    sendResponse({ status: 'started' });
  } else if (request.action === 'stopBot') {
    botActive = false;
    stopBotLoop();
    console.log('🛑 Bot stopped');
    sendResponse({ status: 'stopped' });
  } else if (request.action === 'getStatus') {
    sendResponse({ active: botActive, priceHistory: priceHistory.slice(-50) });
  }
  return true;
});

function startBotLoop() {
  if (intervalId) clearInterval(intervalId);
  
  intervalId = setInterval(() => {
    if (!botActive) return;
    
    const price = getCurrentPrice();
    if (price) {
      priceFailCount = 0;
      priceHistory.push(price);
      if (priceHistory.length > 100) priceHistory.shift();
      
      if (priceHistory.length >= 50) {
        const analysis = analyzeMarket(priceHistory);
        if (analysis.signal !== 'WAIT' && analysis.confidence >= config.confidenceThreshold) {
          console.log('📊 Signal:', analysis);
          executeTrade(analysis.signal);
        }
      }
    } else {
      priceFailCount++;
      if (priceFailCount >= 5) {
        console.error('❌ Failed to get price 5 times. Please check if you are on the OTC trading page.');
      }
    }
  }, config.timeframe * 1000);
}

function stopBotLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function getCurrentPrice() {
  // Strategy 1: Look for price in specific Pocket Option price display elements
  const uiSelectors = [
    '.current-rate',
    '.currentPrice',
    '.price-current',
    '.asset-price',
    '.trades-chart__price',
    '.chart__current-price',
    '[class*="current-price"]',
    '[class*="currentPrice"]',
    '[class*="price-current"]',
    '[class*="asset-price"]',
    '[data-test="current-price"]'
  ];
  
  for (const selector of uiSelectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        // Remove non-numeric characters except dot
        const price = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (!isNaN(price) && price > 0 && price < 1000000) {
          console.log('💰 Price detected:', price, 'via', selector);
          lastPrice = price;
          return price;
        }
      }
    } catch (e) {}
  }
  
  // Strategy 2: Look for price in SVG/Chart elements
  try {
    const textElements = document.querySelectorAll('text, span, div');
    for (const el of textElements) {
      const text = el.textContent.trim();
      // Match pattern like 1.14132
      if (text.match(/^\d+\.\d{4,6}$/)) {
        const price = parseFloat(text);
        if (!isNaN(price) && price > 0 && price < 1000000) {
          console.log('💰 Price detected via pattern match:', price);
          lastPrice = price;
          return price;
        }
      }
    }
  } catch (e) {}
  
  // Strategy 3: Use last known price if failure is recent
  if (lastPrice && priceFailCount < 3) {
    console.warn('⚠️ Using last known price:', lastPrice);
    return lastPrice;
  }
  
  return null;
}

function calculateRSI(prices, period) {
  if (prices.length < period + 1) return 50;
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
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices[prices.length - period];
  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(prices) {
  if (prices.length < 26) return 0;
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
}

function calculateBollingerBands(prices, period = 20) {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
  const sd = Math.sqrt(variance);
  return {
    upper: sma + sd * 2,
    middle: sma,
    lower: sma - sd * 2
  };
}

function calculateStochastic(prices, period = 14) {
  if (prices.length < period) return 50;
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const current = prices[prices.length - 1];
  if (high === low) return 50;
  return ((current - low) / (high - low)) * 100;
}

function calculateMomentum(prices, period = 10) {
  if (prices.length < period + 1) return 0;
  const current = prices[prices.length - 1];
  const past = prices[prices.length - 1 - period];
  return ((current - past) / past) * 100;
}

function analyzeCandlePattern(prices) {
  if (prices.length < 3) return 0;
  const [p1, p2, p3] = prices.slice(-3);
  if (p1 < p2 && p2 < p3) return 1; // Bullish
  if (p1 > p2 && p2 > p3) return -1; // Bearish
  return 0;
}

function analyzeMarket(prices) {
  if (prices.length < 50) return { signal: 'WAIT', confidence: 0, scores: {} };
  
  const scores = { rsi: 0, ema: 0, macd: 0, bollinger: 0, stochastic: 0, momentum: 0, pattern: 0 };
  
  // RSI
  const rsi = calculateRSI(prices, 14);
  if (rsi < 35) scores.rsi = 1;
  else if (rsi > 65) scores.rsi = -1;
  
  // EMA
  const ema5 = calculateEMA(prices, 5);
  const ema20 = calculateEMA(prices, 20);
  if (ema5 > ema20 * 1.001) scores.ema = 1;
  else if (ema5 < ema20 * 0.999) scores.ema = -1;
  
  // MACD
  const macd = calculateMACD(prices);
  if (macd > 0) scores.macd = 1;
  else if (macd < 0) scores.macd = -1;
  
  // Bollinger
  const bb = calculateBollingerBands(prices, 20);
  const lastP = prices[prices.length - 1];
  if (bb.upper !== bb.lower) {
    const pos = (lastP - bb.lower) / (bb.upper - bb.lower);
    if (pos < 0.25) scores.bollinger = 1;
    else if (pos > 0.75) scores.bollinger = -1;
  }
  
  // Stochastic
  const stoch = calculateStochastic(prices, 14);
  if (stoch < 25) scores.stochastic = 1;
  else if (stoch > 75) scores.stochastic = -1;
  
  // Momentum
  const momentum = calculateMomentum(prices, 10);
  if (momentum > 0.5) scores.momentum = 1;
  else if (momentum < -0.5) scores.momentum = -1;
  
  // Pattern
  scores.pattern = analyzeCandlePattern(prices);
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const activeIndicators = Object.values(scores).filter(s => s !== 0).length;
  const confidence = activeIndicators > 0 ? (Math.abs(totalScore) / 7) * 100 : 0;
  
  let signal = 'WAIT';
  if (totalScore >= 3) signal = 'BUY';
  else if (totalScore <= -3) signal = 'SELL';
  
  return { signal, confidence, totalScore, scores };
}

function executeTrade(signal) {
  const buttonSelectors = {
    call: ['button[class*="call"]', 'button[class*="up"]', '.btn-call', '[data-direction="call"]', 'a:has-text("BUY")', 'button:has-text("BUY")'],
    put: ['button[class*="put"]', 'button[class*="down"]', '.btn-put', '[data-direction="put"]', 'a:has-text("SELL")', 'button:has-text("SELL")']
  };
  
  const selectors = signal === 'BUY' ? buttonSelectors.call : buttonSelectors.put;
  let targetButton = null;
  
  // Text search
  try {
    const allBtns = document.querySelectorAll('button, a');
    for (const btn of allBtns) {
      const text = btn.textContent.trim().toUpperCase();
      if ((signal === 'BUY' && text === 'BUY') || (signal === 'SELL' && text === 'SELL')) {
        targetButton = btn;
        break;
      }
    }
  } catch (e) {}
  
  // Selector search
  if (!targetButton) {
    for (const s of selectors) {
      try {
        targetButton = document.querySelector(s);
        if (targetButton) break;
      } catch (e) {}
    }
  }
  
  if (targetButton && config.autoExecute) {
    targetButton.click();
    console.log(`✅ Executed ${signal} trade`);
    return true;
  }
  console.error(`❌ ${signal} button not found`);
  return false;
}
