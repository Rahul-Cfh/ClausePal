'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-3">Error</p>
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
