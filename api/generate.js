// api/generate.js — Vercel Serverless Function
// This runs server-side so your API key stays secret.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS headers (adjust origin for production)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  try {
    const { topicLabel, duration, depth } = req.body;

    if (!topicLabel || !duration || !depth) {
      return res.status(400).json({ error: "Missing required fields: topicLabel, duration, depth" });
    }

    const prompt = `You are a micro-learning content creator. Create an engaging, surprising lesson on ${topicLabel} for someone with ${duration} minutes to spare (${depth}).

Respond ONLY with a JSON object — no preamble, no markdown fences, just raw JSON:
{
  "title": "catchy lesson title (max 8 words)",
  "hook": "one punchy opening sentence that grabs attention",
  "body": "2-3 sentences explaining the core idea clearly",
  "insightLabel": "2-4 word label for key insight (e.g. Why it works)",
  "insight": "1-2 sentences with the deeper or surprising angle",
  "apply": "one specific action the reader can try today",
  "badge": "two-word label like Quick Win or Mind-Bending",
  "quiz": {
    "question": "a multiple-choice question testing the core idea",
    "options": ["option A", "option B", "option C", "option D"],
    "answerIndex": 0
  }
}
Make it genuinely interesting — surprising facts, counterintuitive truths, or practical wisdom. Avoid platitudes.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error?.message || `Anthropic API error: ${response.status}`,
      });
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");

    // Return the raw text — the frontend will parse it
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Generate lesson error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
