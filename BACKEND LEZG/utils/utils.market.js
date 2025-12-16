  // Multi-source price fetcher with fallbacks
  window.getCurrentPrice = async function(pair) {
    if (!pair) return null;

    // Clean the pair symbol
    const cleanPair = pair.toUpperCase().replace(/[^A-Z]/g, "");

    // Try Binance first (crypto)
    if (cleanPair.match(/BTC|ETH|SOL|XRP|BNB|ADA|DOT|LINK/)) {
      const price = await fetchBinancePrice(cleanPair);
      if (price) return price;
    }

    // Try Yahoo Finance (forex & stocks)
    const price = await fetchYahooPrice(cleanPair);
    if (price) return price;

    // Failed to fetch
    console.warn(`Could not fetch price for ${pair}`);
    return null;
  }

    async function fetchBinancePrice(pair) {
    try {
      const symbol = pair.replace("USD", "USDT");
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
        { timeout: 3000 },
      );

      if (!response.ok) return null;

      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.log("Binance fetch failed:", error.message);
      return null;
    }
  }

    // 1. Ticker Mapping (User Input -> Yahoo Finance Ticker)
  const SYMBOL_MAP = {
    US30: "^DJI", // Dow Jones
    NAS100: "^IXIC", // Nasdaq
    SPX500: "^GSPC", // S&P 500
    GER30: "^GDAXI", // DAX
    UK100: "^FTSE", // FTSE
    XAUUSD: "GC=F", // Gold Futures (More reliable than spot XAUUSD=X)
    XAGUSD: "SI=F", // Silver Futures
    BTCUSD: "BTC-USD",
    ETHUSD: "ETH-USD",
    SOLUSD: "SOL-USD",
    XRPUSD: "XRP-USD",
  };

    // 2. Updated Fetch Function
  async function fetchYahooPrice(pair) {
    try {
      let symbol = pair;

      // A. Check Explicit Map
      if (SYMBOL_MAP[pair]) {
        symbol = SYMBOL_MAP[pair];
      }
      // B. Handle Forex (EURUSD -> EURUSD=X)
      else if (pair.length === 6 && !pair.includes("USD")) {
        // Crosses like GBPJPY -> GBPJPY=X
        symbol = pair + "=X";
      } else if (pair.length === 6 && pair.includes("USD")) {
        // Majors like EURUSD -> EURUSD=X
        symbol = pair + "=X";
      }

      console.log(`FETCHING: ${pair} -> ${symbol}`);

      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(targetUrl);

      const response = await fetch(proxyUrl, { timeout: 5000 });
      if (!response.ok) throw new Error("Network Error");

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0)
        return null;

      const result = data.chart.result[0];
      const quote = result.indicators.quote[0];
      const validCloses = quote.close.filter((c) => c !== null);

      if (validCloses.length === 0) return null;
      return validCloses[validCloses.length - 1]; // Last Price
    } catch (error) {
      console.warn(`Yahoo fetch failed for ${pair}:`, error.message);
      return null;
    }
  }
