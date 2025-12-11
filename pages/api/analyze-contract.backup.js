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
You are a contract explainer who outputs structured JSON.

Analyze the contract and return a JSON object with this exact structure:
{
  "summary": "A plain English summary of what this contract is about",
  "yourObligations": ["obligation 1", "obligation 2", ...],
  "theirObligations": ["obligation 1", "obligation 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "questions": ["question 1", "question 2", ...]
}

Be clear, concise, and identify the key points that a regular person needs to understand.
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
