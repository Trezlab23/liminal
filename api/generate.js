// api/generate.js — Vercel Serverless Function
// Proxies Anthropic API calls. Suggested reading comes from the model's knowledge.

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
  },
  "furtherReading": [
    {
      "type": "book or article or paper or talk",
      "title": "exact title of the work",
      "author": "author name"
    }
  ]
}

IMPORTANT rules for furtherReading:
- Include 2-3 items that are real, well-known, and directly relevant to the lesson topic.
- Only suggest works you are highly confident actually exist — real books with real authors, real published articles, real TED talks, real research papers.
- Do NOT invent or fabricate titles. If unsure a work exists, leave it out.
- Mix types when possible (e.g. one book and one talk, or one article and one paper).
- Use the full, accurate title and correct author name.

Make the lesson genuinely interesting — surprising facts, counterintuitive truths, or practical wisdom. Avoid platitudes.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
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

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Generate lesson error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
