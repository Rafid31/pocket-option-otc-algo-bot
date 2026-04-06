# 🤖 Pocket Option OTC Algo Trading Bot

**Automated trading signal generator and execution bot for Pocket Option OTC market** 

Real technical analysis using RSI, EMA, MACD, Bollinger Bands, Stochastic, Momentum, and Candle Patterns with auto-clicking for demo trading.

---

## ✨ Features

- **7-Indicator Confluence Analysis** — RSI, EMA crossover, MACD, Bollinger Bands, Stochastic, Momentum (ROC), and Candle Patterns
- **Auto-Execution** — Clicks CALL/PUT buttons automatically based on signal
- **Chrome Extension** — Runs directly on your Pocket Option tab (no external server)
- **Start/Stop Control** — Full manual control via extension popup
- **Telegram Alerts** (optional) — Get signal notifications on Telegram
- **Demo-First Testing** — Built for safe testing on Pocket Option demo accounts
- **15s / 30s / 60s Timeframes** — Choose your trade expiry
- **Confidence Scoring** — Only trades when indicators agree (3+ confluence)

---

## 📦 Installation

### Step 1: Clone or Download This Repo

```bash
git clone https://github.com/Rafid31/pocket-option-otc-algo-bot.git
cd pocket-option-otc-algo-bot
```

Or download as ZIP and extract.

### Step 2: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the folder containing `manifest.json`
5. The extension icon will appear in your toolbar

### Step 3: Open Pocket Option Demo Account

1. Go to [https://pocketoption.com/en/cabinet/demo-quick-high-low/](https://pocketoption.com/en/cabinet/demo-quick-high-low/)
2. Make sure you're logged into your **DEMO** account

---

## 🚀 How to Use

1. **Open Pocket Option demo** in Chrome
2. **Click the extension icon** in the toolbar
3. **Configure settings:**
   - Timeframe: 15s, 30s, or 60s
   - Confidence threshold: 60%+ recommended
   - Trade amount: $1 for demo testing
   - (Optional) Telegram bot token and chat ID
4. **Click START BOT**
5. The bot will analyze price data and auto-click CALL/PUT when a signal triggers
6. **Click STOP BOT** to pause anytime

---

## 🔬 How the Analysis Works

The bot analyzes live price data from Pocket Option and scores 7 indicators:

| Indicator | Bullish Signal | Bearish Signal |
|-----------|----------------|----------------|
| **RSI (14)** | RSI < 35 (oversold) | RSI > 65 (overbought) |
| **EMA 5/20** | Fast EMA above slow | Fast EMA below slow |
| **MACD** | Histogram positive | Histogram negative |
| **Bollinger Bands** | Price near lower band | Price near upper band |
| **Stochastic %K** | Stoch < 25 | Stoch > 75 |
| **Momentum (ROC)** | Positive rate of change | Negative rate of change |
| **Candle Pattern** | 3-bar bullish structure | 3-bar bearish structure |

**Confluence Scoring:**  
- Score ≥ +3 → **BUY (CALL)**  
- Score ≤ −3 → **SELL (PUT)**  
- Confidence % = `|score| / 7 * 100`

The bot only trades when confidence meets your threshold (default 60%).

---

## ⚙️ Configuration Options

- **Timeframe:** 15s / 30s / 60s — must match your Pocket Option trade expiry
- **Confidence Threshold:** 0-100% — higher = fewer but stronger signals
- **Trade Amount:** Dollar amount per trade
- **Telegram Bot Token:** (Optional) Get from [@BotFather](https://t.me/BotFather)
- **Telegram Chat ID:** (Optional) Your Telegram user ID

---

## 📂 File Structure

```
pocket-option-otc-algo-bot/
├── manifest.json          # Chrome Extension config
├── content.js             # Core trading engine (runs on Pocket Option page)
├── background.js          # Service worker for extension state
├── popup.html             # Extension control panel UI
├── popup.js               # Popup logic (Start/Stop buttons)
└── README.md              # This file
```

---

## ⚠️ Important Warnings

- **DEMO ONLY** — Test thoroughly on demo before considering live trading
- **No guarantees** — Technical analysis is not a crystal ball; losses are possible
- **Auto-clicking risk** — Pocket Option may detect/block automated clicking
- **Account safety** — Use at your own risk; not responsible for account bans or losses
- **Not financial advice** — This is an educational tool, not investment advice

---

## 🛠️ Troubleshooting

**Bot not finding price?**  
- The bot uses multiple DOM selectors; Pocket Option's page structure may have changed
- Open browser console (F12) → look for price detection errors

**Buttons not clicking?**  
- Check console for "button not found" errors
- Pocket Option's button selectors may have changed
- Verify you're on the correct OTC trading page

**Extension not loading?**  
- Make sure all files are in the same folder as `manifest.json`
- Check Chrome Extensions page for error messages

---

## 📈 Future Roadmap

- [ ] Live price feed integration (WebSocket)
- [ ] Backtesting mode with historical data
- [ ] Martingale / Anti-Martingale stake management
- [ ] More advanced indicators (Ichimoku, Fibonacci, etc.)
- [ ] Dashboard for signal history and win rate tracking
- [ ] Multi-asset simultaneous trading

---

## 🤝 Contributing

Pull requests welcome! If you improve the indicator logic, fix bugs, or add features, feel free to contribute.

---

## 📜 License

MIT License — Free to use, modify, and distribute.

---

## 🔗 Links

- **Pocket Option:** [https://pocketoption.com](https://pocketoption.com)
- **Telegram Bot Setup:** [https://core.telegram.org/bots](https://core.telegram.org/bots)

---

**⚡ Built for educational purposes. Trade responsibly. Always test on demo first.**
