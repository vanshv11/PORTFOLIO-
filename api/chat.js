
export default async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const apiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY;
  
    if (!apiKey) {
      console.error("No API key configured (XAI_API_KEY or GROQ_API_KEY)");
      return res.status(500).json({ error: "Chat service is not configured. Please add an API key." });
    }
  
    const { question, portfolioContext = "", history = [] } = req.body || {};
  
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 2000 ||
      typeof portfolioContext !== "string" ||
      portfolioContext.length > 12000 ||
      !Array.isArray(history) ||
      history.length > 2 ||
      history.some(
        (m) =>
          !m ||
          !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" ||
          m.content.length > 2000
      )
    ) {
      return res.status(400).json({ error: "Invalid chat request." });
    }
  
    try {
      const isXAI = apiKey.startsWith("xai-");
      const endpoint = isXAI
        ? "https://api.x.ai/v1/chat/completions"
        : "https://api.groq.com/openai/v1/chat/completions";
      const model = isXAI ? "grok-beta" : "llama-3.3-70b-versatile";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content: `You are Vansh Vyas's portfolio assistant.
  
  Portfolio information:
  ${portfolioContext}
  
  Instructions:
  - Answer general knowledge questions and portfolio questions.
  - If asked about weather, you can provide weather advice or help.
  - Use conversation history to understand follow-up questions.
  - Never invent personal details or project features.
  - If information is missing, say so.
  - Keep answers concise, normally under 80 words.`,
            },
            ...history,
            { role: "user", content: question.trim() },
          ],
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI provider returned status:", response.status, errorText);
        let errorMsg = "AI provider request failed.";
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.error?.message || parsed.error || parsed.message || errorMsg;
        } catch {
          errorMsg = `Provider error (${response.status}): ${errorText.slice(0, 150)}`;
        }
        return res.status(response.status).json({ error: errorMsg });
      }
  
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
  
      if (!answer) {
        return res.status(502).json({ error: "The AI returned an empty answer." });
      }
  
      return res.status(200).json({ answer });
    } catch (error) {
      console.error("Chat request failed:", error.message);
      return res.status(500).json({ error: "Unable to process chat request: " + error.message });
    }
  }
  