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

const RISK_BADGE: Record<string, React.CSSProperties> = {
  low:      { background: 'rgba(31,74,59,.10)',   color: '#1F4A3B', border: '1px solid rgba(31,74,59,.22)'   },
  medium:   { background: 'rgba(239,178,62,.15)', color: '#8B6C10', border: '1px solid rgba(239,178,62,.35)' },
  high:     { background: 'rgba(233,167,157,.18)', color: '#a0443a', border: '1px solid rgba(233,167,157,.40)' },
  critical: { background: 'rgba(178,58,46,.10)',  color: '#B23A2E', border: '1px solid rgba(178,58,46,.22)'  },
};

const STRATEGY_BADGE: Record<string, React.CSSProperties> = {
  'soft pushback':       { background: 'rgba(26,22,18,.06)',   color: '#4A453E', border: '1px solid rgba(26,22,18,.14)'   },
  'risk framing':        { background: 'rgba(233,167,157,.15)', color: '#a0443a', border: '1px solid rgba(233,167,157,.35)' },
  'commercial tradeoff': { background: 'rgba(31,74,59,.10)',   color: '#1F4A3B', border: '1px solid rgba(31,74,59,.22)'   },
  'fallback position':   { background: 'rgba(239,178,62,.15)', color: '#8B6C10', border: '1px solid rgba(239,178,62,.35)' },
  'escalation trigger':  { background: 'rgba(178,58,46,.10)',  color: '#B23A2E', border: '1px solid rgba(178,58,46,.22)'  },
};
const DEFAULT_STRAT: React.CSSProperties = { background: 'rgba(26,22,18,.06)', color: '#4A453E', border: '1px solid rgba(26,22,18,.14)' };

const monoLabel: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 10,
  letterSpacing: '.10em',
  textTransform: 'uppercase',
  color: '#4A453E',
  fontWeight: 500,
  marginBottom: 6,
};

export function NegotiationTab({ clauses }: { clauses: ClauseItem[] }) {
  const negotiable = clauses.filter(
    (c) => c.recommendedEdit || (c.counterargumentsAndNegotiationStrategies?.length ?? 0) > 0
  );

  if (!negotiable.length) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: '#4A453E', fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic', fontSize: 18 }}>
        No negotiation data available.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {negotiable.map((clause, idx) => (
        <div key={idx} style={{ borderRadius: 16, border: '1px solid rgba(26,22,18,.13)', background: '#FBFAF7', overflow: 'hidden' }}>

          {/* Card header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(26,22,18,.13)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {clause.clauseNumber && (
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, background: 'rgba(26,22,18,.07)', color: '#4A453E', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                {clause.clauseNumber}
              </span>
            )}
            <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: 18, fontWeight: 500, letterSpacing: '-.01em', color: '#1A1612' }}>
              {clause.clauseTitle}
            </span>
            <span style={{
              marginLeft: 'auto',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: 999,
              flexShrink: 0,
              ...(RISK_BADGE[clause.risk] ?? RISK_BADGE.medium),
            }}>
              {clause.risk}
            </span>
          </div>

          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Side-by-side language */}
            {clause.recommendedEdit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <p style={monoLabel}>Current Language</p>
                  <div style={{ background: '#F2EFEB', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(26,22,18,.11)' }}>
                    <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#4A453E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {clause.clauseText}
                    </p>
                  </div>
                </div>
                <div>
                  <p style={{ ...monoLabel, color: '#1F4A3B' }}>Recommended Language</p>
                  <div style={{ background: 'rgba(31,74,59,.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(31,74,59,.15)' }}>
                    <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#1A4032', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {clause.recommendedEdit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Negotiation strategies */}
            {(clause.counterargumentsAndNegotiationStrategies?.length ?? 0) > 0 && (
              <div>
                <p style={monoLabel}>Negotiation Playbook</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {clause.counterargumentsAndNegotiationStrategies!.map((s, i) => (
                    <div key={i} style={{ background: '#F2EFEB', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(26,22,18,.11)' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: '.05em',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 999,
                        marginBottom: 10,
                        ...(STRATEGY_BADGE[s.strategyType] ?? DEFAULT_STRAT),
                      }}>
                        {s.strategyType}
                      </span>
                      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#4A453E', marginBottom: 3 }}>
                        Their argument
                      </p>
                      <p style={{ fontSize: 13.5, color: '#4A453E', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 10 }}>
                        &ldquo;{s.counterpartyArgument}&rdquo;
                      </p>
                      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1F4A3B', marginBottom: 3 }}>
                        Your response
                      </p>
                      <p style={{ fontSize: 13.5, color: '#1A1612', lineHeight: 1.55 }}>
                        {s.negotiationResponse}
                      </p>
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
