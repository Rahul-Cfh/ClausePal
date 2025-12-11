'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface OverallScore {
  averageFavourability: number;
  totalClauses: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
}

interface QuickDecisionDashboardProps {
  overallScore: OverallScore;
  summary: string;
}

export function QuickDecisionDashboard({ overallScore, summary }: QuickDecisionDashboardProps) {
  const healthScore = Math.round(overallScore.averageFavourability * 10);

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-blue-50 border-blue-200';
    if (score >= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 70) return 'Strong Position';
    if (score >= 50) return 'Generally Favorable';
    if (score >= 30) return 'Review Recommended';
    return 'Significant Concerns';
  };

  const lowRiskPercent = overallScore.totalClauses > 0 ? Math.round((overallScore.lowRisk / overallScore.totalClauses) * 100) : 0;
  const mediumRiskPercent = overallScore.totalClauses > 0 ? Math.round((overallScore.mediumRisk / overallScore.totalClauses) * 100) : 0;
  const highRiskPercent = overallScore.totalClauses > 0 ? Math.round((overallScore.highRisk / overallScore.totalClauses) * 100) : 0;
  const criticalRiskPercent = overallScore.totalClauses > 0 ? Math.round((overallScore.criticalRisk / overallScore.totalClauses) * 100) : 0;

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
            <div className="text-3xl font-bold text-gray-900">{overallScore.totalClauses}</div>
            <div className="text-xs text-gray-500 mt-1">Avg Score: {overallScore.averageFavourability.toFixed(1)}/10</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">Low Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{lowRiskPercent}%</div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                {overallScore.lowRisk}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Medium Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{mediumRiskPercent}%</div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {overallScore.mediumRisk}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">High Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{highRiskPercent}%</div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {overallScore.highRisk}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium">Critical</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{criticalRiskPercent}%</div>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                {overallScore.criticalRisk}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Summary</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>

        {overallScore.criticalRisk > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 text-sm mb-1">Action Required</h4>
                <p className="text-sm text-red-800">
                  This contract has {overallScore.criticalRisk} critical risk{overallScore.criticalRisk !== 1 ? 's' : ''} that require immediate attention.
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
