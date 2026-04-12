// api/lessons.js — Save and retrieve lesson history

import pg from "pg";
const { Pool } = pg;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    if (req.method === "GET") {
      const googleId = req.query.googleId;
      if (!googleId) return res.status(400).json({ error: "Missing googleId" });

      const userResult = await pool.query("SELECT id FROM users WHERE google_id = $1", [googleId]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
      const userId = userResult.rows[0].id;

      const lessonsResult = await pool.query(
        `SELECT id, topic_id, title, hook, body, insight_label, insight, apply_text, badge, quiz_question, quiz_correct, xp_earned, duration, created_at
         FROM lessons WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );

      const progressResult = await pool.query(
        `SELECT topic_id, COUNT(*) as lesson_count, SUM(xp_earned) as total_xp,
                SUM(CASE WHEN quiz_correct THEN 1 ELSE 0 END) as correct_count
         FROM lessons WHERE user_id = $1 GROUP BY topic_id`,
        [userId]
      );

      return res.status(200).json({
        lessons: lessonsResult.rows.map(r => ({
          id: r.id,
          topicId: r.topic_id,
          title: r.title,
          hook: r.hook,
          body: r.body,
          insightLabel: r.insight_label,
          insight: r.insight,
          apply: r.apply_text,
          badge: r.badge,
          quizQuestion: r.quiz_question,
          quizCorrect: r.quiz_correct,
          xpEarned: r.xp_earned,
          duration: r.duration,
          createdAt: r.created_at,
        })),
        progress: progressResult.rows.map(r => ({
          topicId: r.topic_id,
          lessonCount: parseInt(r.lesson_count),
          totalXp: parseInt(r.total_xp),
          correctCount: parseInt(r.correct_count),
        })),
      });
    }

    if (req.method === "POST") {
      const { googleId, lesson, quizCorrect, xpEarned, duration } = req.body;
      if (!googleId || !lesson) return res.status(400).json({ error: "Missing required fields" });

      const userResult = await pool.query("SELECT id FROM users WHERE google_id = $1", [googleId]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
      const userId = userResult.rows[0].id;

      await pool.query(
        `INSERT INTO lessons (user_id, topic_id, title, hook, body, insight_label, insight, apply_text, badge, quiz_question, quiz_correct, xp_earned, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [userId, lesson.topicId||"", lesson.title||"", lesson.hook||"", lesson.body||"", lesson.insightLabel||"", lesson.insight||"", lesson.apply||"", lesson.badge||"", lesson.quizQuestion||"", quizCorrect||false, xpEarned||0, duration||0]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Lessons API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await pool.end();
  }
}
