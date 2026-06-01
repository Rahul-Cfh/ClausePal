import Link from 'next/link';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap');

:root{
  --bg:#F2EFEB;--ink:#1A1612;--ink-soft:#4A453E;--paper:#FBFAF7;
  --forest:#1F4A3B;--forest-2:#1A4032;--coral:#E9A79D;--coral-deep:#D98377;
  --yellow:#EFB23E;--lavender:#CEC2E8;
  --line:rgba(26,22,18,.13);--line-strong:rgba(26,22,18,.22);
  --accent:#E9A79D;
  --card-r:30px;
  --serif:"Newsreader",Georgia,serif;
  --sans:"Hanken Grotesk",system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
.lp{background:var(--bg);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;line-height:1.5}
.wrap{max-width:1320px;margin:0 auto;padding:0 32px}
a{color:inherit;text-decoration:none}
.label{font-family:var(--mono);font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:500}

nav{position:sticky;top:0;z-index:50;background:var(--bg);border-bottom:1px solid var(--line)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:78px}
.brand{display:flex;align-items:center;gap:12px}
.badge{width:34px;height:34px;border-radius:50%;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-family:var(--serif);font-size:18px;font-weight:500;padding-bottom:2px}
.brand-name{font-family:var(--serif);font-size:25px;font-weight:600;letter-spacing:-.01em}
.nav-pills{display:flex;align-items:center;gap:6px}
.pill{font-family:var(--mono);font-size:13px;letter-spacing:.02em;padding:9px 18px;border-radius:999px;color:var(--ink-soft);transition:.18s}
.pill:hover{color:var(--ink);background:rgba(26,22,18,.05)}
.pill.active{background:var(--ink);color:var(--bg)}
.nav-actions{display:flex;align-items:center;gap:10px}
.btn{font-family:var(--sans);font-weight:600;font-size:14.5px;cursor:pointer;padding:11px 22px;border-radius:999px;border:1px solid var(--ink);background:transparent;color:var(--ink);transition:.18s;white-space:nowrap;display:inline-block;text-align:center}
.btn:hover{background:rgba(26,22,18,.06)}
.btn.solid{background:var(--ink);color:var(--bg)}
.btn.solid:hover{background:#000}

.ticker{border-bottom:1px solid var(--line);overflow:hidden;background:var(--bg)}
.ticker-track{display:flex;gap:0;white-space:nowrap;animation:lp-scroll 38s linear infinite;width:max-content}
.ticker:hover .ticker-track{animation-play-state:paused}
.ticker-item{font-family:var(--mono);font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft);padding:13px 34px;display:flex;align-items:center;gap:10px}
.dot{width:6px;height:6px;border-radius:50%;background:var(--coral-deep);display:inline-block}
@keyframes lp-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.hero{padding:60px 0 70px}
.hero-grid{display:grid;grid-template-columns:1.04fr .96fr;gap:54px;align-items:center}
.tag{display:inline-flex;align-items:center;gap:10px;white-space:nowrap;background:var(--accent);color:var(--ink);padding:7px 15px;border-radius:8px;font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:600}
.eyebrow{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.meta-line{font-family:var(--mono);font-size:12.5px;color:var(--ink-soft);letter-spacing:.03em}
.hero h1{font-family:var(--serif);font-weight:500;letter-spacing:-.022em;font-size:clamp(46px,6.1vw,90px);line-height:.98;margin:22px 0 0;text-wrap:balance}
.hero h1 em{font-style:italic;font-weight:500}
.hero-sub{font-size:19px;line-height:1.5;color:var(--ink-soft);max-width:480px;margin-top:30px;padding-top:26px;border-top:1px solid var(--line)}
.hero-cta{display:flex;align-items:center;gap:14px;margin-top:30px;flex-wrap:wrap}
.cta-note{font-family:var(--mono);font-size:12px;color:var(--ink-soft);letter-spacing:.02em}

.feature-card{position:relative;border-radius:var(--card-r);background:var(--forest);color:#EFEDE6;padding:34px 34px 38px;min-height:540px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(26,40,32,.55);transition:background .3s}
.feature-card::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 85% 0%,rgba(255,255,255,.13),transparent 55%);pointer-events:none}
.fc-head{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:2}
.fc-kicker{font-family:var(--mono);font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:rgba(239,237,230,.62)}
.fc-kicker strong{display:block;color:#EFEDE6;font-weight:500;margin-top:5px;letter-spacing:.05em}
.fc-arrow{width:42px;height:42px;border-radius:50%;border:1px solid rgba(239,237,230,.32);display:grid;place-items:center;color:#EFEDE6;font-size:17px;flex-shrink:0;transition:.2s}
.feature-card:hover .fc-arrow{background:rgba(239,237,230,.14)}
.chat-stack{position:relative;margin-top:54px;height:250px}
.bubble{position:absolute;border-radius:16px;padding:16px 18px;max-width:330px;box-shadow:0 18px 34px -16px rgba(0,0,0,.4)}
.bubble .b-label{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;opacity:.6}
.bubble .b-text{font-family:var(--serif);font-size:18px;line-height:1.32}
.bubble.draft{background:#F7F5EF;color:var(--ink);top:0;left:0;z-index:2}
.bubble.rewrite{background:var(--accent);color:var(--ink);top:128px;left:78px;z-index:3}
.feature-card.fc-lav{background:var(--lavender);color:var(--ink)}
.feature-card.fc-lav .fc-kicker{color:rgba(26,22,18,.6)}
.feature-card.fc-lav .fc-kicker strong{color:var(--ink)}
.feature-card.fc-lav .fc-arrow{border-color:rgba(26,22,18,.32);color:var(--ink)}
.feature-card.fc-lav .fc-foot .label{color:rgba(26,22,18,.55)}
.feature-card.fc-lav .fc-time{color:var(--ink)}
.b-text .hl{background:rgba(26,22,18,.12);border-radius:3px;padding:0 3px}
.fc-foot{position:absolute;left:34px;bottom:34px;z-index:2}
.fc-foot .label{color:rgba(239,237,230,.6)}
.fc-time{font-family:var(--serif);font-size:48px;font-weight:500;letter-spacing:.01em;line-height:1;margin-top:6px}

.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:30px;flex-wrap:wrap}
.sec-head h2{font-family:var(--serif);font-weight:500;font-size:clamp(30px,3.4vw,46px);letter-spacing:-.02em;line-height:1.02;max-width:680px;text-wrap:balance}
.sec-head h2 em{font-style:italic}
.sec-head p{color:var(--ink-soft);max-width:330px;font-size:15.5px}

.bento{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;padding-bottom:30px}
.card{border-radius:var(--card-r);padding:28px;position:relative;overflow:hidden;display:flex;flex-direction:column;border:1px solid transparent;transition:transform .2s}
.card:hover{transform:translateY(-3px)}
.c-label{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:500}
.card h3{font-family:var(--serif);font-weight:500;font-size:27px;letter-spacing:-.015em;line-height:1.08}
.card p{font-size:14.5px;line-height:1.5}
.corner{position:absolute;right:22px;bottom:22px;width:36px;height:36px;border-radius:50%;border:1px solid var(--line-strong);display:grid;place-items:center;font-size:15px}
.card-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:18px}
.col-7{grid-column:span 7}.col-5{grid-column:span 5}.col-3{grid-column:span 3}.col-6{grid-column:span 6}
.c-paper{background:var(--paper);border-color:var(--line)}
.c-coral{background:var(--coral)}
.c-yellow{background:var(--yellow)}
.c-forest{background:var(--forest);color:#EFEDE6}
.c-forest .corner{border-color:rgba(239,237,230,.3);color:#EFEDE6}
.c-dark{background:var(--ink);color:#E9E5DE}
.c-dark .corner{border-color:rgba(233,229,222,.25);color:#E9E5DE}

.term{font-family:var(--mono);font-size:13px;line-height:1.95;margin-top:14px}
.term .add{color:#7FD7A6}.term .del{color:#E89A8E}.term .dim{color:rgba(233,229,222,.45)}.term .cur{color:var(--yellow)}

.score-num{font-family:var(--serif);font-size:74px;font-weight:500;line-height:.86;letter-spacing:-.01em}
.score-num small{font-size:24px;opacity:.55}
.bars{display:flex;flex-direction:column;gap:11px;margin-top:20px}
.bar-row{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:11.5px;letter-spacing:.04em}
.bar-row .name{width:96px;text-transform:uppercase;opacity:.78}
.track{flex:1;height:7px;border-radius:99px;background:rgba(26,22,18,.16);overflow:hidden}
.track i{display:block;height:100%;border-radius:99px;background:var(--ink)}

.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.chip{font-family:var(--mono);font-size:11.5px;letter-spacing:.03em;padding:7px 13px;border-radius:99px;background:rgba(26,22,18,.09);display:flex;align-items:center;gap:7px}
.chip .risk{width:7px;height:7px;border-radius:50%}
.r-high{background:#C2402E}.r-med{background:#C9892A}.r-low{background:#2E7D4F}

.mini-chat{display:flex;flex-direction:column;gap:11px;margin-top:18px}
.mb{border-radius:14px;padding:12px 15px;font-size:14px;line-height:1.4;max-width:90%}
.mb.q{background:rgba(239,237,230,.14);align-self:flex-start;font-family:var(--mono);font-size:12.5px;letter-spacing:.01em}
.mb.a{background:#F4F2EB;color:var(--ink);align-self:flex-end;font-family:var(--serif);font-size:16px}

.ob-list{margin-top:14px;display:flex;flex-direction:column}
.ob{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 0;border-top:1px solid var(--line)}
.ob:first-child{border-top:none}
.ob .ob-name{font-size:15px}
.ob .ob-when{font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;color:var(--ink-soft)}
.ob .ob-when.due{color:var(--coral-deep)}

.logos{padding:64px 0;border-top:1px solid var(--line);text-align:center}
.logos .label{color:var(--ink-soft);display:block;margin-bottom:30px}
.logo-row{display:flex;flex-wrap:wrap;justify-content:center;gap:46px;align-items:center}
.logo-row span{font-family:var(--serif);font-style:italic;font-size:26px;color:rgba(26,22,18,.55);font-weight:500}

.pricing{padding:78px 0 90px;border-top:1px solid var(--line)}
.price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:8px}
.tier{border-radius:var(--card-r);padding:32px;display:flex;flex-direction:column;min-height:520px}
.tier.t-paper{background:var(--paper);border:1px solid var(--line)}
.tier.t-forest{background:var(--forest);color:#EFEDE6}
.tier.t-dark{background:var(--ink);color:#E9E5DE}
.tier .t-name{font-family:var(--serif);font-size:24px;font-weight:500}
.tier .t-for{font-family:var(--mono);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.62;margin-top:6px}
.t-price{font-family:var(--serif);font-size:58px;font-weight:500;line-height:1;margin:26px 0 4px;letter-spacing:-.01em}
.t-price span{font-family:var(--mono);font-size:14px;letter-spacing:.02em;opacity:.6}
.t-line{height:1px;background:currentColor;opacity:.16;margin:24px 0}
.feat{display:flex;flex-direction:column;gap:13px;font-size:14.5px}
.feat div{display:flex;gap:11px;align-items:flex-start}
.feat .mk{font-family:var(--mono);opacity:.7;flex-shrink:0}
.tier .btn{width:100%;text-align:center;margin-top:auto}
.tier.t-paper .btn{margin-top:28px}
.tier.t-forest .btn,.tier.t-dark .btn{border-color:rgba(239,237,230,.4);color:#EFEDE6;margin-top:28px}
.tier.t-forest .btn.solid,.tier.t-dark .btn.solid{background:var(--accent);color:var(--ink);border-color:var(--accent)}
.badge-pop{display:inline-block;background:var(--accent);color:var(--ink);font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;padding:4px 10px;border-radius:99px;margin-left:10px;vertical-align:middle}

footer{background:var(--ink);color:#E9E5DE;padding:80px 0 40px;border-radius:34px 34px 0 0}
.foot-top{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px}
.foot-brand h2{font-family:var(--serif);font-weight:500;font-size:46px;letter-spacing:-.02em;line-height:1}
.foot-brand h2 em{font-style:italic}
.foot-brand p{color:rgba(233,229,222,.6);font-size:14.5px;margin-top:18px;max-width:280px}
.fcol .label{color:rgba(233,229,222,.45);display:block;margin-bottom:18px}
.fcol a{display:block;color:rgba(233,229,222,.82);font-size:15px;padding:7px 0;transition:.15s}
.fcol a:hover{color:#fff}
.foot-bot{display:flex;justify-content:space-between;align-items:center;margin-top:64px;padding-top:26px;border-top:1px solid rgba(233,229,222,.14);flex-wrap:wrap;gap:14px}
.foot-bot span{font-family:var(--mono);font-size:12px;color:rgba(233,229,222,.5);letter-spacing:.03em}

@media(max-width:980px){
  .hero-grid{grid-template-columns:1fr;gap:38px}
  .feature-card{min-height:440px}
  .bento .card{grid-column:span 12 !important}
  .price-grid{grid-template-columns:1fr}
  .foot-top{grid-template-columns:1fr 1fr;gap:32px}
  .nav-pills{display:none}
}
@media(max-width:560px){
  .wrap{padding:0 20px}
  .nav-actions .btn:not(.solid){display:none}
  .foot-top{grid-template-columns:1fr}
}
`;

const TICKER_ITEMS: { text: string; dot?: true }[] = [
  { text: 'Read every contract like you wrote it yourself' },
  { text: 'NDAs · MSAs · SOWs · Leases · Employment', dot: true },
  { text: 'Avg review time — 38 seconds' },
  { text: 'SOC 2 Type II' },
  { text: 'Issue 042 · 15 Apr 2026' },
  { text: 'No clause left unread' },
];

export default function Home() {
  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav>
        <div className="wrap nav-inner">
          <div className="brand">
            <div className="badge">§</div>
            <div className="brand-name">ClausePal</div>
          </div>
          <div className="nav-pills">
            <a className="pill active" href="#">Product</a>
            <a className="pill" href="#bento">How it works</a>
            <a className="pill" href="#pricing">Pricing</a>
            <a className="pill" href="#">Docs</a>
          </div>
          <div className="nav-actions">
            <Link href="/auth" className="btn">Sign in</Link>
            <Link href="/analyze" className="btn solid">Analyze a contract →</Link>
          </div>
        </div>
      </nav>

      {/* TICKER — items duplicated for seamless loop */}
      <div className="ticker">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div className="ticker-item" key={i}>
              {item.dot && <span className="dot"></span>}
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-left">
            <div className="eyebrow">
              <span className="tag">⚖ AI Contract Analysis</span>
              <span className="meta-line">— Built for people who hate fine print</span>
            </div>
            <h1>Catch the clause<br />before it <em>catches</em><br />you.</h1>
            <p className="hero-sub">ClausePal reads a contract in seconds, scores its risk, flags the clauses that matter, and answers your questions in plain English — so you sign with your eyes open.</p>
            <div className="hero-cta">
              <Link href="/analyze" className="btn solid">Analyze a contract →</Link>
              <Link href="/analyze" className="btn">See a sample report</Link>
              <span className="cta-note">Free for your first 3 documents</span>
            </div>
          </div>

          {/* Featured card */}
          <div className="feature-card fc-lav">
            <div className="fc-head">
              <div className="fc-kicker">Live Review<strong>No. 042 / Master Services Agreement</strong></div>
              <div className="fc-arrow">↗</div>
            </div>
            <div className="chat-stack">
              <div className="bubble draft">
                <div className="b-label">Clause 9.2 — Liability</div>
                <div className="b-text">&ldquo;Provider&apos;s total liability shall <span className="hl">in no event exceed $500</span>.&rdquo;</div>
              </div>
              <div className="bubble rewrite">
                <div className="b-label">ClausePal flag — high risk</div>
                <div className="b-text">&ldquo;This caps their liability at $500. Industry standard is 12 months of fees — push back here.&rdquo;</div>
              </div>
            </div>
            <div className="fc-foot">
              <div className="label">Review time</div>
              <div className="fc-time">00:38</div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section className="wrap" id="bento" style={{ paddingTop: '30px' }}>
        <div className="sec-head">
          <h2>One upload. A full read of <em>every</em> page.</h2>
          <p>Upload a PDF or paste a clause. ClausePal turns dense legalese into a scorecard, a redline, and a conversation.</p>
        </div>

        <div className="bento">
          {/* Plain-English Summary */}
          <div className="card c-paper col-7">
            <div className="c-label" style={{ color: 'var(--ink-soft)' }}>Plain-English Summary · Auto-generated</div>
            <h3 style={{ marginTop: '16px', maxWidth: '520px' }}>&ldquo;This is a 24-month SaaS agreement that auto-renews. You can exit with <em style={{ fontStyle: 'italic' }}>60 days notice</em> — but only at term end.&rdquo;</h3>
            <p style={{ color: 'var(--ink-soft)', marginTop: '14px', maxWidth: '480px' }}>Every contract gets a 5-sentence brief at the top: term, renewal, exit, payment, and the single thing you should look at first.</p>
            <div className="card-foot">
              <span className="c-label" style={{ color: 'var(--ink-soft)' }}>12-page MSA → 38s</span>
              <span className="corner">↗</span>
            </div>
          </div>

          {/* Clause Diff */}
          <div className="card c-dark col-5">
            <div className="c-label" style={{ color: 'rgba(233,229,222,.5)' }}>Clause Diff · vs. your playbook</div>
            <div className="term">
              <div><span className="dim">@@ indemnity §7.1</span></div>
              <div><span className="del">− mutual indemnification</span></div>
              <div><span className="add">+ one-sided — favors counterparty</span></div>
              <div><span className="dim">@@ termination §11</span></div>
              <div><span className="del">− 30 day notice</span></div>
              <div><span className="add">+ 90 day notice required</span></div>
              <div><span className="cur">→ 3 deviations flagged…</span></div>
            </div>
            <div className="card-foot">
              <span className="c-label" style={{ color: 'rgba(233,229,222,.5)' }}>Standards · awaiting review</span>
              <span className="corner">↗</span>
            </div>
          </div>

          {/* Scorecard */}
          <div className="card c-coral col-3">
            <div className="c-label">Risk Score</div>
            <div style={{ marginTop: '18px' }} className="score-num">68<small>/100</small></div>
            <div className="bars">
              <div className="bar-row"><span className="name">Liability</span><span className="track"><i style={{ width: '78%' }}></i></span></div>
              <div className="bar-row"><span className="name">Termination</span><span className="track"><i style={{ width: '60%' }}></i></span></div>
              <div className="bar-row"><span className="name">IP rights</span><span className="track"><i style={{ width: '42%' }}></i></span></div>
              <div className="bar-row"><span className="name">Payment</span><span className="track"><i style={{ width: '25%' }}></i></span></div>
            </div>
            <div className="card-foot"><span className="c-label">Moderate risk</span></div>
          </div>

          {/* Clause Analysis */}
          <div className="card c-yellow col-3">
            <div className="c-label">Clause Analysis</div>
            <h3 style={{ marginTop: '14px' }}>14 clauses<br />read &amp; ranked.</h3>
            <div className="chips">
              <span className="chip"><span className="risk r-high"></span>Auto-renewal</span>
              <span className="chip"><span className="risk r-high"></span>Liability cap</span>
              <span className="chip"><span className="risk r-med"></span>Indemnity</span>
              <span className="chip"><span className="risk r-med"></span>Non-compete</span>
              <span className="chip"><span className="risk r-low"></span>Governing law</span>
              <span className="chip"><span className="risk r-low"></span>Confidentiality</span>
            </div>
            <div className="card-foot"><span className="c-label">3 high · 5 medium · 6 low</span><span className="corner">↗</span></div>
          </div>

          {/* Chat */}
          <div className="card c-forest col-3">
            <div className="c-label" style={{ color: 'rgba(239,237,230,.55)' }}>Ask ClausePal</div>
            <div className="mini-chat">
              <div className="mb q">Can I cancel before 24 months?</div>
              <div className="mb a">Only for cause (§11.3). Otherwise you&apos;re in until renewal.</div>
              <div className="mb q">What&apos;s my notice period?</div>
            </div>
            <div className="card-foot">
              <span className="c-label" style={{ color: 'rgba(239,237,230,.55)' }}>Grounded in your doc</span>
              <span className="corner">↗</span>
            </div>
          </div>

          {/* Obligations */}
          <div className="card c-paper col-3">
            <div className="c-label" style={{ color: 'var(--ink-soft)' }}>Dates &amp; Obligations</div>
            <div className="ob-list">
              <div className="ob"><span className="ob-name">Renewal notice</span><span className="ob-when due">▲ 9 days</span></div>
              <div className="ob"><span className="ob-name">Invoice due — Net 30</span><span className="ob-when">22 Apr</span></div>
              <div className="ob"><span className="ob-name">Security review</span><span className="ob-when">30 Apr</span></div>
              <div className="ob"><span className="ob-name">Price-lock expires</span><span className="ob-when">14 Jun</span></div>
            </div>
            <div className="card-foot">
              <span className="c-label" style={{ color: 'var(--ink-soft)' }}>Synced to calendar</span>
              <span className="corner">↗</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="wrap logos">
        <span className="label">Trusted by teams who read the fine print</span>
        <div className="logo-row">
          <span>Northwind</span>
          <span>Vellum</span>
          <span>Harbor</span>
          <span>Lattice Legal</span>
          <span>Foundry</span>
          <span>Meridian</span>
        </div>
      </section>

      {/* PRICING */}
      <section className="wrap pricing" id="pricing">
        <div className="sec-head">
          <h2>Pricing that reads <em>plainly</em>, too.</h2>
          <p>Start free. Upgrade when contracts start stacking up. Cancel in two clicks — no 90-day notice required.</p>
        </div>
        <div className="price-grid">
          {/* Solo */}
          <div className="tier t-paper">
            <div className="t-name">Solo</div>
            <div className="t-for">For freelancers &amp; founders</div>
            <div className="t-price">$0<span>/forever</span></div>
            <div className="t-line"></div>
            <div className="feat">
              <div><span className="mk">→</span>3 contracts / month</div>
              <div><span className="mk">→</span>Risk score &amp; summary</div>
              <div><span className="mk">→</span>Ask-the-doc chat</div>
              <div><span className="mk">→</span>PDF &amp; paste upload</div>
            </div>
            <Link href="/analyze" className="btn">Start free</Link>
          </div>

          {/* Team */}
          <div className="tier t-forest">
            <div className="t-name">Team<span className="badge-pop">Most popular</span></div>
            <div className="t-for">For ops &amp; small legal</div>
            <div className="t-price">$39<span>/seat · mo</span></div>
            <div className="t-line"></div>
            <div className="feat">
              <div><span className="mk">→</span>Unlimited contracts</div>
              <div><span className="mk">→</span>Clause diff vs. your playbook</div>
              <div><span className="mk">→</span>Obligation &amp; renewal tracking</div>
              <div><span className="mk">→</span>Shared workspace &amp; comments</div>
              <div><span className="mk">→</span>Calendar &amp; Slack sync</div>
            </div>
            <Link href="/analyze" className="btn solid">Start 14-day trial</Link>
          </div>

          {/* Firm */}
          <div className="tier t-dark">
            <div className="t-name">Firm</div>
            <div className="t-for">For legal departments</div>
            <div className="t-price">Custom</div>
            <div className="t-line"></div>
            <div className="feat">
              <div><span className="mk">→</span>Everything in Team</div>
              <div><span className="mk">→</span>Custom clause playbooks</div>
              <div><span className="mk">→</span>SSO, audit log, data residency</div>
              <div><span className="mk">→</span>API &amp; bulk analysis</div>
              <div><span className="mk">→</span>Dedicated success manager</div>
            </div>
            <button className="btn">Talk to sales</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <h2>From clauses<br />to <em>clarity.</em></h2>
              <p>ClausePal is the contract co-pilot that reads what you don&apos;t have time to. Sign with your eyes open.</p>
            </div>
            <div className="fcol">
              <span className="label">Product</span>
              <a href="#">Risk scoring</a>
              <a href="#">Clause diff</a>
              <a href="#">Ask-the-doc</a>
              <a href="#">Obligation tracking</a>
              <a href="#">Integrations</a>
            </div>
            <div className="fcol">
              <span className="label">Company</span>
              <a href="#">About</a>
              <a href="#">Security</a>
              <a href="#">Careers</a>
              <a href="#">Changelog</a>
              <a href="#">Contact</a>
            </div>
            <div className="fcol">
              <span className="label">Legal</span>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">DPA</a>
              <a href="#">Not legal advice</a>
              <a href="#">SOC 2 report</a>
            </div>
          </div>
          <div className="foot-bot">
            <span>© 2026 ClausePal — Issue 042</span>
            <span>§ Built for people who read the fine print</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
