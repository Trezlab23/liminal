import { useState } from "react";

const TOPICS = [
  { id: "career", icon: "💼", label: "Career & Work", color: "#D4875A", glow: "rgba(212,135,90,.25)" },
  { id: "psychology", icon: "🧠", label: "Psychology", color: "#7BA8B8", glow: "rgba(123,168,184,.25)" },
  { id: "finance", icon: "💰", label: "Finance", color: "#7FAE84", glow: "rgba(127,174,132,.25)" },
  { id: "world", icon: "🌍", label: "World Affairs", color: "#9B8EC4", glow: "rgba(155,142,196,.25)" },
  { id: "science", icon: "🔬", label: "Science", color: "#C48E9B", glow: "rgba(196,142,155,.25)" },
  { id: "creativity", icon: "🎨", label: "Creativity", color: "#C4A85A", glow: "rgba(196,168,90,.25)" },
];

const WAIT_TIMES = [
  { label: "2 min", value: 2, desc: "Elevator · Bus stop" },
  { label: "10 min", value: 10, desc: "Short commute" },
  { label: "20 min", value: 20, desc: "Train · Subway" },
  { label: "30 min", value: 30, desc: "Long wait" },
];

const FALLBACK = {
  title: "The 2-Minute Rule",
  hook: "If it takes less than 2 minutes, do it now.",
  body: "Productivity expert David Allen coined this in his GTD system. Your brain wastes more energy deciding to defer a small task than just completing it. Every 'I'll do it later' creates a tiny cognitive drain called an open loop.",
  insightLabel: "Why it works",
  insight: "Small undone tasks occupy working memory. Closing them immediately frees mental space for deeper thinking.",
  apply: "Next time you hesitate on a quick task — notice the hesitation, then just do it.",
  badge: "Quick Win",
  quiz: {
    question: "What does the 2-Minute Rule primarily help reduce?",
    options: ["Meeting frequency", "Cognitive load from open loops", "Email volume", "Decision fatigue"],
    answerIndex: 1,
  },
  _topicId: "career",
};

function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

async function generateLesson(topicId, duration) {
  const topicObj = TOPICS.find(t => t.id === topicId) || TOPICS[0];
  const depth = duration <= 2 ? "one sharp idea only" : duration <= 10 ? "2–3 focused ideas" : "a deeper dive with context";

  // ✅ Calls YOUR Vercel serverless function — not Anthropic directly
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicLabel: topicObj.label,
      duration,
      depth,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error ${res.status}`);
  }

  const data = await res.json();
  const parsed = extractJSON(data.text);
  if (!parsed) throw new Error("Could not parse response");
  return parsed;
}

// Noise SVG for grain texture
const noiseSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`;

function Screen({ children, style }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      animation: "fadeUp 0.45s cubic-bezier(.22,.68,0,1.2) forwards",
      overflowY: "auto", ...style,
    }}>
      {children}
    </div>
  );
}

function Tag({ label, color, glow }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 600,
      letterSpacing: 1.4, textTransform: "uppercase",
      color, border: `1px solid ${color}`,
      borderRadius: 4, padding: "3px 10px",
      background: glow,
      boxShadow: `0 0 12px ${glow}`,
    }}>{label}</span>
  );
}

