'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ClauseAnalysisItem {
  clauseNumber?: string;
  clauseTitle: string;
  clauseText: string;
  matchedPlaybookClause: string;
  playbookMatchFound?: boolean;
  summary: string;
  issues: string[];
  unacceptablePositions: string[];
  questions: string[];
  mitigation: string[];
  recommendedEdit: string;
  deviation: 'low' | 'medium' | 'high' | 'unacceptable' | 'no_playbook';
  favourabilityScore: number;
  favourabilityPercentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

interface ClauseAnalysisProps {
  clauses: ClauseAnalysisItem[];
}

export function ClauseAnalysis({ clauses }: ClauseAnalysisProps) {
  const [filter, setFilter] = useState<string>('all');
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

  const toggleClause = (index: number) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClauses(newExpanded);
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getRiskBadge = (risk: string, score: number) => {
    const scoreDisplay = `${score}/10`;
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Low Risk • {scoreDisplay}</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Medium Risk • {scoreDisplay}</Badge>;
      case 'high':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">High Risk • {scoreDisplay}</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Critical • {scoreDisplay}</Badge>;
      default:
        return null;
    }
  };

  const getCardBorderColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'border-l-4 border-l-green-500';
      case 'medium':
        return 'border-l-4 border-l-blue-500';
      case 'high':
        return 'border-l-4 border-l-yellow-500';
      case 'critical':
        return 'border-l-4 border-l-red-500';
      default:
        return '';
    }
  };

  const filteredClauses = clauses.filter(clause => {
    if (filter === 'all') return true;
    return clause.risk === filter;
  });

  return (
    <Card className="bg-white text-gray-900">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900">Clause-by-Clause Analysis</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Detailed comparison against your legal playbook
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({clauses.length})
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('low')}
            className="gap-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            Low Risk ({clauses.filter(c => c.risk === 'low').length})
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('medium')}
            className="gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            Medium Risk ({clauses.filter(c => c.risk === 'medium').length})
          </Button>
          <Button
            variant={filter === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('high')}
            className="gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            High Risk ({clauses.filter(c => c.risk === 'high').length})
          </Button>
          <Button
            variant={filter === 'critical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('critical')}
            className="gap-1"
          >
            <XCircle className="w-4 h-4" />
            Critical ({clauses.filter(c => c.risk === 'critical').length})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredClauses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No clauses found for this filter.
          </div>
        ) : (
          filteredClauses.map((clause, index) => (
            <Card key={index} className={`${getCardBorderColor(clause.risk)} bg-white text-gray-900`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getRiskIcon(clause.risk)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {clause.clauseNumber && (
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {clause.clauseNumber}
                          </span>
                        )}
                        <CardTitle className="text-lg text-gray-900">{clause.clauseTitle}</CardTitle>
                      </div>
                      <p className={`text-xs mt-1 ${clause.playbookMatchFound === false ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                        Playbook Match: {clause.matchedPlaybookClause}
                        {clause.playbookMatchFound === false && ' ⚠'}
                      </p>
                      <p className="text-xs text-gray-500">Deviation: {clause.deviation.toUpperCase().replace('_', ' ')}</p>
                    </div>
                  </div>
                  {getRiskBadge(clause.risk, clause.favourabilityScore)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{clause.summary}</p>
                </div>

                {clause.issues && clause.issues.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-red-900">Issues Found</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {clause.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-red-800">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {clause.unacceptablePositions && clause.unacceptablePositions.length > 0 && (
                  <div className="p-3 bg-red-100 border-2 border-red-400 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-red-900">⚠ Unacceptable Positions</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {clause.unacceptablePositions.map((pos, idx) => (
                        <li key={idx} className="text-sm text-red-900 font-medium">{pos}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {clause.questions && clause.questions.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-blue-900">Questions for Counterparty</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {clause.questions.map((question, idx) => (
                        <li key={idx} className="text-sm text-blue-800">{question}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {clause.mitigation && clause.mitigation.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-green-900">Mitigation Suggestions</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {clause.mitigation.map((mit, idx) => (
                        <li key={idx} className="text-sm text-green-800">{mit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {clause.recommendedEdit && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-purple-900">Recommended Alternative Language</h4>
                    <p className="text-sm text-purple-800 italic leading-relaxed">{clause.recommendedEdit}</p>
                  </div>
                )}

                <Collapsible open={expandedClauses.has(index)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => toggleClause(index)}
                    >
                      <span className="text-xs font-medium">View Contract Text</span>
                      {expandedClauses.has(index) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-xs mb-2 text-gray-700">Contract Language</h4>
                      <p className="text-xs text-gray-600 leading-relaxed italic">{clause.clauseText}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
