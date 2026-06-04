'use client';

import './onboarding.css';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export type UserContext = {
  role: string;
  companyName: string;
  industry: string;
  mainConcern: string;
  jurisdiction: string;
};

interface OnboardingModalProps {
  initialContext?: UserContext;
  onComplete: (context: UserContext) => void;
}

const ROLES        = ['Founder', 'Freelancer', 'Employee', 'Business Owner', 'Other'];
const INDUSTRIES   = ['Tech', 'Legal', 'Finance', 'Healthcare', 'Real Estate', 'Other'];
const CONCERNS     = ['IP Ownership', 'Payment Terms', 'Liability', 'Termination', 'Confidentiality'];
const JURISDICTIONS = ['India', 'United States', 'European Union', 'United Kingdom', 'Other'];

const STEPS = [
  {
    kicker: 'Step 1 of 5 · Welcome',
    q: <>First — what best describes <em>your</em> role?</>,
    help: 'This helps ClausePal read every contract from your point of view.',
  },
  {
    kicker: 'Step 2 of 5 · About you',
    q: <>What should we <em>call</em> you or your company?</>,
    help: "We'll use this on your reports and shared redlines.",
  },
  {
    kicker: 'Step 3 of 5 · Context',
    q: <>Which <em>industry</em> are you in?</>,
    help: "Risk benchmarks differ by sector — we'll tune yours accordingly.",
  },
  {
    kicker: 'Step 4 of 5 · Your work',
    q: <>What is your <em>main concern</em> with contracts?</>,
    help: "ClausePal will flag clauses that touch this area first.",
  },
  {
    kicker: 'Step 5 of 5 · Jurisdiction',
    q: <>What jurisdiction do you <em>operate in?</em></>,
    help: 'Contract law varies by region — this shapes every recommendation we make.',
  },
];

export function OnboardingModal({ initialContext, onComplete }: OnboardingModalProps) {
  const [form, setForm] = useState<UserContext>(
    initialContext ?? { role: '', companyName: '', industry: '', mainConcern: '', jurisdiction: '' }
  );
  const [stepIdx, setStepIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const set = (key: keyof UserContext) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Per-step completion check
  const canContinue = [
    !!form.role,
    true,                // company name optional
    !!form.industry,
    !!form.mainConcern,
    !!form.jurisdiction,
  ][stepIdx];

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx((s) => s + 1);
    else finishSetup();
  };

  const goBack = () => {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  };

  const finishSetup = () => setIsDone(true);

  const handleComplete = () => {
    localStorage.setItem('clausepal_context', JSON.stringify(form));

    let sessionId = localStorage.getItem('clausepal_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('clausepal_session_id', sessionId);
    }
    void Promise.resolve(
      supabase.from('user_context').upsert(
        {
          session_id: sessionId,
          role: form.role,
          company_name: form.companyName,
          industry: form.industry,
          main_concern: form.mainConcern,
          jurisdiction: form.jurisdiction,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      )
    ).catch(() => {});

    onComplete(form);
  };

  const summaryChips = [form.role, form.companyName, form.industry, form.mainConcern, form.jurisdiction]
    .filter(Boolean);

  const displayName = form.companyName.trim() || 'there';

  return (
    <div className="ob-overlay">
      {/* top bar */}
      <div className="ob-top">
        <div className="ob-top-row">
          <div className="ob-brand">
            <div className="ob-badge">§</div>
            <div className="ob-brand-name">ClausePal</div>
          </div>
          {!isDone && (
            <button type="button" className="ob-skip" onClick={finishSetup}>
              Skip for now
            </button>
          )}
        </div>

        {/* progress segments */}
        <div className="ob-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`ob-seg${isDone || i < stepIdx ? ' done' : i === stepIdx ? ' current' : ''}`}
            >
              <span className="ob-seg-fill" />
            </div>
          ))}
        </div>
      </div>

      {/* stage */}
      <div className="ob-stage">
        <div className="ob-card">

          {isDone ? (
            /* done screen */
            <div className="ob-done">
              <div className="ob-done-mark">✓</div>
              <h2>You&apos;re all set, <em>{displayName}.</em></h2>
              <p>
                ClausePal is tuned to your profile. Every contract you upload
                will be read from your point of view.
              </p>
              {summaryChips.length > 0 && (
                <div className="ob-summary">
                  {summaryChips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="ob-continue"
                style={{ marginTop: 34 }}
                onClick={handleComplete}
              >
                Analyze my first contract →
              </button>
            </div>
          ) : (
            /* active step */
            <div key={stepIdx} className="ob-step">
              <div className="ob-kicker">{STEPS[stepIdx].kicker}</div>
              <h2 className="ob-q">{STEPS[stepIdx].q}</h2>
              <p className="ob-help">{STEPS[stepIdx].help}</p>

              {stepIdx === 0 && (
                <ChipGroup options={ROLES} value={form.role} onChange={set('role')} />
              )}
              {stepIdx === 1 && (
                <div className="ob-field">
                  <input
                    type="text"
                    placeholder="e.g. Jordan Avery, or Avery Studio"
                    autoComplete="off"
                    value={form.companyName}
                    onChange={(e) => set('companyName')(e.target.value)}
                  />
                </div>
              )}
              {stepIdx === 2 && (
                <ChipGroup options={INDUSTRIES} value={form.industry} onChange={set('industry')} />
              )}
              {stepIdx === 3 && (
                <ChipGroup options={CONCERNS} value={form.mainConcern} onChange={set('mainConcern')} />
              )}
              {stepIdx === 4 && (
                <ChipGroup options={JURISDICTIONS} value={form.jurisdiction} onChange={set('jurisdiction')} />
              )}

              <div className="ob-nav">
                <button
                  type="button"
                  className={`ob-back${stepIdx === 0 ? ' hidden' : ''}`}
                  onClick={goBack}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="ob-continue"
                  disabled={!canContinue}
                  onClick={goNext}
                >
                  {stepIdx === STEPS.length - 1 ? 'Finish setup →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ob-chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`ob-chip${value === opt ? ' sel' : ''}`}
          onClick={() => onChange(opt)}
        >
          <span className="ob-chip-tick">✓</span>
          {opt}
        </button>
      ))}
    </div>
  );
}
