"use client";

import "./analyze.css";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Download, Upload, Send } from "lucide-react";
import { QuickDecisionDashboard } from "@/components/QuickDecisionDashboard";
import { ClauseAnalysis } from "@/components/ClauseAnalysis";
import { SideBySideTab } from "@/components/SideBySideTab";
import { NegotiationTab } from "@/components/NegotiationTab";
import { OnboardingModal, type UserContext } from "@/components/OnboardingModal";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClauseAnalysisItem = {
  clauseNumber?: string;
  clauseTitle: string;
  clauseText: string;
  matchedPlaybookClause?: string;
  playbookMatchFound?: boolean;
  summary: string;
  issues?: string[];
  unacceptablePositions?: string[];
  questions?: string[];
  mitigation?: string[];
  recommendedEdit?: string;
  counterargumentsAndNegotiationStrategies?: Array<{
    counterpartyArgument: string;
    negotiationResponse: string;
    strategyType: string;
  }>;
  deviation?: string;
  favourabilityScore: number;
  favourabilityPercentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
};

type AnalysisResult = {
  summary: string;
  yourObligations: string[];
  theirObligations: string[];
  risks: string[];
  questions: string[];
  note: string;
  riskOverview?: string;
  quantifiedRisks?: Array<{
    title: string;
    riskLevel: "High" | "Medium" | "Low";
    likelihood?: "High" | "Medium" | "Low";
    potentialDamage?: string;
    explanation: string;
  }>;
  mitigationSteps?: Array<{ title: string; steps: string[] }>;
  complianceProcesses?: Array<{ title: string; process: string[] }>;
  playbookComparison?: {
    clauseAnalysis: ClauseAnalysisItem[];
    overallScore: {
      averageFavourability: number;
      totalClauses: number;
      lowRisk: number;
      mediumRisk: number;
      highRisk: number;
      criticalRisk: number;
      favourabilityScore?: number;
      counterpartyTrustScore?: number;
      dealScore?: number;
      verdict?: 'SIGN' | 'NEGOTIATE' | 'WALK AWAY';
      verdictReason?: string;
    };
    summary: string;
  } | null;
};

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Tab = 'scorecard' | 'clauses' | 'sidebyside' | 'negotiation';

