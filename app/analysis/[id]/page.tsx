'use client';

import '../../analyze/analyze.css';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Download, Send } from 'lucide-react';
import { QuickDecisionDashboard } from '@/components/QuickDecisionDashboard';
import { ClauseAnalysis } from '@/components/ClauseAnalysis';
import { SideBySideTab } from '@/components/SideBySideTab';
import { NegotiationTab } from '@/components/NegotiationTab';
import { supabase } from '@/lib/supabase';

type Tab = 'scorecard' | 'clauses' | 'sidebyside' | 'negotiation';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

const TABS: { id: Tab; label: string }[] = [
  { id: 'scorecard',   label: 'Scorecard'       },
  { id: 'clauses',     label: 'Clause Analysis' },
  { id: 'sidebyside',  label: 'Side-by-Side'    },
  { id: 'negotiation', label: 'Negotiation'     },
];

export default function AnalysisPage() {
  const params = useParams();
  const id = params?.id as string;
  const router  = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contract, setContract]     = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>('scorecard');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [userContext, setUserContext] = useState<Record<string, string> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return; }
      setUserEmail(session.user.email ?? null);

      const stored = localStorage.getItem('clausepal_context');
      if (stored) try { setUserContext(JSON.parse(stored)); } catch { /* ignore */ }

      const { data, error } = await supabase
        .from('saved_contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) { router.push('/history'); return; }
      setContract(data);
      setLoading(false);
    });
  }, [id, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatLoading || !contract) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const history = [...chatMessages, userMsg];
    setChatMessages([...history, { role: 'assistant', content: '' }]);
    setChatInput('');
    setChatLoading(true);

    const result = contract.analysis_result;
    // Use summary + contract name as stand-in for raw text (not stored)
    const contractText = `${contract.contract_name}\n\n${result?.summary ?? ''}`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), contractText, analysisResult: result, userContext, chatHistory: history }),
      });
      if (!res.ok || !res.body) throw new Error('Chat failed');
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
        msgs[msgs.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong.' };
        return msgs;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const downloadResults = () => {
    if (!contract) return;
    const result = contract.analysis_result;
    const ts  = new Date(contract.created_at).toISOString().split('T')[0];
    const fmt = (items: string[]) => items?.length ? items.map((i: string) => `  - ${i}`).join('\n') : '  - Nothing specific found.';
    const content =
      `CONTRACT ANALYSIS — ${ts}\n${contract.contract_name}\nType: ${contract.contract_type} | Jurisdiction: ${contract.country}\n\n` +
      `SUMMARY\n${result.summary}\n\nYOUR OBLIGATIONS\n${fmt(result.yourObligations)}\n\n` +
      `THEIR OBLIGATIONS\n${fmt(result.theirObligations)}\n\nRISKS\n${fmt(result.risks)}\n\n` +
      `QUESTIONS\n${fmt(result.questions)}\n\nNot legal advice.\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = `contract-analysis-${ts}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F2EFEB', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: '#4A453E' }}>
        Loading analysis…
      </div>
    );
  }

  const result   = contract.analysis_result;
  const clauses  = result?.playbookComparison?.clauseAnalysis ?? [];
  const hasClauses = clauses.length > 0;

  const mostCritical = clauses.find((c: { risk: string }) => c.risk === 'critical') ?? clauses[0];
  const suggestedQuestions = [
    'Should I sign this?',
    "What's the biggest risk?",
    'What should I negotiate first?',
    mostCritical
      ? `Explain the "${mostCritical.clauseTitle}" clause in simple terms`
      : 'Explain the most important clause in simple terms',
  ];

  return (
    <>
      {/* Nav */}
      <nav className="az-nav">
        <div className="az-nav-inner">
          <Link href="/" className="az-brand">
            <div className="az-badge">§</div>
            <div className="az-brand-name">ClausePal</div>
          </Link>
          <div className="az-nav-right">
            <span className="az-step" style={{ padding: '9px 16px' }}>
              {contract.contract_type} · {contract.country}
            </span>
            <Link href="/history" className="az-pill">History</Link>
            <Link href="/knowledge" className="az-pill">Knowledge</Link>
            {userEmail && (
              <div className="az-avatar">{userEmail[0].toUpperCase()}</div>
            )}
          </div>
        </div>
      </nav>

      {/* Two-panel layout */}
      <div className="flex" style={{ height: 'calc(100vh - 74px)', background: '#F2EFEB' }}>

        {/* Left panel — tabbed results */}
        <div className="flex flex-col" style={{ width: '60%', borderRight: '1px solid rgba(26,22,18,.13)' }}>

          {/* Tab bar */}
          <div className="flex items-center flex-shrink-0 px-2 h-12" style={{ borderBottom: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 h-full text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-[#1F4A3B] text-[#1F4A3B]' : 'border-transparent text-[#4A453E] hover:text-[#1A1612]'
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
              <Link
                href="/history"
                className="text-xs transition-colors rounded px-2.5 py-1"
                style={{ color: '#4A453E', border: '1px solid rgba(26,22,18,.18)', fontFamily: '"JetBrains Mono", monospace', textDecoration: 'none' }}
              >
                ← History
              </Link>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6" style={{ background: '#F2EFEB' }}>

            {activeTab === 'scorecard' && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 500, letterSpacing: '-.02em', color: '#1A1612', lineHeight: 1.1, marginBottom: 10 }}>
                    Quick Decision Dashboard <em>&mdash; {contract.contract_type}</em>
                  </h2>
                  <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: '.04em', color: '#4A453E' }}>
                    {contract.contract_type}{contract.country ? ` · ${contract.country}` : ''}
                  </p>
                </div>
                {hasClauses ? (
                  <QuickDecisionDashboard
                    clauses={result.playbookComparison.clauseAnalysis}
                    overallScore={result.playbookComparison.overallScore}
                    summary={result.playbookComparison.summary}
                  />
                ) : (
                  <div className="rounded-xl px-5 py-4 text-sm" style={{ border: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7', color: '#4A453E' }}>
                    No scorecard data available.
                  </div>
                )}
                <div className="space-y-4">
                  <AnalysisSection title="Plain English Summary">
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#4A453E' }}>{result.summary}</p>
                  </AnalysisSection>
                  <AnalysisSection title="Your Obligations"><BulletList items={result.yourObligations} /></AnalysisSection>
                  <AnalysisSection title="Their Obligations"><BulletList items={result.theirObligations} /></AnalysisSection>
                  <AnalysisSection title="Risks & Red Flags"><BulletList items={result.risks} /></AnalysisSection>
                  <AnalysisSection title="Questions to Ask Before Signing"><BulletList items={result.questions} /></AnalysisSection>
                  {result.riskOverview?.trim() && (
                    <AnalysisSection title="Risk Overview">
                      <p className="text-sm leading-relaxed" style={{ color: '#4A453E' }}>{result.riskOverview}</p>
                    </AnalysisSection>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'clauses' && (
              hasClauses ? <ClauseAnalysis clauses={clauses} /> : <EmptyTab message="No clause analysis available." />
            )}
            {activeTab === 'sidebyside' && (
              hasClauses ? <SideBySideTab clauses={clauses} /> : <EmptyTab message="No clause data available." />
            )}
            {activeTab === 'negotiation' && (
              hasClauses ? <NegotiationTab clauses={clauses} /> : <EmptyTab message="No negotiation data available." />
            )}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="flex flex-col" style={{ width: '40%', background: '#FBFAF7' }}>
          <div className="h-12 px-5 flex items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,22,18,.13)' }}>
            <h2 style={{ color: '#1A1612', fontFamily: '"Newsreader", Georgia, serif', fontSize: 16, fontWeight: 500 }}>
              Chat with your contract
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ background: '#F2EFEB' }}>
            {chatMessages.length === 0 ? (
              <div className="space-y-2.5 pt-2">
                <p className="text-xs px-1" style={{ color: '#4A453E', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Suggested questions:
                </p>
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

          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,22,18,.13)' }}>
            <form onSubmit={e => { e.preventDefault(); sendMessage(chatInput); }} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask anything about this contract…"
                disabled={chatLoading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 outline-none"
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
    </>
  );
}

function AnalysisSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ border: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7' }}>
      <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: 15, color: '#1A1612' }}>{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm" style={{ color: '#4A453E' }}>Nothing specific found.</p>;
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
