"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Upload, FileText, X } from "lucide-react";
import { QuickDecisionDashboard } from "@/components/QuickDecisionDashboard";
import { ClauseAnalysis } from "@/components/ClauseAnalysis";

type ClauseAnalysisItem = {
  clause_title: string;
  found_text: string;
  favorability: 'favorable' | 'acceptable' | 'needs_review' | 'red_flag';
  explanation: string;
  deviation: string | null;
  recommendation: string;
};

type PlaybookComparison = {
  clauseAnalysis: ClauseAnalysisItem[];
  overallScore: {
    favorable: number;
    acceptable: number;
    needs_review: number;
    red_flag: number;
    total: number;
  };
  summary: string;
};

type AnalysisResult = {
  summary: string;
  yourObligations: string[];
  theirObligations: string[];
  risks: string[];
  questions: string[];
  note: string;
  riskOverview?: string;
  quantifiedRisks?: Array<{
    title: string;
    riskLevel: "High" | "Medium" | "Low";
    likelihood?: "High" | "Medium" | "Low";
    potentialDamage?: string;
    explanation: string;
  }>;
  mitigationSteps?: Array<{
    title: string;
    steps: string[];
  }>;
  complianceProcesses?: Array<{
    title: string;
    process: string[];
  }>;
  playbookComparison?: PlaybookComparison | null;
};