const TABS: { id: Tab; label: string }[] = [
  { id: 'scorecard',   label: 'Scorecard'       },
  { id: 'clauses',     label: 'Clause Analysis' },
  { id: 'sidebyside',  label: 'Side-by-Side'    },
  { id: 'negotiation', label: 'Negotiation'     },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  // Form state
  const [contractText, setContractText]   = useState("");
  const [contractType, setContractType]   = useState("Rental");
  const [country, setCountry]             = useState("India");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [result, setResult]               = useState<AnalysisResult | null>(null);

  // PDF upload
  const [pdfLoading, setPdfLoading]       = useState(false);
  const [pdfFileName, setPdfFileName]     = useState<string | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // Onboarding / context
  const [userContext, setUserContext]     = useState<UserContext | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Auth
  const [userId, setUserId]               = useState<string | null>(null);
  const [accessToken, setAccessToken]     = useState<string | null>(null);
  const [userEmail, setUserEmail]         = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages]   = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]         = useState('');
  const [chatLoading, setChatLoading]     = useState(false);
  const chatEndRef                        = useRef<HTMLDivElement>(null);

  // Tabs
  const [activeTab, setActiveTab]         = useState<Tab>('scorecard');

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem('clausepal_context');
    if (stored) {
      try { setUserContext(JSON.parse(stored)); }
      catch { setShowOnboarding(true); }
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        setAccessToken(session.access_token);
        setUserEmail(session.user.email ?? null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
      setAccessToken(session?.access_token ?? null);
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfFileName(file.name);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res  = await fetch("/api/extract-pdf-text", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract text from PDF.");
      const stripped = data.text
        .split('\n')
        .filter((l: string) => !l.trim().match(/^-- \d+ of \d+ --$/))
        .join('\n').trim();
      if (stripped.length < 100) {
        setError("Could not extract text from this PDF. It may be a scanned document. Please copy and paste the contract text manually instead.");
        setPdfFileName(null);
        return;
      }
      setContractText(data.text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to read PDF.");
      setPdfFileName(null);
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!contractText.trim()) { setError("Please paste a contract to analyze."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText, contractType, country, userContext, userId, accessToken }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error((data as { error?: string; details?: string } | null)?.error ?? "Something went wrong while analyzing.");
      }
      setResult(data as AnalysisResult);
      setActiveTab('scorecard');
      setChatMessages([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze contract.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatLoading || !result) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const history = [...chatMessages, userMsg];
    setChatMessages([...history, { role: 'assistant', content: '' }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), contractText, analysisResult: result, userContext, chatHistory: history }),
      });
      if (!res.ok || !res.body) throw new Error('Chat request failed');
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setChatMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content: msgs[msgs.length - 1].content + chunk };
          return msgs;
        });
      }
    } catch {
      setChatMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return msgs;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;
    const ts   = new Date().toISOString().split('T')[0];
    const fmt  = (items: string[]) => items?.length ? items.map(i => `  - ${i}`).join('\n') : "  - Nothing specific found.";
    const content = `CONTRACT ANALYSIS — ${ts}\nType: ${contractType} | Jurisdiction: ${country}\n\n` +
      `SUMMARY\n${result.summary}\n\nYOUR OBLIGATIONS\n${fmt(result.yourObligations)}\n\n` +
      `THEIR OBLIGATIONS\n${fmt(result.theirObligations)}\n\nRISKS\n${fmt(result.risks)}\n\n` +
      `QUESTIONS\n${fmt(result.questions)}\n\nNot legal advice. Consult a qualified lawyer for important decisions.\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = `contract-analysis-${ts}.txt`;
    a.click();
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const clauses = result?.playbookComparison?.clauseAnalysis ?? [];
  const hasClauses = clauses.length > 0;

  const mostCriticalClause =
    clauses.find(c => c.risk === 'critical') ?? clauses[0];

  const suggestedQuestions = [
    "Should I sign this?",
    "What's the biggest risk?",
    "What should I negotiate first?",
    mostCriticalClause
      ? `Explain the "${mostCriticalClause.clauseTitle}" clause in simple terms`
      : "Explain the most important clause in simple terms",
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  const charCount = contractText.length;

  return (
    <>
      {/* ── Nav ── */}
      <nav className="az-nav">
        <div className="az-nav-inner">
          <Link href="/" className="az-brand">
            <div className="az-badge">§</div>
            <div className="az-brand-name">ClausePal</div>
          </Link>
          <div className="az-nav-right">
            {result && (
              <span className="az-step" style={{ padding: '9px 16px' }}>
                {contractType} · {country}
              </span>
            )}
            {userId && (
              <Link href="/history" className="az-pill">History</Link>
            )}
            {userId && (
              <Link href="/knowledge" className="az-pill">Knowledge</Link>
            )}
            {userId ? (
              <>
                <button
                  type="button"
                  title={userEmail ?? undefined}
                  onClick={() => supabase.auth.signOut()}
                  className="az-pill"
                >
                  Sign out
                </button>
                {userEmail && (
                  <div className="az-avatar">
                    {userEmail[0].toUpperCase()}
                  </div>
                )}
              </>
            ) : (
              <Link href="/auth" className="az-pill" style={{ color: 'var(--forest)', fontWeight: 600 }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      {!result ? (
        /* ── Pre-analysis: editorial upload form ── */
        <main className="az-main">
          <div className="az-wrap">
            <div className="az-eyebrow">
              <span className="az-tag">⚖ New analysis</span>
              <span className="az-step">Step 1 of 2 — Upload</span>
            </div>
            <h1 className="az-h1">Analyze your <em>contract.</em></h1>
            <p className="az-sub">
              Paste the text or upload a PDF. ClausePal breaks it down clause by clause,
              scores the risk, and flags what to look at first.
            </p>

            {/* context strip */}
            {userContext && (
              <div className="az-context">
                <div className="az-ctx-left">
                  <span className="az-ctx-dot" />
                  <span className="az-ctx-role">{userContext.role}</span>
                  <span className="az-ctx-meta">
                    {userContext.companyName && <span>{userContext.companyName}</span>}
                    <span>{userContext.industry}</span>
                    <span>{userContext.jurisdiction}</span>
                    <span>{userContext.mainConcern}</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="az-ctx-edit"
                  onClick={() => setShowOnboarding(true)}
                >
                  Edit profile
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* selectors */}
              <div className="az-selectors">
                <div className="az-sfield">
                  <label>Contract type</label>
                  <div className="az-sel-wrap">
                    <select
                      className="az-select"
                      value={contractType}
                      onChange={e => setContractType(e.target.value)}
                    >
                      {['Rental / Lease', 'NDA', 'Master Services Agreement', 'Statement of Work',
                        'Employment', 'Freelance / Contractor', 'Terms of Service', 'Job Offer', 'SaaS', 'Other']
                        .map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="az-sfield">
                  <label>Jurisdiction</label>
                  <input
                    className="az-jinput"
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="e.g. India, California, EU"
                  />
                </div>
              </div>

              {/* paste area */}
              <div className="az-paste">
                <textarea
                  value={contractText}
                  onChange={e => setContractText(e.target.value)}
                  placeholder="Paste the full contract text here…"
                />
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfUpload} />
                <button
                  type="button"
                  className="az-upload-btn"
                  disabled={pdfLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload style={{ width: 14, height: 14 }} />
                  {pdfLoading ? 'Extracting…' : 'Upload PDF'}
                </button>
                <span className="az-paste-meta">
                  {pdfFileName && !pdfLoading
                    ? pdfFileName
                    : `${charCount.toLocaleString()} character${charCount === 1 ? '' : 's'}`}
                </span>
              </div>

              {error && <div className="az-error">{error}</div>}

              <button type="submit" className="az-analyze-btn" disabled={loading}>
                {loading ? 'Reading clause by clause…' : 'Analyze contract →'}
              </button>
            </form>

            <p className="az-disclaimer">
              Not legal advice. For important decisions, consult a qualified lawyer.
            </p>
          </div>
        </main>
      ) : (
        /* ── Post-analysis: two-panel layout ── */
        <div className="flex" style={{ height: 'calc(100vh - 74px)', background: '#F2EFEB' }}>

          {/* ── Left panel — tabbed results (60%) ── */}
          <div className="flex flex-col" style={{ width: '60%', borderRight: '1px solid rgba(26,22,18,.13)' }}>

            {/* Tab bar */}
            <div className="flex items-center flex-shrink-0 px-2 h-12" style={{ borderBottom: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 h-full text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#1F4A3B] text-[#1F4A3B]'
                      : 'border-transparent text-[#4A453E] hover:text-[#1A1612]'
                  }`}
                  style={{ fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}
                >
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 pr-2">
                <button
                  type="button"
                  onClick={downloadResults}
                  className="inline-flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: '#4A453E', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.04em' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => { setResult(null); setActiveTab('scorecard'); setChatMessages([]); }}
                  className="text-xs transition-colors rounded px-2.5 py-1"
                  style={{ color: '#4A453E', border: '1px solid rgba(26,22,18,.18)', fontFamily: '"JetBrains Mono", monospace' }}
                >
                  + New
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ background: '#F2EFEB' }}>

              {activeTab === 'scorecard' && (
                <div className="space-y-6">
                  {hasClauses ? (
                    <QuickDecisionDashboard
                      clauses={result.playbookComparison!.clauseAnalysis}
                      overallScore={result.playbookComparison!.overallScore}
                      summary={result.playbookComparison!.summary}
                    />
                  ) : (
                    <div className="rounded-xl px-5 py-4 text-sm" style={{ border: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7', color: '#4A453E' }}>
                      No scorecard data available for this contract.
                    </div>
                  )}

                  {/* Comprehensive analysis */}
                  <div className="space-y-4">
                    <AnalysisSection title="Plain English Summary">
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#4A453E' }}>{result.summary}</p>
                    </AnalysisSection>
                    <AnalysisSection title="Your Obligations">
                      <BulletList items={result.yourObligations} />
                    </AnalysisSection>
                    <AnalysisSection title="Their Obligations">
                      <BulletList items={result.theirObligations} />
                    </AnalysisSection>
                    <AnalysisSection title="Risks & Red Flags">
                      <BulletList items={result.risks} />
                    </AnalysisSection>
                    <AnalysisSection title="Questions to Ask Before Signing">
                      <BulletList items={result.questions} />
                    </AnalysisSection>
                    {result.riskOverview?.trim() && (
                      <AnalysisSection title="Risk Overview">
                        <p className="text-sm leading-relaxed" style={{ color: '#4A453E' }}>{result.riskOverview}</p>
                      </AnalysisSection>
                    )}
                    {result.mitigationSteps && result.mitigationSteps.length > 0 && (
                      <AnalysisSection title="Mitigation Steps">
                        {result.mitigationSteps.map((m, i) => (
                          <div key={i} className="mb-3">
                            <p className="text-sm font-semibold mb-1" style={{ color: '#1A1612' }}>{m.title}</p>
                            <BulletList items={m.steps} />
                          </div>
                        ))}
                      </AnalysisSection>
                    )}
                    {result.complianceProcesses && result.complianceProcesses.length > 0 && (
                      <AnalysisSection title="Compliance Processes">
                        {result.complianceProcesses.map((c, i) => (
                          <div key={i} className="mb-3">
                            <p className="text-sm font-semibold mb-1" style={{ color: '#1A1612' }}>{c.title}</p>
                            <BulletList items={c.process} />
                          </div>
                        ))}
                      </AnalysisSection>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'clauses' && (
                hasClauses
                  ? <ClauseAnalysis clauses={clauses} />
                  : <EmptyTab message="No clause analysis available." />
              )}

              {activeTab === 'sidebyside' && (
                hasClauses
                  ? <SideBySideTab clauses={clauses} />
                  : <EmptyTab message="No clause data available for side-by-side view." />
              )}

              {activeTab === 'negotiation' && (
                hasClauses
                  ? <NegotiationTab clauses={clauses} />
                  : <EmptyTab message="No negotiation data available." />
              )}

            </div>
          </div>

          {/* ── Right panel — chat (40%) ── */}
          <div className="flex flex-col" style={{ width: '40%', background: '#FBFAF7' }}>
            {/* Panel header */}
            <div className="h-12 px-5 flex items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,22,18,.13)' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1A1612', fontFamily: '"Newsreader", Georgia, serif', fontSize: 16 }}>Chat with your contract</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ background: '#F2EFEB' }}>
              {chatMessages.length === 0 ? (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs px-1" style={{ color: '#4A453E', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.06em', textTransform: 'uppercase' }}>Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={chatLoading}
                      className="w-full text-left text-sm transition-colors disabled:opacity-50"
                      style={{ color: '#1A1612', background: '#FBFAF7', border: '1px solid rgba(26,22,18,.13)', borderRadius: 12, padding: '12px 16px', fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                      style={msg.role === 'user'
                        ? { background: '#1F4A3B', color: '#EFEDE6', fontWeight: 500 }
                        : { background: '#FBFAF7', color: '#1A1612', border: '1px solid rgba(26,22,18,.11)' }
                      }
                    >
                      {msg.content ||
                        (chatLoading && i === chatMessages.length - 1
                          ? <span style={{ color: '#4A453E' }} className="animate-pulse">▋</span>
                          : null
                        )
                      }
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,22,18,.13)' }}>
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(chatInput); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask anything about this contract…"
                  disabled={chatLoading}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 transition-colors outline-none"
                  style={{ border: '1px solid rgba(26,22,18,.13)', background: '#F2EFEB', color: '#1A1612', fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="rounded-xl disabled:opacity-40 disabled:cursor-not-allowed p-2.5 transition-colors flex-shrink-0"
                  style={{ background: '#1F4A3B', color: '#EFEDE6' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {showOnboarding && (
        <OnboardingModal
          initialContext={userContext ?? undefined}
          onComplete={ctx => { setUserContext(ctx); setShowOnboarding(false); }}
        />
      )}
    </>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function AnalysisSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ border: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7' }}>
      <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: 15, color: '#1A1612' }}>{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm" style={{ color: '#4A453E' }}>Nothing specific found in this section.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#4A453E' }}>
          <span className="mt-1 flex-shrink-0" style={{ color: 'rgba(26,22,18,.30)' }}>·</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <div className="py-12 text-center text-sm" style={{ color: '#4A453E', fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic', fontSize: 16 }}>{message}</div>;
}
