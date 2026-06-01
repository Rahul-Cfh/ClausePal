'use client';

interface NegotiationStrategy {
  counterpartyArgument: string;
  negotiationResponse: string;
  strategyType: string;
}

interface ClauseItem {
  clauseNumber?: string;
  clauseTitle: string;
  clauseText: string;
  recommendedEdit?: string;
  counterargumentsAndNegotiationStrategies?: NegotiationStrategy[];
  risk: 'low' | 'medium' | 'high' | 'critical';
}

const STRATEGY_STYLE: Record<string, string> = {
  'soft pushback':      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'risk framing':       'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'commercial tradeoff':'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'fallback position':  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'escalation trigger': 'bg-red-500/15 text-red-400 border-red-500/30',
};

const RISK_STYLE: Record<string, string> = {
  low:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function NegotiationTab({ clauses }: { clauses: ClauseItem[] }) {
  const negotiable = clauses.filter(
    (c) => c.recommendedEdit || (c.counterargumentsAndNegotiationStrategies?.length ?? 0) > 0
  );

  if (!negotiable.length) {
    return (
      <div className="py-12 text-center text-slate-500">
        No negotiation data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {negotiable.map((clause, idx) => (
        <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            {clause.clauseNumber && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono flex-shrink-0">
                {clause.clauseNumber}
              </span>
            )}
            <span className="font-semibold text-slate-100">{clause.clauseTitle}</span>
            <span
              className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded border flex-shrink-0 ${RISK_STYLE[clause.risk] ?? RISK_STYLE.medium}`}
            >
              {clause.risk.toUpperCase()}
            </span>
          </div>

          <div className="p-5 space-y-5">
            {clause.recommendedEdit && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
                    Current Language
                  </p>
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <p className="text-sm font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {clause.clauseText}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-emerald-500 uppercase tracking-wide font-semibold mb-2">
                    Recommended Language
                  </p>
                  <div className="bg-emerald-950/20 rounded-lg p-3 border border-emerald-500/20">
                    <p className="text-sm font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {clause.recommendedEdit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(clause.counterargumentsAndNegotiationStrategies?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
                  Negotiation Playbook
                </p>
                <div className="space-y-3">
                  {clause.counterargumentsAndNegotiationStrategies!.map((s, i) => (
                    <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border mb-3 ${STRATEGY_STYLE[s.strategyType] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}
                      >
                        {s.strategyType}
                      </span>
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Their argument:</p>
                          <p className="text-sm text-slate-400 italic">
                            &ldquo;{s.counterpartyArgument}&rdquo;
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-500 mb-1">Your response:</p>
                          <p className="text-sm text-slate-200">{s.negotiationResponse}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
