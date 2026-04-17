// api/setup-paths.js — One-time setup for path_progress table
// Run by visiting /api/setup-paths once in your browser after deploying

import pg from "pg";
const { Pool } = pg;

export default async function handler(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS path_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        path_id VARCHAR(100) NOT NULL,
        lesson_id VARCHAR(100) NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, path_id, lesson_id)
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_path_progress_user ON path_progress(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_path_progress_path ON path_progress(user_id, path_id);`);

    return res.status(200).json({ success: true, message: "path_progress table created successfully" });
  } catch (err) {
    console.error("Setup error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
}
