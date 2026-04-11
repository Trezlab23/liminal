// api/setup-db.js — Run once to create the users table
// Visit /api/setup-db in your browser after deploying to initialize the database.
// You can delete this file after running it once.

import pg from "pg";
const { Pool } = pg;

export default async function handler(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        streak INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        lesson_count INTEGER DEFAULT 0,
        last_lesson_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    return res.status(200).json({ success: true, message: "Database table created successfully." });
  } catch (err) {
    console.error("DB setup error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
}
