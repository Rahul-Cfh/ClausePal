'use client';

interface ClauseItem {
  clauseNumber?: string;
  clauseTitle: string;
  clauseText: string;
  summary: string;
  issues?: string[];
  risk: 'low' | 'medium' | 'high' | 'critical';
}

const IMPACT = {
  low:      { label: 'Low impact — standard clause',                  color: 'text-emerald-400' },
  medium:   { label: 'Medium impact — review carefully',               color: 'text-amber-400'   },
  high:     { label: 'High impact — negotiation recommended',          color: 'text-orange-400'  },
  critical: { label: 'Critical impact — do not accept without changes', color: 'text-red-400'    },
} as const;

export function SideBySideTab({ clauses }: { clauses: ClauseItem[] }) {
  if (!clauses.length) {
    return <div className="py-12 text-center text-slate-500">No clause data available.</div>;
  }

  return (
    <div className="space-y-4">
      {clauses.map((clause, idx) => {
        const impact = IMPACT[clause.risk] ?? IMPACT.medium;
        return (
          <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3 flex-wrap">
              {clause.clauseNumber && (
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono flex-shrink-0">
                  {clause.clauseNumber}
                </span>
              )}
              <span className="font-semibold text-slate-100">{clause.clauseTitle}</span>
              <span className={`ml-auto text-xs font-medium flex-shrink-0 ${impact.color}`}>
                {impact.label}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-800">
              <div className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
                  Original Language
                </p>
                <p className="text-sm font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {clause.clauseText || 'Original text not available.'}
                </p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
                  Plain English
                </p>
                <p className="text-sm text-slate-200 leading-relaxed mb-4">{clause.summary}</p>
                {clause.issues && clause.issues.length > 0 && (
                  <>
                    <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      Key Points
                    </p>
                    <ul className="space-y-1.5">
                      {clause.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-slate-600 mt-1 flex-shrink-0">·</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
