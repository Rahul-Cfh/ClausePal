'use client';

import './clause-analysis.css';
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

const RISK_ICON = {
  low:      CheckCircle2,
  medium:   AlertCircle,
  high:     AlertTriangle,
  critical: XCircle,
} as const;

const FILTER_OPTIONS = ['all', 'low', 'medium', 'high', 'critical'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

function stratTypeClass(type: string): string {
  const map: Record<string, string> = {
    'soft pushback':       'st-soft-pushback',
    'risk framing':        'st-risk-framing',
    'commercial tradeoff': 'st-commercial-tradeoff',
    'fallback position':   'st-fallback-position',
    'escalation trigger':  'st-escalation-trigger',
  };
  return map[type] ?? 'st-default';
}

export function ClauseAnalysis({ clauses }: { clauses: ClauseAnalysisItem[] }) {
  const [filter, setFilter]           = useState<FilterOption>('all');
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

  const filterActiveClass = (f: FilterOption) =>
    filter === f ? `ca-filter f-active-${f}` : 'ca-filter';

  return (
    <div>
      {/* Filter bar */}
      <div className="ca-filters">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={filterActiveClass(f)}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ca-empty">No clauses match this filter.</div>
      ) : (
        filtered.map((clause, index) => {
          const Icon   = RISK_ICON[clause.risk] ?? AlertCircle;
          const isOpen = expandedClauses.has(index);
          const isTextOpen = expandedClauses.has(index + 10000);

          return (
            <div key={index} className={`ca-card risk-${clause.risk}`}>

              {/* Header */}
              <button
                type="button"
                className="ca-header"
                onClick={() => toggle(index)}
              >
                <Icon className={`ca-icon risk-${clause.risk}`} />

                <div className="ca-header-body">
                  <div className="ca-header-row">
                    {clause.clauseNumber && (
                      <span className="ca-clause-num">{clause.clauseNumber}</span>
                    )}
                    <span className="ca-clause-title">{clause.clauseTitle}</span>
                  </div>
                  {!isOpen && (
                    <p className="ca-summary-preview">{clause.summary}</p>
                  )}
                </div>

                <div className="ca-header-right">
                  <span className={`ca-score-badge risk-${clause.risk}`}>
                    {clause.favourabilityScore}/10
                  </span>
                  {isOpen
                    ? <ChevronUp className="ca-chevron" style={{ width: 16, height: 16 }} />
                    : <ChevronDown className="ca-chevron" style={{ width: 16, height: 16 }} />
                  }
                </div>
              </button>

              {/* Expanded body */}
              <Collapsible open={isOpen}>
                <CollapsibleContent>
                  <div className="ca-body">

                    {/* Summary */}
                    <div>
                      <p className="ca-section-label">Summary</p>
                      <p className="ca-summary-text">{clause.summary}</p>
                    </div>

                    {/* Issues */}
                    {clause.issues && clause.issues.length > 0 && (
                      <div className="ca-block b-issues">
                        <p className="ca-section-label">Issues Found</p>
                        <ul className="ca-list">
                          {clause.issues.map((issue, i) => (
                            <li key={i}>
                              <span className="ca-bullet">·</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Unacceptable positions */}
                    {clause.unacceptablePositions && clause.unacceptablePositions.length > 0 && (
                      <div className="ca-block b-unacceptable">
                        <p className="ca-section-label">⚠ Unacceptable Positions</p>
                        <ul className="ca-list">
                          {clause.unacceptablePositions.map((pos, i) => (
                            <li key={i}>
                              <span className="ca-bullet">·</span>
                              {pos}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Questions */}
                    {clause.questions && clause.questions.length > 0 && (
                      <div className="ca-block b-questions">
                        <p className="ca-section-label">Questions for Counterparty</p>
                        <ul className="ca-list">
                          {clause.questions.map((q, i) => (
                            <li key={i}>
                              <span className="ca-bullet">·</span>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mitigation */}
                    {clause.mitigation && clause.mitigation.length > 0 && (
                      <div className="ca-block b-mitigation">
                        <p className="ca-section-label">Mitigation Suggestions</p>
                        <ul className="ca-list">
                          {clause.mitigation.map((m, i) => (
                            <li key={i}>
                              <span className="ca-bullet">·</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended language */}
                    {clause.recommendedEdit && (
                      <div className="ca-block b-recommended">
                        <p className="ca-section-label">Recommended Language</p>
                        <p className="ca-recommended-text">{clause.recommendedEdit}</p>
                      </div>
                    )}

                    {/* Negotiation strategies */}
                    {clause.counterargumentsAndNegotiationStrategies &&
                      clause.counterargumentsAndNegotiationStrategies.length > 0 && (
                      <div className="ca-block b-negotiation">
                        <p className="ca-section-label">Negotiation Strategies</p>
                        {clause.counterargumentsAndNegotiationStrategies.map((s, i) => (
                          <div key={i} className="ca-strat-card">
                            <span className={`ca-strat-type ${stratTypeClass(s.strategyType)}`}>
                              {s.strategyType}
                            </span>
                            <p className="ca-strat-label their">Their argument</p>
                            <p className="ca-strat-arg">&ldquo;{s.counterpartyArgument}&rdquo;</p>
                            <p className="ca-strat-label yours" style={{ marginTop: 10 }}>Your response</p>
                            <p className="ca-strat-resp">{s.negotiationResponse}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Original contract text */}
                    <Collapsible open={isTextOpen}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="ca-text-toggle"
                          onClick={() => toggle(index + 10000)}
                        >
                          <span>View original contract text</span>
                          {isTextOpen
                            ? <ChevronUp style={{ width: 14, height: 14 }} />
                            : <ChevronDown style={{ width: 14, height: 14 }} />
                          }
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ca-original-text">
                          <p>{clause.clauseText}</p>
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
