// api/paths.js — Fetch and update path progress

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
    // GET — fetch all path progress for a user
    if (req.method === "GET") {
      const googleId = req.query.googleId;
      if (!googleId) return res.status(400).json({ error: "Missing googleId" });

      const userResult = await pool.query("SELECT id FROM users WHERE google_id = $1", [googleId]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
      const userId = userResult.rows[0].id;

      const result = await pool.query(
        "SELECT path_id, lesson_id FROM path_progress WHERE user_id = $1 ORDER BY completed_at ASC",
        [userId]
      );

      // Transform into { pathId: [lessonId, ...] } shape to match frontend state
      const progress = {};
      for (const row of result.rows) {
        if (!progress[row.path_id]) progress[row.path_id] = [];
        progress[row.path_id].push(row.lesson_id);
      }

      return res.status(200).json({ progress });
    }

    // POST — mark a path lesson as complete
    if (req.method === "POST") {
      const { googleId, pathId, lessonId } = req.body;
      if (!googleId || !pathId || !lessonId) {
        return res.status(400).json({ error: "Missing googleId, pathId, or lessonId" });
      }

      const userResult = await pool.query("SELECT id FROM users WHERE google_id = $1", [googleId]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
      const userId = userResult.rows[0].id;

      // Use ON CONFLICT to handle replays without error
      await pool.query(
        `INSERT INTO path_progress (user_id, path_id, lesson_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, path_id, lesson_id) DO NOTHING`,
        [userId, pathId, lessonId]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Paths API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await pool.end();
  }
}
