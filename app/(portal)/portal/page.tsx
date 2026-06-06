'use client';

import '../../portal/portal.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type SavedContract = {
  id: string;
  contract_name: string;
  contract_type: string | null;
  deal_score: number | null;
  verdict: string | null;
  created_at: string;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDay() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRecDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function verdictClass(v: string | null) {
  if (v === 'SIGN') return 'rvd-sign';
  if (v === 'NEGOTIATE') return 'rvd-neg';
  if (v === 'WALK AWAY') return 'rvd-walk';
  return 'rvd-none';
}

function verdictLabel(v: string | null) {
  if (v === 'SIGN') return '✓ Sign';
  if (v === 'NEGOTIATE') return '⚠ Negotiate';
  if (v === 'WALK AWAY') return '✗ Walk away';
  return '—';
}

const INSIGHTS = [
  { name: 'Liability',       pct: 82, color: 'var(--red)'    },
  { name: 'IP rights',       pct: 68, color: 'var(--red)'    },
  { name: 'Termination',     pct: 54, color: 'var(--yellow)' },
  { name: 'Payment',         pct: 33, color: 'var(--yellow)' },
  { name: 'Confidentiality', pct: 18, color: 'var(--forest)' },
];

export default function PortalPage() {
  const router = useRouter();
  const [contracts, setContracts]   = useState<SavedContract[]>([]);
  const [loading, setLoading]       = useState(true);
  const [userEmail, setUserEmail]   = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return; }
      setUserEmail(session.user.email ?? null);

      const { data } = await supabase
        .from('saved_contracts')
        .select('id, contract_name, contract_type, deal_score, verdict, created_at')
        .order('created_at', { ascending: false });

      if (data) setContracts(data as SavedContract[]);
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div className="po-loading">Loading…</div>;

  const total      = contracts.length;
  const walkCount  = contracts.filter(c => c.verdict === 'WALK AWAY').length;
  const negCount   = contracts.filter(c => c.verdict === 'NEGOTIATE').length;
  const signCount  = contracts.filter(c => c.verdict === 'SIGN').length;
  const recent     = contracts.slice(0, 10);

  const displayName = userEmail ? userEmail.split('@')[0] : 'there';

  return (
    <main className="po-main">

        {/* Topbar */}
        <div className="po-topbar">
          <div className="po-greet">
            <div className="po-g-date">{formatDay()}</div>
            <h1>{greeting()}, <em>{displayName}.</em></h1>
          </div>
          <div className="po-top-actions">
            <Link href="/history" className="po-btn">⊞ Contract history</Link>
            <Link href="/analyze" className="po-btn solid">↥ Analyze a contract</Link>
          </div>
        </div>

        {/* Stats */}
        <section className="po-stats">
          <div className="po-stat st-paper">
            <div className="po-st-top">
              <span className="po-st-label">Total analyzed</span>
              <span className="po-st-ic">⊞</span>
            </div>
            <div className="po-st-num">{total}</div>
            <div className="po-st-sub">all time</div>
          </div>
          <div className="po-stat st-red">
            <div className="po-st-top">
              <span className="po-st-label">Walk away</span>
              <span className="po-st-ic">✗</span>
            </div>
            <div className="po-st-num">{walkCount}</div>
            <div className="po-st-sub">
              {total > 0 ? `${Math.round(walkCount / total * 100)}% of contracts` : 'no data yet'}
            </div>
          </div>
          <div className="po-stat st-yellow">
            <div className="po-st-top">
              <span className="po-st-label">Negotiate</span>
              <span className="po-st-ic">⚠</span>
            </div>
            <div className="po-st-num">{negCount}</div>
            <div className="po-st-sub">
              {total > 0 ? `${Math.round(negCount / total * 100)}% of contracts` : 'no data yet'}
            </div>
          </div>
          <div className="po-stat st-forest">
            <div className="po-st-top">
              <span className="po-st-label">Sign</span>
              <span className="po-st-ic">✓</span>
            </div>
            <div className="po-st-num">{signCount}</div>
            <div className="po-st-sub">
              {total > 0 ? `${Math.round(signCount / total * 100)}% of contracts` : 'no data yet'}
            </div>
          </div>
        </section>

        {/* Content grid */}
        <div className="po-content">

          {/* Recently analyzed */}
          <div className="po-block">
            <div className="po-block-head">
              <h2>Recently analyzed</h2>
              <Link href="/history">View all →</Link>
            </div>
            {recent.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink-soft)' }}>
                No contracts analyzed yet.
              </div>
            ) : (
              recent.map(c => (
                <Link key={c.id} href={`/analysis/${c.id}`} className="po-rec">
                  <div className="po-rec-ic">§</div>
                  <div className="po-rec-main">
                    <div className="po-rec-title">{c.contract_name}</div>
                    <div className="po-rec-meta">
                      {c.contract_type && <span>{c.contract_type}</span>}
                      <span>{formatRecDate(c.created_at)}</span>
                    </div>
                  </div>
                  <span className={`po-rvd ${verdictClass(c.verdict)}`}>
                    {verdictLabel(c.verdict)}
                  </span>
                  <div className="po-rec-score">
                    {c.deal_score ?? '—'}<small>{c.deal_score !== null ? '/100' : ''}</small>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Right column — Where deals break */}
          <div className="po-block" style={{ alignSelf: 'start' }}>
            <div className="po-block-head">
              <h2>Where deals break</h2>
            </div>
            <div className="po-insight">
              {INSIGHTS.map(({ name, pct, color }) => (
                <div key={name} className="po-i-row">
                  <span className="po-i-name">{name}</span>
                  <span className="po-i-track">
                    <i style={{ width: `${pct}%`, background: color }} />
                  </span>
                  <span className="po-i-val">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
  );
}
