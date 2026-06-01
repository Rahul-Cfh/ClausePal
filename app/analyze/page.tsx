"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Upload, Send } from "lucide-react";
import { QuickDecisionDashboard } from "@/components/QuickDecisionDashboard";
import { ClauseAnalysis } from "@/components/ClauseAnalysis";
import { OnboardingModal, type UserContext } from "@/components/OnboardingModal";
import { supabase } from "@/lib/supabase";

type ClauseAnalysisItem = {
  clauseTitle: string;
  clauseText: string;
  matchedPlaybookClause: string;
  summary: string;
  issues: string[];
  unacceptablePositions: string[];
  questions: string[];
  mitigation: string[];
  recommendedEdit: string;
  deviation: 'low' | 'medium' | 'high' | 'unacceptable';
  favourabilityScore: number;
  favourabilityPercentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
};

type PlaybookComparison = {
  clauseAnalysis: ClauseAnalysisItem[];
  overallScore: {
    averageFavourability: number;
    totalClauses: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
  };
  summary: string;
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
  mitigationSteps?: Array<{
    title: string;
    steps: string[];
  }>;
  complianceProcesses?: Array<{
    title: string;
    process: string[];
  }>;
  playbookComparison?: PlaybookComparison | null;
};

export default function AnalyzePage() {
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("Rental");
  const [country, setCountry] = useState("India");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  type ChatMessage = { role: 'user' | 'assistant'; content: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
        body: JSON.stringify({
          message: text.trim(),
          contractText,
          analysisResult: result,
          userContext,
          chatHistory: history,
        }),
      });
      if (!res.ok || !res.body) throw new Error('Chat request failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setChatMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = {
            role: 'assistant',
            content: msgs[msgs.length - 1].content + chunk,
          };
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

  useEffect(() => {
    const stored = localStorage.getItem('clausepal_context');
    if (stored) {
      try {
        setUserContext(JSON.parse(stored));
      } catch {
        setShowOnboarding(true);
      }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAccessToken(session?.access_token ?? null);
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfLoading(true);
    setPdfFileName(file.name);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to extract text from PDF.");
      }

      const stripped = data.text
        .split('\n')
        .filter((line: string) => !line.trim().match(/^-- \d+ of \d+ --$/))
        .join('\n')
        .trim();

      if (stripped.length < 100) {
        setError("Could not extract text from this PDF. It may be a scanned document. Please copy and paste the contract text manually instead.");
        setPdfFileName(null);
        return;
      }

      setContractText(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to read PDF.");
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

    if (!contractText.trim()) {
      setError("Please paste a contract to analyze.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          contractType,
          country,
          userContext,
          userId,
          accessToken,
        }),
      });

      const data = await res.json().catch((e) => {
        console.error("Failed to parse response:", e);
        return null;
      });

      console.log("API Response status:", res.status);
      console.log("API Response data:", data);

      if (data && data.playbookComparison) {
        console.log("Playbook Comparison received:", {
          hasClauseAnalysis: !!data.playbookComparison.clauseAnalysis,
          clauseAnalysisLength: data.playbookComparison.clauseAnalysis?.length || 0,
          hasOverallScore: !!data.playbookComparison.overallScore,
          totalClauses: data.playbookComparison.overallScore?.totalClauses || 0,
        });
      } else {
        console.log("No playbook comparison in response");
      }

      if (!res.ok || !data) {
        const msg =
          (data && (data as any).error) ||
          "Something went wrong while analyzing.";
        const details =
          data && (data as any).details
            ? ` | details: ${(data as any).details}`
            : "";
        throw new Error(msg + details);
      }

      setResult(data as AnalysisResult);
    } catch (err: any) {
      console.error("Full error:", err);
      setError(err.message || "Failed to analyze contract.");
    } finally {
      setLoading(false);
    }
  };

  const mostCriticalClause =
    result?.playbookComparison?.clauseAnalysis?.find((c) => c.risk === 'critical') ??
    result?.playbookComparison?.clauseAnalysis?.[0];

  const suggestedQuestions = [
    "Should I sign this?",
    "What's the biggest risk?",
    "What should I negotiate first?",
    mostCriticalClause
      ? `Explain the "${mostCriticalClause.clauseTitle}" clause in simple terms`
      : "Explain the most important clause in simple terms",
  ];

  const downloadResults = () => {
    if (!result) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `contract-analysis-${timestamp}.txt`;

    const formatList = (items: string[]) => {
      if (!items || items.length === 0) return "  - Nothing specific found in this section.\n";
      return items.map(item => `  - ${item}`).join('\n');
    };

    let playbookSection = '';
    if (result.playbookComparison && result.playbookComparison.overallScore.totalClauses > 0) {
      const pb = result.playbookComparison;
      const healthScore = Math.round(pb.overallScore.averageFavourability * 10);
      playbookSection = `
================================================================================

QUICK DECISION DASHBOARD

Contract Health Score: ${healthScore}%
Average Favourability: ${pb.overallScore.averageFavourability.toFixed(1)}/10

Clauses Analyzed: ${pb.overallScore.totalClauses}
  - Low Risk: ${pb.overallScore.lowRisk}
  - Medium Risk: ${pb.overallScore.mediumRisk}
  - High Risk: ${pb.overallScore.highRisk}
  - Critical: ${pb.overallScore.criticalRisk}

Summary: ${pb.summary}

================================================================================

CLAUSE-BY-CLAUSE ANALYSIS

${pb.clauseAnalysis.map((clause, idx) => `
${idx + 1}. ${clause.matchedPlaybookClause}
   Risk Level: ${clause.risk.toUpperCase()}
   Favourability Score: ${clause.favourabilityScore}/10
   Deviation: ${clause.deviation.toUpperCase()}

   Summary:
   ${clause.summary}

   ${clause.issues.length > 0 ? `Issues Found:\n${clause.issues.map(i => `   - ${i}`).join('\n')}\n\n` : ''}
   ${clause.unacceptablePositions.length > 0 ? `⚠ UNACCEPTABLE POSITIONS:\n${clause.unacceptablePositions.map(p => `   - ${p}`).join('\n')}\n\n` : ''}
   Questions for Counterparty:
${clause.questions.map(q => `   - ${q}`).join('\n')}

   Mitigation Suggestions:
${clause.mitigation.map(m => `   - ${m}`).join('\n')}

   Recommended Alternative Language:
   "${clause.recommendedEdit}"

   Contract Text:
   "${clause.clauseText}"
`).join('\n')}

================================================================================
`;
    }

    const content = `CONTRACT ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Contract Type: ${contractType}
Country/Region: ${country}
${playbookSection}
================================================================================

COMPREHENSIVE ANALYSIS

================================================================================

PLAIN ENGLISH SUMMARY
${result.summary}

================================================================================

YOUR OBLIGATIONS
${formatList(result.yourObligations)}

================================================================================

THEIR OBLIGATIONS
${formatList(result.theirObligations)}

================================================================================

RISKS & RED FLAGS
${formatList(result.risks)}

================================================================================

QUESTIONS TO ASK BEFORE SIGNING
${formatList(result.questions)}

================================================================================

DISCLAIMER
This explanation is generated by AI and may not cover every detail. It is not
legal advice. For important decisions, please speak to a qualified lawyer.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4">
            {userId && (
              <Link
                href="/history"
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                History
              </Link>
            )}
            {userId ? (
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                title={userEmail ?? undefined}
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth"
                className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Sign In
              </Link>
            )}

            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/screenshot_2025-12-11_at_4.57.19_am.png"
                alt="LegalLens Logo"
                width={50}
                height={50}
                className="transition-transform group-hover:scale-105"
              />
              <div className="text-right">
                <div className="text-xl font-bold font-[family-name:var(--font-orbitron)] tracking-wider">LegalLens</div>
                <div className="text-xs text-cyan-400" style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.6), 0 0 16px rgba(34, 211, 238, 0.4), 0 0 24px rgba(34, 211, 238, 0.2)' }}>
                  Deciphering the fine print.
                </div>
              </div>
            </Link>
          </div>
        </div>

        <h1 className="text-3xl font-semibold mb-2">Analyze your contract</h1>
        <p className="text-slate-300 mb-4">
          Paste your contract below and we&apos;ll break it down into simple,
          human language. This is not legal advice.
        </p>

        {userContext && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="font-medium text-slate-100">{userContext.role}</span>
              {userContext.companyName && (
                <span className="text-slate-500">· {userContext.companyName}</span>
              )}
              <span className="text-slate-500">· {userContext.industry}</span>
              <span className="text-slate-500">· {userContext.jurisdiction}</span>
              <span className="text-slate-500">· Focus: {userContext.mainConcern}</span>
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
          <div>
            <label className="block text-sm mb-1">Contract type</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option>Rental</option>
              <option>Job Offer</option>
              <option>Freelance</option>
              <option>NDA</option>
              <option>SaaS</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Country or region (for context only)
            </label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="India, US, EU, etc."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm">Paste your contract text or upload a PDF</label>
              <div className="flex items-center gap-2">
                {pdfLoading && (
                  <span className="text-xs text-slate-400">Extracting text from PDF...</span>
                )}
                {pdfFileName && !pdfLoading && (
                  <span className="text-xs text-emerald-400 truncate max-w-[200px]">{pdfFileName}</span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                />
                <button
                  type="button"
                  disabled={pdfLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload PDF
                </button>
              </div>
            </div>
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono"
              placeholder="Paste the full contract text, or upload a PDF above..."
            />
            <p className="mt-1 text-xs text-slate-500">
              PDFs must be text-based (not scanned images).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Explain this contract"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        </div>
      </div>

      {result && (
        <div className="max-w-[1400px] mx-auto px-4 pb-12">
          <div className="flex gap-6 items-start">
            {/* ── Analysis column ── */}
            <div className="flex-1 min-w-0 space-y-6">
          <div className="mt-0 space-y-6">
            {result.playbookComparison &&
             result.playbookComparison.clauseAnalysis &&
             Array.isArray(result.playbookComparison.clauseAnalysis) &&
             result.playbookComparison.clauseAnalysis.length > 0 ? (
              <>
                <QuickDecisionDashboard
                  clauses={result.playbookComparison.clauseAnalysis}
                  overallScore={result.playbookComparison.overallScore}
                  summary={result.playbookComparison.summary}
                />

                <ClauseAnalysis clauses={result.playbookComparison.clauseAnalysis} />

                <div className="border-t-2 border-slate-700 pt-6">
                  <h2 className="text-2xl font-semibold mb-4">Comprehensive Analysis</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Detailed breakdown of obligations, risks, and recommended actions
                  </p>
                </div>
              </>
            ) : result.playbookComparison === null ? (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-1">Quick Analysis Mode</h3>
                    <p className="text-sm text-slate-300">
                      This contract has been analyzed using the quick overview mode. The general analysis below is available.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <SectionCard title="Plain English summary">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {result.summary}
              </p>
            </SectionCard>

            <SectionCard title="Your obligations">
              <BulletList items={result.yourObligations} />
            </SectionCard>

            <SectionCard title="Their obligations">
              <BulletList items={result.theirObligations} />
            </SectionCard>

            <SectionCard title="Risks & red flags">
              <BulletList items={result.risks} />
            </SectionCard>

            <SectionCard title="Questions to ask before signing">
              <BulletList items={result.questions} />
            </SectionCard>

            {result.riskOverview && result.riskOverview.trim() && (
              <SectionCard title="Risk overview">
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {result.riskOverview}
                </p>
              </SectionCard>
            )}

            {result.quantifiedRisks && result.quantifiedRisks.length > 0 && (
              <RiskMatrix />
            )}

            {result.quantifiedRisks && result.quantifiedRisks.length > 0 && (
              <SectionCard title="Quantified risks">
                <div className="space-y-4">
                  {result.quantifiedRisks.map((risk, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm font-semibold">{risk.title}</p>
                      <p className="text-xs text-slate-400">
                        Risk level: {risk.riskLevel}
                        {risk.likelihood && `, Likelihood: ${risk.likelihood}`}
                      </p>
                      {risk.potentialDamage && (
                        <p className="text-xs text-slate-400">
                          Potential damage: {risk.potentialDamage}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{risk.explanation}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {result.mitigationSteps && result.mitigationSteps.length > 0 && (
              <SectionCard title="Mitigation steps">
                <div className="space-y-4">
                  {result.mitigationSteps.map((mitigation, idx) => (
                    <div key={idx}>
                      <p className="text-sm font-semibold mb-2">{mitigation.title}</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {mitigation.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="leading-snug">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {result.complianceProcesses && result.complianceProcesses.length > 0 && (
              <SectionCard title="Compliance process">
                <div className="space-y-4">
                  {result.complianceProcesses.map((compliance, idx) => (
                    <div key={idx}>
                      <p className="text-sm font-semibold mb-2">{compliance.title}</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {compliance.process.map((step, stepIdx) => (
                          <li key={stepIdx} className="leading-snug">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <button
              onClick={downloadResults}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-emerald-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Results
            </button>

            <p className="mt-4 text-xs text-slate-500">
              This explanation is generated by AI and may not cover every detail.
              It is not legal advice. For important decisions, please speak to a
              qualified lawyer.
            </p>
          </div>
          </div>

          {/* ── Chat column ── */}
          <div className="w-[380px] flex-shrink-0 sticky top-6 rounded-xl border border-slate-700 bg-slate-900 flex flex-col overflow-hidden" style={{ height: '620px' }}>
            <div className="px-4 py-3 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-100">Chat with your contract</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ask anything about this contract</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-500 mb-3">Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={chatLoading}
                      className="w-full text-left text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-slate-900 font-medium'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {msg.content ||
                        (chatLoading && i === chatMessages.length - 1 ? (
                          <span className="text-slate-500 animate-pulse">▋</span>
                        ) : null)}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-700 flex-shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this contract..."
                  disabled={chatLoading}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed p-2 text-slate-900 transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      )}

    {showOnboarding && (
      <OnboardingModal
        initialContext={userContext ?? undefined}
        onComplete={(ctx) => {
          setUserContext(ctx);
          setShowOnboarding(false);
        }}
      />
    )}
    </>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-base font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Nothing specific found in this section.
      </p>
    );
  }
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {items.map((item, idx) => (
        <li key={idx} className="leading-snug">
          {item}
        </li>
      ))}
    </ul>
  );
}

function RiskMatrix() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold mb-3">Risk Assessment Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900">
              <th className="border border-slate-700 p-2 text-left">Severity ↓ / Likelihood →</th>
              <th className="border border-slate-700 p-2">Low</th>
              <th className="border border-slate-700 p-2">Medium</th>
              <th className="border border-slate-700 p-2">High</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-700 p-2 font-medium">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-green-950/40 text-green-300">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-green-950/40 text-green-300">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-yellow-950/40 text-yellow-300">Medium</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-medium">Medium</td>
              <td className="border border-slate-700 p-2 text-center bg-green-950/40 text-green-300">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-yellow-950/40 text-yellow-300">Medium</td>
              <td className="border border-slate-700 p-2 text-center bg-orange-950/40 text-orange-300">High</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-medium">High</td>
              <td className="border border-slate-700 p-2 text-center bg-yellow-950/40 text-yellow-300">Medium</td>
              <td className="border border-slate-700 p-2 text-center bg-orange-950/40 text-orange-300">High</td>
              <td className="border border-slate-700 p-2 text-center bg-red-950/40 text-red-300">Critical</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
