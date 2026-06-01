import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, contractText, analysisResult, userContext, chatHistory } = req.body;

  if (!message || !contractText) {
    return res.status(400).json({ error: "message and contractText are required" });
  }

  const company = userContext?.companyName || null;
  const verdict = analysisResult?.playbookComparison?.overallScore?.verdict;
  const dealScore = analysisResult?.playbookComparison?.overallScore?.dealScore;
  const verdictReason = analysisResult?.playbookComparison?.overallScore?.verdictReason;
  const topRisks = (analysisResult?.risks ?? []).slice(0, 5).join("; ");
  const topClauses = (analysisResult?.playbookComparison?.clauseAnalysis ?? [])
    .slice(0, 5)
    .map(c => `${c.clauseTitle} (${c.risk} risk, ${c.favourabilityScore}/10)`)
    .join(", ");

  const systemPrompt = `You are ClausePal, an AI legal assistant helping ${company ? company : "a user"} understand their contract.

CONTRACT TEXT:
${contractText.slice(0, 10000)}

ANALYSIS ALREADY PERFORMED:
- Summary: ${analysisResult?.summary ?? "Not available"}
- Key risks: ${topRisks || "None identified"}
${verdict ? `- Verdict: ${verdict} (Deal Score: ${dealScore}/100)` : ""}
${verdictReason ? `- Verdict reason: ${verdictReason}` : ""}
${topClauses ? `- Key clauses analyzed: ${topClauses}` : ""}

${userContext ? `USER PROFILE:
- Role: ${userContext.role}
- Industry: ${userContext.industry}
- Main concern: ${userContext.mainConcern}
- Jurisdiction: ${userContext.jurisdiction}` : ""}

Answer questions conversationally in plain English. Be direct, specific, and practical. Reference specific clauses and terms from the contract when relevant. You are not a lawyer and this is not legal advice — if the user asks for definitive legal guidance, remind them to consult a qualified lawyer.`;

  // Build messages array from history (includes the current user message)
  const messages = (chatHistory ?? []).map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(chunk.delta.text);
      }
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
}
