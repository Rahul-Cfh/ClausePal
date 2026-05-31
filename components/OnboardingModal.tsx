'use client';

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

const ROLES = ['Freelancer', 'Employee', 'Founder', 'Investor', 'Other'];
const INDUSTRIES = ['Tech', 'Creative', 'Finance', 'Legal', 'Healthcare', 'Other'];
const CONCERNS = ['IP Ownership', 'Payment Terms', 'Liability', 'Termination', 'Confidentiality'];
const JURISDICTIONS = ['India', 'United States', 'European Union', 'United Kingdom', 'Other'];

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
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            value === opt
              ? 'bg-emerald-500 border-emerald-500 text-slate-900 font-medium'
              : 'border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function OnboardingModal({ initialContext, onComplete }: OnboardingModalProps) {
  const [form, setForm] = useState<UserContext>(
    initialContext ?? {
      role: '',
      companyName: '',
      industry: '',
      mainConcern: '',
      jurisdiction: '',
    }
  );

  const isComplete = !!(form.role && form.industry && form.mainConcern && form.jurisdiction);

  const set = (key: keyof UserContext) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!isComplete) return;

    localStorage.setItem('clausepal_context', JSON.stringify(form));

    // Fire-and-forget — don't block onComplete on a network call
    let sessionId = localStorage.getItem('clausepal_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('clausepal_session_id', sessionId);
    }
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
    ).then(() => {}).catch(() => {});

    onComplete(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto text-slate-100">
        <h2 className="text-xl font-semibold mb-1 text-slate-100">Before we analyze</h2>
        <p className="text-slate-400 text-sm mb-6">
          Tell us about yourself so we can tailor the analysis to your situation.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              1. What best describes your role?
            </label>
            <ChipGroup options={ROLES} value={form.role} onChange={set('role')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              2. Your company or project name{' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set('companyName')(e.target.value)}
              placeholder="e.g. Acme Inc., Project Atlas..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              3. What industry are you in?
            </label>
            <ChipGroup options={INDUSTRIES} value={form.industry} onChange={set('industry')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              4. What's your main concern with this contract?
            </label>
            <ChipGroup options={CONCERNS} value={form.mainConcern} onChange={set('mainConcern')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              5. What jurisdiction do you operate in?
            </label>
            <ChipGroup
              options={JURISDICTIONS}
              value={form.jurisdiction}
              onChange={set('jurisdiction')}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-500">You can update this anytime.</p>
          <button
            type="button"
            disabled={!isComplete}
            onClick={handleSubmit}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
