import { useMemo, useState } from "react";
import { coin, money, number } from "../data/demo";
import { coinProfiles } from "../data/coin-profiles";
import { recentNews } from "../data/content";
import { marketStats, hash, random, profiles } from "../data/market";
import TradingChart from "./TradingChart";
export function MarketNotes({ symbol }: { symbol: string }) {
  const p = coinProfiles[symbol] ?? coinProfiles.BTC;
  const stats = marketStats(symbol);
  return (
    <section className="market-notes">
      <div>
        <h2>2018 market snapshot</h2>
        <div className="market-stat-cards">
          {[
            [
              "Period return",
              (stats.returnPct > 0 ? "+" : "") +
                number(stats.returnPct, 2) +
                "%",
            ],
            ["Annualized volatility", number(stats.volatility, 1) + "%"],
            ["Period high", money(stats.high, stats.high < 1 ? 4 : 2)],
            ["Period low", money(stats.low, stats.low < 1 ? 4 : 2)],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <p>{p.summary}</p>
        <p>{p.detail}</p>
        <small className="subtle">
          Illustrative 2018 market series · not exchange history
        </small>
      </div>
      <aside>
        <h2>Research desk</h2>
        {recentNews
          .filter((n) =>
            ["markets", "infrastructure", "standards"].includes(n.topic),
          )
          .slice(0, 4)
          .map((n) => (
            <a
              className="research-link"
              href={"/news/" + n.slug + "/"}
              key={n.slug}
            >
              <time>{n.date}</time>
              <strong>{n.title}</strong>
              <span>{n.readMinutes} min read →</span>
            </a>
          ))}
      </aside>
    </section>
  );
}
export function CoinExtra({ symbol, tab }: { symbol: string; tab: string }) {
  const a = coin(symbol);
  const p = coinProfiles[symbol] ?? coinProfiles.BTC;
  const [side, setSide] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [open, setOpen] = useState<number | null>(0);
  const rows = useMemo(() => {
    const rnd = random(hash(symbol));
    return Array.from({ length: 30 }, (_, i) => ({
      time: new Date(Date.UTC(2018, 11, 31, 18, 42 - i)).toISOString(),
      price: a.price * (0.998 + rnd() * 0.004),
      amount: 0.05 + rnd() * 3,
      side: rnd() > 0.5 ? "Buy" : "Sell",
    }));
  }, [symbol]);
  if (tab === "analysis")
    return (
      <>
        <h2>{a.name} Analysis</h2>
        <p className="section-intro">
          Explore trend, volatility and relative performance with simulated 2018
          data. Indicators describe past observations, not a forecast.
        </p>
        <TradingChart instrument={symbol} compare height={350} />
        <MarketNotes symbol={symbol} />
      </>
    );
  if (tab === "trades")
    return (
      <>
        <div className="section-row">
          <h2>{a.name} Trades</h2>
          <div className="inline-actions">
            {["All", "Buy", "Sell"].map((v) => (
              <button
                className="button small"
                key={v}
                aria-pressed={side === v}
                onClick={() => setSide(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <p className="section-intro">
          Simulated trade tape · 31 December 2018 · UTC. Newest trades first.
        </p>
        <div className="table-scroll">
          <table className="mock-trades">
            <thead>
              <tr>
                {[
                  "Time (UTC)",
                  "Side",
                  "Price (USD)",
                  "Amount",
                  "Total (USD)",
                  "Venue",
                ].map((v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => side === "All" || side === r.side)
                .map((r, i) => (
                  <tr key={r.time}>
                    <td>{r.time.slice(11, 19)}</td>
                    <td className={r.side === "Buy" ? "positive" : "negative"}>
                      {r.side}
                    </td>
                    <td>{money(r.price, r.price < 1 ? 6 : 2)}</td>
                    <td>
                      {number(r.amount, 5)} {symbol}
                    </td>
                    <td>{money(r.price * r.amount)}</td>
                    <td>{["Binance", "Huobi", "OKEx", "Kraken"][i % 4]}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </>
    );
  if (tab === "forum") {
    const threads = [
      [
        "How do you compare liquidity across exchanges?",
        "Mira Chen",
        12,
        "A useful comparison uses the same pair and observation time. Check the spread, depth near the quoted price and withdrawal availability rather than relying on total volume alone.",
      ],
      [
        "What does a moving average add to a chart?",
        "Alex Morgan",
        8,
        "A moving average smooths past observations. Changing the window changes the delay and the amount of noise that remains. It is descriptive rather than a guarantee about the next price.",
      ],
      [
        "Keeping network transfers separate from P&L",
        "Nina Brooks",
        6,
        "A deposit increases quantity; a price change increases or decreases the equivalent value. Separating these events makes it possible to reconcile an account without treating cash movement as market performance.",
      ],
      ["Reading the 2018 " + a.name + " roadmap", "Leo Park", 4, p.detail],
      [
        "Why does an index differ from one coin?",
        "Sam Rivera",
        3,
        "Weights, constituent eligibility and correlations determine the basket path. Two indices can end near the same value while having very different drawdowns and volatility along the way.",
      ],
    ];
    return (
      <>
        <div className="section-row">
          <h2>{a.name} Community</h2>
          <select
            aria-label="Sort discussions"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Newest</option>
            <option>Most replies</option>
          </select>
        </div>
        <p className="section-intro">
          Sample discussions from a 2018 research community. Participants and
          replies are fictional.
        </p>
        <div className="community-threads">
          {(sort === "Newest" ? [...threads].reverse() : threads).map(
            ([title, author, replies, answer], i) => (
              <article key={String(title)}>
                <button
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="community-avatar">
                    {String(author)
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>
                      {author} · November {22 - i}, 2018
                    </small>
                  </span>
                  <b>
                    {replies}
                    <small>replies</small>
                  </b>
                </button>
                {open === i && <p>{answer}</p>}
              </article>
            ),
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <h2>{a.name} Timeline</h2>
      <p className="section-intro">
        Illustrative research timeline for 2018. These entries demonstrate a
        dated workflow, not verified project announcements.
      </p>
      <div className="market-timeline">
        {[
          [
            "2018-01-15",
            "Research baseline",
            "Record the network model, token supply and the available trading venues.",
          ],
          [
            "2018-03-20",
            "Liquidity review",
            "Compare spreads and volume across several markets using the same observation window.",
          ],
          ["2018-06-12", "Technical review", p.summary],
          [
            "2018-08-30",
            "Portfolio checkpoint",
            "Review the position against concentration and liquidity rules before considering a rebalance.",
          ],
          [
            "2018-10-22",
            "Market update",
            "Compare the asset with the selected index and record the source and time of every valuation.",
          ],
          [
            "2018-12-31",
            "Year-end review",
            "Separate market returns from deposits, withdrawals and changes to the basket composition.",
          ],
        ].map(([date, title, text]) => (
          <article key={date}>
            <time>{date}</time>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
export function IndexNotes({ id }: { id: string }) {
  const p = profiles[id] ?? profiles["tbci-20-stable"];
  const s = marketStats(id);
  return (
    <div className="index-notes">
      <p>{p.description}</p>
      <div className="market-stat-cards">
        {[
          ["Risk profile", p.risk],
          ["2018 mock return", number(s.returnPct, 1) + "%"],
          ["Annualized volatility", number(s.volatility, 1) + "%"],
          ["Historical observations", "365 daily bars"],
        ].map(([k, v]) => (
          <div key={k}>
            <small>{k}</small>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
