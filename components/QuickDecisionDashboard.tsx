'use client';

import { Badge } from '@/components/ui/badge';

interface ClauseItem {
  clauseNumber?: string;
  clauseTitle: string;
  favourabilityPercentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  deviation?: string;
  playbookMatchFound?: boolean;
  matchedPlaybookClause?: string;
}

interface OverallScore {
  averageFavourability: number;
  totalClauses: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  playbookMatchedClauses?: number;
  noPlaybookMatchClauses?: number;
  favourabilityScore?: number;
  counterpartyTrustScore?: number;
  dealScore?: number;
  verdict?: 'SIGN' | 'NEGOTIATE' | 'WALK AWAY';
  verdictReason?: string;
}

interface QuickDecisionDashboardProps {
  clauses: ClauseItem[];
  overallScore: OverallScore;
  summary: string;
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor =
    score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex-1 bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className={`text-3xl font-bold ${textColor}`}>{score}</div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</div>
    </div>
  );
}

const VERDICT_CONFIG = {
  'SIGN': {
    label: 'SIGN ✓',
    bg: 'bg-emerald-500/15 border-emerald-500/40',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'NEGOTIATE': {
    label: 'NEGOTIATE ⚠',
    bg: 'bg-amber-500/15 border-amber-500/40',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  'WALK AWAY': {
    label: 'WALK AWAY ✗',
    bg: 'bg-red-500/15 border-red-500/40',
    text: 'text-red-400',
    dot: 'bg-red-500',
  },
} as const;

export function QuickDecisionDashboard({ clauses, overallScore, summary }: QuickDecisionDashboardProps) {
  const healthScore = Math.round(overallScore.averageFavourability * 10);
  const favourabilityScore = overallScore.favourabilityScore ?? healthScore;
  const counterpartyTrustScore = overallScore.counterpartyTrustScore ?? healthScore;
  const dealScore = overallScore.dealScore ?? Math.round(favourabilityScore * 0.5 + counterpartyTrustScore * 0.3 + healthScore * 0.2);
  const verdict = overallScore.verdict ?? (dealScore >= 70 ? 'SIGN' : dealScore >= 40 ? 'NEGOTIATE' : 'WALK AWAY');
  const verdictReason = overallScore.verdictReason ?? 'Based on overall contract analysis.';

  const vc = VERDICT_CONFIG[verdict];

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[risk] ?? styles.medium}`}>
        {labels[risk] ?? risk}
      </span>
    );
  };

  const getDeviationBadge = (deviation: string) => {
    if (deviation === 'no_playbook') return null;
    const styles: Record<string, string> = {
      none: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      minor: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      major: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      no_match: 'bg-slate-500/20 text-slate-500 border-slate-600/30',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[deviation] ?? styles.minor}`}>
        {deviation.replace('_', ' ')}
      </span>
    );
  };

  const barColor = (pct: number) =>
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

  const pctTextColor = (pct: number) =>
    pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
      {/* Verdict banner */}
      <div className={`border-b border-slate-700 px-6 py-5 ${vc.bg}`}>
        <div className={`text-3xl font-bold tracking-wide mb-1 ${vc.text}`}>
          {vc.label}
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{verdictReason}</p>
      </div>

      {/* Three score boxes */}
      <div className="px-6 py-5 flex gap-4 border-b border-slate-700">
        <ScoreBox label="Favourability" score={favourabilityScore} />
        <ScoreBox label="Counterparty Trust" score={counterpartyTrustScore} />
        <ScoreBox label="Deal Score" score={dealScore} />
      </div>

      {/* Clause table */}
      <div className="px-6 py-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
          Clause Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Clause</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-52">Favourability</th>
                <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deviation</th>
              </tr>
            </thead>
            <tbody>
              {clauses.map((clause, index) => (
                <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="py-3 px-2 text-slate-200 font-medium">
                    <div className="flex items-center gap-2">
                      {clause.clauseNumber && (
                        <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          {clause.clauseNumber}
                        </span>
                      )}
                      <span>{clause.clauseTitle}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${barColor(clause.favourabilityPercentage)} transition-all`}
                          style={{ width: `${clause.favourabilityPercentage}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold w-9 text-right tabular-nums ${pctTextColor(clause.favourabilityPercentage)}`}>
                        {clause.favourabilityPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">{getRiskBadge(clause.risk)}</td>
                  <td className="py-3 px-2 text-center">{clause.deviation ? getDeviationBadge(clause.deviation) : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 pb-5 border-t border-slate-700/60 pt-4">
        <p className="text-sm text-slate-400 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
