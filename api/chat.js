// api/chat.js — Lesson-grounded AI chat

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const { lesson, history, message } = req.body;
    if (!lesson || !message) return res.status(400).json({ error: "Missing lesson or message" });

    // Build lesson context
    const lessonContext = `You are a helpful tutor discussing a micro-learning lesson with a student. Your job is to help them explore the topic deeper, answer follow-up questions, and connect ideas.

LESSON THEY JUST READ:
Title: ${lesson.title}
Hook: ${lesson.hook}
Body: ${lesson.body}
Key insight (${lesson.insightLabel}): ${lesson.insight}
How to apply: ${lesson.apply}

GUIDELINES:
- Keep responses concise (2-4 sentences typically), since this is a mobile micro-learning app
- Ground your answers in the lesson content when relevant, but also draw on broader knowledge
- Be warm, curious, and conversational — not lecturing
- If the student asks something off-topic, gently redirect or connect it back to the lesson
- Avoid bullet lists unless explicitly helpful — prose feels more conversational
- Don't restate the lesson content verbatim — build on it`;

    const messages = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role && msg.content) messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: lessonContext,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errorData.error?.message || `Anthropic API error: ${response.status}` });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm having trouble thinking right now. Try asking again?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
