import articles from "./articles.json" with { type: "json" };
export type Article = {
  slug: string;
  title: string;
  publishedAt: string;
  date: string;
  category: string;
  topic: string;
  image: string;
  summary: string;
  sections: { heading: string; paragraphs: string[] }[];
  author: string;
  readMinutes: number;
  views: number;
  sources: { title: string; url: string; kind: string }[];
  tags: string[];
};
export const news: Article[] = articles;
export const coinNews = [
  {
    slug: "atomic-swaps",
    title: "Crypto 101: Beginner’s Guide to Cross-Chain Atomic Swaps",
    source: "CNN",
    age: "15 min ago",
    category: "Blockchain",
    summary:
      "Atomic swaps mean the ability to exchange digital assets across different blockchain networks without the involvement of central parties.",
    image: "coin-news-1.jpg",
    date: "OCT 18, 2018",
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
    image: "coin-news-2.jpg",
    date: "OCT 18, 2018",
  },
  {
    slug: "brexit-markets",
    title: "Crypto 101: Beginner’s Guide to Cross-Chain Atomic Swaps",
    source: "Live Bitcoin News",
    age: "50 min ago",
    category: "Blockchain",
    summary:
      "Many different external factors can influence financial markets. This also applies to cryptocurrencies, which are already volatile by nature.",
    image: "coin-news-3.jpg",
    date: "OCT 18, 2018",
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
    image: "coin-news-4.jpg",
    date: "OCT 18, 2018",
  },
  {
    slug: "lightning-bike",
    title: "This Electric Bike Runs on Lightning Network Bitcoin Micropayments",
    source: "CNN",
    age: "1 hour ago",
    category: "Blockchain",
    summary:
      "Matthias Steinig, a German developer whose focus seems to be on the development of Lightning Network-enabled technologies for use consumers, has created two projects.",
    image: "coin-news-5.jpg",
    date: "OCT 18, 2018",
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
    image: "coin-news-6.jpg",
    date: "OCT 18, 2018",
  },
];
export const recentNews = [...news].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);
