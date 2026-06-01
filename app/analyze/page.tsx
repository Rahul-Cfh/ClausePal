"use client";

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

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm px-6 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="text-lg font-bold tracking-wide text-slate-100">
          ClausePal
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {result && (
            <span className="text-slate-500 hidden sm:inline">
              {contractType} · {country}
            </span>
          )}
          {userId && (
            <Link href="/history" className="text-slate-400 hover:text-slate-200 transition-colors">
              History
            </Link>
          )}
          {userId ? (
            <button
              type="button"
              title={userEmail ?? undefined}
              onClick={() => supabase.auth.signOut()}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link href="/auth" className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
              Sign In
            </Link>
          )}
        </nav>
      </header>

      {/* ── Main ── */}
      {!result ? (
        /* ── Pre-analysis: centered form ── */
        <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950 flex items-start justify-center pt-14 px-4 pb-12">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-slate-100 mb-2">Analyze your contract</h1>
              <p className="text-slate-400">
                Paste the text or upload a PDF. We&apos;ll break it down clause by clause.
              </p>
            </div>

            {userContext && (
              <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-medium text-slate-100">{userContext.role}</span>
                  {userContext.companyName && <span className="text-slate-500">· {userContext.companyName}</span>}
                  <span className="text-slate-500">· {userContext.industry}</span>
                  <span className="text-slate-500">· {userContext.jurisdiction}</span>
                  <span className="text-slate-500">· {userContext.mainConcern}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOnboarding(true)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 ml-4"
                >
                  Edit
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contract type + country row */}
              <div className="flex gap-3">
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {['Rental','Job Offer','Freelance','NDA','SaaS','Other'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="Jurisdiction (e.g. India, US)"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Textarea with floating PDF button */}
              <div className="relative">
                <textarea
                  value={contractText}
                  onChange={e => setContractText(e.target.value)}
                  rows={14}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 font-mono placeholder:text-slate-500 placeholder:font-sans focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Paste the full contract text here…"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {pdfLoading && (
                    <span className="text-xs text-slate-400">Extracting…</span>
                  )}
                  {pdfFileName && !pdfLoading && (
                    <span className="text-xs text-emerald-400 max-w-[140px] truncate">{pdfFileName}</span>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                  <button
                    type="button"
                    disabled={pdfLoading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload PDF
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 text-base transition-colors"
              >
                {loading ? "Analyzing…" : "Analyze Contract"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-600">
              Not legal advice. For important decisions, consult a qualified lawyer.
            </p>
          </div>
        </main>
      ) : (
        /* ── Post-analysis: two-panel layout ── */
        <div className="flex bg-slate-950" style={{ height: 'calc(100vh - 3.5rem)' }}>

          {/* ── Left panel — tabbed results (60%) ── */}
          <div className="flex flex-col border-r border-slate-800" style={{ width: '60%' }}>

            {/* Tab bar */}
            <div className="flex items-center border-b border-slate-800 flex-shrink-0 px-2 h-12">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 h-full text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 pr-2">
                <button
                  type="button"
                  onClick={downloadResults}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => { setResult(null); setActiveTab('scorecard'); setChatMessages([]); }}
                  className="text-xs text-slate-500 hover:text-emerald-400 transition-colors border border-slate-700 hover:border-emerald-500/50 rounded px-2.5 py-1"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">

              {activeTab === 'scorecard' && (
                <div className="space-y-6">
                  {hasClauses ? (
                    <QuickDecisionDashboard
                      clauses={result.playbookComparison!.clauseAnalysis}
                      overallScore={result.playbookComparison!.overallScore}
                      summary={result.playbookComparison!.summary}
                    />
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-400">
                      No scorecard data available for this contract.
                    </div>
                  )}

                  {/* Comprehensive analysis */}
                  <div className="space-y-4">
                    <AnalysisSection title="Plain English Summary">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{result.summary}</p>
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
                        <p className="text-sm text-slate-300 leading-relaxed">{result.riskOverview}</p>
                      </AnalysisSection>
                    )}
                    {result.mitigationSteps && result.mitigationSteps.length > 0 && (
                      <AnalysisSection title="Mitigation Steps">
                        {result.mitigationSteps.map((m, i) => (
                          <div key={i} className="mb-3">
                            <p className="text-sm font-semibold text-slate-200 mb-1">{m.title}</p>
                            <BulletList items={m.steps} />
                          </div>
                        ))}
                      </AnalysisSection>
                    )}
                    {result.complianceProcesses && result.complianceProcesses.length > 0 && (
                      <AnalysisSection title="Compliance Processes">
                        {result.complianceProcesses.map((c, i) => (
                          <div key={i} className="mb-3">
                            <p className="text-sm font-semibold text-slate-200 mb-1">{c.title}</p>
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
          <div className="flex flex-col bg-slate-950" style={{ width: '40%' }}>
            {/* Panel header */}
            <div className="h-12 border-b border-slate-800 px-5 flex items-center flex-shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">Chat with your contract</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs text-slate-500 px-1">Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={chatLoading}
                      className="w-full text-left text-sm text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-slate-900 font-medium'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {msg.content ||
                        (chatLoading && i === chatMessages.length - 1
                          ? <span className="text-slate-500 animate-pulse">▋</span>
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
            <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
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
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed p-2.5 text-slate-900 transition-colors flex-shrink-0"
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">Nothing specific found in this section.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
          <span className="text-slate-600 mt-1 flex-shrink-0">·</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <div className="py-12 text-center text-slate-500 text-sm">{message}</div>;
}
