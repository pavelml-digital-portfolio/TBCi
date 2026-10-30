import { useEffect, useState } from "react";
import projects from "../data/ico-2018.json";

export const icoProjects = projects;
const SOURCE =
  "https://github.com/earlvanze/ICO-Analysis-Scraper/blob/master/ICO%20Analysis%20-%20ICOBench%20Analysis.csv";
const label = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const status = (p: (typeof projects)[number], at: string) =>
  p.start > at ? "Upcoming" : p.end < at ? "Ended" : "Active";
export default function IcoCalendar({ slug }: { slug?: string }) {
  const [month, setMonth] = useState(9);
  const [view, setView] = useState("List");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [kind, setKind] = useState("all");
  const [state, setState] = useState("all");
  const [day, setDay] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [onlySaved, setOnlySaved] = useState(false);
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("tbci-ico-watchlist") ?? "[]",
      );
      if (Array.isArray(value) && value.every((v) => typeof v === "string"))
        setSaved(value);
    } catch {}
    const m = new URLSearchParams(location.search).get("month");
    if (m && Number(m) >= 1 && Number(m) <= 12) setMonth(Number(m) - 1);
  }, []);
  const toggle = (id: string) => {
    const next = saved.includes(id)
      ? saved.filter((s) => s !== id)
      : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem("tbci-ico-watchlist", JSON.stringify(next));
    } catch {}
  };
  const monthStart = "2018-" + String(month + 1).padStart(2, "0") + "-01";
  const monthEnd =
    "2018-" +
    String(month + 1).padStart(2, "0") +
    "-" +
    new Date(Date.UTC(2018, month + 1, 0)).getUTCDate();
  const at = day ?? "2018-10-22";
  const matches = projects.filter(
    (p) =>
      (p.name + " " + p.token).toLowerCase().includes(query.toLowerCase()) &&
      (country === "all" || p.country === country) &&
      (kind === "all" || p.type === kind) &&
      (!onlySaved || saved.includes(p.id)) &&
      (state === "all" || status(p, at) === state),
  );
  const rows = matches.filter((p) =>
    day
      ? p.start <= day && p.end >= day
      : p.start <= monthEnd && p.end >= monthStart,
  );
  const first = new Date(Date.UTC(2018, month, 1));
  const padding = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(2018, month + 1, 0)).getUTCDate();
  const details = projects.find((p) => p.id === slug);
  if (details)
    return (
      <div className="site-container ico-detail">
        <a
          className="blue"
          href={"/ico/?month=" + Number(details.start.slice(5, 7))}
        >
          ← Back to 2018 calendar
        </a>
        <div className="ico-detail-heading">
          <span
            className="ico-project-icon"
            style={{ background: details.color }}
          >
            {details.token.slice(0, 2)}
          </span>
          <div>
            <span className="archive-badge">2018 archive</span>
            <h1>{details.name}</h1>
            <p>
              {details.token} · {details.type} · {details.country}
            </p>
          </div>
          <button
            className="button"
            aria-pressed={saved.includes(details.id)}
            onClick={() => toggle(details.id)}
          >
            {saved.includes(details.id) ? "★ Watching" : "☆ Watch project"}
          </button>
        </div>
        <div className="ico-facts">
          {[
            ["Sale start", label(details.start)],
            ["Sale end", label(details.end)],
            ["Reported raised", details.raised ?? "Not recorded"],
            ["Listed country", details.country],
            ["Token", details.token],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <div className="ico-detail-grid">
          <article>
            <h2>Project overview</h2>
            <p>{details.summary}</p>
            <h2>The historical sale window</h2>
            <p>
              The archived listing places this offering between{" "}
              {label(details.start)} and {label(details.end)}. Both dates fall
              in 2018. The window covers{" "}
              {Math.round(
                (Date.parse(details.end) - Date.parse(details.start)) /
                  86400000,
              ) + 1}{" "}
              calendar days, including the opening and closing dates.
            </p>
            <p>
              {details.raised
                ? "The listing reports " +
                  details.raised +
                  " raised. This is the source’s reported figure and may refer to a particular round rather than the full financing of the project."
                : "The source does not provide a raised amount for this entry. An absent value is not treated as zero or replaced with a simulated result."}{" "}
              The calendar preserves the archived token identifier and does not
              substitute a later token migration or rebrand.
            </p>
            <h2>Reading a 2018 token-sale record</h2>
            <p>
              Sale dates establish a fundraising interval. They do not establish
              the delivery date of a product, the release schedule of tokens or
              the rights held by each participant. Those questions require the
              original sale documents, allocation terms and dated technical
              releases.
            </p>
            <p>
              A private round, a public sale and a later exchange listing can
              have different prices and eligibility rules. When comparing
              projects, identify which round each number describes and whether
              the amount was reported in dollars, ether or another currency.
            </p>
            <div className="ico-milestones">
              <div>
                <span>01</span>
                <div>
                  <strong>Opening date</strong>
                  <p>{label(details.start)} · recorded sale window begins</p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <strong>Closing date</strong>
                  <p>{label(details.end)} · recorded sale window ends</p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <strong>Archive review</strong>
                  <p>
                    Compare the listing with original sale documents and a dated
                    network roadmap.
                  </p>
                </div>
              </div>
            </div>
            <div className="article-source-box">
              <strong>Historical data source</strong>
              <a href={SOURCE} target="_blank" rel="noreferrer">
                Archived ICObench CSV · data row {details.sourceRow} ↗
              </a>
              <p>
                Secondary archive. Dates and reported proceeds are listing
                records, not independently confirmed sale results.
              </p>
            </div>
          </article>
          <aside className="ico-allocation">
            <h2>Illustrative token allocation</h2>
            <p>
              Mock allocation for exploring the interface. These percentages are
              not the project’s historical tokenomics.
            </p>
            <div
              className="ico-allocation-ring"
              role="img"
              aria-label="Illustrative token allocation"
              style={{
                background:
                  "conic-gradient(" +
                  details.allocation
                    .map((a, i) => {
                      const prev = details.allocation
                        .slice(0, i)
                        .reduce((s, p) => s + p.share, 0);
                      return (
                        ["#218dff", "#8a7ec9", "#27a68d", "#e8b94f", "#e87e8e"][
                          i
                        ] +
                        " " +
                        prev +
                        "% " +
                        (prev + a.share) +
                        "%"
                      );
                    })
                    .join(",") +
                  ")",
              }}
            >
              <span>
                100%<small>Sample allocation</small>
              </span>
            </div>
            {details.allocation.map((a, i) => (
              <div className="allocation-row" key={a.label}>
                <i
                  style={{
                    background: [
                      "#218dff",
                      "#8a7ec9",
                      "#27a68d",
                      "#e8b94f",
                      "#e87e8e",
                    ][i],
                  }}
                />
                <span>{a.label}</span>
                <strong>{a.share}%</strong>
              </div>
            ))}
            <a className="button primary" href="/news/ico-year-in-review/">
              How to read an ICO calendar →
            </a>
          </aside>
        </div>
        <section className="ico-related">
          <h2>More 2018 offerings</h2>
          <div className="ico-mini-grid">
            {projects
              .filter(
                (p) =>
                  p.id !== slug &&
                  p.start.slice(5, 7) === details.start.slice(5, 7),
              )
              .slice(0, 3)
              .map((p) => (
                <a key={p.id} href={"/ico/" + p.id + "/"}>
                  <span
                    className="ico-project-icon"
                    style={{ background: p.color }}
                  >
                    {p.token.slice(0, 2)}
                  </span>
                  <strong>{p.name}</strong>
                  <small>
                    {label(p.start)} – {label(p.end)}
                  </small>
                </a>
              ))}
          </div>
        </section>
      </div>
    );
  return (
    <>
      <div className="list-hero ico-hero">
        <div className="site-container">
          <div className="section-row">
            <h1>ICO calendar</h1>
            <span className="archive-badge">January–December 2018</span>
          </div>
          <p>
            Explore {projects.length} archived token offerings. Dates and
            reported proceeds come from historical listings.
          </p>
          <div className="market-filter-bar">
            <label>
              Search
              <input
                aria-label="Search ICO"
                type="search"
                placeholder="Project or token"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Country
              <select
                aria-label="ICO country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="all">All countries</option>
                {[...new Set(projects.map((p) => p.country))]
                  .sort()
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </select>
            </label>
            <label>
              Type
              <select
                aria-label="ICO type"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="all">All types</option>
                {[...new Set(projects.map((p) => p.type))].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                aria-label="ICO status"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="all">All statuses</option>
                {["Active", "Upcoming", "Ended"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button
              className="button dark"
              aria-pressed={onlySaved}
              onClick={() => setOnlySaved(!onlySaved)}
            >
              ☆ Watchlist ({saved.length})
            </button>
          </div>
        </div>
      </div>
      <main className="site-container ico-calendar">
        <div className="ico-summary">
          <div>
            <small>Archive selection</small>
            <strong>{projects.length} projects</strong>
          </div>
          <div>
            <small>Starting this month</small>
            <strong>
              {
                projects.filter(
                  (p) => p.start.slice(0, 7) === monthStart.slice(0, 7),
                ).length
              }{" "}
              offerings
            </strong>
          </div>
          <div>
            <small>Open at month end</small>
            <strong>
              {projects.filter((p) => status(p, monthEnd) === "Active").length}
            </strong>
          </div>
          <div>
            <small>Countries represented</small>
            <strong>{new Set(projects.map((p) => p.country)).size}</strong>
          </div>
        </div>
        <div className="ico-calendar-toolbar">
          <div className="ico-month-controls">
            <button
              className="button"
              aria-label="Previous ICO month"
              disabled={month === 0}
              onClick={() => {
                setMonth(month - 1);
                setDay(null);
              }}
            >
              ‹
            </button>
            <select
              aria-label="ICO month"
              value={month}
              onChange={(e) => {
                setMonth(Number(e.target.value));
                setDay(null);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(Date.UTC(2018, i, 1)).toLocaleString("en", {
                    month: "long",
                    timeZone: "UTC",
                  })}{" "}
                  2018
                </option>
              ))}
            </select>
            <button
              className="button"
              aria-label="Next ICO month"
              disabled={month === 11}
              onClick={() => {
                setMonth(month + 1);
                setDay(null);
              }}
            >
              ›
            </button>
          </div>
          <div className="ico-view-controls">
            {["List", "Calendar"].map((v) => (
              <button
                className="button"
                key={v}
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  setDay(null);
                }}
              >
                {v === "Calendar" ? "▦" : "☷"} {v}
              </button>
            ))}
          </div>
        </div>
        <p className="ico-results">
          {rows.length} listings overlap{" "}
          {day
            ? label(day)
            : new Date(Date.UTC(2018, month, 1)).toLocaleString("en", {
                month: "long",
                timeZone: "UTC",
              }) + " 2018"}{" "}
          · Status as of {label(at)}
          {day && (
            <button className="plain blue" onClick={() => setDay(null)}>
              Clear day filter ×
            </button>
          )}
        </p>
        {view === "Calendar" && (
          <>
            <div className="ico-month-grid">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((v) => (
                <div className="weekday" key={v}>
                  {v}
                </div>
              ))}
              {Array.from({ length: padding }, (_, i) => (
                <div key={"blank" + i} className="empty-day" />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const date =
                  monthStart.slice(0, 8) + String(i + 1).padStart(2, "0");
                const entries = matches.filter(
                  (p) => p.start <= date && p.end >= date,
                );
                return (
                  <button
                    className={"ico-day " + (date === day ? "selected" : "")}
                    key={date}
                    aria-label={
                      label(date) + ", " + entries.length + " offerings"
                    }
                    onClick={() => setDay(date)}
                  >
                    <strong>{i + 1}</strong>
                    {entries.slice(0, 2).map((p) => (
                      <span key={p.id} style={{ borderColor: p.color }}>
                        {p.name}
                      </span>
                    ))}
                    {entries.length > 2 && (
                      <small>+{entries.length - 2} more</small>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="subtle">
              Choose a day to see the offerings open on that date.
            </p>
          </>
        )}
        <div className="table-scroll">
          <table className="ico-table">
            <thead>
              <tr>
                {[
                  "Watch",
                  "Project",
                  "Token / Type",
                  "Country",
                  "Sale window",
                  "Reported raised",
                  "Status at reference date",
                ].map((v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button
                      className="watch-star"
                      aria-pressed={saved.includes(p.id)}
                      aria-label={"Watch " + p.name}
                      onClick={() => toggle(p.id)}
                    >
                      {saved.includes(p.id) ? "★" : "☆"}
                    </button>
                  </td>
                  <td>
                    <a className="ico-project-name" href={"/ico/" + p.id + "/"}>
                      <span
                        className="ico-project-icon"
                        style={{ background: p.color }}
                      >
                        {p.token.slice(0, 2)}
                      </span>
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.sector}</small>
                      </span>
                    </a>
                  </td>
                  <td>
                    {p.token}
                    <small>{p.type}</small>
                  </td>
                  <td>{p.country}</td>
                  <td>
                    <time>{label(p.start)}</time>
                    <small>to {label(p.end)}</small>
                  </td>
                  <td>
                    {p.raised ?? <span className="subtle">Not recorded</span>}
                  </td>
                  <td>
                    <span
                      className={"ico-status " + status(p, at).toLowerCase()}
                    >
                      {status(p, at)}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No ICO listings match this month and these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="ico-archive-note">
          <h2>About this calendar</h2>
          <p>
            Only entries whose recorded start and end dates both fall in 2018
            are included. Invalid date ranges were excluded. This is a selected
            historical archive, not a complete record of all offerings or a live
            sale calendar.
          </p>
          <a href={SOURCE} target="_blank" rel="noreferrer">
            View archived listing data ↗
          </a>
          <a href="/news/ico-year-in-review/">
            Read the 2018 token-sale guide →
          </a>
        </div>
      </main>
    </>
  );
}
