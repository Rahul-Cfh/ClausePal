import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

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

const openaiExtended = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict",
  fetch: (url, init) => {
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(180000),
    });
  },
});

export default async function handler(req, res) {
  console.log("=== API Handler Called ===");
  console.log("Method:", req.method);

  try {
    if (req.method !== "POST") {
      console.log("ERROR: Method not allowed");
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("Step 1: Checking API key...");
    if (!process.env.OPENAI_API_KEY) {
      console.log("ERROR: OpenAI API key not configured");
      return res
        .status(500)
        .json({ error: "Server OpenAI API key is not configured." });
    }
    console.log("Step 1: API key found ✓");

    console.log("Step 2: Parsing request body...");
    const body = req.body;
    console.log("Body received:", {
      hasContractText: !!body.contractText,
      contractTextLength: body.contractText?.length || 0,
      contractType: body.contractType,
      country: body.country
    });

    const contractText =
      typeof body.contractText === "string" ? body.contractText.trim() : "";
    const contractType = body.contractType || "Unknown";
    const country = body.country || "Unknown";

    if (!contractText) {
      console.log("ERROR: No contract text received");
      return res
        .status(400)
        .json({ error: "No contract text received by server." });
    }
    console.log("Step 2: Request body parsed ✓");

    console.log("Step 3: Trimming contract text...");
    const trimmed = contractText.slice(0, 12000);
    console.log("Step 3: Contract trimmed to", trimmed.length, "characters ✓");

    const systemPrompt = `
You are a contract explainer for non-lawyers who outputs structured JSON.

Read the ENTIRE contract text thoroughly and identify ALL clauses present. Analyze EVERY single clause comprehensively, not just a subset. The contract type / country context will help make your analysis more relevant.

You MUST return a JSON object with this EXACT structure (do NOT add any extra top-level keys):

{
  "summary": "string - A plain English summary of what this contract is about (2-4 sentences)",
  "yourObligations": ["string", "..."],
  "theirObligations": ["string", "..."],
  "risks": ["string", "..."],
  "questions": ["string", "..."],
  "note": "string - A brief disclaimer or note about the analysis",
  "riskOverview": "string - A 2-3 sentence overall view of the main risks in this contract",
  "quantifiedRisks": [
    {
      "title": "string - Short name of the risk",
      "riskLevel": "High" | "Medium" | "Low",
      "likelihood": "High" | "Medium" | "Low" | "Unknown",
      "overallRisk": "Low" | "Medium" | "High" | "Critical",
      "potentialDamage": "string - Quantified loss if possible (e.g., 'Up to ₹38,000', 'Full deposit ₹1,10,000 at risk'), otherwise qualitative description",
      "explanation": "string - 1-3 sentences explaining why this is a risk"
    }
  ],
  "mitigationSteps": [
    {
      "title": "string - What this mitigation is about",
      "steps": ["string - Concrete, practical action", "..."]
    }
  ],
  "complianceProcesses": [
    {
      "title": "string - The clause or obligation",
      "process": ["string - Recurring or systematic action", "..."]
    }
  ]
}

Instructions:
1. Fill ALL of the original fields:
   - summary: Plain English overview of the contract
   - yourObligations: What the signing party must do (array of strings)
   - theirObligations: What the other party must do (array of strings)
   - risks: Key risks and red flags (array of strings)
   - questions: Important questions to ask before signing (array of strings)
   - note: A brief disclaimer (e.g., "This is an AI-generated analysis and not legal advice")

2. Additionally compute richer risk analysis:
   - riskOverview: A 2-3 sentence overall assessment of the main risks in this contract

   - quantifiedRisks: CRITICAL - Analyze EVERY clause in the contract and provide a risk assessment for ALL of them. Do NOT filter to only high-priority items. Include ALL clauses even if they have low risk. For each clause/risk:
     * title: Short descriptive name for the clause or risk
     * riskLevel: Assess the SEVERITY of impact if it occurs as "High", "Medium", or "Low"
     * likelihood: Assess how likely this risk is to occur as "High", "Medium", "Low", or "Unknown"
     * overallRisk: Compute this using the risk matrix below based on riskLevel (severity) × likelihood:

       RISK MATRIX:
       Severity ↓ / Likelihood →     Low        Medium        High
       ----------------------------------------------------------------
       Low severity                  Low        Low           Medium
       Medium severity               Low        Medium        High
       High severity                 Medium     High          Critical

       Examples:
       - High severity + Low likelihood = Medium overallRisk
       - Medium severity + High likelihood = High overallRisk
       - Low severity + Medium likelihood = Low overallRisk
       - High severity + High likelihood = Critical overallRisk
       - Any severity + Unknown likelihood = use your best judgment (typically Medium)

     * potentialDamage: Quantify the loss if possible (e.g., "Up to ₹38,000", "Full deposit ₹1,10,000 at risk", "Up to one month rent"). If exact amounts aren't in the contract, give a qualitative description (e.g., "Significant financial penalties", "Loss of property rights")
     * explanation: 1-3 sentences explaining what this clause means and why it is or isn't a risk in simple, practical terms

   - mitigationSteps: For EVERY identified risk or unfavorable clause, provide mitigation steps. Each item should have:
     * title: Clear title of what this mitigation addresses
     * steps: Array of 2-5 concrete, practical actions the user can take

   - complianceProcesses: For EVERY clause that requires ongoing compliance, provide a process. Each item should have:
     * title: The clause or obligation being addressed
     * process: Array of 2-5 recurring or systematic actions (e.g., monthly payment reminders, documentation practices, inspection checklists)

3. Strict requirements:
   - ALWAYS return valid JSON with the exact keys above
   - NO markdown, no backticks, no commentary outside the JSON
   - All arrays must always exist (even if empty, use [])
   - All strings must not contain unescaped quotes
   - Keep language simple and accessible for non-lawyers
   - Do NOT provide legal advice; only explain meaning and potential risks
   - Use the contract type and country context to make your analysis more relevant and specific
   - When computing overallRisk, strictly follow the risk matrix provided above
   - IMPORTANT: Do NOT filter or prioritize - include ALL clauses in your analysis
`;

    const userPrompt = `
Contract type: ${contractType}
Country: ${country}

Contract:
"""
${trimmed}
"""
`;

    console.log("Step 4: Preparing OpenAI API call...");
    console.log("Model: gpt-4o-mini");
    console.log("Contract type:", contractType);
    console.log("Country:", country);

    let text;
    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        temperature: 0.2,
        maxTokens: 8000,
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: 2,
      });
      text = result.text;
      console.log("Step 4: OpenAI API call completed ✓");
    } catch (apiError) {
      console.log("OpenAI API Error:", apiError.message);
      console.log("Full error:", JSON.stringify(apiError, null, 2));
      throw new Error(`OpenAI API failed: ${apiError.message}`);
    }

    console.log("Step 5: Processing OpenAI response...");
    console.log("Response text (first 300 chars):", text.slice(0, 300));
    console.log("Step 5: Response received ✓");

    console.log("Step 6: Parsing final JSON from response...");

    // Strip markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7); // Remove ```json
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3); // Remove ```
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3); // Remove trailing ```
    }
    cleanedText = cleanedText.trim();

    console.log("Cleaned text (first 300 chars):", cleanedText.slice(0, 300));

    const finalJson = JSON.parse(cleanedText);
    console.log("Final JSON structure:", {
      hasSummary: !!finalJson.summary,
      hasYourObligations: !!finalJson.yourObligations,
      hasTheirObligations: !!finalJson.theirObligations,
      hasRisks: !!finalJson.risks,
      hasQuestions: !!finalJson.questions,
      yourObligationsCount: finalJson.yourObligations?.length || 0,
      theirObligationsCount: finalJson.theirObligations?.length || 0,
      risksCount: finalJson.risks?.length || 0,
      questionsCount: finalJson.questions?.length || 0
    });
    console.log("Step 7: Final JSON parsed ✓");

    console.log("Step 8: Performing simplified clause analysis...");
    let playbookComparison = null;
    try {
        const simplifiedPrompt = `You are a legal contract analyst. Analyze this contract and identify the TOP 3-5 MOST IMPORTANT clauses.

CONTRACT TEXT:
${trimmed}

INSTRUCTIONS:
1. Identify the 3-5 most critical clauses in this contract
2. Focus on clauses that have the most significant business or legal impact
3. Provide detailed analysis for each clause

For each clause, provide:
- clauseNumber: Original identifier from contract (e.g., "1", "2", "Section A")
- clauseTitle: Short, clear title (e.g., "Confidentiality", "Payment Terms", "Liability")
- clauseText: Verbatim text from contract (max 500 chars)
- summary: 1-2 sentence plain English explanation
- issues: Specific problems or concerns (array of strings)
- unacceptablePositions: Extremely problematic terms that should not be accepted (array of strings, empty if none)
- questions: 2-3 questions to ask the counterparty (array of strings)
- mitigation: 2-3 suggestions to reduce risk (array of strings)
- recommendedEdit: Suggested alternative language for this clause (string, can be empty)
- matchedPlaybookClause: "Quick Analysis Mode" (fixed string since no playbook comparison)
- playbookMatchFound: false (boolean, always false in quick mode)
- deviation: "no_playbook" (fixed string since no playbook comparison)
- favourabilityScore: 0-10 (10=very favorable, 0=unacceptable)
- favourabilityPercentage: favourabilityScore * 10 (0-100)
- risk: "low", "medium", "high", or "critical"

Return ONLY valid JSON:
{
  "clauseAnalysis": [
    {
      "clauseNumber": "string",
      "clauseTitle": "string",
      "clauseText": "string",
      "summary": "string",
      "issues": ["string"],
      "unacceptablePositions": ["string"],
      "questions": ["string"],
      "mitigation": ["string"],
      "recommendedEdit": "string",
      "matchedPlaybookClause": "Quick Analysis Mode",
      "playbookMatchFound": false,
      "deviation": "no_playbook",
      "favourabilityScore": number,
      "favourabilityPercentage": number,
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
  "summary": "2-3 sentence summary of overall contract analysis"
}`;

        console.log('Calling OpenAI for simplified clause analysis...');
        console.log('Simplified prompt length:', simplifiedPrompt.length);
        console.log('Contract text length:', trimmed.length);

        const startTime = Date.now();

        const playbookResult = await generateText({
          model: openai('gpt-4o'),
          prompt: simplifiedPrompt,
          temperature: 0.3,
          maxTokens: 8000,
          maxRetries: 1,
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Simplified clause analysis completed in ${duration} seconds`);

        let cleanedPlaybookText = playbookResult.text.trim();
        if (cleanedPlaybookText.startsWith("```json")) {
          cleanedPlaybookText = cleanedPlaybookText.slice(7);
        } else if (cleanedPlaybookText.startsWith("```")) {
          cleanedPlaybookText = cleanedPlaybookText.slice(3);
        }
        if (cleanedPlaybookText.endsWith("```")) {
          cleanedPlaybookText = cleanedPlaybookText.slice(0, -3);
        }
        cleanedPlaybookText = cleanedPlaybookText.trim();

        console.log("Cleaned analysis text (first 500 chars):", cleanedPlaybookText.slice(0, 500));
        console.log("Cleaned analysis text (last 200 chars):", cleanedPlaybookText.slice(-200));

        playbookComparison = JSON.parse(cleanedPlaybookText);

        console.log("Step 8: Clause analysis completed ✓");
        console.log("Analysis structure:", {
          hasClauseAnalysis: !!playbookComparison.clauseAnalysis,
          clauseAnalysisIsArray: Array.isArray(playbookComparison.clauseAnalysis),
          clauseAnalysisLength: playbookComparison.clauseAnalysis?.length || 0,
          hasOverallScore: !!playbookComparison.overallScore,
          totalClauses: playbookComparison.overallScore?.totalClauses || 0,
          hasSummary: !!playbookComparison.summary
        });

        if (playbookComparison.clauseAnalysis && playbookComparison.clauseAnalysis.length > 0) {
          console.log("First clause sample:", {
            clauseNumber: playbookComparison.clauseAnalysis[0].clauseNumber,
            clauseTitle: playbookComparison.clauseAnalysis[0].clauseTitle,
            hasAllRequiredFields: !!(
              playbookComparison.clauseAnalysis[0].clauseNumber &&
              playbookComparison.clauseAnalysis[0].clauseTitle &&
              playbookComparison.clauseAnalysis[0].favourabilityScore !== undefined
            )
          });
        }

        console.log("Total clauses analyzed:", playbookComparison.clauseAnalysis?.length || 0);

        if (playbookComparison && playbookComparison.clauseAnalysis && Array.isArray(playbookComparison.clauseAnalysis)) {
          const actualClauseCount = playbookComparison.clauseAnalysis.length;

          if (!playbookComparison.overallScore) {
            console.log("WARNING: overallScore missing, creating default structure");
            playbookComparison.overallScore = {};
          }

          const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
          let totalFavourability = 0;

          playbookComparison.clauseAnalysis.forEach(clause => {
            clause.matchedPlaybookClause = clause.matchedPlaybookClause || "Quick Analysis Mode";
            clause.playbookMatchFound = clause.playbookMatchFound !== undefined ? clause.playbookMatchFound : false;
            clause.deviation = clause.deviation || "no_playbook";
            clause.unacceptablePositions = clause.unacceptablePositions || [];
            clause.recommendedEdit = clause.recommendedEdit || "";

            const risk = (clause.risk || 'medium').toLowerCase();
            if (risk === 'low') riskCounts.low++;
            else if (risk === 'medium') riskCounts.medium++;
            else if (risk === 'high') riskCounts.high++;
            else if (risk === 'critical') riskCounts.critical++;

            totalFavourability += (clause.favourabilityScore || 5);
          });

          playbookComparison.overallScore.totalClauses = actualClauseCount;
          playbookComparison.overallScore.lowRisk = riskCounts.low;
          playbookComparison.overallScore.mediumRisk = riskCounts.medium;
          playbookComparison.overallScore.highRisk = riskCounts.high;
          playbookComparison.overallScore.criticalRisk = riskCounts.critical;
          playbookComparison.overallScore.averageFavourability = actualClauseCount > 0 ? totalFavourability / actualClauseCount : 0;

          console.log("Calculated overallScore:", playbookComparison.overallScore);
        }
    } catch (analysisError) {
      console.log("=== CLAUSE ANALYSIS ERROR (non-critical) ===");
      console.log("Error type:", analysisError.constructor.name);
      console.log("Error name:", analysisError.name);
      console.log("Error message:", analysisError.message);

      if (analysisError.name === 'SyntaxError') {
        console.log("This is a JSON parsing error. The AI response may be malformed.");
      } else if (analysisError.name === 'AbortError' || analysisError.message?.includes('timeout')) {
        console.log("This is a timeout error. The clause analysis took too long.");
      } else if (analysisError.message?.includes('rate limit')) {
        console.log("This is a rate limit error. Too many requests to OpenAI API.");
      }

      console.log("Continuing with basic analysis only (no detailed clause analysis)");
    }

    const responseData = {
      ...finalJson,
      playbookComparison: playbookComparison
    };

    console.log("Step 9: Sending success response to client");
    console.log("Response includes playbookComparison:", !!playbookComparison);
    if (playbookComparison) {
      console.log("PlaybookComparison totalClauses:", playbookComparison.overallScore?.totalClauses);
      console.log("PlaybookComparison clauseAnalysis length:", playbookComparison.clauseAnalysis?.length);
    }
    return res.status(200).json(responseData);
  } catch (err) {
    console.log("=== CRITICAL ERROR ===");
    console.log("Error type:", err.constructor.name);
    console.log("Error message:", err.message);
    console.log("Error stack:", err.stack);

    return res.status(500).json({
      error: "Server error",
      details: err.message || String(err),
    });
  }
}
