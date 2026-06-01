"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QuickDecisionDashboard } from "@/components/QuickDecisionDashboard";
import { ClauseAnalysis } from "@/components/ClauseAnalysis";

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

const VERDICT_STYLE: Record<string, string> = {
  SIGN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  NEGOTIATE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "WALK AWAY": "bg-red-500/20 text-red-400 border-red-500/30",
};

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (!verdict) return null;
  const style = VERDICT_STYLE[verdict] ?? "bg-slate-700 text-slate-400 border-slate-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style}`}>
      {verdict}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
        return;
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analyze
          </Link>
        </div>

        <h1 className="text-3xl font-semibold mb-1">Contract History</h1>
        <p className="text-slate-400 text-sm mb-8">Your past analyses, newest first.</p>

        {contracts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-1">No contracts analyzed yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Upload your first contract to see your history here.
            </p>
            <Link
              href="/analyze"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Analyze a Contract
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const isExpanded = expandedId === contract.id;
              const result = contract.analysis_result;
              const hasClauses =
                result?.playbookComparison?.clauseAnalysis?.length > 0;

              return (
                <div
                  key={contract.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden"
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(contract.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-slate-100 truncate">
                          {contract.contract_name}
                        </span>
                        {contract.contract_type && (
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {contract.contract_type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(contract.created_at)}
                        {contract.country && ` · ${contract.country}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <VerdictBadge verdict={contract.verdict} />
                      {contract.deal_score !== null && (
                        <span className="text-sm font-semibold text-slate-300 tabular-nums w-12 text-right">
                          {contract.deal_score}
                          <span className="text-slate-500 font-normal">/100</span>
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded analysis */}
                  {isExpanded && result && (
                    <div className="border-t border-slate-800 p-5 space-y-6">
                      {hasClauses && (
                        <>
                          <QuickDecisionDashboard
                            clauses={result.playbookComparison.clauseAnalysis}
                            overallScore={result.playbookComparison.overallScore}
                            summary={result.playbookComparison.summary}
                          />
                          <ClauseAnalysis
                            clauses={result.playbookComparison.clauseAnalysis}
                          />
                          <div className="border-t border-slate-700 pt-5">
                            <h2 className="text-xl font-semibold mb-4">Comprehensive Analysis</h2>
                          </div>
                        </>
                      )}

                      {result.summary && (
                        <Section title="Plain English Summary">
                          <p className="text-sm leading-relaxed text-slate-300">{result.summary}</p>
                        </Section>
                      )}
                      {result.yourObligations?.length > 0 && (
                        <Section title="Your Obligations">
                          <BulletList items={result.yourObligations} />
                        </Section>
                      )}
                      {result.theirObligations?.length > 0 && (
                        <Section title="Their Obligations">
                          <BulletList items={result.theirObligations} />
                        </Section>
                      )}
                      {result.risks?.length > 0 && (
                        <Section title="Risks & Red Flags">
                          <BulletList items={result.risks} />
                        </Section>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-base font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
      {items.map((item, idx) => (
        <li key={idx} className="leading-snug">{item}</li>
      ))}
    </ul>
  );
}
