'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ClauseAnalysisItem {
  clause_title: string;
  found_text: string;
  favorability: 'favorable' | 'acceptable' | 'needs_review' | 'red_flag';
  explanation: string;
  deviation: string | null;
  recommendation: string;
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

  const getFavorabilityIcon = (favorability: string) => {
    switch (favorability) {
      case 'favorable':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'acceptable':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'needs_review':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'red_flag':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getFavorabilityBadge = (favorability: string) => {
    switch (favorability) {
      case 'favorable':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Favorable</Badge>;
      case 'acceptable':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Acceptable</Badge>;
      case 'needs_review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Needs Review</Badge>;
      case 'red_flag':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Red Flag</Badge>;
      default:
        return null;
    }
  };

  const getCardBorderColor = (favorability: string) => {
    switch (favorability) {
      case 'favorable':
        return 'border-l-4 border-l-green-500';
      case 'acceptable':
        return 'border-l-4 border-l-blue-500';
      case 'needs_review':
        return 'border-l-4 border-l-yellow-500';
      case 'red_flag':
        return 'border-l-4 border-l-red-500';
      default:
        return '';
    }
  };

  const filteredClauses = clauses.filter(clause => {
    if (filter === 'all') return true;
    return clause.favorability === filter;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Clause-by-Clause Analysis</CardTitle>
        <CardDescription className="text-base">
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
            variant={filter === 'favorable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('favorable')}
            className="gap-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            Favorable ({clauses.filter(c => c.favorability === 'favorable').length})
          </Button>
          <Button
            variant={filter === 'acceptable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('acceptable')}
            className="gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            Acceptable ({clauses.filter(c => c.favorability === 'acceptable').length})
          </Button>
          <Button
            variant={filter === 'needs_review' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('needs_review')}
            className="gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            Needs Review ({clauses.filter(c => c.favorability === 'needs_review').length})
          </Button>
          <Button
            variant={filter === 'red_flag' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('red_flag')}
            className="gap-1"
          >
            <XCircle className="w-4 h-4" />
            Red Flags ({clauses.filter(c => c.favorability === 'red_flag').length})
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
            <Card key={index} className={`${getCardBorderColor(clause.favorability)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getFavorabilityIcon(clause.favorability)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{clause.clause_title}</CardTitle>
                    </div>
                  </div>
                  {getFavorabilityBadge(clause.favorability)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Analysis</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{clause.explanation}</p>
                </div>

                {clause.deviation && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1 text-amber-900">Deviation from Standard</h4>
                    <p className="text-sm text-amber-800">{clause.deviation}</p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-1 text-blue-900">Recommendation</h4>
                  <p className="text-sm text-blue-800">{clause.recommendation}</p>
                </div>

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
                      <p className="text-xs text-gray-600 leading-relaxed italic">{clause.found_text}</p>
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
