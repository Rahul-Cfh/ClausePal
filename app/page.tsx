import Link from 'next/link';
import Image from 'next/image';
import { ClipboardList, Cog, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-16">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <Image
              src="/screenshot_2025-12-11_at_4.57.19_am.png"
              alt="LegalLens Logo"
              width={60}
              height={60}
              className="transition-transform group-hover:scale-105"
            />
            <div>
              <div className="text-2xl font-bold font-[family-name:var(--font-orbitron)] tracking-wider">LegalLens</div>
              <div className="text-sm text-cyan-400" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.4), 0 0 30px rgba(34, 211, 238, 0.2)' }}>
                Deciphering the fine print.
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-24">

        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            The AI Copilot for Everyone Who Isn't a Lawyer
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed">
            Paste. Analyze. Understand. No legal jargon. Powered by AI.
          </p>
          <Link
            href="/analyze"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Analyze a Contract
          </Link>
        </div>

        <div className="border border-slate-800 rounded-lg p-8 md:p-12 mb-16">
          <h2 className="text-2xl font-semibold text-center mb-12">How It Works</h2>

          <div className="space-y-10">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                <ClipboardList className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 1: Paste your contract</h3>
                <p className="text-slate-400">
                  Copy and paste any contract or legal document into our analyzer.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                <Cog className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 2: AI analyzes obligations, risks, and red flags</h3>
                <p className="text-slate-400">
                  Our AI breaks down complex clauses and identifies what matters most.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 3: Get a simple explanation you can trust</h3>
                <p className="text-slate-400">
                  Receive clear, actionable insights in plain language anyone can understand.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-8">
          Your data is never stored. This is not legal advice.
        </div>
      </div>
    </div>
  );
}