export default function AnalyzePage() {
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("Rental");
  const [country, setCountry] = useState("India");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/extract-pdf-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to extract text from PDF');
    }

    const data = await response.json();
    return data.text;
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 10MB. Please upload a smaller file.');
      return;
    }

    setUploadedFile(file);
    setIsProcessingPDF(true);
    setError(null);

    try {
      const extractedText = await extractTextFromPDF(file);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF. The file may be scanned or image-based.');
      }

      setContractText(extractedText);
      setIsProcessingPDF(false);
    } catch (err) {
      console.error('Error extracting text from PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract text from PDF. Please try again.';
      setError(errorMessage);
      setIsProcessingPDF(false);
      setUploadedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setContractText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!contractText.trim()) {
      setError("Please upload a contract PDF to analyze.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          contractType,
          country,
        }),
      });

      const data = await res.json().catch((e) => {
        console.error("Failed to parse response:", e);
        return null;
      });

      console.log("API Response status:", res.status);
      console.log("API Response data:", data);

      if (!res.ok || !data) {
        const msg =
          (data && (data as any).error) ||
          "Something went wrong while analyzing.";
        const details =
          data && (data as any).details
            ? ` | details: ${(data as any).details}`
            : "";
        throw new Error(msg + details);
      }

      setResult(data as AnalysisResult);
    } catch (err: any) {
      console.error("Full error:", err);
      setError(err.message || "Failed to analyze contract.");
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `contract-analysis-${timestamp}.txt`;

    const formatList = (items: string[]) => {
      if (!items || items.length === 0) return "  - Nothing specific found in this section.\n";
      return items.map(item => `  - ${item}`).join('\n');
    };

    let playbookSection = '';
    if (result.playbookComparison && result.playbookComparison.overallScore.total > 0) {
      const pb = result.playbookComparison;
      playbookSection = `
================================================================================

QUICK DECISION DASHBOARD

Contract Health Score: ${Math.round(
        ((pb.overallScore.favorable * 4 + pb.overallScore.acceptable * 3 +
          pb.overallScore.needs_review * 1.5) / (pb.overallScore.total * 4)) * 100
      )}%

Clauses Analyzed: ${pb.overallScore.total}
  - Favorable: ${pb.overallScore.favorable}
  - Acceptable: ${pb.overallScore.acceptable}
  - Needs Review: ${pb.overallScore.needs_review}
  - Red Flags: ${pb.overallScore.red_flag}

Summary: ${pb.summary}

================================================================================

CLAUSE-BY-CLAUSE ANALYSIS

${pb.clauseAnalysis.map((clause, idx) => `
${idx + 1}. ${clause.clause_title}
   Favorability: ${clause.favorability.toUpperCase().replace('_', ' ')}

   Analysis:
   ${clause.explanation}

   ${clause.deviation ? `Deviation from Standard:\n   ${clause.deviation}\n   ` : ''}
   Recommendation:
   ${clause.recommendation}

   Contract Text:
   "${clause.found_text}"
`).join('\n')}

================================================================================
`;
    }

    const content = `CONTRACT ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Contract Type: ${contractType}
Country/Region: ${country}
${playbookSection}
================================================================================

COMPREHENSIVE ANALYSIS

================================================================================

PLAIN ENGLISH SUMMARY
${result.summary}

================================================================================

YOUR OBLIGATIONS
${formatList(result.yourObligations)}

================================================================================

THEIR OBLIGATIONS
${formatList(result.theirObligations)}

================================================================================

RISKS & RED FLAGS
${formatList(result.risks)}

================================================================================

QUESTIONS TO ASK BEFORE SIGNING
${formatList(result.questions)}

================================================================================

DISCLAIMER
This explanation is generated by AI and may not cover every detail. It is not
legal advice. For important decisions, please speak to a qualified lawyer.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/screenshot_2025-12-11_at_4.57.19_am.png"
              alt="LegalLens Logo"
              width={50}
              height={50}
              className="transition-transform group-hover:scale-105"
            />
            <div className="text-right">
              <div className="text-xl font-bold font-[family-name:var(--font-orbitron)] tracking-wider">LegalLens</div>
              <div className="text-xs text-cyan-400" style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.6), 0 0 16px rgba(34, 211, 238, 0.4), 0 0 24px rgba(34, 211, 238, 0.2)' }}>
                Deciphering the fine print.
              </div>
            </div>
          </Link>
        </div>

        <h1 className="text-3xl font-semibold mb-2">Analyze your contract</h1>
        <p className="text-slate-300 mb-6">
          Upload your contract PDF and we&apos;ll break it down into simple,
          human language. This is not legal advice.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Contract type</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option>Rental</option>
              <option>Job Offer</option>
              <option>Freelance</option>
              <option>NDA</option>
              <option>SaaS</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Country or region (for context only)
            </label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="India, US, EU, etc."
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Upload your contract PDF
            </label>

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-sm text-slate-300 mb-1">
                  Drag and drop your PDF here, or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supported format: PDF (max 10MB)
                </p>
              </div>
            ) : (
              <div className="border border-slate-700 bg-slate-900/60 rounded-lg p-4">
                {isProcessingPDF ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    <div>
                      <p className="text-sm font-medium">Processing PDF...</p>
                      <p className="text-xs text-slate-400">Extracting text from your document</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-400">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 hover:bg-slate-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-500">
              We extract text from your PDF automatically. Images and complex formatting may not be preserved.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || isProcessingPDF || !contractText.trim()}
            className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
          >
            {loading ? "Analyzing..." : "Explain this contract"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {result.playbookComparison && result.playbookComparison.overallScore.total > 0 && (
              <>
                <QuickDecisionDashboard
                  overallScore={result.playbookComparison.overallScore}
                  summary={result.playbookComparison.summary}
                />

                <ClauseAnalysis clauses={result.playbookComparison.clauseAnalysis} />

                <div className="border-t-2 border-slate-700 pt-6">
                  <h2 className="text-2xl font-semibold mb-4">Comprehensive Analysis</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Detailed breakdown of obligations, risks, and recommended actions
                  </p>
                </div>
              </>
            )}

            <SectionCard title="Plain English summary">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {result.summary}
              </p>
            </SectionCard>

            <SectionCard title="Your obligations">
              <BulletList items={result.yourObligations} />
            </SectionCard>

            <SectionCard title="Their obligations">
              <BulletList items={result.theirObligations} />
            </SectionCard>

            <SectionCard title="Risks & red flags">
              <BulletList items={result.risks} />
            </SectionCard>

            <SectionCard title="Questions to ask before signing">
              <BulletList items={result.questions} />
            </SectionCard>

            {result.riskOverview && result.riskOverview.trim() && (
              <SectionCard title="Risk overview">
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {result.riskOverview}
                </p>
              </SectionCard>
            )}

            {result.quantifiedRisks && result.quantifiedRisks.length > 0 && (
              <RiskMatrix />
            )}

            {result.quantifiedRisks && result.quantifiedRisks.length > 0 && (
              <SectionCard title="Quantified risks">
                <div className="space-y-4">
                  {result.quantifiedRisks.map((risk, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm font-semibold">{risk.title}</p>
                      <p className="text-xs text-slate-400">
                        Risk level: {risk.riskLevel}
                        {risk.likelihood && `, Likelihood: ${risk.likelihood}`}
                      </p>
                      {risk.potentialDamage && (
                        <p className="text-xs text-slate-400">
                          Potential damage: {risk.potentialDamage}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{risk.explanation}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {result.mitigationSteps && result.mitigationSteps.length > 0 && (
              <SectionCard title="Mitigation steps">
                <div className="space-y-4">
                  {result.mitigationSteps.map((mitigation, idx) => (
                    <div key={idx}>
                      <p className="text-sm font-semibold mb-2">{mitigation.title}</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {mitigation.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="leading-snug">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {result.complianceProcesses && result.complianceProcesses.length > 0 && (
              <SectionCard title="Compliance process">
                <div className="space-y-4">
                  {result.complianceProcesses.map((compliance, idx) => (
                    <div key={idx}>
                      <p className="text-sm font-semibold mb-2">{compliance.title}</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {compliance.process.map((step, stepIdx) => (
                          <li key={stepIdx} className="leading-snug">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <button
              onClick={downloadResults}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-emerald-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Results
            </button>

            <p className="mt-4 text-xs text-slate-500">
              This explanation is generated by AI and may not cover every detail.
              It is not legal advice. For important decisions, please speak to a
              qualified lawyer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-base font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Nothing specific found in this section.
      </p>
    );
  }
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {items.map((item, idx) => (
        <li key={idx} className="leading-snug">
          {item}
        </li>
      ))}
    </ul>
  );
}

function RiskMatrix() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold mb-3">Risk Assessment Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900">
              <th className="border border-slate-700 p-2 text-left">Severity ↓ / Likelihood →</th>
              <th className="border border-slate-700 p-2">Low</th>
              <th className="border border-slate-700 p-2">Medium</th>
              <th className="border border-slate-700 p-2">High</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-700 p-2 font-medium">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-green-950/40 text-green-300">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-green-950/40 text-green-300">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-yellow-950/40 text-yellow-300">Medium</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-medium">Medium</td>
              <td className="border border-slate-700 p-2 text-center bg-green-950/40 text-green-300">Low</td>
              <td className="border border-slate-700 p-2 text-center bg-yellow-950/40 text-yellow-300">Medium</td>
              <td className="border border-slate-700 p-2 text-center bg-orange-950/40 text-orange-300">High</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-medium">High</td>
              <td className="border border-slate-700 p-2 text-center bg-yellow-950/40 text-yellow-300">Medium</td>
              <td className="border border-slate-700 p-2 text-center bg-orange-950/40 text-orange-300">High</td>
              <td className="border border-slate-700 p-2 text-center bg-red-950/40 text-red-300">Critical</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
