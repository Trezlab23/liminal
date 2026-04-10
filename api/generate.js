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

    // Scale content length to match the selected reading time
    let bodyLength, insightLength, hookLength, applyLength, readingCount;
    if (duration <= 2) {
      bodyLength = "2-3 sentences";
      insightLength = "1 sentence";
      hookLength = "one punchy sentence";
      applyLength = "one brief sentence";
      readingCount = "1-2";
    } else if (duration <= 10) {
      bodyLength = "4-6 sentences forming a couple of short paragraphs";
      insightLength = "2-3 sentences";
      hookLength = "one punchy sentence that sets up the core idea";
      applyLength = "2-3 sentences with a specific, actionable step";
      readingCount = "2-3";
    } else if (duration <= 20) {
      bodyLength = "3-4 substantial paragraphs (8-12 sentences total) with examples and context";
      insightLength = "4-6 sentences exploring the nuance in depth";
      hookLength = "1-2 sentences that create genuine curiosity";
      applyLength = "3-4 sentences with a detailed, step-by-step action";
      readingCount = "3";
    } else {
      bodyLength = "4-6 substantial paragraphs (12-18 sentences total) with multiple examples, historical context, and real-world applications";
      insightLength = "6-8 sentences providing a thorough deep-dive into the surprising angle, with supporting evidence";
      hookLength = "1-2 compelling sentences";
      applyLength = "4-5 sentences with a detailed exercise or multi-step action plan";
      readingCount = "3";
    }

    const prompt = `You are a micro-learning content creator. Create an engaging, surprising lesson on ${topicLabel}. The reader has ${duration} minutes, so calibrate the LENGTH accordingly — this is a ${depth}.

Respond ONLY with a JSON object — no preamble, no markdown fences, just raw JSON:
{
  "title": "catchy lesson title (max 8 words)",
  "hook": "${hookLength} that grabs attention",
  "body": "${bodyLength} explaining the core idea clearly",
  "insightLabel": "2-4 word label for key insight (e.g. Why it works)",
  "insight": "${insightLength} with the deeper or surprising angle",
  "apply": "${applyLength} the reader can try today",
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

CRITICAL LENGTH RULE: The reader has ${duration} MINUTES. ${duration <= 2 ? "Keep it very concise — a quick hit of insight." : duration <= 10 ? "Write enough for a satisfying short read — not a quick blurb." : duration <= 20 ? "This should feel like a proper article with depth, examples, and nuance. Do NOT write a short blurb." : "This should feel like a mini-essay — thorough, rich with examples, historical context, and multiple angles. The reader has a full 30 minutes, so give them real substance."}

IMPORTANT rules for furtherReading:
- Include ${readingCount} items that are real, well-known, and directly relevant.
- Only suggest works you are highly confident actually exist — real books with real authors, real published articles, real TED talks, real research papers.
- Do NOT invent or fabricate titles. If unsure a work exists, leave it out.
- Mix types when possible (e.g. one book and one talk, or one article and one paper).
- Use the full, accurate title and correct author name.

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
        max_tokens: duration <= 2 ? 800 : duration <= 10 ? 1500 : duration <= 20 ? 2500 : 4000,
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
