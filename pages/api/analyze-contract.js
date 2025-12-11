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

Read the full contract text and the contract type / country context provided by the user. Explain the contract in simple, plain language that a regular person can understand.

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

   - quantifiedRisks: Provide 3-10 of the most important risk items. For each risk:
     * title: Short descriptive name for the risk
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
     * explanation: 1-3 sentences explaining the risk in simple, practical terms

   - mitigationSteps: Provide 3-10 items describing what the user can do to reduce or manage those risks. For each:
     * title: Clear title of what this mitigation addresses
     * steps: Array of 2-5 concrete, practical actions the user can take

   - complianceProcesses: Provide 3-10 items describing ongoing processes/checklists to stay compliant with important clauses. For each:
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

    const { text } = await generateText({
      model: openai("gpt-4o-mini", {
        structuredOutputs: true,
      }),
      temperature: 0.2,
      system: systemPrompt,
      prompt: userPrompt,
    });
    console.log("Step 4: OpenAI API call completed ✓");

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

    console.log("Step 8: Sending success response to client");
    return res.status(200).json(finalJson);
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
