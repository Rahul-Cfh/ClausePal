'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface NegotiationStrategy {
  counterpartyArgument: string;
  negotiationResponse: string;
  strategyType: string;
}

interface ClauseAnalysisItem {
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
  counterargumentsAndNegotiationStrategies?: NegotiationStrategy[];
  deviation?: string;
  favourabilityScore: number;
  favourabilityPercentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

const RISK_CONFIG = {
  low:      { icon: CheckCircle2,  iconColor: 'text-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', border: 'border-l-emerald-500'  },
  medium:   { icon: AlertCircle,   iconColor: 'text-amber-500',   badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',       border: 'border-l-amber-500'    },
  high:     { icon: AlertTriangle, iconColor: 'text-orange-500',  badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',    border: 'border-l-orange-500'   },
  critical: { icon: XCircle,       iconColor: 'text-red-500',     badge: 'bg-red-500/20 text-red-400 border-red-500/30',             border: 'border-l-red-500'      },
} as const;

const STRATEGY_STYLE: Record<string, string> = {
  'soft pushback':       'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'risk framing':        'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'commercial tradeoff': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'fallback position':   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'escalation trigger':  'bg-red-500/15 text-red-400 border-red-500/30',
};

const FILTER_OPTIONS = ['all', 'low', 'medium', 'high', 'critical'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

export function ClauseAnalysis({ clauses }: { clauses: ClauseAnalysisItem[] }) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setExpandedClauses(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const counts = {
    all:      clauses.length,
    low:      clauses.filter(c => c.risk === 'low').length,
    medium:   clauses.filter(c => c.risk === 'medium').length,
    high:     clauses.filter(c => c.risk === 'high').length,
    critical: clauses.filter(c => c.risk === 'critical').length,
  };

  const filtered = filter === 'all' ? clauses : clauses.filter(c => c.risk === filter);

  const filterLabel: Record<FilterOption, string> = {
    all:      `All (${counts.all})`,
    low:      `Low (${counts.low})`,
    medium:   `Medium (${counts.medium})`,
    high:     `High (${counts.high})`,
    critical: `Critical (${counts.critical})`,
  };

  const filterStyle = (f: FilterOption): string => {
    if (filter !== f) return 'border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300';
    const active: Record<FilterOption, string> = {
      all:      'bg-slate-700 text-slate-100 border border-slate-600',
      low:      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      medium:   'bg-amber-500/20 text-amber-400 border border-amber-500/40',
      high:     'bg-orange-500/20 text-orange-400 border border-orange-500/40',
      critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
    };
    return active[f];
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStyle(f)}`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          No clauses match this filter.
        </div>
      ) : (
        filtered.map((clause, index) => {
          const cfg = RISK_CONFIG[clause.risk] ?? RISK_CONFIG.medium;
          const Icon = cfg.icon;
          const isOpen = expandedClauses.has(index);

          return (
            <div
              key={index}
              className={`rounded-xl border border-slate-800 bg-slate-900 border-l-4 ${cfg.border} overflow-hidden`}
            >
              {/* Header — always visible */}
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {clause.clauseNumber && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        {clause.clauseNumber}
                      </span>
                    )}
                    <span className="font-semibold text-slate-100">{clause.clauseTitle}</span>
                  </div>
                  {!isOpen && (
                    <p className="text-sm text-slate-400 mt-0.5 truncate">{clause.summary}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cfg.badge}`}>
                    {clause.favourabilityScore}/10
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Expanded body */}
              <Collapsible open={isOpen}>
                <CollapsibleContent>
                  <div className="px-4 pb-5 space-y-4 border-t border-slate-800 pt-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1.5">Summary</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{clause.summary}</p>
                    </div>

                    {clause.issues && clause.issues.length > 0 && (
                      <div className="rounded-lg bg-red-950/25 border border-red-500/20 p-3">
                        <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-2">Issues Found</p>
                        <ul className="space-y-1">
                          {clause.issues.map((issue, i) => (
                            <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                              <span className="text-red-600 mt-1 flex-shrink-0">·</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clause.unacceptablePositions && clause.unacceptablePositions.length > 0 && (
                      <div className="rounded-lg bg-red-950/40 border-2 border-red-500/40 p-3">
                        <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-2">
                          ⚠ Unacceptable Positions
                        </p>
                        <ul className="space-y-1">
                          {clause.unacceptablePositions.map((pos, i) => (
                            <li key={i} className="text-sm text-red-300 font-medium flex items-start gap-2">
                              <span className="text-red-500 mt-1 flex-shrink-0">·</span>
                              {pos}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clause.questions && clause.questions.length > 0 && (
                      <div className="rounded-lg bg-blue-950/25 border border-blue-500/20 p-3">
                        <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold mb-2">Questions for Counterparty</p>
                        <ul className="space-y-1">
                          {clause.questions.map((q, i) => (
                            <li key={i} className="text-sm text-blue-300 flex items-start gap-2">
                              <span className="text-blue-600 mt-1 flex-shrink-0">·</span>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clause.mitigation && clause.mitigation.length > 0 && (
                      <div className="rounded-lg bg-emerald-950/25 border border-emerald-500/20 p-3">
                        <p className="text-xs text-emerald-400 uppercase tracking-wide font-semibold mb-2">Mitigation Suggestions</p>
                        <ul className="space-y-1">
                          {clause.mitigation.map((m, i) => (
                            <li key={i} className="text-sm text-emerald-300 flex items-start gap-2">
                              <span className="text-emerald-600 mt-1 flex-shrink-0">·</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clause.recommendedEdit && (
                      <div className="rounded-lg bg-purple-950/25 border border-purple-500/20 p-3">
                        <p className="text-xs text-purple-400 uppercase tracking-wide font-semibold mb-2">Recommended Language</p>
                        <p className="text-sm font-mono text-purple-200 leading-relaxed italic">
                          {clause.recommendedEdit}
                        </p>
                      </div>
                    )}

                    {clause.counterargumentsAndNegotiationStrategies &&
                      clause.counterargumentsAndNegotiationStrategies.length > 0 && (
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3">
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
                          Negotiation Strategies
                        </p>
                        <div className="space-y-3">
                          {clause.counterargumentsAndNegotiationStrategies.map((s, i) => (
                            <div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-700/50">
                              <span
                                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border mb-2 ${STRATEGY_STYLE[s.strategyType] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}
                              >
                                {s.strategyType}
                              </span>
                              <div className="space-y-2 mt-1">
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">Their argument:</p>
                                  <p className="text-sm text-slate-400 italic">
                                    &ldquo;{s.counterpartyArgument}&rdquo;
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-emerald-500 mb-0.5">Your response:</p>
                                  <p className="text-sm text-slate-200">{s.negotiationResponse}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Collapsible open={expandedClauses.has(index + 10000)}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          onClick={() => toggle(index + 10000)}
                          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-400 py-1 transition-colors"
                        >
                          <span>View original contract text</span>
                          {expandedClauses.has(index + 10000)
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                          }
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 rounded-lg bg-slate-950 border border-slate-800 p-3">
                          <p className="text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                            {clause.clauseText}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })
      )}
    </div>
  );
}
