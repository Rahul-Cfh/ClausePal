"use client";

import "./history.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SavedContract = {
  id: string;
  contract_name: string;
  contract_type: string | null;
  country: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis_result: any;
  deal_score: number | null;
  verdict: string | null;
  created_at: string;
};

type FilterKey = "all" | "sign" | "negotiate" | "walk";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function verdictClass(v: string | null) {
  if (v === "SIGN") return "vb-sign";
  if (v === "NEGOTIATE") return "vb-negotiate";
  if (v === "WALK AWAY") return "vb-walk";
  return "vb-none";
}

function verdictLabel(v: string | null) {
  if (v === "SIGN") return "✓ Sign";
  if (v === "NEGOTIATE") return "⚠ Negotiate";
  if (v === "WALK AWAY") return "✗ Walk away";
  return "—";
}

export default function HistoryPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
        return;
      }
      setUserEmail(session.user.email ?? null);
      const { data, error } = await supabase
        .from("saved_contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setContracts(data as SavedContract[]);
      setLoading(false);
    });
  }, [router]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter + search
  const filtered = contracts.filter((c) => {
    const matchFilter =
      filter === "all" ||
      (filter === "sign" && c.verdict === "SIGN") ||
      (filter === "negotiate" && c.verdict === "NEGOTIATE") ||
      (filter === "walk" && c.verdict === "WALK AWAY");
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.contract_name.toLowerCase().includes(q) ||
      (c.contract_type ?? "").toLowerCase().includes(q) ||
      (c.country ?? "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // Group by month with dividers
  const grouped: Array<{ month: string; items: SavedContract[] }> = [];
  for (const c of filtered) {
    const m = monthLabel(c.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.month === m) {
      last.items.push(c);
    } else {
      grouped.push({ month: m, items: [c] });
    }
  }

  // Stats
  const total = contracts.length;
  const signCount = contracts.filter((c) => c.verdict === "SIGN").length;
  const negotiateCount = contracts.filter((c) => c.verdict === "NEGOTIATE").length;
  const walkCount = contracts.filter((c) => c.verdict === "WALK AWAY").length;

  if (loading) {
    return (
      <div className="hs-loading">
        Loading history…
      </div>
    );
  }

  return (
    <div className="hs-root">
      {/* ── Nav ── */}
      <nav className="hs-nav">
        <div className="hs-nav-inner">
          <Link href="/" className="hs-brand">
            <div className="hs-badge">§</div>
            <div className="hs-brand-name">ClausePal</div>
          </Link>
          <div className="hs-nav-right">
            <Link href="/history" className="hs-pill active">History</Link>
            <button
              type="button"
              className="hs-pill"
              onClick={() => supabase.auth.signOut().then(() => router.push("/auth"))}
            >
              Sign out
            </button>
            {userEmail && (
              <div className="hs-avatar">{userEmail[0].toUpperCase()}</div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Page ── */}
      <div className="hs-page">

        {/* header */}
        <div className="hs-head">
          <div>
            <div className="hs-eyebrow">
              Your archive · {total} {total === 1 ? "analysis" : "analyses"}
            </div>
            <h1 className="hs-h1">Every contract <em>you&apos;ve</em> read.</h1>
          </div>
          <Link href="/analyze" className="hs-new-btn">+ Analyze a new contract</Link>
        </div>

        {/* stats */}
        <div className="hs-stats">
          <div className="hs-stat">
            <div className="st-num">{total}</div>
            <div className="st-name">Total analyzed</div>
          </div>
          <div className="hs-stat s-forest">
            <div className="st-num">{signCount}</div>
            <div className="st-name">Safe to sign</div>
          </div>
          <div className="hs-stat s-yellow">
            <div className="st-num">{negotiateCount}</div>
            <div className="st-name">Negotiate first</div>
          </div>
          <div className="hs-stat s-red">
            <div className="st-num">{walkCount}</div>
            <div className="st-name">Walk away</div>
          </div>
        </div>

        {/* toolbar */}
        <div className="hs-toolbar">
          <div className="hs-filters">
            {(["all", "sign", "negotiate", "walk"] as FilterKey[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`hs-filter${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "sign" ? "Sign" : f === "negotiate" ? "Negotiate" : "Walk away"}
              </button>
            ))}
          </div>
          <div className="hs-search">
            <span className="hs-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search contracts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* list */}
        {contracts.length === 0 ? (
          <div className="hs-empty">
            <div className="hs-empty-icon">§</div>
            <p style={{ marginBottom: 8, fontStyle: 'normal', fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
              No contracts analyzed yet
            </p>
            <p style={{ marginBottom: 24, fontSize: 14, fontStyle: 'normal' }}>
              Upload your first contract to see your history here.
            </p>
            <Link href="/analyze" className="hs-new-btn">Analyze a Contract</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="hs-empty">No contracts match that filter.</div>
        ) : (
          <div className="hs-list">
            {grouped.map(({ month, items }) => (
              <React.Fragment key={month}>
                <div className="hs-divider">{month}</div>
                {items.map((contract) => {
                  const isExpanded = expandedId === contract.id;
                  const result = contract.analysis_result;
                  const hasClauses = result?.playbookComparison?.clauseAnalysis?.length > 0;

                  return (
                    <React.Fragment key={contract.id}>
                      <button
                        type="button"
                        className={`hs-row${isExpanded ? " expanded" : ""}`}
                        onClick={() => toggleExpand(contract.id)}
                      >
                        <div className="hs-row-icon">§</div>

                        <div className="row-main">
                          <div className="r-title">{contract.contract_name}</div>
                          <div className="r-meta">
                            {contract.contract_type && <span>{contract.contract_type}</span>}
                            {contract.country && <span>{contract.country}</span>}
                            {hasClauses && (
                              <span>
                                {result.playbookComparison.clauseAnalysis.length} clauses
                              </span>
                            )}
                          </div>
                        </div>

                        {contract.deal_score !== null ? (
                          <div className="r-score">
                            <div className="rs-num">{contract.deal_score}</div>
                            <div className="rs-lab">Deal</div>
                          </div>
                        ) : (
                          <div />
                        )}

                        <span className={`hs-verdict ${verdictClass(contract.verdict)}`}>
                          {verdictLabel(contract.verdict)}
                        </span>

                        <div className="r-date">{formatDate(contract.created_at)}</div>
                      </button>

                      {isExpanded && result && (
                        <div className="hs-expanded">
                          <CompactPreview result={result} contractId={contract.id} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CompactPreview({ result, contractId }: { result: any; contractId: string }) {
  const overallScore = result?.playbookComparison?.overallScore;
  const fav   = overallScore?.favourabilityScore   ?? null;
  const trust = overallScore?.counterpartyTrustScore ?? null;
  const deal  = overallScore?.dealScore              ?? null;

  const scoreColor = (n: number | null) => {
    if (n === null) return '#4A453E';
    return n >= 70 ? '#1F4A3B' : n >= 40 ? '#A07C10' : '#B23A2E';
  };
  const barColor = (n: number | null) => {
    if (n === null) return 'rgba(26,22,18,.10)';
    return n >= 70 ? '#1F4A3B' : n >= 40 ? '#EFB23E' : '#B23A2E';
  };

  return (
    <div className="hs-preview">
      {/* Summary */}
      {result.summary && (
        <p className="hs-preview-summary">{result.summary}</p>
      )}

      {/* Score boxes */}
      {(fav !== null || trust !== null || deal !== null) && (
        <div className="hs-preview-scores">
          {[
            { label: 'Favourability',      value: fav   },
            { label: 'Counterparty Trust', value: trust },
            { label: 'Deal Score',         value: deal  },
          ].map(({ label, value }) => (
            <div key={label} className="hs-preview-score-box">
              <div className="hs-preview-score-num" style={{ color: scoreColor(value) }}>
                {value ?? '—'}
              </div>
              <div className="hs-preview-score-bar">
                <div style={{ height: '100%', width: `${value ?? 0}%`, background: barColor(value), borderRadius: 99 }} />
              </div>
              <div className="hs-preview-score-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Open full analysis */}
      <Link href={`/analysis/${contractId}`} className="hs-open-btn">
        Open Full Analysis →
      </Link>
    </div>
  );
}
