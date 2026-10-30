import { useEffect, useState } from "react";
import {
  basket,
  coin,
  indexChoices,
  defaultIndex,
  findIndex,
  news,
  exchanges,
  money,
  number,
  publicCoinTabs,
  coinNews,
} from "../data/demo";
import {
  Wordmark,
  CryptoIcon,
  AssetLabel,
  Sparkline,
  Chart,
  Composition,
  Methodology,
  CoinChart,
} from "./Primitives";
type Page =
  | "home"
  | "index"
  | "coins"
  | "coin"
  | "exchanges"
  | "exchange"
  | "news"
  | "article"
  | "privacy";
const allIndices = [defaultIndex, ...indexChoices];
function Header() {
  return (
    <header className="public-header">
      <div className="site-container header-inner">
        <a href="/" className="public-brand" aria-label="TBCi home">
          <Wordmark />
          <span>Cryptocurrency index</span>
        </a>
        <details className="mobile-public-menu">
          <summary aria-label="Open navigation">☰</summary>
          <nav>
            <a href="/index/tbci-20-balance/">Index</a>
            <a href="/coins/">Coins</a>
            <a href="/exchanges/">Exchanges</a>
            <a href="/news/">News</a>
            <a href="/app/">Login / Register</a>
          </nav>
        </details>
        <nav className="public-nav" aria-label="Main navigation">
          <details className="index-dropdown">
            <summary>Index &nbsp; ⌄</summary>
            <div className="dropdown">
              {allIndices.map((i) => (
                <a key={i.id} href={"/index/" + i.id + "/"}>
                  {i.name}
                </a>
              ))}
            </div>
          </details>
          <a href="/coins/">Coins</a>
          <a href="/exchanges/">Exchanges</a>
          <a href="/news/?category=ico">ICOs</a>
          <a href="/news/">News</a>
        </nav>
        <form className="header-search" action="/coins/">
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="site-search">
            Search coins
          </label>
          <input
            id="site-search"
            name="q"
            placeholder="Search..."
            type="search"
          />
        </form>
        <div className="login-links">
          <a href="/app/">Login</a>
          <span>/</span>
          <a href="/app/">Register</a>
        </div>
      </div>
    </header>
  );
}
function Socials({ article = false }: { article?: boolean }) {
  return (
    <div
      className="socials"
      aria-label={article ? "Share article" : "Follow updates"}
    >
      {["♥", "f", "in", "➤"].map((icon, i) => (
        <a
          key={i}
          href={article ? "#article-tags" : "#daily-updates"}
          aria-label={["Twitter", "Facebook", "LinkedIn", "Telegram"][i]}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
function Footer() {
  return (
    <footer className="public-footer">
      <div className="site-container footer-columns">
        <div>
          <a href="/">
            <Wordmark />
          </a>
          <small>Cryptocurrency index</small>
          <Socials />
        </div>
        <div className="footer-copy">
          <strong>© TBCi, 2018. All rights reserved.</strong>
          <p>
            Illustrative historical data and a demonstration account. No real
            payments or blockchain transactions are performed. No advertising
            counters are installed.
          </p>
          <a href="/privacy/">Privacy and local data</a>
        </div>
        <div className="footer-support">
          <p>
            Technical support
            <br />
            <span>support@tbci.com</span>
          </p>
          <p>
            PR-department:
            <br />
            <span>pr@tbci.com</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
function Subscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section className="subscribe-section" id="daily-updates">
      <div className="site-container">
        <h2>Daily updates</h2>
        <p>for project updates and market news</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <label htmlFor="subscribe-email" className="sr-only">
            Your email
          </label>
          <input
            id="subscribe-email"
            placeholder="Your e-mail"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setDone(false);
            }}
          />
          <button className="button primary">Subscribe</button>
        </form>
        {done && (
          <p role="status" className="subscription-status">
            Demo form: your email was not sent or saved.
          </p>
        )}
        <div className="follow-line">
          <span>Follow us on</span>
          <Socials />
        </div>
      </div>
    </section>
  );
}
function NewsCards({ items = news.slice(0, 6) }: { items?: typeof news }) {
  return (
    <div className="news-grid">
      {items.map((n) => (
        <a className="news-card" key={n.slug} href={"/news/" + n.slug + "/"}>
          <div className="news-photo">
            <img
              src={"/media/" + n.image}
              width="370"
              height="233"
              loading="lazy"
              alt=""
            />
            <span data-category={n.category}>{n.category}</span>
          </div>
          <div className="news-card-body">
            <h3>{n.title}</h3>
            <time>{n.date}</time>
          </div>
        </a>
      ))}
    </div>
  );
}
function Ticker() {
  const [at, setAt] = useState(0);
  const a = basket[at % basket.length];
  return (
    <div className="ticker">
      <div className="site-container ticker-inner">
        <button
          aria-label="Previous currency"
          onClick={() => setAt((at + basket.length - 1) % basket.length)}
        >
          ‹
        </button>
        <a className="ticker-name" href={"/coins/" + a.slug + "/"}>
          <CryptoIcon symbol={a.symbol} size={22} />
          {a.symbol} {a.name}
        </a>
        <strong>{money(a.price)}</strong>
        <div>
          <small>Direct vol 24h</small>
          <b>$ 1.16 B</b>
        </div>
        <div>
          <small>Total vol 24h</small>
          <b>$ 3.47 B</b>
        </div>
        <div>
          <small>Mrk.Cap</small>
          <b>$ 114.33 B</b>
        </div>
        <Sparkline />
        <span className={a.change > 0 ? "positive" : "negative"}>
          {a.change > 0 ? "+" : ""}
          {number(a.change, 2)}%
        </span>
        <a className="button dark" href="/coins/">
          ☷ &nbsp; All Coins
        </a>
        <button
          aria-label="Next currency"
          onClick={() => setAt((at + 1) % basket.length)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
function Home() {
  const [selected, setSelected] = useState("tbci-20-balance");
  const [more, setMore] = useState(false);
  const index = findIndex(selected);
  return (
    <>
      <div className="home-hero">
        <div className="site-container home-hero-copy">
          <div className="section-row">
            <h1>
              Tugush Blockchain Capital index{" "}
              {index.id.includes("10")
                ? "10"
                : index.id.includes("50")
                  ? "50"
                  : "20"}{" "}
              {index.name.split(" ").at(-1)}
            </h1>
            <div className="hero-follow">
              <span>follow us</span>
              <Socials />
            </div>
          </div>
          <div className="hero-price">
            <strong>{number(index.points)}</strong>
            <span className="positive">▲ 1.468 &nbsp; +2,11%</span>
            <small>
              24 hour change
              <br />
              October 22, 2018 09:42 PM UTC
            </small>
          </div>
          <div className="hero-index-buttons">
            {indexChoices.slice(0, 3).map((i) => (
              <button
                key={i.id}
                aria-pressed={selected === i.id}
                onClick={() => setSelected(i.id)}
              >
                {i.name}
              </button>
            ))}
            <details>
              <summary>More ⌄</summary>
              <div className="dropdown">
                {indexChoices.slice(3).map((i) => (
                  <button key={i.id} onClick={() => setSelected(i.id)}>
                    {i.name}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
        <Chart hero height={360} />
      </div>
      <Ticker />
      <section className="home-intro">
        <div className="site-container intro-grid">
          <div>
            <h2>Introducing TBC Index</h2>
            <p>
              Our TBCI 20 Crypto Index was created in August 2018 for monitoring
              current state of global crypto-market via tracking changes across
              20 top-ranked cryptocurrencies according to their market
              capitalization.
            </p>
            <p>
              Technically, the TBC-20 Crypto Index is the summation of the free
              float market values (or market capitalizations) of all
              cryptocurrencies within the index divided by the divisor (defined,
              similar to FTSE and S&amp;P methodology, as the previous period’s
              sum of market capitalizations of its constituents or a value
              derived by our arbitrarily-picked index starting value).
            </p>
            <a className="blue" href={"/index/" + selected + "/"}>
              More information
            </a>
          </div>
          <aside>
            <h3>Current Composition</h3>
            <table>
              <tbody>
                {(more ? basket : basket.slice(0, 6)).map((a) => (
                  <tr key={a.symbol}>
                    <td>
                      <CryptoIcon symbol={a.symbol} size={18} />
                    </td>
                    <td>
                      {a.symbol} &nbsp; {a.name}
                    </td>
                    <td>{a.weight.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="button small" onClick={() => setMore(!more)}>
              {more ? "Show less" : "View All Coins"} ⌄
            </button>
          </aside>
        </div>
      </section>
      <section className="home-news">
        <div className="site-container">
          <h2>News &amp; Articles</h2>
          <NewsCards />
          <div className="center-action">
            <a className="button navy" href="/news/">
              View More News
            </a>
          </div>
        </div>
      </section>
      <Subscribe />
      <Footer />
    </>
  );
}
function MarketHero({
  type,
  slug,
  tab = "overview",
}: {
  type: "coin" | "exchange" | "index";
  slug: string;
  tab?: string;
}) {
  const a =
    type === "coin" ? (basket.find((c) => c.slug === slug) ?? basket[0]) : null;
  const exchange = exchanges.find((e) => e.slug === slug) ?? exchanges[2];
  const index = findIndex(slug);
  const [watch, setWatch] = useState(false);
  const [message, setMessage] = useState("");
  const title =
    type === "coin"
      ? a!.name + " " + a!.symbol
      : type === "exchange"
        ? exchange.name
        : index.name;
  return (
    <>
      <div className="market-hero">
        <div className="site-container">
          <div className="section-row">
            <h1>
              {type === "coin" && <CryptoIcon symbol={a!.symbol} size={35} />}{" "}
              {type === "exchange" && (
                <img
                  className="exchange-mark"
                  src="/coins/huobi.png"
                  width="40"
                  height="40"
                  alt=""
                />
              )}
              {title}
              <small className="rank">Rank {type === "exchange" ? 3 : 1}</small>
            </h1>
            <div className="market-actions">
              <button
                className="button dark"
                aria-pressed={watch}
                onClick={() => setWatch(!watch)}
              >
                {watch ? "★ Watching" : "☆ Watchlist"}
              </button>
              <button
                className="button dark"
                aria-label="Copy page link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(location.href);
                    setMessage("Link copied");
                  } catch {
                    setMessage(
                      "Select the address in your browser to copy it.",
                    );
                  }
                }}
              >
                ♧
              </button>
              <button
                className="button dark"
                aria-label="Share page"
                onClick={async () => {
                  try {
                    if (navigator.share)
                      await navigator.share({ title, url: location.href });
                    else {
                      await navigator.clipboard.writeText(location.href);
                      setMessage("Link copied");
                    }
                  } catch {}
                }}
              >
                ♧
              </button>
            </div>
          </div>
          <div className="section-row">
            <div className="hero-price">
              <strong>
                {type === "coin"
                  ? money(a!.price)
                  : type === "exchange"
                    ? money(exchange.volume, 0)
                    : number(index.points)}
              </strong>
              <span className="positive">
                ▲ {type === "exchange" ? "12.27 %" : "1.468　+2,11%"}
              </span>
              <small>
                24 hour change
                <br />
                October 22, 2018 09:42 PM UTC
              </small>
            </div>
            {type === "index" ? (
              <div className="inline-actions">
                <a className="button primary" href="/app/buy/">
                  Buy TBCi
                </a>
                <a className="button dark" href="/app/sell/">
                  Sell
                </a>
              </div>
            ) : (
              <a
                className="button dark"
                href={type === "coin" ? "/coins/" : "/exchanges/"}
              >
                ☷ &nbsp; All {type === "coin" ? "Coins" : "Exchange"}
              </a>
            )}
          </div>
          {message && (
            <span className="hero-message" role="status">
              {message}
            </span>
          )}
        </div>
      </div>
      <div className="market-metrics">
        <div className="site-container">
          {(type === "exchange"
            ? [
                ["Total volume", "$6 571 271 536"],
                ["Volume 24h", "$571 271 536"],
                ["Volume 7d", "$4 105 787 840"],
                ["Volume 30d", "$12 812 934 128"],
                ["Trading pairs", "350"],
                ["Top Pair", "BTC/USDT"],
              ]
            : type === "coin"
              ? [
                  ["Market Cap", "$110 117 709 712"],
                  ["Volume 24h", "$4 088 533 236"],
                  ["Circulating Supply", "17 348 162 " + a!.symbol],
                  ["Max Supply", "21 000 000 " + a!.symbol],
                  ["Last trade", "0.004120 BTC ($25.75) / Coinbase"],
                ]
              : [
                  ["Market Cap", "$110 117 709 712"],
                  ["Volume 24h", "$4 088 533 236"],
                  ["Price", money(index.price, 3)],
                  ["Total tokens", "140 245 398"],
                  ["Coins quantity", "20"],
                ]
          ).map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      {type === "coin" && (
        <div
          className="site-container coin-tabs"
          role="navigation"
          aria-label="Currency sections"
        >
          {publicCoinTabs.map(([id, name]) => (
            <a
              key={id}
              className={id === tab ? "active" : ""}
              href={
                "/coins/" + slug + "/" + (id === "overview" ? "" : id + "/")
              }
            >
              {name}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
function IndexPage({ slug }: { slug: string }) {
  const [deposit, setDeposit] = useState(3788);
  const [day, setDay] = useState(190);
  const [comparison, setComparison] = useState("BTC");
  const item = findIndex(slug);
  const rate = 1 + Math.max(0, 500 - day) / 22;
  const value = deposit * rate;
  const baseRate =
    comparison === "BTC" ? 5.48 : comparison === "ETH" ? 4.21 : 3.76;
  const date = new Date(Date.UTC(2017, 5, 1 + day));
  return (
    <>
      <MarketHero type="index" slug={slug} />
      <div className="site-container public-index-content">
        <Chart multi height={510} />
        <section className="composition-section">
          <h2>{item.name} Composition</h2>
          <p className="composition-subtitle">
            Diversified portfolio consists of the most liquid cryptocurrencies
          </p>
          <Composition />
        </section>
        <section>
          <h2 className="center-heading">List of included cryptocurrencies</h2>
          <p className="inclusion-criteria">
            Inclusion criteria:{" "}
            <strong className="blue">
              Capitalization size = min $0.3 bln.
            </strong>
          </p>
          <CurrencyTable composition />
          <p className="exclusion-note">
            Note: The TBC 20 Crypto Index deliberately excludes cryptocurrencies
            standing for any fiat currencies (USDT), exchange services and
            precious metals. The values shown here are illustrative historical
            data.
          </p>
        </section>
        <section className="index-calculator">
          <h2>Calculate profit index</h2>
          <p className="calculator-subtitle">
            Indicate the amount of investment and the date to see income
          </p>
          <div className="investment-sliders">
            <label>
              Initial investment<output>{money(deposit, 0)}</output>
              <input
                aria-label="Initial investment"
                type="range"
                min="1000"
                max="100000"
                step="1"
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
              />
              <span>
                <small>with $1000</small>
                <small>to $100 000</small>
              </span>
            </label>
            <label>
              Purchase date
              <output>
                {date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </output>
              <input
                aria-label="Purchase date"
                type="range"
                min="0"
                max="502"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              />
              <span>
                <small>1 Jun 2017</small>
                <small>16 Oct 2018</small>
              </span>
            </label>
          </div>
          <div className="calculator-grid">
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th>Cost</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{item.name}</td>
                    <td className="blue">{money(value)}</td>
                    <td className="blue">{number((rate - 1) * 100, 0)}%</td>
                  </tr>
                  <tr>
                    <td>
                      <select
                        aria-label="Compare investment with"
                        value={comparison}
                        onChange={(e) => setComparison(e.target.value)}
                      >
                        <option value="BTC">Bitcoin BTC</option>
                        <option value="ETH">Ethereum ETH</option>
                        <option value="LTC">Litecoin LTC</option>
                      </select>
                    </td>
                    <td>{money(deposit * baseRate)}</td>
                    <td>{number((baseRate - 1) * 100, 0)}%</td>
                  </tr>
                </tbody>
              </table>
              <div className="center-action">
                <a className="button primary" href="/app/buy/">
                  Buy TBCi
                </a>
              </div>
            </div>
            <div
              className="calculation-result"
              role="status"
              aria-label="Investment return"
            >
              <span>Revenue</span>
              <strong>{money(value - deposit, 0)}</strong>
              <hr />
              <span>Rate</span>
              <b className="blue">{number((rate - 1) * 100, 0)}%</b>
            </div>
          </div>
        </section>
        <Methodology />
      </div>
      <Footer />
    </>
  );
}

function CurrencyTable({ composition = false }: { composition?: boolean }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("rank");
  const [type, setType] = useState("coins");
  const [cap, setCap] = useState("all");
  const [price, setPrice] = useState("all");
  const [volume, setVolume] = useState("all");
  const [currency, setCurrency] = useState("USD");
  const [limit, setLimit] = useState(15);
  const [onlyWatch, setOnlyWatch] = useState(false);
  const [watch, setWatch] = useState(["ETH", "XRP"]);
  useEffect(() => {
    if (!composition) {
      setQuery(new URLSearchParams(location.search).get("q") ?? "");
      try {
        const saved = JSON.parse(
          localStorage.getItem("tbci-watchlist") || "null",
        );
        if (Array.isArray(saved) && saved.every((s) => typeof s === "string"))
          setWatch(saved);
      } catch {}
    }
  }, [composition]);
  const toggle = (symbol: string) => {
    const next = watch.includes(symbol)
      ? watch.filter((s) => s !== symbol)
      : [...watch, symbol];
    setWatch(next);
    try {
      localStorage.setItem("tbci-watchlist", JSON.stringify(next));
    } catch {}
  };
  const order = [
    "BTC",
    "ETH",
    "XRP",
    "BCH",
    "XLM",
    "EOS",
    "LTC",
    "USDT",
    "ADA",
    "XMR",
    "TRX",
    "DASH",
    "IOTA",
    "BNB",
    "NEO",
    "ETC",
    "QTUM",
    "ZIL",
    "LINK",
    "ZEC",
  ];
  let rows = (composition ? basket : order.map(coin)).filter(
    (a, i) =>
      (a.name + " " + a.symbol).toLowerCase().includes(query.toLowerCase()) &&
      (!onlyWatch || watch.includes(a.symbol)) &&
      (type !== "tokens" ||
        ["USDT", "ZIL", "BNB", "LINK"].includes(a.symbol)) &&
      (cap === "all" || (cap === "large" ? i < 5 : i >= 5)) &&
      (price === "all" || (price === "high" ? a.price >= 100 : a.price < 1)) &&
      (volume === "all" || (volume === "high" ? i < 5 : i >= 5)),
  );
  if (sort === "price") rows = rows.toSorted((a, b) => b.price - a.price);
  if (sort === "name")
    rows = rows.toSorted((a, b) => a.name.localeCompare(b.name));
  const convert = (value: number) =>
    currency === "USD"
      ? money(value, value < 1 ? 6 : 2)
      : number(value / coin(currency).price, 6) + " " + currency;
  return (
    <>
      {!composition && (
        <div className="list-hero">
          <div className="site-container">
            <h1>All Cryptocurrency list</h1>
            <div className="market-filter-bar coin-filters">
              <label>
                Type coins
                <select
                  aria-label="Type coins"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="coins">Coins</option>
                  <option value="tokens">Tokens</option>
                </select>
              </label>
              <label>
                Market Cap
                <select
                  aria-label="Market Cap filter"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="large">Large cap</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Price
                <select
                  aria-label="Price filter"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="high">Over $100</option>
                  <option value="low">Under $1</option>
                </select>
              </label>
              <label>
                Volume 24h
                <select
                  aria-label="Volume filter"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="high">High volume</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Currency
                <select
                  aria-label="Market currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option>USD</option>
                  <option>BTC</option>
                  <option>ETH</option>
                </select>
              </label>
              <button
                className="button dark watchlist-filter"
                aria-pressed={onlyWatch}
                onClick={() => setOnlyWatch(!onlyWatch)}
              >
                Watchlist
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={composition ? "" : "site-container coin-list-page"}>
        <div className="table-scroll">
          <table className="currency-table">
            <thead>
              {composition ? (
                <tr>
                  <th>Currency</th>
                  <th>Market cap</th>
                  <th>Share of portfolio</th>
                  <th>Price</th>
                  <th>Value of share</th>
                </tr>
              ) : (
                <tr>
                  <th aria-label="Watchlist" />
                  <th>#</th>
                  <th>
                    <button
                      onClick={() => setSort(sort === "name" ? "rank" : "name")}
                    >
                      Name
                    </button>
                  </th>
                  <th>Symbol</th>
                  <th>Market Cap</th>
                  <th>
                    <button
                      onClick={() =>
                        setSort(sort === "price" ? "rank" : "price")
                      }
                    >
                      Price
                    </button>
                  </th>
                  <th>Volume (24h)</th>
                  <th>Circulating Supply</th>
                  <th>Price Graph (7d)</th>
                  <th>% 24H</th>
                </tr>
              )}
            </thead>
            <tbody>
              {rows.slice(0, composition ? 10 : limit).map((a, i) =>
                composition ? (
                  <tr key={a.symbol}>
                    <td>
                      <a href={"/coins/" + a.slug + "/"}>
                        <AssetLabel symbol={a.symbol} />
                      </a>
                    </td>
                    <td>{money(110117709712 / (i + 1), 0)}</td>
                    <td>
                      <div className="volume-cell">
                        <span>{a.weight}%</span>
                        <i
                          style={{
                            background: a.color,
                            width: a.weight * 3 + "%",
                          }}
                        />
                      </div>
                    </td>
                    <td>{money(a.price, 3)}</td>
                    <td>{money((168593 * a.weight) / 100)}</td>
                  </tr>
                ) : (
                  <tr key={a.symbol}>
                    <td>
                      <button
                        className={
                          "watch-star " +
                          (watch.includes(a.symbol) ? "selected" : "")
                        }
                        aria-label={
                          (watch.includes(a.symbol) ? "Remove " : "Add ") +
                          a.symbol +
                          (watch.includes(a.symbol)
                            ? " from watchlist"
                            : " to watchlist")
                        }
                        aria-pressed={watch.includes(a.symbol)}
                        onClick={() => toggle(a.symbol)}
                      >
                        {watch.includes(a.symbol) ? "★" : "☆"}
                      </button>
                    </td>
                    <td>{i + 1}</td>
                    <td>
                      <a href={"/coins/" + a.slug + "/"}>
                        <AssetLabel symbol={a.symbol} />
                      </a>
                    </td>
                    <td>{a.symbol}</td>
                    <td>{convert(110117709712 / (i + 1))}</td>
                    <td>{convert(a.price)}</td>
                    <td>{convert(4088533236 / (i + 1))}</td>
                    <td>
                      {number(17348162 * (i + 1), 0)} {a.symbol}
                    </td>
                    <td>
                      <Sparkline negative={a.change < 0} />
                    </td>
                    <td className={a.change >= 0 ? "positive" : "negative"}>
                      {a.change > 0 ? "+" : ""}
                      {a.change.toFixed(2)}%
                    </td>
                  </tr>
                ),
              )}
              {!rows.length && (
                <tr>
                  <td colSpan={composition ? 5 : 10} className="empty-cell">
                    No currencies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!composition && (
          <div className="list-bottom">
            <button
              className="button primary"
              onClick={() => setLimit(limit + 20)}
              disabled={limit >= rows.length}
            >
              Show more
            </button>
            <span>
              {rows.length ? 1 : 0}–{Math.min(limit, rows.length)} of{" "}
              {rows.length}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function Coins() {
  return (
    <>
      <CurrencyTable />
      <Footer />
    </>
  );
}
function Converter({ symbol }: { symbol: string }) {
  const [from, setFrom] = useState(symbol);
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("1");
  const rate =
    coin(from).price /
    (to === "EUR" ? 1.136 : to === "USD" ? 1 : coin(to).price);
  return (
    <section className="converter">
      <h2>Convertisseur</h2>
      <div className="converter-fields">
        <div>
          <label htmlFor="convert-from">give away</label>
          <select
            id="convert-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {basket.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            aria-label="Convert amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="convert-to">convert</label>
          <select
            id="convert-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {["EUR", "USD", "BTC", "ETH"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <output aria-label="Converted value">
            {number(Math.max(0, Number(amount) || 0) * rate, 3)}
          </output>
        </div>
      </div>
    </section>
  );
}
function CoinInfo({ slug, tab }: { slug: string; tab: string }) {
  const a = basket.find((c) => c.slug === slug) ?? basket[0];
  return (
    <>
      <MarketHero type="coin" slug={slug} tab={tab} />
      <div
        className={
          "site-container coin-detail-page " +
          (tab === "overview" ? "coin-overview" : "")
        }
      >
        {tab === "overview" || ["analysis", "forum"].includes(tab) ? (
          <div className="coin-overview-grid">
            <aside>
              <h2>Detail information</h2>
              <table className="information-table">
                <tbody>
                  {[
                    ["Website", a.name + ".com"],
                    ["Started", "03 January 2009 over 9 years ago"],
                    ["Whitepaper", "Download"],
                    ["Explorer", "blockchain.com/explorer"],
                    ["Message Board", "bitcointalk.org"],
                    ["Source Code", "github.com/bitcoin/"],
                    ["Org. Structure", "Decentralized"],
                    ["Open Source", "Yes"],
                    ["Proof Type", "Proof of Work"],
                    ["Algorithm", "SHA256"],
                    ["Hardware wallet", "Yes"],
                    ["Max Supply", "21 000 000"],
                    ["Available Supply", "17 348 162"],
                    ["Difficulty Adj.", "2016 blocks"],
                    ["Block RR.", "50%"],
                    ["Block No.", "247 856.0"],
                    ["Network H/s", "51 417 644 209.9"],
                    ["Block Reward", "12.5"],
                  ].map(([k, v], i) => (
                    <tr key={k}>
                      <th>{k}</th>
                      <td>
                        {a.symbol!=="BTC"?"Not supplied":i < 6 ? (
                          <a
                            href={
                              i === 0
                                ? "https://bitcoin.org/"
                                : i === 2
                                  ? "https://bitcoin.org/bitcoin.pdf"
                                  : i === 5
                                    ? "https://github.com/bitcoin/bitcoin"
                                    : i === 3
                                      ? "https://www.blockchain.com/explorer"
                                      : "https://bitcointalk.org/"
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {v}
                          </a>
                        ) : (
                          v
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </aside>
            <div>
              <h2>Latest {a.name} - Historical Price Chart</h2>
              <Chart multi signed height={410} />
              <Converter symbol={a.symbol} />
              <section className="about-coin">
                <h2>About coin</h2>
                {a.symbol==="BTC"?<>
                <p>
                  Bitcoin uses peer-to-peer technology to operate with no
                  central authority or banks; managing transactions and the
                  issuing of bitcoins is carried out collectively by the
                  network. Although other cryptocurrencies have come before,
                  Bitcoin is the first decentralized cryptocurrency. Its
                  reputation has spawned copies and evolution in the space.
                </p>
                <p>
                  With the largest variety of markets and the biggest value,
                  Bitcoin is here to stay. It is the most traded cryptocurrency
                  and one of the main entry points for other cryptocurrencies.
                  The price is unstable as always and it can go up or down in a
                  single day.
                </p>
                <p>
                  Bitcoin is an SHA-256 POW coin with almost 21,000,000 total
                  minable coins. The block time is 10 minutes. See below for a
                  full range of markets where you can trade US Dollars for
                  Bitcoin, crypto to Bitcoin and many other currencies.
                </p>
                <p>
                  Learn about the history of Bitcoin and check out the facts
                  about Bitcoin here.
                </p></>:<p>{a.name} ({a.symbol}) is shown with illustrative historical market data. Detailed verified metadata for this asset was not supplied in the source archive.</p>}
              </section>
            </div>
          </div>
        ) : tab === "historical-price" ? (
          <HistoricalTable name={a.name} />
        ) : tab === "markets" || tab === "trades" ? (
          <>
            <h2>{a.name} Markets</h2>
            <PairsTable />
          </>
        ) : tab === "news" || tab === "timeline" ? (
          <CoinNews name={a.name} />
        ) : (
          <>
            <h2>{a.name} Charts</h2>
            <CoinChart />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
function HistoricalTable({ name }: { name: string }) {
  const [start, setStart] = useState("2018-11-01");
  const [end, setEnd] = useState("2018-11-20");
  const rows = Array.from({ length: 30 }, (_, i) => ({
    date: "2018-11-" + String(i + 1).padStart(2, "0"),
    open: 6333.75 + Math.sin(i) * 120,
  }))
    .filter((r) => r.date >= start && r.date <= end)
    .reverse();
  return (
    <>
      <h2>Historical price for {name}</h2>
      <div className="historical-filters">
        <div>
          <label htmlFor="historical-from">From</label>
          <input
            id="historical-from"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="historical-to">To</label>
          <input
            id="historical-to"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <span>{rows.length} days</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "Date",
                "Open",
                "High",
                "Low",
                "Close",
                "Volume",
                "Market Cap",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date}>
                <td>{r.date}</td>
                <td>{money(r.open)}</td>
                <td>{money(r.open * 1.02)}</td>
                <td>{money(r.open * 0.97)}</td>
                <td>{money(r.open * 1.01)}</td>
                <td>{money(5364495000, 0)}</td>
                <td>{money(110117709712, 0)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7}>No prices in this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
function PairsTable() {
  return (
    <div className="table-scroll">
      <table className="pairs-table">
        <thead>
          <tr>
            {[
              "#",
              "Currency",
              "Pair",
              "Volume 24h",
              "Price",
              "Volume (%)",
              "Updated",
              "Charts",
              "Status",
            ].map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {basket.slice(0, 12).map((a, i) => (
            <tr key={a.symbol}>
              <td>{i + 1}</td>
              <td>
                <a href={"/coins/" + a.slug + "/"}>
                  <AssetLabel symbol={a.symbol} />
                </a>
              </td>
              <td>
                {a.symbol}/{i % 2 ? "BTC" : "USDT"}
              </td>
              <td>{money(142176028 / (i + 1), 0)}</td>
              <td>{money(a.price, a.price < 1 ? 6 : 2)}</td>
              <td>{number(20.53 / (i + 1), 2)}%</td>
              <td>Spot</td>
              <td>
                <a
                  href={"/coins/" + a.slug + "/charts/"}
                  aria-label={"Charts for " + a.symbol}
                >
                  ↗
                </a>
              </td>
              <td>
                <span className="market-status" aria-label="Active" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CoinNews({ name }: { name: string }) {
  const [source, setSource] = useState("all");
  const [include, setInclude] = useState("all");
  const [exclude, setExclude] = useState("none");
  const rows = coinNews.filter(
    (n) =>
      (source === "all" || source === n.source) &&
      (include === "all" || include === n.category) &&
      exclude !== n.category,
  );
  return (
    <>
      <h2>{name} News</h2>
      <div className="coin-news-filter">
        <select
          aria-label="News Feeds"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="all">News Feeds</option>
          {[...new Set(coinNews.map((n) => n.source))].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Include news category"
          value={include}
          onChange={(e) => setInclude(e.target.value)}
        >
          <option value="all">Include</option>
          {["Blockchain", "Exchange", "ICO", "Markets"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Exclude news category"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
        >
          <option value="none">Exclude</option>
          {["Blockchain", "Exchange", "ICO", "Markets"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div className="coin-news-list">
        {rows.map((n) => (
          <a href={"/news/" + n.slug + "/"} key={n.slug}>
            <img
              src={"/media/" + n.image}
              alt=""
              width="253"
              height="140"
              loading="lazy"
            />
            <div>
              <time>
                <b>{n.source}</b> &nbsp; {n.age}
              </time>
              <h3>{n.title}</h3>
              <p>{n.summary}</p>
              <span className="coin-news-categories">
                Categories: &nbsp; <b className="blue">BTC</b> &nbsp; | &nbsp;
                Exchange &nbsp; | &nbsp; Blockchain
              </span>
            </div>
          </a>
        ))}
        {!rows.length && <p>No news found.</p>}
      </div>
    </>
  );
}
function Exchanges() {
  const [volume, setVolume] = useState("all");
  const [change, setChange] = useState("all");
  const [crypto, setCrypto] = useState("BTC");
  const [onlyWatch, setOnlyWatch] = useState(false);
  const [watch, setWatch] = useState(["huobi", "okex"]);
  const [limit, setLimit] = useState(15);
  const list = exchanges.filter(
    (e) =>
      (volume === "all" || e.volume > 500000000) &&
      (change === "all" || (change === "up" ? e.change >= 0 : e.change < 0)) &&
      (!onlyWatch || watch.includes(e.slug)) &&
      (crypto !== "ETH" || e.markets > 250),
  );
  const toggle = (slug: string) =>
    setWatch((w) =>
      w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug],
    );
  return (
    <>
      <div className="list-hero">
        <div className="site-container">
          <h1>Cryptocurrency Exchanges</h1>
          <div className="market-filter-bar exchange-filters">
            <label>
              Volume
              <select
                aria-label="Exchange volume"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              >
                <option value="all">All</option>
                <option value="large">Over $500M</option>
              </select>
            </label>
            <label>
              Change 24h
              <select
                aria-label="Exchange change"
                value={change}
                onChange={(e) => setChange(e.target.value)}
              >
                <option value="all">All</option>
                <option value="up">Positive</option>
                <option value="down">Negative</option>
              </select>
            </label>
            <label>
              Crypto
              <select
                aria-label="Exchange crypto"
                value={crypto}
                onChange={(e) => setCrypto(e.target.value)}
              >
                <option>BTC</option>
                <option>ETH</option>
                <option>USDT</option>
              </select>
            </label>
            <button
              className="button dark watchlist-filter"
              aria-pressed={onlyWatch}
              onClick={() => setOnlyWatch(!onlyWatch)}
            >
              Watchlist
            </button>
          </div>
        </div>
      </div>
      <div className="site-container exchanges-page">
        <div className="exchange-stats">
          <section>
            <h2>Trading Overview</h2>
            <table className="information-table">
              <tbody>
                <tr>
                  <th>Volume markets</th>
                  <td>$6.90 B</td>
                </tr>
                <tr>
                  <th>Exchanges</th>
                  <td>158</td>
                </tr>
                <tr>
                  <th>Pairs</th>
                  <td>18007</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h2>Market By Volume</h2>
            <div className="volume-by-market">
              <div className="volume-market-header">
                <span>Market</span>
                <span />
                <span>Share</span>
                <span>Volume</span>
              </div>
              {[
                ["USDT", 31, "$2.14 B"],
                ["BTC", 21, "$1.43 B"],
                ["XRP", 19, "$1.30 B"],
                ["ETH", 15, "$1.06 B"],
                ["OTHER", 14, "$976.69 M"],
              ].map(([symbol, share, value]) => (
                <div className="volume-market-row" key={symbol}>
                  <span>{symbol}</span>
                  <i>
                    <b style={{ width: (Number(share) / 31) * 100 + "%" }} />
                  </i>
                  <span>{share}%</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="table-scroll">
          <table className="exchange-table">
            <thead>
              <tr>
                <th aria-label="Watchlist" />
                <th>#</th>
                <th>Name</th>
                <th>Volume (24h)</th>
                <th>Total %</th>
                <th>Pairs</th>
                <th>Top Pair</th>
                <th>Vol Graph (7d)</th>
                <th>% 24H</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, limit).map((e, i) => (
                <tr key={e.slug}>
                  <td>
                    <button
                      className={
                        "watch-star " +
                        (watch.includes(e.slug) ? "selected" : "")
                      }
                      aria-label={
                        (watch.includes(e.slug) ? "Remove " : "Add ") +
                        e.name +
                        " watchlist"
                      }
                      onClick={() => toggle(e.slug)}
                    >
                      {watch.includes(e.slug) ? "★" : "☆"}
                    </button>
                  </td>
                  <td>{i + 1}</td>
                  <td>
                    <a
                      className="exchange-name"
                      href={"/exchanges/" + e.slug + "/"}
                    >
                      {i < 5 ? (
                        <img
                          src={"/coins/exchange-" + e.slug + ".png"}
                          alt=""
                          width="24"
                          height="24"
                        />
                      ) : (
                        <span>{e.name[0]}</span>
                      )}
                      {e.name}
                    </a>
                  </td>
                  <td>{money(e.volume, 0)}</td>
                  <td>{number(e.share, 2)}%</td>
                  <td>{e.markets}</td>
                  <td>
                    <span className="pair-tags">
                      {[crypto, "ETH", "USDT"]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map((v) => (
                          <a href={"/exchanges/" + e.slug + "/"} key={v}>
                            {v}
                          </a>
                        ))}
                    </span>
                  </td>
                  <td>
                    <Sparkline negative={e.change < 0} />
                  </td>
                  <td className={e.change > 0 ? "positive" : "negative"}>
                    {e.change > 0 ? "+" : ""}
                    {number(e.change, 2)}%
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={9} className="empty-cell">
                    No exchanges found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="list-bottom">
          <button
            className="button primary"
            disabled={limit >= list.length}
            onClick={() => setLimit(limit + 20)}
          >
            Show more
          </button>
          <div className="inline-actions">
            <button
              className="button small blue-text"
              disabled={limit >= list.length}
              onClick={() => setLimit(limit + 100)}
            >
              Next 100 →
            </button>
            <button
              className="button small blue-text"
              disabled={limit >= list.length}
              onClick={() => setLimit(list.length)}
            >
              View All
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function Exchange({ slug }: { slug: string }) {
  const exchange = exchanges.find((e) => e.slug === slug) ?? exchanges[2];
  const [period, setPeriod] = useState("24h");
  return (
    <>
      <MarketHero type="exchange" slug={slug} />
      <div className="site-container exchange-detail">
        <div className="exchange-detail-top">
          <section>
            <h2>Detail information</h2>
            <div className="info-tables">
              {[
                [
                  ["Website", exchange.slug + ".com"],
                  ["Fees", "Trading fees"],
                  ["Twitter", "@" + exchange.name.replaceAll(" ", "")],
                  ["Launched", "Sep 2013"],
                  ["Active Markets", "284"],
                ],
                [
                  ["Volume 24h", money(exchange.volume, 0)],
                  ["Volume 7d", money(exchange.volume * 7, 0)],
                  ["Volume 30d", money(exchange.volume * 30, 0)],
                  ["Trading pairs", "350"],
                  ["Top Pair", "BTC/USDT"],
                ],
              ].map((rows, i) => (
                <table key={i}>
                  <tbody>
                    {rows.map(([k, v]) => (
                      <tr key={k}>
                        <th>{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </section>
          <section className="exchange-volume">
            <h2>Volume change</h2>
            <div className="volume-periods">
              {["24h", "Week", "Month", "All"].map((p) => (
                <button
                  key={p}
                  aria-pressed={p === period}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="volume-histogram">
              {Array.from({ length: 48 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height:
                      30 +
                      Math.sin(i / (period === "24h" ? 9 : 5)) * 30 +
                      Math.cos(i * 0.4) * 5 +
                      "%",
                  }}
                />
              ))}
            </div>
            <div className="chart-months">
              <span>14. Nov</span>
              <span>16. Nov</span>
              <span>18. Nov</span>
            </div>
          </section>
        </div>
        <PairsTable />
      </div>
      <Footer />
    </>
  );
}
function NewsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [popular, setPopular] = useState(false);
  const [limit, setLimit] = useState(9);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") ?? "");
    const c = (params.get("category") ?? "all").toUpperCase();
    if (["NEWS", "ARTICLES", "ANALYSIS"].includes(c)) setCategory(c);
    else if (c === "ICO") setQuery("TRX");
  }, []);
  const feed = [
    news.find((n) => n.slug === "gates-foundation")!,
    {
      ...news.find((n) => n.slug === "huobi-stablecoin")!,
      category: "ARTICLES",
    },
    { ...news[2], image: "feed-ethereum.jpg" },
    ...news.slice(3, 9),
  ];
  const list = feed.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) &&
      (category === "all" || n.category === category) &&
      (type === "all" || n.category === type),
  );
  const items = popular ? [...list].reverse() : list;
  return (
    <>
      <div className="list-hero news-hero">
        <div className="site-container">
          <h1>News &amp; Articles</h1>
          <div className="market-filter-bar">
            <label>
              Categories
              <select
                aria-label="News category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All</option>
                <option>NEWS</option>
                <option>ARTICLES</option>
                <option>ANALYSIS</option>
              </select>
            </label>
            <label>
              Types
              <select
                aria-label="News type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="all">All</option>
                <option>NEWS</option>
                <option>ANALYSIS</option>
              </select>
            </label>
            <label>
              Search
              <input
                aria-label="Search news"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
              />
            </label>
            <div className="news-sorting">
              <button aria-pressed={!popular} onClick={() => setPopular(false)}>
                Newest first
              </button>
              <button aria-pressed={popular} onClick={() => setPopular(true)}>
                Popular first
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="site-container news-page">
        {!query && category === "all" && type === "all" && (
          <>
            <div className="featured-news">
              {[
                [
                  "feature-main.jpg",
                  "Top 3 Coins to Watch Nov 5 - Nov 11, 2018",
                ],
                ["feature-trx.jpg", "100,000 TRX Giveaway"],
                [
                  "feature-recap.jpg",
                  "Crypto Recap of the Week Oct 29 - Nov 4, 2018",
                ],
              ].map(([image, title], i) => (
                <a
                  key={image}
                  href="/news/huobi-stablecoin/"
                  className={"featured-card feature-" + i}
                >
                  <img src={"/media/" + image} alt="" />
                  <div>
                    <h2>{title}</h2>
                    <span>
                      a day ago | {i === 2 ? "George Kingslay" : "Jon Nielsen"}
                    </span>
                  </div>
                </a>
              ))}
            </div>
            <div className="news-ticker">
              {basket.slice(0, 5).map((a) => (
                <a href={"/coins/" + a.slug + "/"} key={a.symbol}>
                  <b>{a.symbol}</b>
                  <span>
                    {money(a.price)}{" "}
                    <i className={a.change > 0 ? "positive" : "negative"}>
                      ({a.change}%)
                    </i>
                  </span>
                  <Sparkline negative={a.change < 0} />
                </a>
              ))}
            </div>
          </>
        )}
        <NewsCards items={items.slice(0, limit)} />
        {!items.length && <p className="empty-cell">No news found.</p>}
        <div className="center-action">
          <button
            className="button navy"
            disabled={limit >= items.length}
            onClick={() => setLimit(limit + 9)}
          >
            View More News
          </button>
        </div>
      </div>
      <Subscribe />
      <Footer />
    </>
  );
}
function Article({ slug }: { slug: string }) {
  const item =
    [...news, ...coinNews].find((n) => n.slug === slug) ??
    news.find((n) => n.slug === "huobi-stablecoin")!;
  const huobi = slug === "huobi-stablecoin";
  return (
    <>
      <div className="article-hero">
        <div className="site-container">
          <h1>
            {huobi ? (
              <>
                One coin to Rule Them All?
                <br />
                Huobi’s New Program Lets Users Swap Between Tokens
              </>
            ) : (
              item.title
            )}
          </h1>
          <div className="article-meta">
            <a
              className="category-tag"
              href={"/news/?category=" + item.category}
            >
              {item.category}
            </a>
            <time>{item.date}</time>
            <span>
              Total views &nbsp;<b>394</b>
            </span>
            <span>
              Total shares &nbsp;<b>61</b>
            </span>
          </div>
        </div>
      </div>
      <main className="site-container article-layout" data-mockup="PUB-14">
        <aside>
          <Socials article />
        </aside>
        <article>
          <p>
            {huobi
              ? "Singapore-based cryptocurrency exchange Huobi Global today introduced an all-in-one stablecoin program called HUSD, which will allow traders to convert between four USD-pegged cryptocurrency tokens."
              : item.title +
                ". This archival publication discusses developments in blockchain technology and cryptocurrency markets."}
          </p>
          <img
            className="article-photo"
            src={"/media/" + item.image}
            width="760"
            height="400"
            alt={huobi ? "Huobi Global on a mobile phone" : ""}
          />
          <h2>
            {huobi
              ? "HUSD: Huobi’s All-in-One Stablecoin Solution"
              : item.title}
          </h2>
          {huobi ? (
            <>
              <p>
                According to the announcement, the HUSD solution aims to reduce
                the need to choose between multiple stablecoins, as well as to
                cut down on transaction costs incurred when switching between
                these US dollar-pegged assets. It does so by automatically
                converting all stablecoin deposits on Huobi’s platform to its
                newly launched HUSD token, which is native to the exchange and
                cannot be withdrawn.
              </p>
              <p>
                According to Huobi, HUSD is pegged to stablecoin deposits rather
                than USD itself. Its supply mechanism appears to be more
                equivalent to regulated wallet services that people recharge
                with fiat debit/credit cards, and, in return, instantly receive
                available platform tokens to shop or pay for utility bills. Only
                in the case of Huobi, people pay via stablecoins to purchase
                HUSD as platform tokens.
              </p>
              <p>
                Considering that the instability of any stablecoin listed on
                Huobi can impact HUSD functionality, the exchange has confirmed
                that it would evaluate each before deciding to add them to its
                trading platform.
              </p>
              <h2>Tether Not Listed among Stablecoins</h2>
              <p>
                Huobi has added four stablecoins, which are Paxos Standard
                (PAX), USD Coin (USDC), TrueUSD (TUSD), and Gemini Dollar
                (GUSD), to its HUSD solution portfolio. The exchange had
                announced the opening of deposits for these stablecoins earlier
                in October.
              </p>
              <p>
                Other stablecoins are visibly closing in to ease out the traders
                after its volatile performance. At the same time, the volumes of
                stablecoin alternatives are surging.
              </p>
            </>
          ) : (
            <>
              <p>
                This demonstration card preserves the title and photograph from
                the supplied design. A complete licensed article has not been
                supplied for this publication.
              </p>
              <p>
                Market prices and events shown in the prototype are historical
                examples. They are not current financial information.
              </p>
            </>
          )}
          <p className="article-author">AUTHOR &nbsp; Josiah Wilmoth</p>
          <div className="article-tags" id="article-tags">
            {[
              "Blockchain news",
              "HuobyGlobal",
              "Exchange",
              "Cryptocurrency",
            ].map((t) => (
              <a href="/news/" key={t}>
                #{t}
              </a>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
export default function Public({
  page = "home",
  slug = "bitcoin",
  tab = "overview",
}: {
  page?: Page;
  slug?: string;
  tab?: string;
}) {
  return (
    <div
      className={"public-shell public-" + page}
      data-mockup={
        page === "home"
          ? "PUB-01"
          : page === "index"
            ? "PUB-03"
            : page === "coins"
              ? "PUB-06"
              : page === "exchanges"
                ? "PUB-04"
                : page === "exchange"
                  ? "PUB-05"
                  : page === "news"
                    ? "PUB-13"
                    : page === "article"
                      ? "PUB-14"
                      : page === "coin"
                        ? ({
                            overview: "PUB-07",
                            charts: "PUB-08",
                            "historical-price": "PUB-09",
                            markets: "PUB-10",
                            news: "PUB-11",
                          }[tab] ?? "PUB-07")
                        : undefined
      }
    >
      <div className="public-top">
        <Header />
      </div>
      {page === "home" ? (
        <Home />
      ) : page === "index" ? (
        <IndexPage slug={slug} />
      ) : page === "coins" ? (
        <Coins />
      ) : page === "coin" ? (
        <CoinInfo slug={slug} tab={tab} />
      ) : page === "exchanges" ? (
        <Exchanges />
      ) : page === "exchange" ? (
        <Exchange slug={slug} />
      ) : page === "news" ? (
        <NewsPage />
      ) : page === "article" ? (
        <Article slug={slug} />
      ) : (
        <>
          <div className="site-container privacy-content">
            <h1>Privacy and local data</h1>
            <p>
              This demonstration stores profile preferences, sample balances and
              operations only in this browser’s localStorage. There are no
              analytics counters or real payment connections. Clear site data or
              use Setting in the account to reset the demonstration.
            </p>
            <a className="button primary" href="/">
              Back to TBCi
            </a>
          </div>
          <Footer />
        </>
      )}
    </div>
  );
}
