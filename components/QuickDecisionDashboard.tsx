'use client';

import './quick-decision.css';

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

const VERDICT_CONFIG = {
  'SIGN':      { cls: 'v-sign',      label: '✓ Sign'      },
  'NEGOTIATE': { cls: 'v-negotiate', label: '⚠ Negotiate'  },
  'WALK AWAY': { cls: 'v-walk',      label: '✗ Walk Away'  },
} as const;

function scoreClass(n: number) {
  return n >= 70 ? 'c-good' : n >= 40 ? 'c-mid' : 'c-bad';
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  const cls = scoreClass(score);
  return (
    <div className="qd-score-box">
      <div className={`qd-score-num ${cls}`}>{score}</div>
      <div className="qd-score-bar-track">
        <div className={`qd-score-bar-fill ${cls}`} style={{ width: `${score}%` }} />
      </div>
      <div className="qd-score-label">{label}</div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const labels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return (
    <span className={`qd-badge risk-${risk}`}>{labels[risk] ?? risk}</span>
  );
}

const DEVIATION_CONFIG: Record<string, { cls: string; label: string }> = {
  none:        { cls: 'dev-none',     label: 'None'       },
  minor:       { cls: 'dev-minor',    label: 'Minor'      },
  moderate:    { cls: 'dev-moderate', label: 'Moderate'   },
  major:       { cls: 'dev-major',    label: 'Major'      },
  critical:    { cls: 'dev-critical', label: 'Critical'   },
  no_match:    { cls: 'dev-no-match', label: 'No Playbook' },
  no_playbook: { cls: 'dev-no-match', label: 'No Playbook' },
};

function DeviationBadge({ deviation }: { deviation: string }) {
  const cfg = DEVIATION_CONFIG[deviation];
  if (!cfg) return null;
  return (
    <span className={`qd-badge ${cfg.cls}`}>{cfg.label}</span>
  );
}

export function QuickDecisionDashboard({ clauses, overallScore, summary }: QuickDecisionDashboardProps) {
  const healthScore          = Math.round(overallScore.averageFavourability * 10);
  const favourabilityScore   = overallScore.favourabilityScore   ?? healthScore;
  const counterpartyTrustScore = overallScore.counterpartyTrustScore ?? healthScore;
  const dealScore            = overallScore.dealScore ?? Math.round(
    favourabilityScore * 0.5 + counterpartyTrustScore * 0.3 + healthScore * 0.2
  );
  const verdict      = overallScore.verdict      ?? (dealScore >= 70 ? 'SIGN' : dealScore >= 40 ? 'NEGOTIATE' : 'WALK AWAY');
  const verdictReason = overallScore.verdictReason ?? 'Based on overall contract analysis.';

  const vc = VERDICT_CONFIG[verdict];

  return (
    <div className="qd-root">

      {/* verdict banner */}
      <div className={`qd-verdict ${vc.cls}`}>
        <div className="qd-verdict-label">{vc.label}</div>
        <p className="qd-verdict-reason">{verdictReason}</p>
      </div>

      {/* three score boxes */}
      <div className="qd-scores">
        <ScoreBox label="Favourability"       score={favourabilityScore} />
        <ScoreBox label="Counterparty Trust"  score={counterpartyTrustScore} />
        <ScoreBox label="Deal Score"          score={dealScore} />
      </div>

      {/* clause table */}
      <div className="qd-table-wrap">
        <div className="qd-table-heading">Clause Breakdown</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="qd-table">
            <thead>
              <tr>
                <th>Clause</th>
                <th className="w-fav">Favourability</th>
                <th className="center">Risk</th>
                <th className="center">Deviation</th>
              </tr>
            </thead>
            <tbody>
              {clauses.map((clause, i) => {
                const pct = clause.favourabilityPercentage;
                const pc  = scoreClass(pct);
                return (
                  <tr key={i}>
                    <td>
                      <div className="qd-clause-title">
                        {clause.clauseNumber && (
                          <span className="qd-clause-num">{clause.clauseNumber}</span>
                        )}
                        {clause.clauseTitle}
                      </div>
                    </td>
                    <td>
                      <div className="qd-fav-cell">
                        <div className="qd-fav-track">
                          <div className={`qd-fav-fill ${pc}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`qd-fav-pct ${pc}`}>{pct}%</span>
                      </div>
                    </td>
                    <td className="qd-td-center">
                      <RiskBadge risk={clause.risk} />
                    </td>
                    <td className="qd-td-center">
                      {clause.deviation && <DeviationBadge deviation={clause.deviation} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* summary */}
      <div className="qd-summary">
        <p>{summary}</p>
      </div>

    </div>
  );
}
