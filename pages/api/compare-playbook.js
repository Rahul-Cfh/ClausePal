import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict",
  fetch: (url, init) => {
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(120000),
    });
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractText } = req.body;

    if (!contractText) {
      return res.status(400).json({ error: 'Contract text is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: playbookClauses, error: dbError } = await supabase
      .from('legal_playbook')
      .select('*')
      .order('clause_title', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch playbook clauses' });
    }

    const playbookContext = playbookClauses.map(clause => ({
      title: clause.clause_title,
      standardLanguage: clause.standard_language,
      explanation: clause.explanation,
      unacceptablePosition: clause.unacceptable_position,
      acceptableDeviation: clause.acceptable_level_of_deviation,
      standardResponse: clause.standard_response
    }));

    const prompt = `You are a legal contract analyst. Your task is to extract and analyze ALL clauses from the contract, then match them against our playbook.

CONTRACT TEXT:
${contractText}

PLAYBOOK CLAUSES (for reference):
${JSON.stringify(playbookContext, null, 2)}

CRITICAL INSTRUCTIONS - TWO-STEP PROCESS:

STEP 1: EXTRACT ALL CLAUSES FROM THE CONTRACT
- Read the ENTIRE contract text thoroughly from beginning to end
- Identify EVERY distinct clause, section, or provision in the contract
- Look for:
  * Numbered sections (1., 2., 3., etc.)
  * Titled sections (e.g., "Purpose", "Confidential Information", "Term and Termination")
  * Lettered subsections (a., b., c., etc.)
  * Any other distinct contractual provisions
- Do NOT filter based on the playbook - extract EVERYTHING
- If the contract has 12 clauses, you must identify all 12
- Include ALL clauses even if they seem minor or routine

STEP 2: ANALYZE AND MATCH EACH CLAUSE
- For EACH extracted clause, analyze it thoroughly
- Try to match it to the most relevant playbook clause
- If no playbook match exists, still provide analysis based on general legal principles
- Provide comprehensive analysis for every single clause

For each clause, you MUST provide ALL of the following fields:
   - clauseNumber: The original number/identifier from the contract (e.g., "1", "2.a", "3", "Recital A", etc.)
   - clauseTitle: A short, human-readable title for the clause (e.g., "CONFIDENTIAL INFORMATION", "DATA SECURITY", "PURPOSE", "GOVERNING LAW")
   - clauseText: The actual verbatim text from the contract (quote directly, max 500 chars)
   - matchedPlaybookClause: The title of the playbook clause this matches, or "No playbook match" if none exists
   - playbookMatchFound: boolean - true if a playbook match was found, false otherwise
   - summary: A concise 1-2 sentence plain English summary of what this clause means
   - issues: Array of specific issues or problems found in this clause (concrete, actionable items; use empty array if none)
   - unacceptablePositions: Array of any unacceptable positions found (use empty array if none)
   - questions: Array of 2-4 specific questions to ask the counterparty about this clause
   - mitigation: Array of 2-4 concrete suggestions to reduce risk or improve the clause
   - recommendedEdit: Provide alternative language that would be more favorable (specific text suggestion, or "No changes recommended" if favorable)
   - deviation: Assess deviation level from playbook standard as one of: "low", "medium", "high", "unacceptable", or "no_playbook" if no match
   - favourabilityScore: Rate from 0-10 where:
     * 10 = fully aligned with playbook or highly favorable
     * 7-9 = minor acceptable deviations, still favorable
     * 4-6 = moderate deviations requiring review
     * 1-3 = major deviations, unfavorable
     * 0 = contains unacceptable position
   - favourabilityPercentage: Simply favourabilityScore * 10 (an integer from 0-100)
   - risk: Overall risk rating as one of: "low", "medium", "high", or "critical"

IMPORTANT REQUIREMENTS:
- You MUST extract and analyze EVERY clause in the contract
- Do NOT skip clauses just because they don't match the playbook
- The number of clauses in your analysis should match the number of distinct clauses/sections in the contract
- If the contract has numbered sections 1-12, your response should include all 12
- Be exhaustive and comprehensive in your extraction

Return ONLY a valid JSON object with this structure:
{
  "clauseAnalysis": [
    {
      "clauseNumber": "string",
      "clauseTitle": "string",
      "clauseText": "string",
      "matchedPlaybookClause": "string",
      "playbookMatchFound": boolean,
      "summary": "string",
      "issues": ["string", ...],
      "unacceptablePositions": ["string", ...],
      "questions": ["string", ...],
      "mitigation": ["string", ...],
      "recommendedEdit": "string",
      "deviation": "low" | "medium" | "high" | "unacceptable" | "no_playbook",
      "favourabilityScore": number (0-10),
      "favourabilityPercentage": number (0-100),
      "risk": "low" | "medium" | "high" | "critical"
    }
  ],
  "overallScore": {
    "averageFavourability": number,
    "totalClauses": number,
    "lowRisk": number,
    "mediumRisk": number,
    "highRisk": number,
    "criticalRisk": number,
    "playbookMatchedClauses": number,
    "noPlaybookMatchClauses": number
  },
  "summary": "A brief 2-3 sentence summary of the overall contract favorability and key concerns"
}`;

    console.log('=== Playbook Comparison Analysis Started ===');
    console.log('Contract text length:', contractText.length);
    console.log('Number of playbook clauses available:', playbookClauses?.length || 0);
    console.log('Calling OpenAI for comprehensive clause extraction...');

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt: prompt,
      temperature: 0.3,
      maxRetries: 2,
    });

    console.log('OpenAI response received, parsing...');

    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanedText);
      console.log('✓ Successfully parsed playbook comparison result');
      console.log('=== Extraction Summary ===');
      console.log('Total clauses extracted:', analysisResult.overallScore?.totalClauses || 0);
      console.log('Playbook-matched clauses:', analysisResult.overallScore?.playbookMatchedClauses || 0);
      console.log('Clauses without playbook match:', analysisResult.overallScore?.noPlaybookMatchClauses || 0);
      console.log('Clause titles:', analysisResult.clauseAnalysis?.map(c => c.clauseTitle).join(', '));
      console.log('=========================');
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanedText.slice(0, 500));
      return res.status(500).json({
        error: 'Failed to parse analysis result',
        details: parseError.message
      });
    }

    return res.status(200).json(analysisResult);

  } catch (error) {
    console.error('Error in playbook comparison:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      details: error.message
    });
  }
}
