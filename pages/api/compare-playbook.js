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

    const prompt = `You are a legal contract analyst. Analyze the following contract against our standard NDA playbook clauses.

CONTRACT TEXT:
${contractText}

PLAYBOOK CLAUSES:
${JSON.stringify(playbookContext, null, 2)}

INSTRUCTIONS:
1. Identify which playbook clauses are present in the contract
2. For each identified clause, determine the favorability level:
   - "favorable": Language is in our favor or meets standard expectations
   - "acceptable": Minor deviations from standard but within acceptable limits
   - "needs_review": Significant deviations requiring careful consideration
   - "red_flag": Unacceptable positions or high-risk language

3. For each identified clause, provide:
   - clause_title: The title from the playbook
   - found_text: The actual text from the contract (quote verbatim)
   - favorability: One of the four levels above
   - explanation: Why you assigned this favorability level
   - deviation: How the contract language differs from standard (if applicable)
   - recommendation: What action should be taken

Return ONLY a valid JSON object with this structure:
{
  "clauseAnalysis": [
    {
      "clause_title": "string",
      "found_text": "string",
      "favorability": "favorable" | "acceptable" | "needs_review" | "red_flag",
      "explanation": "string",
      "deviation": "string or null",
      "recommendation": "string"
    }
  ],
  "overallScore": {
    "favorable": number,
    "acceptable": number,
    "needs_review": number,
    "red_flag": number,
    "total": number
  },
  "summary": "A brief 2-3 sentence summary of the overall contract favorability"
}

Only include clauses that are actually present in the contract. Do not include clauses that are missing.`;

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
