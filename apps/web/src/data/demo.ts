export type Asset = {
  symbol: string;
  name: string;
  price: number;
  weight: number;
  color: string;
  change: number;
  slug: string;
};
const rows: [string, string, number, number, string, number][] = [
  ["BTC", "Bitcoin", 6333.75, 27, "#ff5d82", 2.02],
  ["XRP", "Ripple", 0.505186, 14.2, "#6bc9ae", 8.89],
  ["ETH", "Ethereum", 208.1, 5.4, "#8985c6", -0.97],
  ["BCH", "Bitcoin Cash", 553.56, 4.5, "#d49ad4", -0.85],
  ["EOS", "EOS", 5.47, 3.8, "#67bf53", -0.59],
  ["IOTA", "Iota", 0.48, 2.9, "#31bca9", 1.12],
  ["ETC", "Ethereum Classic", 9.72, 2.7, "#36b7d1", -0.73],
  ["QTUM", "Qtum", 3.88, 2.4, "#f7bf31", 1.37],
  ["ZIL", "Zilliqa", 0.035, 2.3, "#982bc7", -1.03],
  ["LTC", "Litecoin", 53.13, 2.1, "#47b9e4", -2.17],
  ["NEO", "NEO", 16.18, 4, "#b5d56a", -1.87],
  ["XMR", "Monero", 106.21, 4, "#fa506b", -0.43],
  ["ADA", "Cardano", 0.076, 4, "#558cf1", -1.15],
  ["DASH", "Dash", 153.44, 4, "#cf955e", 1.25],
  ["XLM", "Stellar", 0.245, 4, "#cbe748", 1.78],
  ["TRX", "TRON", 0.024, 3.5, "#e69f48", -1.45],
  ["BNB", "Binance Coin", 9.45, 3.5, "#efc034", 0.64],
  ["USDT", "Tether", 1, 2.5, "#46c5e9", 0.01],
  ["LINK", "Chainlink", 0.46, 1.5, "#7d5aeb", -1.52],
  ["ZEC", "Zcash", 122.7, 1.7, "#f4d84c", -0.88],
];
export const basket: Asset[] = rows.map(
  ([symbol, name, price, weight, color, change]) => ({
    symbol,
    name,
    price,
    weight,
    color,
    change,
    slug: name.toLowerCase().replaceAll(" ", "-"),
  }),
);
export const TOKEN_PRICE = 92844.234 / 2353;
export const assets: Asset[] = [
  ...basket,
  {
    symbol: "USD",
    name: "Visa/Mastercard",
    price: 1,
    weight: 0,
    color: "#269c74",
    change: 0,
    slug: "usd",
  },
  {
    symbol: "TBCi",
    name: "TBCi-20 Stable",
    price: TOKEN_PRICE,
    weight: 0,
    color: "#208cff",
    change: 2.11,
    slug: "tbci",
  },
];
export const walletSymbols = [
  "BTC",
  "ETH",
  "XRP",
  "BCH",
  "EOS",
  "XLM",
  "LTC",
  "ADA",
  "XMR",
  "USDT",
];
export const indexChoices = [
  {
    id: "tbci-10-stable",
    name: "TBCi-10 Stable",
    price: 55.537,
    balance: 2353,
    points: 87.842,
    change: 2.11,
  },
  {
    id: "tbci-20-balance",
    name: "TBCi-20 Balance",
    price: 40.537,
    balance: 1425,
    points: 124.642,
    change: 3.11,
  },
  {
    id: "tbci-50-active",
    name: "TBCi-50 Active",
    price: 120.768,
    balance: 34.03,
    points: 204.942,
    change: 1.11,
  },
  {
    id: "tbci-20-balance-2",
    name: "TBCi-20 Balance",
    price: 50.537,
    balance: 0,
    points: 88.642,
    change: 2.11,
  },
  {
    id: "tbci-20-utility",
    name: "TBCi-20 Utility",
    price: 27.537,
    balance: 0.35,
    points: 92.842,
    change: -2.11,
  },
  {
    id: "tbci-20-security",
    name: "TBCi-20 Security",
    price: 65.537,
    balance: 0,
    points: 65.842,
    change: -3.11,
  },
];
export const defaultIndex = {
  id: "tbci-20-stable",
  name: "TBCi-20 Stable",
  price: TOKEN_PRICE,
  balance: 2353,
  points: 87.842,
  change: 2.11,
};
export const findIndex = (id: string) =>
  indexChoices.find((i) => i.id === id) ?? defaultIndex;
