// Pocket Option OTC Algo Trading Bot - Content Script (FIXED)
console.log('🚀 OTC Algo Bot loaded - v1.1 FIXED');

let botActive = false;
let priceHistory = [];
let config = { timeframe: 30, confidenceThreshold: 60, tradeAmount: 1, autoExecute: true, telegramBot: '', telegramChat: '' };
let intervalId = null;

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
}

function stopBotLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function getCurrentPrice() {
  // Enhanced Pocket Option price selectors
  const selectors = [
    '.current-rate',
    '[class*="current-price"]',
    '[class*="currentPrice"]', 
    '[class*="price-current"]',
    '[class*="asset-price"]',
    '[data-test="current-price"]',
    '.trades-chart__price',
    '.chart__current-price'
  ];
  
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const price = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && price > 0) {
        console.log('💰 Price detected:', price, 'via', selector);
        return price;
      }
    }
  }
  
  console.warn('⚠️ Price not found - check if you are on OTC trading page');
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
  if (p1 < p2 && p2 < p3) return 1;  // Bullish
  if (p1 > p2 && p2 > p3) return -1; // Bearish
  return 0;
}

function analyzeMarket(prices) {
  if (prices.length < 50) return { signal: 'WAIT', confidence: 0, scores: {} };
  
  const scores = {
    rsi: 0,
    ema: 0,
    macd: 0,
    bollinger: 0,
    stochastic: 0,
    momentum: 0,
    pattern: 0
  };
  
  // RSI (14)
  const rsi = calculateRSI(prices, 14);
  if (rsi < 35) scores.rsi = 1;
  else if (rsi > 65) scores.rsi = -1;
  
  // EMA Crossover (5/20)
  const ema5 = calculateEMA(prices, 5);
  const ema20 = calculateEMA(prices, 20);
  if (ema5 > ema20 * 1.001) scores.ema = 1;
  else if (ema5 < ema20 * 0.999) scores.ema = -1;
  
  // MACD
  const macd = calculateMACD(prices);
  if (macd > 0) scores.macd = 1;
  else if (macd < 0) scores.macd = -1;
  
  // Bollinger Bands
  const bb = calculateBollingerBands(prices, 20);
  const lastPrice = prices[prices.length - 1];
  if (bb.upper !== bb.lower) {
    const bbPosition = (lastPrice - bb.lower) / (bb.upper - bb.lower);
    if (bbPosition < 0.25) scores.bollinger = 1;
    else if (bbPosition > 0.75) scores.bollinger = -1;
  }
  
  // Stochastic
  const stoch = calculateStochastic(prices, 14);
  if (stoch < 25) scores.stochastic = 1;
  else if (stoch > 75) scores.stochastic = -1;
  
  // Momentum
  const momentum = calculateMomentum(prices, 10);
  if (momentum > 0.5) scores.momentum = 1;
  else if (momentum < -0.5) scores.momentum = -1;
  
  // Candle Pattern
  scores.pattern = analyzeCandlePattern(prices);
  
  // Calculate total score and confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const activeIndicators = Object.values(scores).filter(s => s !== 0).length;
  const confidence = activeIndicators > 0 ? (Math.abs(totalScore) / 7) * 100 : 0;
  
  let signal = 'WAIT';
  if (totalScore >= 3) signal = 'BUY';
  else if (totalScore <= -3) signal = 'SELL';
  
  console.log('📈 Analysis:', { signal, confidence: confidence.toFixed(1) + '%', totalScore, scores });
  
  return { signal, confidence, totalScore, scores };
}

function executeTrade(signal) {
  // Enhanced button selectors for Pocket Option
  const buttonSelectors = {
    call: [
      'button[data-direction="call"]',
      'button[class*="call"]',
      'button[class*="up"]',
      '.btn-call',
      '[data-dir="call"]',
      'button:has-text("Higher")',
      'button:has-text("Up")'
    ],
    put: [
      'button[data-direction="put"]',
      'button[class*="put"]',
      'button[class*="down"]',
      '.btn-put',
      '[data-dir="put"]',
      'button:has-text("Lower")',
      'button:has-text("Down")'
    ]
  };
  
  const selectors = signal === 'BUY' ? buttonSelectors.call : buttonSelectors.put;
  let targetButton = null;
  
  for (const selector of selectors) {
    targetButton = document.querySelector(selector);
    if (targetButton) {
      console.log('🎯 Button found via:', selector);
      break;
    }
  }
  
  if (targetButton && config.autoExecute) {
    targetButton.click();
    console.log(`✅ Executed ${signal} trade`);
    return true;
  } else {
    console.error(`❌ ${signal} button not found - selectors may need update`);
    return false;
  }
}
