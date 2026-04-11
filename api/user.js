// api/user.js — Read and update user stats

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
    // GET — fetch user stats by googleId
    if (req.method === "GET") {
      const googleId = req.query.googleId;
      if (!googleId) return res.status(400).json({ error: "Missing googleId" });

      const result = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
      if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

      const user = result.rows[0];
      return res.status(200).json({
        user: {
          id: user.id,
          streak: user.streak,
          xp: user.xp,
          lessonCount: user.lesson_count,
          lastLessonDate: user.last_lesson_date,
        },
      });
    }

    // POST — update stats after completing a lesson
    if (req.method === "POST") {
      const { googleId, xpEarned } = req.body;
      if (!googleId) return res.status(400).json({ error: "Missing googleId" });

      const xpToAdd = typeof xpEarned === "number" ? xpEarned : 5;

      // Get current user
      const current = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
      if (current.rows.length === 0) return res.status(404).json({ error: "User not found" });

      const user = current.rows[0];
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const lastDate = user.last_lesson_date ? new Date(user.last_lesson_date).toISOString().slice(0, 10) : null;

      // Calculate streak
      let newStreak = user.streak;
      if (lastDate === today) {
        // Already did a lesson today — streak stays the same
        newStreak = user.streak;
      } else if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        if (lastDate === yesterdayStr) {
          // Consecutive day — increment streak
          newStreak = user.streak + 1;
        } else {
          // Missed a day — reset to 1
          newStreak = 1;
        }
      } else {
        // First ever lesson
        newStreak = 1;
      }

      const result = await pool.query(
        `UPDATE users 
         SET xp = xp + $1, lesson_count = lesson_count + 1, streak = $2, last_lesson_date = $3
         WHERE google_id = $4
         RETURNING *`,
        [xpToAdd, newStreak, today, googleId]
      );

      const updated = result.rows[0];
      return res.status(200).json({
        user: {
          id: updated.id,
          streak: updated.streak,
          xp: updated.xp,
          lessonCount: updated.lesson_count,
          lastLessonDate: updated.last_lesson_date,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("User API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await pool.end();
  }
}
