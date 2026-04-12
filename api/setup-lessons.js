// api/setup-lessons.js — Run once to create the lessons table
// Visit /api/setup-lessons in your browser after deploying.
// You can delete this file after running it once.

import pg from "pg";
const { Pool } = pg;

export default async function handler(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT NOT NULL,
        title TEXT NOT NULL,
        hook TEXT,
        body TEXT,
        insight_label TEXT,
        insight TEXT,
        apply_text TEXT,
        badge TEXT,
        quiz_question TEXT,
        quiz_correct BOOLEAN DEFAULT false,
        xp_earned INTEGER DEFAULT 0,
        duration INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons(user_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_topic_id ON lessons(topic_id);
    `);

    return res.status(200).json({ success: true, message: "Lessons table created successfully." });
  } catch (err) {
    console.error("DB setup error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
}
