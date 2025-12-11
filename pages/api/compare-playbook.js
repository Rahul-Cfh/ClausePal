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

    const prompt = `You are a legal contract analyst. Analyze the following contract against our standard legal playbook clauses.

CONTRACT TEXT:
${contractText}

PLAYBOOK CLAUSES:
${JSON.stringify(playbookContext, null, 2)}

INSTRUCTIONS:
1. Read the ENTIRE contract text thoroughly from beginning to end
2. For EACH playbook clause, carefully search the contract to determine if a similar or related clause is present
3. For each identified clause found in the contract, provide comprehensive analysis

4. For each clause, you MUST provide ALL of the following fields:
   - clauseTitle: A short, human-readable title for the clause (e.g., "CONFIDENTIAL INFORMATION", "DATA SECURITY", "INTELLECTUAL PROPERTY", "LIMITATION OF LIABILITY")
   - clauseText: The actual verbatim text from the contract (quote directly, max 500 chars)
   - matchedPlaybookClause: The title of the playbook clause this matches
   - summary: A concise 1-2 sentence plain English summary of what this clause means
   - issues: Array of specific issues or problems found in this clause (concrete, actionable items)
   - unacceptablePositions: Array of any unacceptable positions found (if none, use empty array)
   - questions: Array of 2-4 specific questions to ask the counterparty about this clause
   - mitigation: Array of 2-4 concrete suggestions to reduce risk or improve the clause
   - recommendedEdit: Provide alternative language that would be more favorable (specific text suggestion)
   - deviation: Assess deviation level from playbook standard as one of: "low", "medium", "high", or "unacceptable"
   - favourabilityScore: Rate from 0-10 where:
     * 10 = fully aligned with playbook, highly favorable
     * 7-9 = minor acceptable deviations, still favorable
     * 4-6 = moderate deviations requiring review
     * 1-3 = major deviations, unfavorable
     * 0 = contains unacceptable position
   - favourabilityPercentage: Simply favourabilityScore * 10 (an integer from 0-100)
   - risk: Overall risk rating as one of: "low", "medium", "high", or "critical" (use "critical" if unacceptable)

5. Be thorough. Check for variations, paraphrases, and related language.

6. IMPORTANT: Only include clauses that are actually present in the contract.

Return ONLY a valid JSON object with this structure:
{
  "clauseAnalysis": [
    {
      "clauseTitle": "string",
      "clauseText": "string",
      "matchedPlaybookClause": "string",
      "summary": "string",
      "issues": ["string", ...],
      "unacceptablePositions": ["string", ...],
      "questions": ["string", ...],
      "mitigation": ["string", ...],
      "recommendedEdit": "string",
      "deviation": "low" | "medium" | "high" | "unacceptable",
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
    "criticalRisk": number
  },
  "summary": "A brief 2-3 sentence summary of the overall contract favorability and key concerns"
}`;

    console.log('Calling OpenAI for playbook comparison...');
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
      console.log('Successfully parsed playbook comparison result');
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
