import './landing.css';
import Link from 'next/link';

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
