// api/auth/google.js — Verify Google OAuth token and return/create user

import pg from "pg";
const { Pool } = pg;

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

  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing credential" });
  }

  try {
    // Verify the Google ID token using Google's tokeninfo endpoint
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const payload = await verifyRes.json();

    // Verify the token was issued for our app
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: "Token not issued for this app" });
    }

    const { sub: googleId, email, name, picture } = payload;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    try {
      // Try to find existing user
      let result = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);

      if (result.rows.length === 0) {
        // Create new user
        result = await pool.query(
          `INSERT INTO users (google_id, email, name, picture, streak, xp, lesson_count)
           VALUES ($1, $2, $3, $4, 0, 0, 0)
           RETURNING *`,
          [googleId, email, name, picture]
        );
      }

      const user = result.rows[0];

      return res.status(200).json({
        user: {
          id: user.id,
          googleId: user.google_id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          streak: user.streak,
          xp: user.xp,
          lessonCount: user.lesson_count,
          lastLessonDate: user.last_lesson_date,
        },
      });
    } finally {
      await pool.end();
    }
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
