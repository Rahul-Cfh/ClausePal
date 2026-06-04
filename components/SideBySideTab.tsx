'use client';

interface ClauseItem {
  clauseNumber?: string;
  clauseTitle: string;
  clauseText: string;
  summary: string;
  issues?: string[];
  risk: 'low' | 'medium' | 'high' | 'critical';
}

const IMPACT: Record<string, { label: string; color: string }> = {
  low:      { label: 'Low impact — standard clause',                   color: '#1F4A3B' },
  medium:   { label: 'Medium impact — review carefully',                color: '#8B6C10' },
  high:     { label: 'High impact — negotiation recommended',           color: '#a0443a' },
  critical: { label: 'Critical impact — do not accept without changes', color: '#B23A2E' },
};

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(26,22,18,.13)',
  background: '#FBFAF7',
  overflow: 'hidden',
  marginBottom: 12,
};

const headerStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderBottom: '1px solid rgba(26,22,18,.13)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap' as const,
  background: '#FBFAF7',
};

const numChipStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 10.5,
  background: 'rgba(26,22,18,.07)',
  color: '#4A453E',
  padding: '2px 7px',
  borderRadius: 5,
  flexShrink: 0,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  borderTop: '1px solid rgba(26,22,18,.10)',
};

const colStyle: React.CSSProperties = {
  padding: '18px 20px',
};

const colBorderStyle: React.CSSProperties = {
  ...colStyle,
  borderRight: '1px solid rgba(26,22,18,.10)',
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 10,
  letterSpacing: '.10em',
  textTransform: 'uppercase' as const,
  color: '#4A453E',
  fontWeight: 500,
  marginBottom: 10,
};

export function SideBySideTab({ clauses }: { clauses: ClauseItem[] }) {
  if (!clauses.length) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: '#4A453E', fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic', fontSize: 18 }}>
        No clause data available.
      </div>
    );
  }

  return (
    <div>
      {clauses.map((clause, idx) => {
        const impact = IMPACT[clause.risk] ?? IMPACT.medium;
        return (
          <div key={idx} style={cardStyle}>
            <div style={headerStyle}>
              {clause.clauseNumber && (
                <span style={numChipStyle}>{clause.clauseNumber}</span>
              )}
              <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: 18, fontWeight: 500, letterSpacing: '-.01em', color: '#1A1612' }}>
                {clause.clauseTitle}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.03em', color: impact.color, flexShrink: 0 }}>
                {impact.label}
              </span>
            </div>

            <div style={gridStyle}>
              <div style={colBorderStyle}>
                <p style={sectionLabelStyle}>Original Language</p>
                <p style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 12.5, color: '#4A453E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {clause.clauseText || 'Original text not available.'}
                </p>
              </div>
              <div style={colStyle}>
                <p style={sectionLabelStyle}>Plain English</p>
                <p style={{ fontSize: 14, color: '#1A1612', lineHeight: 1.65, marginBottom: clause.issues?.length ? 16 : 0 }}>
                  {clause.summary}
                </p>
                {clause.issues && clause.issues.length > 0 && (
                  <>
                    <p style={{ ...sectionLabelStyle, marginBottom: 8 }}>Key Points</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {clause.issues.map((issue, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5, color: '#4A453E', lineHeight: 1.55 }}>
                          <span style={{ color: 'rgba(26,22,18,.30)', flexShrink: 0, marginTop: 1 }}>·</span>
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