function GlowOrb({ top, left, color, size = 180 }) {
  return (
    <div style={{
      position: "absolute", top, left,
      width: size, height: size, borderRadius: "50%",
      background: color, filter: "blur(60px)",
      pointerEvents: "none", zIndex: 0, opacity: .55,
    }} />
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [streak, setStreak] = useState(3);
  const [xp, setXp] = useState(140);
  const [lessonCount, setLessonCount] = useState(12);

  const topicObj = lesson ? TOPICS.find(t => t.id === lesson._topicId) : null;
  const topicColor = topicObj?.color || "#D4875A";
  const topicGlow = topicObj?.glow || "rgba(212,135,90,.2)";

  const toggleTopic = (id) =>
    setSelectedTopics(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]);

  const startLesson = async () => {
    setError(null);
    setScreen("loading");
    setQuizAnswer(null);
    const pick = selectedTopics[Math.floor(Math.random() * selectedTopics.length)];
    try {
      const data = await generateLesson(pick, selectedTime.value);
      data._topicId = pick;
      setLesson(data);
      setScreen("lesson");
    } catch (e) {
      console.error(e);
      setLesson({ ...FALLBACK, _topicId: pick });
      setError("Showing a sample lesson — AI will be back shortly.");
      setScreen("lesson");
    }
  };

  const submitQuiz = (idx) => {
    setQuizAnswer(idx);
    if (idx === lesson?.quiz?.answerIndex) setXp(p => p + 20);
  };

  const finishAndHome = () => {
    setStreak(s => s + 1);
    setXp(p => p + (quizAnswer === lesson?.quiz?.answerIndex ? 20 : 5));
    setLessonCount(c => c + 1);
    setSelectedTopics([]); setSelectedTime(null);
    setLesson(null); setError(null);
    setScreen("home");
  };

  const C = {
    bg: "#1C1510",
    surface1: "rgba(255,245,235,.04)",
    surface2: "rgba(255,245,235,.07)",
    surface3: "rgba(255,245,235,.11)",
    border: "rgba(255,235,210,.1)",
    borderHover: "rgba(255,235,210,.22)",
    text: "#F0E6D8",
    textSub: "#A8998A",
    textMuted: "#6A5C50",
    accent: "#D4875A",
    accentGlow: "rgba(212,135,90,.3)",
    green: "#7FAE84",
    red: "#C48E9B",
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#141010",
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px) scale(.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes breathe {
          0%,100% { opacity:.4; transform:scale(1); }
          50%      { opacity:.9; transform:scale(1.06); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-main {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #C97848 0%, #A85C30 100%);
          color: #FDF5EC; border: none; border-radius: 12px;
          padding: 14px 24px; font-family: 'DM Sans', sans-serif;
          font-weight: 500; font-size: 14px; cursor: pointer; width: 100%;
          letter-spacing: .4px;
          box-shadow: 0 4px 20px rgba(201,120,72,.35), inset 0 1px 0 rgba(255,255,255,.15);
          transition: opacity .2s, transform .15s, box-shadow .2s;
        }
        .btn-main::after {
          content: ''; position: absolute; inset: 0;
          background: ${noiseSVG}; opacity: .4; pointer-events: none;
        }
        .btn-main:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 6px 28px rgba(201,120,72,.45), inset 0 1px 0 rgba(255,255,255,.15); }
        .btn-main:disabled { opacity:.3; cursor:not-allowed; transform:none; box-shadow:none; }
        .btn-ghost {
          background: rgba(255,245,235,.05);
          color: ${C.textSub}; border: 1px solid ${C.border};
          border-radius: 12px; padding: 14px 24px;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          font-size: 14px; cursor: pointer; width: 100%;
          transition: background .2s, border-color .2s;
        }
        .btn-ghost:hover { background:rgba(255,245,235,.08); border-color:${C.borderHover}; }
        .card {
          background: ${C.surface2};
          border: 1px solid ${C.border};
          border-radius: 16px;
          backdrop-filter: blur(16px);
          box-shadow: 0 2px 16px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .card-deep {
          background: linear-gradient(145deg, rgba(255,245,235,.08) 0%, rgba(255,245,235,.03) 100%);
          border: 1px solid ${C.border};
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.07);
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Phone shell */}
      <div style={{
        width: 375, height: 780,
        background: C.bg,
        borderRadius: 46,
        overflow: "hidden", position: "relative",
        boxShadow: "0 48px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(255,235,210,.08), inset 0 1px 0 rgba(255,235,210,.06)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Global grain overlay */}
        <div style={{ position:"absolute", inset:0, backgroundImage: noiseSVG, backgroundSize:"256px", opacity:.4, pointerEvents:"none", zIndex:10 }} />

        {/* Status bar */}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 28px 0", color:C.textMuted, fontSize:11, flexShrink:0, fontWeight:500, position:"relative", zIndex:11 }}>
          <span>9:41</span><span style={{ letterSpacing:2 }}>···</span>
        </div>

        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>

          {/* ── HOME ── */}
          {screen === "home" && (
            <Screen style={{ padding:"20px 26px 28px", position:"relative" }}>
              <GlowOrb top={-60} left={-40} color="rgba(212,135,90,.18)" size={240} />
              <GlowOrb top={320} left={160} color="rgba(155,142,196,.12)" size={200} />
              <div style={{ flex:1, position:"relative", zIndex:1 }}>

                {/* Wordmark */}
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontFamily:"Cormorant Garamond", fontWeight:300, fontSize:36, color:C.text, letterSpacing:2, lineHeight:1 }}>Liminal</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:5, letterSpacing:1.5, textTransform:"uppercase" }}>Learning in the in-between</div>
                </div>

                {/* Hero text */}
                <div className="card-deep" style={{ padding:"20px 20px 18px", marginBottom:20 }}>
                  <div style={{ fontFamily:"Cormorant Garamond", fontSize:22, color:C.text, lineHeight:1.5, fontStyle:"italic", marginBottom:10 }}>
                    "The space between where you are and where you're going."
                  </div>
                  <div style={{ width:32, height:1, background:`linear-gradient(90deg, ${C.accent}, transparent)`, marginBottom:10 }} />
                  <div style={{ color:C.textSub, fontSize:13, lineHeight:1.7, fontWeight:300 }}>
                    Turn idle moments into micro-lessons. AI-curated, freshly composed for you every time.
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                  {[
                    { label:"Streak", val:streak, suffix:" days", color:C.accent },
                    { label:"XP", val:xp, suffix:" pts", color:"#C4A85A" },
                    { label:"Lessons", val:lessonCount, suffix:"", color:C.green },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding:"12px 8px", textAlign:"center" }}>
                      <div style={{ fontFamily:"Cormorant Garamond", fontWeight:600, fontSize:22, color:s.color, lineHeight:1 }}>{s.val}<span style={{ fontSize:11, fontFamily:"DM Sans", fontWeight:300 }}>{s.suffix}</span></div>
                      <div style={{ fontSize:9, color:C.textMuted, marginTop:4, textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* AI badge */}
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C.surface1, borderRadius:10, border:`1px solid ${C.border}` }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.accent, boxShadow:`0 0 8px ${C.accentGlow}`, flexShrink:0 }} />
                  <div style={{ fontSize:12, color:C.textSub, fontWeight:300, letterSpacing:.2 }}>Every lesson is curated for you. No two sessions are ever the same.</div>
                </div>
              </div>

              <div style={{ marginTop:20, position:"relative", zIndex:1 }}>
                <button className="btn-main" onClick={() => setScreen("topics")}>Begin a session →</button>
              </div>
            </Screen>
          )}

          {/* ── TOPICS ── */}
          {screen === "topics" && (
            <Screen style={{ padding:"20px 26px 28px" }}>
              <GlowOrb top={200} left={200} color="rgba(155,142,196,.1)" size={180} />
              <button onClick={() => setScreen("home")} style={{ background:"none", border:"none", color:C.textMuted, fontSize:13, cursor:"pointer", textAlign:"left", marginBottom:20, padding:0, position:"relative", zIndex:1 }}>← Back</button>
              <div style={{ fontFamily:"Cormorant Garamond", fontSize:30, color:C.text, marginBottom:4, fontWeight:300, position:"relative", zIndex:1 }}>What draws you?</div>
              <div style={{ color:C.textMuted, fontSize:12, marginBottom:20, letterSpacing:.3, position:"relative", zIndex:1 }}>Select one or more to explore</div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, flex:1, position:"relative", zIndex:1 }}>
                {TOPICS.map(t => {
                  const sel = selectedTopics.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTopic(t.id)} style={{
                      background: sel
                        ? `linear-gradient(145deg, ${t.glow} 0%, rgba(255,245,235,.04) 100%)`
                        : C.surface1,
                      border:`1.5px solid ${sel ? t.color : C.border}`,
                      borderRadius:16, padding:"16px 14px", cursor:"pointer",
                      transition:"all .25s", textAlign:"left",
                      boxShadow: sel ? `0 4px 20px ${t.glow}, inset 0 1px 0 rgba(255,255,255,.08)` : "0 2px 8px rgba(0,0,0,.2)",
                    }}>
                      <div style={{ fontSize:22, marginBottom:8 }}>{t.icon}</div>
                      <div style={{ color:C.text, fontWeight:500, fontSize:13 }}>{t.label}</div>
                      {sel
                        ? <div style={{ marginTop:6, fontSize:10, color:t.color, fontWeight:600, letterSpacing:.8 }}>✓ Selected</div>
                        : <div style={{ marginTop:6, fontSize:10, color:C.textMuted, letterSpacing:.5 }}>Tap to add</div>
                      }
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop:18, position:"relative", zIndex:1 }}>
                <button className="btn-main" disabled={selectedTopics.length === 0} onClick={() => setScreen("time")}>
                  Choose your window →
                </button>
              </div>
            </Screen>
          )}

          {/* ── TIME ── */}
          {screen === "time" && (
            <Screen style={{ padding:"20px 26px 28px" }}>
              <GlowOrb top={-40} left={160} color="rgba(212,135,90,.1)" size={160} />
              <button onClick={() => setScreen("topics")} style={{ background:"none", border:"none", color:C.textMuted, fontSize:13, cursor:"pointer", textAlign:"left", marginBottom:20, padding:0, position:"relative", zIndex:1 }}>← Back</button>
              <div style={{ fontFamily:"Cormorant Garamond", fontSize:30, color:C.text, marginBottom:4, fontWeight:300, position:"relative", zIndex:1 }}>How long do you have?</div>
              <div style={{ color:C.textMuted, fontSize:12, marginBottom:22, letterSpacing:.3, position:"relative", zIndex:1 }}>The lesson adapts to your window</div>

              <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1, position:"relative", zIndex:1 }}>
                {WAIT_TIMES.map(t => {
                  const sel = selectedTime?.value === t.value;
                  return (
                    <button key={t.value} onClick={() => setSelectedTime(t)} style={{
                      background: sel
                        ? `linear-gradient(135deg, rgba(212,135,90,.15) 0%, rgba(255,245,235,.04) 100%)`
                        : C.surface1,
                      border:`1.5px solid ${sel ? C.accent : C.border}`,
                      borderRadius:14, padding:"16px 20px", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      transition:"all .2s",
                      boxShadow: sel ? `0 4px 20px ${C.accentGlow}` : "none",
                    }}>
                      <div style={{ textAlign:"left" }}>
                        <div style={{ fontFamily:"Cormorant Garamond", fontWeight:400, fontSize:24, color:C.text }}>{t.label}</div>
                        <div style={{ fontSize:12, color:C.textMuted, marginTop:1, letterSpacing:.2 }}>{t.desc}</div>
                      </div>
                      {sel && (
                        <div style={{ width:22, height:22, borderRadius:"50%", background:`linear-gradient(135deg, ${C.accent}, #A85C30)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, boxShadow:`0 2px 8px ${C.accentGlow}` }}>✓</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop:18, position:"relative", zIndex:1 }}>
                <button className="btn-main" disabled={!selectedTime} onClick={startLesson}>
                  Generate my lesson ✦
                </button>
              </div>
            </Screen>
          )}

          {/* ── LOADING ── */}
          {screen === "loading" && (
            <Screen style={{ alignItems:"center", justifyContent:"center", padding:32, gap:26, position:"relative" }}>
              <GlowOrb top={100} left={80} color="rgba(212,135,90,.12)" size={200} />
              <GlowOrb top={300} left={160} color="rgba(155,142,196,.1)" size={160} />
              <div style={{ position:"relative", zIndex:1, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
                <div style={{ fontFamily:"Cormorant Garamond", fontSize:56, animation:"breathe 2.8s ease-in-out infinite", color:C.accent, lineHeight:1, textShadow:`0 0 30px ${C.accentGlow}` }}>◈</div>
                <div style={{ width:26, height:26, borderRadius:"50%", border:`2px solid rgba(255,235,210,.1)`, borderTop:`2px solid ${C.accent}`, animation:"spin .9s linear infinite" }} />
                <div>
                  <div style={{ fontFamily:"Cormorant Garamond", fontSize:22, color:C.text, marginBottom:6, fontWeight:300 }}>Composing your lesson…</div>
                  <div style={{ color:C.textMuted, fontSize:13, letterSpacing:.3 }}>Something worth your in-between time</div>
                </div>
              </div>
            </Screen>
          )}

          {/* ── LESSON ── */}
          {screen === "lesson" && lesson && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              animation: "fadeUp 0.45s cubic-bezier(.22,.68,0,1.2) forwards",
              overflow: "hidden",
            }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px 20px", position: "relative" }}>
                <GlowOrb top={-50} left={160} color={topicGlow} size={200} />

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, position:"relative", zIndex:1 }}>
                  <button onClick={() => setScreen("time")} style={{ background:"none", border:"none", color:C.textMuted, fontSize:13, cursor:"pointer", padding:0 }}>← Exit</button>
                  <div style={{ fontSize:11, color:C.textMuted, letterSpacing:.8 }}>{selectedTime?.label} read</div>
                </div>

                {error && (
                  <div style={{ background:"rgba(180,140,80,.08)", border:`1px solid rgba(180,140,80,.2)`, borderRadius:8, padding:"8px 12px", color:"#B09040", fontSize:12, marginBottom:12, position:"relative", zIndex:1 }}>⚠ {error}</div>
                )}

                {/* Progress bar */}
                <div style={{ height:2, background:"rgba(255,235,210,.07)", borderRadius:99, marginBottom:18, overflow:"hidden", position:"relative", zIndex:1 }}>
                  <div style={{ width:"65%", height:"100%", background:`linear-gradient(90deg, ${topicColor}, ${topicColor}88)`, borderRadius:99, boxShadow:`0 0 8px ${topicGlow}` }} />
                </div>

                <div style={{ marginBottom:16, position:"relative", zIndex:1 }}>
                  <Tag label={lesson.badge} color={topicColor} glow={topicGlow} />
                  <div style={{ fontFamily:"Cormorant Garamond", fontWeight:400, fontSize:26, color:C.text, lineHeight:1.25, marginTop:12 }}>{lesson.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:5, letterSpacing:.5 }}>{topicObj?.icon} {topicObj?.label}</div>
                </div>

                <div style={{ height:1, background:`linear-gradient(90deg, ${topicColor}44, transparent)`, marginBottom:18, position:"relative", zIndex:1 }} />

                <div style={{ display:"flex", flexDirection:"column", gap:14, position:"relative", zIndex:1 }}>
                  {/* Hook */}
                  <div style={{ borderLeft:`2px solid ${topicColor}`, paddingLeft:16, boxShadow:`-4px 0 12px ${topicGlow}` }}>
                    <div style={{ fontFamily:"Cormorant Garamond", fontSize:20, fontStyle:"italic", color:C.text, lineHeight:1.5 }}>{lesson.hook}</div>
                  </div>

                  {/* Body */}
                  <div style={{ color:C.textSub, fontSize:14, lineHeight:1.8, fontWeight:300 }}>{lesson.body}</div>

                  {/* Insight */}
                  <div className="card-deep" style={{ padding:16 }}>
                    <div style={{ fontSize:9, color:topicColor, fontWeight:600, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>{lesson.insightLabel}</div>
                    <div style={{ color:C.text, fontSize:14, lineHeight:1.65, fontWeight:300 }}>{lesson.insight}</div>
                  </div>

                  {/* Apply */}
                  <div style={{ background:`linear-gradient(135deg, rgba(127,174,132,.1) 0%, rgba(255,245,235,.03) 100%)`, border:`1px solid rgba(127,174,132,.2)`, borderRadius:14, padding:16, boxShadow:"inset 0 1px 0 rgba(255,255,255,.04)" }}>
                    <div style={{ fontSize:9, color:C.green, fontWeight:600, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Try it</div>
                    <div style={{ color:C.textSub, fontSize:14, lineHeight:1.65, fontWeight:300 }}>{lesson.apply}</div>
                  </div>
                </div>
              </div>

              {/* Pinned button — always visible at bottom */}
              <div style={{ flexShrink: 0, padding: "12px 26px 28px", position: "relative", zIndex: 1, background: `linear-gradient(0deg, ${C.bg} 60%, transparent)` }}>
                <button className="btn-main" onClick={() => setScreen("quiz")}>Quick reflection →</button>
              </div>
            </div>
          )}

          {/* ── QUIZ ── */}
          {screen === "quiz" && lesson && (
            <Screen style={{ padding:"20px 26px 28px", position:"relative" }}>
              <GlowOrb top={300} left={-40} color="rgba(127,174,132,.1)" size={180} />
              <div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase", letterSpacing:2, marginBottom:20, position:"relative", zIndex:1 }}>Reflection</div>
              <div style={{ fontFamily:"Cormorant Garamond", fontSize:22, color:C.text, lineHeight:1.45, marginBottom:24, fontWeight:400, position:"relative", zIndex:1 }}>
                {lesson.quiz?.question}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1, position:"relative", zIndex:1 }}>
                {(lesson.quiz?.options || []).map((opt, i) => {
                  const isCorrect = i === lesson.quiz?.answerIndex;
                  const isSelected = quizAnswer === i;
                  const revealed = quizAnswer !== null;
                  let bg = C.surface1, borderC = C.border, color = C.textSub, shadow = "none";
                  if (revealed) {
                    if (isCorrect) { bg="rgba(127,174,132,.12)"; borderC="#7FAE84"; color=C.green; shadow=`0 2px 12px rgba(127,174,132,.15)`; }
                    else if (isSelected) { bg="rgba(196,142,155,.1)"; borderC="#C48E9B"; color=C.red; }
                  }
                  return (
                    <button key={i} onClick={() => !revealed && submitQuiz(i)} style={{
                      background:bg, border:`1.5px solid ${borderC}`,
                      borderRadius:12, padding:"13px 16px",
                      cursor:revealed?"default":"pointer",
                      textAlign:"left", color, fontSize:14,
                      fontFamily:"'DM Sans', sans-serif",
                      fontWeight:(isSelected||(revealed&&isCorrect))?500:300,
                      transition:"all .2s", boxShadow:shadow,
                    }}>
                      {revealed && isCorrect && "✓  "}{revealed && isSelected && !isCorrect && "✗  "}{opt}
                    </button>
                  );
                })}
              </div>

              {quizAnswer !== null && (
                <div style={{ marginTop:20, position:"relative", zIndex:1 }}>
                  <div style={{ textAlign:"center", marginBottom:12, color:quizAnswer===lesson.quiz?.answerIndex?C.green:C.textMuted, fontStyle:"italic", fontFamily:"Cormorant Garamond", fontSize:16 }}>
                    {quizAnswer===lesson.quiz?.answerIndex ? "+20 XP — well done." : "Keep exploring — understanding deepens over time."}
                  </div>
                  <button className="btn-main" onClick={() => setScreen("done")}>Complete session</button>
                </div>
              )}
            </Screen>
          )}

          {/* ── DONE ── */}
          {screen === "done" && (
            <Screen style={{ padding:"36px 26px 32px", alignItems:"center", justifyContent:"center", textAlign:"center", position:"relative" }}>
              <GlowOrb top={60} left={80} color="rgba(212,135,90,.14)" size={220} />
              <GlowOrb top={400} left={160} color="rgba(155,142,196,.1)" size={160} />
              <div style={{ position:"relative", zIndex:1, width:"100%" }}>
                <div style={{ fontFamily:"Cormorant Garamond", fontSize:56, color:C.accent, marginBottom:14, lineHeight:1, textShadow:`0 0 40px ${C.accentGlow}` }}>◈</div>
                <div style={{ fontFamily:"Cormorant Garamond", fontWeight:300, fontSize:28, color:C.text, marginBottom:6 }}>Session complete.</div>
                <div style={{ color:C.textMuted, marginBottom:28, fontStyle:"italic", fontFamily:"Cormorant Garamond", fontSize:16 }}>Another moment well spent.</div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
                  {[
                    { label:"XP earned", val:quizAnswer===lesson?.quiz?.answerIndex?"+20":"+5", color:C.accent },
                    { label:"Streak", val:`${streak+1} days`, color:"#C4A85A" },
                    { label:"Lesson", val:"Complete", color:C.green },
                    { label:"Time", val:selectedTime?.label||"—", color:"#7BA8B8" },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding:14, textAlign:"center" }}>
                      <div style={{ fontFamily:"Cormorant Garamond", fontWeight:400, fontSize:20, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:9, color:C.textMuted, marginTop:4, textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button className="btn-main" onClick={startLesson}>Another lesson ✦</button>
                  <button className="btn-ghost" onClick={finishAndHome}>Return home</button>
                </div>
              </div>
            </Screen>
          )}

        </div>

        {/* Bottom nav */}
        {["home","topics","time"].includes(screen) && (
          <div style={{ display:"flex", justifyContent:"space-around", padding:"10px 0 20px", borderTop:`1px solid ${C.border}`, flexShrink:0, background:`linear-gradient(0deg, rgba(28,21,16,.98) 0%, rgba(28,21,16,.9) 100%)`, position:"relative", zIndex:11 }}>
            {[
              { icon:"◇", label:"Home", s:"home" },
              { icon:"◈", label:"Topics", s:"topics" },
              { icon:"◉", label:"Time", s:"time" },
            ].map(n => (
              <button key={n.label} onClick={() => setScreen(n.s)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:15, color:screen===n.s?C.accent:C.textMuted, fontFamily:"Cormorant Garamond", transition:"color .2s", textShadow:screen===n.s?`0 0 12px ${C.accentGlow}`:"none" }}>{n.icon}</span>
                <span style={{ fontSize:9, color:screen===n.s?C.accent:C.textMuted, fontWeight:500, letterSpacing:.8, textTransform:"uppercase" }}>{n.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
