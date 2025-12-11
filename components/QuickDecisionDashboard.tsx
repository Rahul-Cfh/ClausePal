'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ClauseItem {
  clauseNumber?: string;
  clauseTitle: string;
  favourabilityPercentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  deviation: 'low' | 'medium' | 'high' | 'unacceptable' | 'no_playbook';
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
}

interface QuickDecisionDashboardProps {
  clauses: ClauseItem[];
  overallScore: OverallScore;
  summary: string;
}

export function QuickDecisionDashboard({ clauses, overallScore, summary }: QuickDecisionDashboardProps) {
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

  const getFavourabilityColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFavourabilityTextColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-700';
    if (percentage >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getRiskBadge = (risk: string) => {
    const badges = {
      low: <Badge className="bg-green-100 text-green-800 border-green-300">Low</Badge>,
      medium: <Badge className="bg-blue-100 text-blue-800 border-blue-300">Medium</Badge>,
      high: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">High</Badge>,
      critical: <Badge className="bg-red-100 text-red-800 border-red-300">Critical</Badge>,
    };
    return badges[risk as keyof typeof badges] || badges.low;
  };

  const getDeviationBadge = (deviation: string) => {
    const badges = {
      low: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Low</Badge>,
      medium: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Medium</Badge>,
      high: <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">High</Badge>,
      unacceptable: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Unacceptable</Badge>,
      no_playbook: <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">No Playbook</Badge>,
    };
    return badges[deviation as keyof typeof badges] || badges.low;
  };

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
            {(overallScore.playbookMatchedClauses !== undefined || overallScore.noPlaybookMatchClauses !== undefined) && (
              <div className="text-xs text-gray-500 mt-1">
                {overallScore.playbookMatchedClauses || 0} playbook matched • {overallScore.noPlaybookMatchClauses || 0} unmatched
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-3">Clause-by-Clause Analysis</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Clause</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 w-64">Favourability</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Risk</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {clauses.map((clause, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">
                      <div className="flex items-center gap-2">
                        {clause.clauseNumber && (
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {clause.clauseNumber}
                          </span>
                        )}
                        <span>{clause.clauseTitle}</span>
                      </div>
                      {clause.playbookMatchFound === false && (
                        <span className="text-xs text-gray-500 italic">No playbook match</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full ${getFavourabilityColor(clause.favourabilityPercentage)} transition-all`}
                            style={{ width: `${clause.favourabilityPercentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-semibold w-12 text-right ${getFavourabilityTextColor(clause.favourabilityPercentage)}`}>
                          {clause.favourabilityPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">{getRiskBadge(clause.risk)}</td>
                    <td className="py-3 px-2 text-center">{getDeviationBadge(clause.deviation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
