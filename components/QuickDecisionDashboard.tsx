'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface OverallScore {
  favorable: number;
  acceptable: number;
  needs_review: number;
  red_flag: number;
  total: number;
}

interface QuickDecisionDashboardProps {
  overallScore: OverallScore;
  summary: string;
}

export function QuickDecisionDashboard({ overallScore, summary }: QuickDecisionDashboardProps) {
  const getHealthScore = () => {
    if (overallScore.total === 0) return 0;

    const favorableWeight = overallScore.favorable * 4;
    const acceptableWeight = overallScore.acceptable * 3;
    const needsReviewWeight = overallScore.needs_review * 1.5;
    const redFlagWeight = overallScore.red_flag * 0;

    const totalWeight = favorableWeight + acceptableWeight + needsReviewWeight + redFlagWeight;
    const maxWeight = overallScore.total * 4;

    return Math.round((totalWeight / maxWeight) * 100);
  };

  const healthScore = getHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Strong Position';
    if (score >= 60) return 'Generally Favorable';
    if (score >= 40) return 'Review Recommended';
    return 'Significant Concerns';
  };

  const favorablePercent = overallScore.total > 0 ? Math.round((overallScore.favorable / overallScore.total) * 100) : 0;
  const acceptablePercent = overallScore.total > 0 ? Math.round((overallScore.acceptable / overallScore.total) * 100) : 0;
  const needsReviewPercent = overallScore.total > 0 ? Math.round((overallScore.needs_review / overallScore.total) * 100) : 0;
  const redFlagPercent = overallScore.total > 0 ? Math.round((overallScore.red_flag / overallScore.total) * 100) : 0;

  return (
    <Card className={`border-2 ${getHealthBgColor(healthScore)}`}>
      <CardHeader>
        <CardTitle className="text-2xl">Quick Decision Dashboard</CardTitle>
        <CardDescription className="text-base">
          Playbook-based clause analysis for faster decision making
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Contract Health Score</div>
            <div className={`text-5xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore}%
            </div>
            <div className={`text-sm font-semibold mt-1 ${getHealthColor(healthScore)}`}>
              {getHealthLabel(healthScore)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-600 mb-2">Clauses Analyzed</div>
            <div className="text-3xl font-bold text-gray-900">{overallScore.total}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">Favorable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{favorablePercent}%</div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                {overallScore.favorable}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Acceptable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{acceptablePercent}%</div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {overallScore.acceptable}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">Needs Review</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{needsReviewPercent}%</div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {overallScore.needs_review}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium">Red Flags</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{redFlagPercent}%</div>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                {overallScore.red_flag}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Summary</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>

        {overallScore.red_flag > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 text-sm mb-1">Action Required</h4>
                <p className="text-sm text-red-800">
                  This contract has {overallScore.red_flag} red flag{overallScore.red_flag !== 1 ? 's' : ''} that require immediate attention.
                  Review the clause-by-clause analysis below before proceeding.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