export const number = (value: number, digits = 3) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(
    value,
  );
export const money = (value: number, digits = 2) =>
  "$" +
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
export const coin = (symbol: string) =>
  assets.find((a) => a.symbol === symbol) ?? basket[0];
export type Operation = {
  id: string;
  type:
    "buy" | "sell" | "compile" | "unmake" | "deposit" | "withdraw" | "claim";
  symbol: string;
  amount: number;
  value: number;
  date: string;
};
export type DemoState = {
  name: string;
  email: string;
  selectedIndex: string;
  balances: Record<string, number>;
  operations: Operation[];
  addedWallets: string[];
  tokenBalances: Record<string, number>;
  redemption: {
    indexId: string;
    amount: number;
    remaining: Record<string, number>;
  } | null;
};
const initialBalances = Object.fromEntries(
  basket.map((a) => [a.symbol, ((55537 - 5400.44) * a.weight) / 100 / a.price]),
);
export const seed: DemoState = {
  name: "Sergey Petrov",
  email: "sergey@example.com",
  selectedIndex: "tbci-20-stable",
  balances: { ...initialBalances, USD: 5400.44, TBCi: 2353 },
  operations: [],
  addedWallets: [],
  redemption: null,
  tokenBalances: Object.fromEntries(
    [defaultIndex, ...indexChoices].map((i) => [i.id, i.balance]),
  ),
};
export const publicCoinTabs = [
  ["overview", "Overview"],
  ["historical-price", "Historical price"],
  ["analysis", "Analysis"],
  ["markets", "Markets"],
  ["charts", "Charts"],
  ["trades", "Trades"],
  ["forum", "Forum"],
  ["news", "News"],
  ["timeline", "Timeline"],
];
export const news = [
  {
    slug: "barclays-blockchain",
    title:
      "Major Korean Financial Holding Company Wins Blockchain Patent for Improved Fintech Security",
    category: "NEWS",
    date: "OCT 13, 2018",
    image: "news-1.jpg",
  },
  {
    slug: "okex-stablecoins",
    title:
      "Third Top Cryptocurrency Exchange OKEx Lists Four Stablecoins at Once",
    category: "ARTICLES",
    date: "OCT 12, 2018",
    image: "news-2.jpg",
  },
  {
    slug: "bitfinex-reporting",
    title: "Bitcoin Exchange Bitfinex Announces New Reporting Tools for Users",
    category: "ANALYSIS",
    date: "OCT 11, 2018",
    image: "news-3.jpg",
  },
  {
    slug: "tether-stablecoins",
    title:
      "Trader Says Tether Will be Replaced by New Stablecoins, Better for Crypto",
    category: "NEWS",
    date: "OCT 10, 2018",
    image: "news-4.jpg",
  },
  {
    slug: "gary-cohn-blockchain",
    title: "Ex-Goldman Sachs President Gary Cohn Joins Blockchain Startup",
    category: "NEWS",
    date: "OCT 9, 2018",
    image: "news-5.jpg",
  },
  {
    slug: "cryptocurrency-market",
    title:
      "Cryptocurrency Market Loses $16 Billion as Dow Jones, Nasdaq Plummet",
    category: "ANALYSIS",
    date: "OCT 8, 2018",
    image: "news-6.jpg",
  },
  {
    slug: "shanghai-stocks",
    title:
      "STOCK NEWS Chinese Stocks Look to Hit Biggest One-Day Gain in 3 Years",
    category: "NEWS",
    date: "OCT 10, 2018",
    image: "news-7.jpg",
  },
  {
    slug: "ai-cryptocurrency",
    title: "Opinion: Can AI Tools Improve Cryptocurrency Adoption?",
    category: "NEWS",
    date: "OCT 9, 2018",
    image: "news-8.jpg",
  },
  {
    slug: "novogratz-crypto",
    title:
      "Novogratz Says Cryptos Are Safe, Expects Bitcoin to Rally in Q1 2019",
    category: "ANALYSIS",
    date: "OCT 8, 2018",
    image: "news-9.jpg",
  },
  {
    slug: "gates-foundation",
    title:
      "Gates Foundation Partners Ripple and Coil in Financial Inclusion Initiative",
    category: "NEWS",
    date: "October 13, 2018",
    image: "gates.jpg",
  },
  {
    slug: "huobi-stablecoin",
    title:
      "One coin to Rule Them All? Huobi’s New Program Lets Users Swap Between Tokens",
    category: "NEWS",
    date: "October 19, 2018",
    image: "huobi.jpg",
  },
];
export const coinNews = [
  {
    slug: "atomic-swaps",
    title: "Crypto 101: Beginner’s Guide to Cross-Chain Atomic Swaps",
    source: "CNN",
    age: "15 min ago",
    category: "Blockchain",
    summary:
      "Atomic swaps mean the ability to exchange digital assets across different blockchain networks without the involvement of central parties.",
  },
  {
    slug: "jp-morgan-bitcoin",
    title:
      "JP Morgan CEO Jamie Dimon Says He Doesn’t “Give A S--t” About Bitcoin",
    source: "CryptoGlobe",
    age: "20 min ago",
    category: "Exchange",
    summary:
      "JP Morgan CEO Jamie Dimon has recently stated that while he stands by his comments on Bitcoin, he is tired of answering questions about the cryptocurrency.",
  },
  {
    slug: "brexit-markets",
    title: "Crypto 101: Beginner’s Guide to Cross-Chain Atomic Swaps",
    source: "Live Bitcoin News",
    age: "50 min ago",
    category: "Blockchain",
    summary:
      "Many different external factors can influence financial markets. This also applies to cryptocurrencies, which are already volatile by nature.",
  },
  {
    slug: "ico-roundup",
    title:
      "ICO Roundup: SEC Annual Report, Israeli Offerings Raise $600 Million, Rapper Sued",
    source: "Bitcoin.com",
    age: "1 hour ago",
    category: "ICO",
    summary:
      "The annual report of the SEC’s Division of Enforcement has detailed the actions taken against initial coin offerings during the preceding financial year.",
  },
  {
    slug: "lightning-bike",
    title: "This Electric Bike Runs on Lightning Network Bitcoin Micropayments",
    source: "CNN",
    age: "1 hour ago",
    category: "Blockchain",
    summary:
      "Matthias Steinig, a German developer whose focus seems to be on the development of Lightning Network-enabled technologies for use consumers, has created two projects.",
  },
  {
    slug: "top-performers",
    title:
      "Top Crypto Performers Overview: Bitcoin Cash, Stellar, Monero, EOS, Ripple",
    source: "CoinTelegraph",
    age: "2 hours ago",
    category: "Markets",
    summary:
      "An overview of cryptocurrency performance and market developments from the archival news feed.",
  },
].map((n, i) => ({
  ...n,
  image: "coin-news-" + (i + 1) + ".jpg",
  date: "October 2018",
}));
export const exchanges = [
  "Binance",
  "Huobi",
  "OKEx",
  "BitForex",
  "Coinbene",
  "Bitfinex",
  "Bithumb",
  "Coinbase Pro",
  "HitBTC",
  "Kraken",
  "Bitstamp",
  "Poloniex",
  "KuCoin",
  "Bittrex",
  "Bit-Z",
  "Gate.io",
  "Gemini",
  "Liquid",
  "EXMO",
  "CoinEx",
].map((name, i) => ({
  name,
  slug: name.toLowerCase().replaceAll(" ", "-"),
  volume: 1403305015 / (i * 0.38 + 1),
  markets: 350 - i * 9,
  change: i % 3 === 0 ? 2.41 : -1.15 - i * 0.32,
  share: 17.3 / (i * 0.8 + 1),
}));
