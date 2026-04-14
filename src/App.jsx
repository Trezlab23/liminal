import { useState, useEffect, useCallback } from "react";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

const TOPICS = [
  { id: "career", icon: "💼", label: "Career & Work", color: "#a064ff", glow: "rgba(160,100,255,.2)" },
  { id: "psychology", icon: "🧠", label: "Psychology", color: "#64b4ff", glow: "rgba(100,180,255,.2)" },
  { id: "finance", icon: "💰", label: "Finance", color: "#4ade80", glow: "rgba(74,222,128,.2)" },
  { id: "world", icon: "🌍", label: "World Affairs", color: "#ff3c78", glow: "rgba(255,60,120,.2)" },
  { id: "science", icon: "🔬", label: "Science", color: "#f59e0b", glow: "rgba(245,158,11,.2)" },
  { id: "creativity", icon: "🎨", label: "Creativity", color: "#c084fc", glow: "rgba(192,132,252,.2)" },
];

const WAIT_TIMES = [
  { label: "2 min", value: 2, desc: "Elevator · Bus stop" },
  { label: "10 min", value: 10, desc: "Short commute" },
  { label: "20 min", value: 20, desc: "Train · Subway" },
  { label: "30 min", value: 30, desc: "Long wait" },
];

const FALLBACK = {
  title: "The 2-Minute Rule", hook: "If it takes less than 2 minutes, do it now.",
  body: "Productivity expert David Allen coined this in his GTD system. Your brain wastes more energy deciding to defer a small task than just completing it.",
  insightLabel: "Why it works", insight: "Small undone tasks occupy working memory. Closing them immediately frees mental space for deeper thinking.",
  apply: "Next time you hesitate on a quick task — notice the hesitation, then just do it.", badge: "Quick Win",
  quiz: { question: "What does the 2-Minute Rule primarily help reduce?", options: ["Meeting frequency", "Cognitive load from open loops", "Email volume", "Decision fatigue"], answerIndex: 1 },
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

async function generateLesson(topicId, duration, googleId) {
  const topicObj = TOPICS.find(t => t.id === topicId);
  const topicLabel = topicObj ? topicObj.label : topicId; // custom topics use the ID as the label
  const depth = duration <= 2 ? "one sharp idea only" : duration <= 10 ? "2-3 focused ideas" : "a deeper dive with context";
  const body = { topicLabel, duration, depth };
  if (googleId) body.googleId = googleId;
  const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || `API error ${res.status}`); }
  const data = await res.json();
  const parsed = extractJSON(data.text);
  if (!parsed) throw new Error("Could not parse response");
  return parsed;
}

/* Nav Icons */
const NavHome = ({ active }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#a064ff" : "rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const NavProgress = ({ active }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#a064ff" : "rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const NavHistory = ({ active }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#a064ff" : "rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M4.93 4.93l2.83 2.83" opacity="0.4"/></svg>);
const NavLearn = ({ active }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#a064ff" : "rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="9"/></svg>);

const MindPlanetIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <defs><linearGradient id="mpg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a064ff"/><stop offset="100%" stopColor="#ff3c78"/></linearGradient></defs>
    <circle cx="40" cy="40" r="18" fill="none" stroke="url(#mpg)" strokeWidth="1.2"/>
    <path d="M33 37 C33 33, 35 31, 38 31 C39 30, 40 30, 41 31 C42 30, 43 30, 44 31 C47 31, 49 33, 49 37 C50 39, 49 41, 47 42 C48 44, 47 47, 45 48 C43 49, 41 49, 40 48 C39 49, 37 49, 35 48 C33 47, 32 44, 33 42 C31 41, 30 39, 33 37Z" fill="none" stroke="#a064ff" strokeWidth="0.9" opacity="0.75"/>
    <line x1="40" y1="31" x2="40" y2="48" stroke="#a064ff" strokeWidth="0.5" opacity="0.35"/>
    <path d="M34 40 Q40 38 46 40" fill="none" stroke="#a064ff" strokeWidth="0.5" opacity="0.3"/>
    <ellipse cx="40" cy="40" rx="30" ry="11" fill="none" stroke="#ff3c78" strokeWidth="0.7" opacity="0.25" transform="rotate(-20 40 40)"/>
    <circle cx="63" cy="28" r="2.5" fill="#ff3c78" opacity="0.8"/><circle cx="16" cy="50" r="2" fill="#a064ff" opacity="0.5"/>
    <circle cx="54" cy="18" r="1" fill="#64b4ff" opacity="0.4"/><circle cx="26" cy="60" r="1.2" fill="#c084fc" opacity="0.35"/>
  </svg>
);

function Screen({ children, style }) {
  return (<div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s cubic-bezier(.22,.68,0,1.1) forwards", overflowY: "auto", ...style }}>{children}</div>);
}

function GlowOrb({ top, left, color, size = 180 }) {
  return <div style={{ position: "absolute", top, left, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />;
}

function Glass({ children, style }) {
  return (<div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 16, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", ...style }}>{children}</div>);
}

/* Progress Ring */
function ProgressRing({ percent, color, size = 52, strokeWidth = 3 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function useGoogleAuth() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (document.getElementById("google-gsi-script")) { if (window.google?.accounts) setLoaded(true); return; } const s = document.createElement("script"); s.id = "google-gsi-script"; s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true; s.onload = () => setLoaded(true); document.head.appendChild(s); }, []);
  const renderButton = useCallback((elId, onSuccess) => { if (!loaded || !window.google?.accounts) return; window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => { if (r.credential) onSuccess(r.credential); } }); const el = document.getElementById(elId); if (el) { el.innerHTML = ""; window.google.accounts.id.renderButton(el, { type: "standard", theme: "filled_black", size: "large", width: 280, text: "signin_with", shape: "pill" }); } }, [loaded]);
  return { loaded, renderButton };
}

/* Milestone Levels */
const LEVELS = [
  { name: "Newcomer", threshold: 0 },
  { name: "Beginner", threshold: 3 },
  { name: "Curious", threshold: 8 },
  { name: "Intermediate", threshold: 15 },
  { name: "Skilled", threshold: 25 },
  { name: "Advanced", threshold: 40 },
  { name: "Expert", threshold: 60 },
  { name: "Master", threshold: 100 },
];

function getLevel(lessonCount) {
  let current = LEVELS[0], next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (lessonCount >= LEVELS[i].threshold) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? Math.round(((lessonCount - current.threshold) / (next.threshold - current.threshold)) * 100)
    : 100;
  return { name: current.name, progress, next: next?.name, lessonsToNext: next ? next.threshold - lessonCount : 0 };
}

/* Achievement Badges */
const ACHIEVEMENTS = [
  { id: "first_light", icon: "🌱", name: "First Light", desc: "Complete your first lesson", check: (u, tp) => (u.lessonCount || 0) >= 1 },
  { id: "on_fire", icon: "🔥", name: "On Fire", desc: "Reach a 7-day streak", check: (u) => (u.streak || 0) >= 7 },
  { id: "unstoppable", icon: "⚡", name: "Unstoppable", desc: "Reach a 14-day streak", check: (u) => (u.streak || 0) >= 14 },
  { id: "legendary", icon: "💫", name: "Legendary", desc: "Reach a 30-day streak", check: (u) => (u.streak || 0) >= 30 },
  { id: "explorer", icon: "🧭", name: "Explorer", desc: "Try all 6 topics", check: (u, tp) => tp.length >= 6 },
  { id: "scholar", icon: "📚", name: "Scholar", desc: "Complete 10 lessons", check: (u) => (u.lessonCount || 0) >= 10 },
  { id: "sharpshooter", icon: "🎯", name: "Sharpshooter", desc: "Reach 80% quiz accuracy", check: (u, tp) => { const total = tp.reduce((s,p) => s+p.lessonCount,0); const correct = tp.reduce((s,p) => s+p.correctCount,0); return total >= 5 && (correct/total) >= 0.8; } },
  { id: "century", icon: "🏆", name: "Century", desc: "Earn 100 XP", check: (u) => (u.xp || 0) >= 100 },
  { id: "diamond", icon: "💎", name: "Diamond Mind", desc: "Earn 500 XP", check: (u) => (u.xp || 0) >= 500 },
  { id: "cosmic", icon: "🌌", name: "Cosmic Learner", desc: "Complete 50 lessons", check: (u) => (u.lessonCount || 0) >= 50 },
];

const STREAK_MILESTONES = [
  { days: 7, bonus: 50, label: "1 Week" },
  { days: 14, bonus: 100, label: "2 Weeks" },
  { days: 30, bonus: 200, label: "1 Month" },
  { days: 60, bonus: 500, label: "2 Months" },
  { days: 100, bonus: 1000, label: "100 Days" },
];

function getUnlockedBadges(user, topicProgress) {
  return ACHIEVEMENTS.filter(a => a.check(user, topicProgress));
}

function getNextMilestone(streak) {
  return STREAK_MILESTONES.find(m => streak < m.days) || null;
}

const C = {
  bg: "#0D0B14", surface: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.9)", textSub: "rgba(255,255,255,0.45)", textMuted: "rgba(255,255,255,0.2)",
  accent: "#a064ff", accentGlow: "rgba(160,100,255,0.3)", pink: "#ff3c78", pinkGlow: "rgba(255,60,120,0.15)",
  blue: "#64b4ff", green: "#4ade80", red: "#f87171",
  gradient: "linear-gradient(135deg, #a064ff 0%, #ff3c78 100%)",
};

function timeAgo(date) {
  const now = new Date(); const d = new Date(date); const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now"; if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`; if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState("home");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [lessonHistory, setLessonHistory] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [viewingLesson, setViewingLesson] = useState(null);
  const [onboardSlide, setOnboardSlide] = useState(() => {
    return localStorage.getItem("liminal_onboarded") ? 3 : 0;
  });
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopicText, setCustomTopicText] = useState("");
  const { loaded: googleLoaded, renderButton } = useGoogleAuth();

  useEffect(() => { const saved = localStorage.getItem("liminal_user"); if (saved) { try { const p = JSON.parse(saved); setUser(p); fetch(`/api/user?googleId=${p.googleId}`).then(r => r.ok ? r.json() : null).then(d => { if (d?.user) { const u = { ...p, ...d.user }; setUser(u); localStorage.setItem("liminal_user", JSON.stringify(u)); } }).catch(() => {}); } catch {} } setAuthLoading(false); }, []);

  const handleGoogleLogin = useCallback(async (credential) => { try { const res = await fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) }); if (!res.ok) throw new Error(); const data = await res.json(); setUser(data.user); localStorage.setItem("liminal_user", JSON.stringify(data.user)); } catch (err) { console.error("Login error:", err); } }, []);

  useEffect(() => { if (!user && googleLoaded && !authLoading && onboardSlide === 3) { setTimeout(() => renderButton("google-signin-btn", handleGoogleLogin), 150); } }, [user, googleLoaded, authLoading, renderButton, onboardSlide, handleGoogleLogin]);

  // Fetch lesson data when user logs in or navigates to history/progress
  const fetchLessonData = useCallback(async () => {
    if (!user?.googleId) return;
    try {
      const res = await fetch(`/api/lessons?googleId=${user.googleId}`);
      if (res.ok) {
        const data = await res.json();
        setLessonHistory(data.lessons || []);
        setTopicProgress(data.progress || []);
      }
    } catch {}
  }, [user?.googleId]);

  useEffect(() => { if (user?.googleId) fetchLessonData(); }, [user?.googleId, fetchLessonData]);

  const handleLogout = () => { setUser(null); setShowAccountMenu(false); localStorage.removeItem("liminal_user"); if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect(); setScreen("home"); setSelectedTopics([]); setSelectedTime(null); setLesson(null); setError(null); setQuizAnswer(null); setLessonHistory([]); setTopicProgress([]); };
  const handleDeleteAccount = async () => { if (!user?.googleId) { handleLogout(); return; } if (!window.confirm("This will permanently delete your account and all your progress. Are you sure?")) return; try { await fetch("/api/auth/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ googleId: user.googleId }) }); } catch {} handleLogout(); };
  const handleGuestLogin = () => { setUser({ guest: true, name: "Explorer", streak: 0, xp: 0, lessonCount: 0 }); };

  const topicObj = lesson ? (TOPICS.find(t => t.id === lesson._topicId) || { id: lesson._topicId, icon: "✨", label: lesson._topicId, color: "#c084fc", glow: "rgba(192,132,252,.2)" }) : null;
  const topicColor = topicObj?.color || C.accent;
  const topicGlow = topicObj?.glow || C.accentGlow;
  const toggleTopic = (id) => { setShowCustomTopic(false); setCustomTopicText(""); setSelectedTopics(p => p.includes(id) ? [] : [id]); };
  

  const startLesson = async () => { setError(null); setScreen("loading"); setQuizAnswer(null); const pick = selectedTopics[Math.floor(Math.random() * selectedTopics.length)]; try { const data = await generateLesson(pick, selectedTime.value, user?.googleId); data._topicId = pick; setLesson(data); setScreen("lesson"); } catch (e) { console.error(e); setLesson({ ...FALLBACK, _topicId: pick }); setError("Showing a sample lesson — AI will be back shortly."); setScreen("lesson"); } };
  const submitQuiz = (idx) => { setQuizAnswer(idx); };

  const finishAndHome = async () => {
    const xpEarned = quizAnswer === lesson?.quiz?.answerIndex ? 20 : 5;
    const quizCorrect = quizAnswer === lesson?.quiz?.answerIndex;
    if (user?.googleId) {
      try {
        // Save user stats
        const res = await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ googleId: user.googleId, xpEarned }) });
        if (res.ok) { const d = await res.json(); const u = { ...user, ...d.user }; setUser(u); localStorage.setItem("liminal_user", JSON.stringify(u)); }
        // Save lesson to history
        await fetch("/api/lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          googleId: user.googleId,
          lesson: { topicId: lesson._topicId, title: lesson.title, hook: lesson.hook, body: lesson.body, insightLabel: lesson.insightLabel, insight: lesson.insight, apply: lesson.apply, badge: lesson.badge, quizQuestion: lesson.quiz?.question },
          quizCorrect, xpEarned, duration: selectedTime?.value || 0,
        })});
        // Refresh lesson data
        fetchLessonData();
      } catch {}
    } else if (user?.guest) {
      setUser(prev => ({ ...prev, xp: (prev.xp||0)+xpEarned, lessonCount: (prev.lessonCount||0)+1, streak: (prev.streak||0)+1 }));
      // Save to local guest history
      setLessonHistory(prev => [{ id: Date.now(), topicId: lesson._topicId, title: lesson.title, hook: lesson.hook, badge: lesson.badge, quizCorrect, xpEarned, duration: selectedTime?.value, createdAt: new Date().toISOString() }, ...prev]);
      setTopicProgress(prev => {
        const existing = prev.find(p => p.topicId === lesson._topicId);
        if (existing) return prev.map(p => p.topicId === lesson._topicId ? { ...p, lessonCount: p.lessonCount + 1, totalXp: p.totalXp + xpEarned, correctCount: p.correctCount + (quizCorrect ? 1 : 0) } : p);
        return [...prev, { topicId: lesson._topicId, lessonCount: 1, totalXp: xpEarned, correctCount: quizCorrect ? 1 : 0 }];
      });
    }
    setSelectedTopics([]); setSelectedTime(null); setLesson(null); setError(null); setShowCustomTopic(false); setCustomTopicText(""); setScreen("home");
  };

  const totalLessonsAllTopics = topicProgress.reduce((s, p) => s + p.lessonCount, 0);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#08060E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Sora:wght@200;300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes breathe { 0%,100% { opacity:.3; transform:scale(1); } 50% { opacity:.8; transform:scale(1.08); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(160,100,255,0.2); } 50% { box-shadow: 0 0 40px rgba(160,100,255,0.4), 0 0 60px rgba(255,60,120,0.15); } }
        .btn-primary { position:relative; overflow:hidden; background:${C.gradient}; color:#fff; border:none; border-radius:14px; padding:14px 24px; font-family:'Outfit',sans-serif; font-weight:500; font-size:14px; cursor:pointer; width:100%; letter-spacing:.3px; box-shadow:0 4px 24px rgba(160,100,255,0.3), 0 1px 0 inset rgba(255,255,255,0.15); transition:all .2s; }
        .btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 32px rgba(160,100,255,0.4), 0 1px 0 inset rgba(255,255,255,0.15); }
        .btn-primary:disabled { opacity:.25; cursor:not-allowed; transform:none; box-shadow:none; }
        .btn-secondary { background:rgba(255,255,255,0.04); color:${C.textSub}; border:0.5px solid ${C.border}; border-radius:14px; padding:14px 24px; font-family:'Outfit',sans-serif; font-weight:400; font-size:14px; cursor:pointer; width:100%; transition:all .2s; }
        .btn-secondary:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.12); }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ width: 375, height: 780, background: C.bg, borderRadius: 44, overflow: "hidden", position: "relative", boxShadow: "0 48px 100px rgba(0,0,0,.8), 0 0 0 0.5px rgba(160,100,255,0.1)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {/* ONBOARDING + LOGIN */}
          {!user && !authLoading && onboardSlide === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s ease forwards" }}>
              <GlowOrb top={-60} left={60} color="rgba(160,100,255,0.15)" size={280} />
              <GlowOrb top={400} left={180} color="rgba(255,60,120,0.08)" size={200} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", position: "relative", zIndex: 1 }}>
                <div style={{ animation: "pulseGlow 3s ease-in-out infinite", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, background: "rgba(160,100,255,0.08)", border: "0.5px solid rgba(160,100,255,0.2)" }}><MindPlanetIcon size={42} /></div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 200, color: "#fff", textAlign: "center", lineHeight: 1.4, marginBottom: 16 }}>The space between<br/>is yours to fill.</div>
                <div style={{ fontSize: 12, color: C.textSub, textAlign: "center", lineHeight: 1.6, maxWidth: 270 }}>Liminal turns your idle moments — commutes, queues, waiting rooms — into AI-composed micro-lessons.</div>
              </div>
              <div style={{ padding: "0 28px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: C.accent }} />
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                </div>
                <button className="btn-primary" onClick={() => setOnboardSlide(1)}>Next →</button>
              </div>
            </div>
          )}

          {!user && !authLoading && onboardSlide === 1 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s ease forwards" }}>
              <GlowOrb top={-40} left={100} color="rgba(160,100,255,0.1)" size={200} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 200, color: "#fff", textAlign: "center", lineHeight: 1.4, marginBottom: 28 }}>Fresh every time.<br/>Never the same lesson twice.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(160,100,255,0.06)", border: "0.5px solid rgba(160,100,255,0.12)", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(160,100,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.accent, fontWeight: 500, flexShrink: 0 }}>1</div>
                    <div><div style={{ fontSize: 12, color: "#fff", fontWeight: 400 }}>Pick a topic</div><div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>Psychology, science, finance & more</div></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,60,120,0.04)", border: "0.5px solid rgba(255,60,120,0.1)", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,60,120,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.pink, fontWeight: 500, flexShrink: 0 }}>2</div>
                    <div><div style={{ fontSize: 12, color: "#fff", fontWeight: 400 }}>Set your time</div><div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>2 minutes or 30 — the lesson adapts</div></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(100,180,255,0.04)", border: "0.5px solid rgba(100,180,255,0.1)", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(100,180,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.blue, fontWeight: 500, flexShrink: 0 }}>3</div>
                    <div><div style={{ fontSize: 12, color: "#fff", fontWeight: 400 }}>Learn something new</div><div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>AI composes a unique lesson just for you</div></div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "0 28px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: C.accent }} />
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                </div>
                <button className="btn-primary" onClick={() => setOnboardSlide(2)}>Next →</button>
                <button onClick={() => setOnboardSlide(0)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>← Back</button>
              </div>
            </div>
          )}

          {!user && !authLoading && onboardSlide === 2 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s ease forwards" }}>
              <GlowOrb top={-40} left={60} color="rgba(160,100,255,0.12)" size={220} />
              <GlowOrb top={380} left={200} color="rgba(74,222,128,0.05)" size={140} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 200, color: "#fff", textAlign: "center", lineHeight: 1.4, marginBottom: 24 }}>Track your growth.<br/>Build a streak.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, width: "100%", marginBottom: 20 }}>
                  {[{ label: "Streak", val: "7", color: C.accent, bg: "rgba(160,100,255,0.06)", bc: "rgba(160,100,255,0.1)" }, { label: "XP", val: "340", color: C.pink, bg: "rgba(255,60,120,0.05)", bc: "rgba(255,60,120,0.1)" }, { label: "Lessons", val: "24", color: C.blue, bg: "rgba(100,180,255,0.05)", bc: "rgba(100,180,255,0.1)" }].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `0.5px solid ${s.bc}`, borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, color: s.color, fontWeight: 200 }}>{s.val}</div>
                      <div style={{ fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
                  {["🌱","🔥","🧭","📚"].map((e,i) => <span key={i} style={{ fontSize: 18 }}>{e}</span>)}
                  {["🎯","💫"].map((e,i) => <span key={i+4} style={{ fontSize: 18, filter: "grayscale(1) opacity(0.3)" }}>{e}</span>)}
                </div>
                <div style={{ fontSize: 12, color: C.textSub, textAlign: "center", lineHeight: 1.6 }}>Earn XP, unlock achievement badges, and level up across topics.</div>
              </div>
              <div style={{ padding: "0 28px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: C.accent }} />
                </div>
                <button className="btn-primary" onClick={() => { localStorage.setItem("liminal_onboarded", "1"); setOnboardSlide(3); }}>Get started →</button>
                <button onClick={() => setOnboardSlide(1)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>← Back</button>
              </div>
            </div>
          )}

          {!user && !authLoading && onboardSlide === 3 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 26px 28px", animation: "fadeUp 0.4s ease forwards" }}>
              <GlowOrb top={-60} left={60} color="rgba(160,100,255,0.15)" size={280} />
              <GlowOrb top={350} left={180} color="rgba(255,60,120,0.08)" size={200} />
              <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%" }}>
                <div style={{ animation: "pulseGlow 3s ease-in-out infinite", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: "rgba(160,100,255,0.08)", border: "0.5px solid rgba(160,100,255,0.2)" }}><MindPlanetIcon size={42} /></div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 200, fontSize: 34, color: "#fff", letterSpacing: 6, textTransform: "uppercase", marginBottom: 6 }}>Liminal</div>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 36 }}>Micro-learning · AI-powered</div>
                <Glass style={{ padding: "22px 20px", marginBottom: 28 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, color: C.text, lineHeight: 1.6, fontWeight: 200, fontStyle: "italic", marginBottom: 12 }}>Turn idle moments into micro-lessons, freshly composed by AI every time.</div>
                  <div style={{ width: 30, height: 1, background: C.gradient, margin: "0 auto 12px" }} />
                  <div style={{ color: C.textSub, fontSize: 12, lineHeight: 1.6, fontWeight: 300 }}>Sign in to track your streak, earn XP, and pick up where you left off.</div>
                </Glass>
                <div style={{ display: "flex", justifyContent: "center" }}><div id="google-signin-btn" style={{ minHeight: 44 }} /></div>
                <button onClick={handleGuestLogin} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 13, fontFamily: "'Outfit', sans-serif", marginTop: 18, padding: "8px 0", transition: "color .2s" }} onMouseEnter={e => e.currentTarget.style.color = C.textSub} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>Continue as guest →</button>
              </div>
            </div>
          )}

          {authLoading && (<Screen style={{ alignItems: "center", justifyContent: "center" }}><div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTop: `2px solid ${C.accent}`, animation: "spin .9s linear infinite" }} /></Screen>)}

          {/* HOME */}
          {user && screen === "home" && (
            <Screen style={{ padding: "16px 24px 24px", position: "relative" }}>
              <GlowOrb top={-50} left={40} color="rgba(160,100,255,0.12)" size={260} />
              <GlowOrb top={350} left={200} color="rgba(255,60,120,0.06)" size={180} />
              <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 200, fontSize: 30, color: "#fff", letterSpacing: 5, textTransform: "uppercase" }}>Liminal</div>
                    <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 3, textTransform: "uppercase", marginTop: 3 }}>Micro-learning · AI</div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => user.guest ? handleLogout() : setShowAccountMenu(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                      {user.guest ? <span style={{ fontSize: 11, color: C.accent }}>Sign in</span>
                        : user.picture ? <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${showAccountMenu ? C.accent : "rgba(255,255,255,0.1)"}` }} referrerPolicy="no-referrer" />
                        : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(160,100,255,0.15)", border: "1px solid rgba(160,100,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.accent }}>{user.name?.[0] || "?"}</div>}
                    </button>
                    {showAccountMenu && !user.guest && (
                      <div style={{ position: "absolute", top: 36, right: 0, width: 180, zIndex: 20, background: "#1a1525", border: "0.5px solid rgba(160,100,255,0.15)", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,.6)", overflow: "hidden" }}>
                        <div style={{ padding: "12px 14px 8px", borderBottom: `0.5px solid ${C.border}` }}><div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{user.name}</div><div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{user.email}</div></div>
                        <button onClick={handleLogout} style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", color: C.textSub, fontSize: 12, fontFamily: "'Outfit',sans-serif", textAlign: "left", cursor: "pointer" }}>Sign out</button>
                        <button onClick={handleDeleteAccount} style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", color: C.red, fontSize: 12, fontFamily: "'Outfit',sans-serif", textAlign: "left", cursor: "pointer" }}>Delete account</button>
                      </div>
                    )}
                  </div>
                </div>
                <Glass style={{ padding: "18px 18px 16px", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, color: C.text, lineHeight: 1.5, fontWeight: 200, fontStyle: "italic", marginBottom: 10 }}>{user.guest ? "Your next lesson awaits." : (user.lessonCount||0) > 0 ? `Welcome back, ${user.name?.split(" ")[0]||"explorer"}.` : `Welcome, ${user.name?.split(" ")[0]||"explorer"}.`}</div>
                  <div style={{ width: 30, height: 1, background: C.gradient, marginBottom: 10 }} />
                  <div style={{ color: C.textSub, fontSize: 12, lineHeight: 1.7, fontWeight: 300 }}>Turn idle moments into micro-lessons. AI-curated, freshly composed for you every time.</div>
                </Glass>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[{ label: "Streak", val: user.streak||0, suffix: " days", color: C.accent, bg: "rgba(160,100,255,0.06)", bc: "rgba(160,100,255,0.1)" }, { label: "XP", val: user.xp||0, suffix: " pts", color: C.pink, bg: "rgba(255,60,120,0.05)", bc: "rgba(255,60,120,0.1)" }, { label: "Lessons", val: user.lessonCount||0, suffix: "", color: C.blue, bg: "rgba(100,180,255,0.05)", bc: "rgba(100,180,255,0.1)" }].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `0.5px solid ${s.bc}`, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 200, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}<span style={{ fontSize: 10, fontFamily: "'Outfit',sans-serif", fontWeight: 300, opacity: .6 }}>{s.suffix}</span></div>
                      <div style={{ fontSize: 8, color: C.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: 1.2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: C.surface, borderRadius: 10, border: `0.5px solid ${C.border}` }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accentGlow}` }} />
                  <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>Every lesson composed fresh by AI</div>
                </div>

                {/* Achievements preview */}
                {(() => {
                  const unlocked = getUnlockedBadges(user, topicProgress);
                  const nextMilestone = getNextMilestone(user.streak || 0);
                  return (unlocked.length > 0 || nextMilestone) ? (
                    <div style={{ marginTop: 10 }}>
                      {unlocked.length > 0 && (
                        <div style={{ padding: "10px 14px", background: C.surface, borderRadius: 10, border: `0.5px solid ${C.border}`, marginBottom: nextMilestone ? 8 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Achievements</span>
                            <span style={{ fontSize: 9, color: C.accent }}>{unlocked.length}/{ACHIEVEMENTS.length}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {unlocked.slice(0, 6).map(a => (
                              <span key={a.id} title={a.name} style={{ fontSize: 16, filter: "none" }}>{a.icon}</span>
                            ))}
                            {unlocked.length > 6 && <span style={{ fontSize: 11, color: C.textMuted, alignSelf: "center" }}>+{unlocked.length - 6}</span>}
                            {ACHIEVEMENTS.length - unlocked.length > 0 && (
                              <span style={{ fontSize: 11, color: C.textMuted, alignSelf: "center", marginLeft: 4 }}>· {ACHIEVEMENTS.length - unlocked.length} locked</span>
                            )}
                          </div>
                        </div>
                      )}
                      {nextMilestone && (
                        <div style={{ padding: "10px 14px", background: "rgba(255,60,120,0.04)", borderRadius: 10, border: "0.5px solid rgba(255,60,120,0.1)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>
                              <span style={{ color: C.pink, fontWeight: 500 }}>{nextMilestone.label}</span> streak milestone in {nextMilestone.days - (user.streak||0)} day{nextMilestone.days - (user.streak||0) !== 1 ? "s" : ""}
                            </div>
                            <span style={{ fontSize: 10, color: C.pink, fontWeight: 500 }}>+{nextMilestone.bonus} XP</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              <div style={{ marginTop: 18, position: "relative", zIndex: 1 }}><button className="btn-primary" onClick={() => { setShowAccountMenu(false); setScreen("topics"); }}>Begin a session →</button></div>
            </Screen>
          )}

          {/* TOPICS */}
          {user && screen === "topics" && (
            <Screen style={{ padding: "16px 24px 24px" }}>
              <GlowOrb top={220} left={220} color="rgba(160,100,255,0.08)" size={160} />
              <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 18, padding: 0, position: "relative", zIndex: 1 }}>← Back</button>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, color: "#fff", marginBottom: 4, fontWeight: 200, position: "relative", zIndex: 1 }}>What draws you?</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 18, position: "relative", zIndex: 1 }}>Choose a topic or create your own</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1, position: "relative", zIndex: 1 }}>
                {TOPICS.map(t => { const sel = selectedTopics.includes(t.id) && !showCustomTopic; return (
                  <button key={t.id} onClick={() => toggleTopic(t.id)} style={{ background: sel ? `linear-gradient(135deg, ${t.glow} 0%, rgba(255,255,255,0.02) 100%)` : C.surface, border: `0.5px solid ${sel ? t.color+"44" : C.border}`, borderRadius: 16, padding: "14px 12px", cursor: "pointer", transition: "all .25s", textAlign: "left", boxShadow: sel ? `0 4px 20px ${t.glow}` : "none" }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ color: "#fff", fontWeight: 400, fontSize: 12 }}>{t.label}</div>
                    {sel ? <div style={{ marginTop: 6, fontSize: 9, color: t.color, fontWeight: 500 }}>✓ Selected</div> : <div style={{ marginTop: 6, fontSize: 9, color: C.textMuted }}>Tap to add</div>}
                  </button>); })}
                {/* Custom topic tile */}
                <button onClick={() => { setShowCustomTopic(true); setSelectedTopics([]); }} style={{
                  background: showCustomTopic ? "linear-gradient(135deg, rgba(192,132,252,0.15) 0%, rgba(255,255,255,0.02) 100%)" : C.surface,
                  border: `0.5px solid ${showCustomTopic ? "rgba(192,132,252,0.3)" : C.border}`, borderRadius: 16, padding: "14px 12px", cursor: "pointer", transition: "all .25s", textAlign: "left",
                  boxShadow: showCustomTopic ? "0 4px 20px rgba(192,132,252,0.15)" : "none",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>✨</div>
                  <div style={{ color: "#fff", fontWeight: 400, fontSize: 12 }}>Your topic</div>
                  {showCustomTopic ? <div style={{ marginTop: 6, fontSize: 9, color: "#c084fc", fontWeight: 500 }}>✓ Custom</div> : <div style={{ marginTop: 6, fontSize: 9, color: C.textMuted }}>Anything you want</div>}
                </button>
              </div>

              {/* Custom topic input */}
              {showCustomTopic && (
                <div style={{ marginTop: 12, position: "relative", zIndex: 1 }}>
                  <input
                    type="text"
                    value={customTopicText}
                    onChange={e => { setCustomTopicText(e.target.value); if (e.target.value.trim()) setSelectedTopics([e.target.value.trim()]); else setSelectedTopics([]); }}
                    placeholder="Type a topic... e.g. quantum computing"
                    autoFocus
                    style={{
                      width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(192,132,252,0.25)", borderRadius: 12,
                      color: "#fff", fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", transition: "border-color .2s",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(192,132,252,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(192,132,252,0.25)"}
                    onKeyDown={e => { if (e.key === "Enter" && customTopicText.trim()) setScreen("time"); }}
                  />
                  {/* Suggestion chips — dynamic based on history */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {(() => {
                      const allSuggestions = ["Stoic Philosophy", "Space Exploration", "Nutrition Science", "Blockchain", "Urban Design", "Music Theory", "Behavioral Economics", "Climate Science", "Ancient History", "Machine Learning", "Photography", "Meditation", "Game Theory", "Architecture", "Neuroscience", "Mythology", "Cryptography", "Linguistics"];
                      const pastCustomTopics = lessonHistory.map(l => l.topicId).filter(id => !TOPICS.find(t => t.id === id));
                      const explored = new Set(pastCustomTopics.map(t => t.toLowerCase()));
                      const fresh = allSuggestions.filter(s => !explored.has(s.toLowerCase()));
                      // Show 6: mix of fresh suggestions, shuffled
                      const shuffled = fresh.sort(() => Math.random() - 0.5).slice(0, 6);
                      return shuffled.map(s => (
                        <button key={s} onClick={() => { setCustomTopicText(s); setSelectedTopics([s]); }} style={{
                          padding: "6px 12px", background: customTopicText === s ? "rgba(192,132,252,0.12)" : "rgba(255,255,255,0.03)",
                          border: `0.5px solid ${customTopicText === s ? "rgba(192,132,252,0.3)" : C.border}`, borderRadius: 20,
                          color: customTopicText === s ? "#c084fc" : C.textSub, fontSize: 10, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all .2s",
                        }}>
                          {s}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, position: "relative", zIndex: 1 }}><button className="btn-primary" disabled={selectedTopics.length === 0} onClick={() => setScreen("time")}>Choose your window →</button></div>
            </Screen>
          )}

          {/* TIME */}
          {user && screen === "time" && (
            <Screen style={{ padding: "16px 24px 24px" }}>
              <GlowOrb top={-30} left={180} color="rgba(160,100,255,0.08)" size={140} />
              <button onClick={() => setScreen("topics")} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 18, padding: 0, position: "relative", zIndex: 1 }}>← Back</button>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, color: "#fff", marginBottom: 4, fontWeight: 200, position: "relative", zIndex: 1 }}>How long do you have?</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 20, position: "relative", zIndex: 1 }}>The lesson adapts to your window</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, position: "relative", zIndex: 1 }}>
                {WAIT_TIMES.map(t => { const sel = selectedTime?.value === t.value; return (
                  <button key={t.value} onClick={() => setSelectedTime(t)} style={{ background: sel ? "linear-gradient(135deg, rgba(160,100,255,0.1) 0%, rgba(255,60,120,0.04) 100%)" : C.surface, border: `0.5px solid ${sel ? "rgba(160,100,255,0.25)" : C.border}`, borderRadius: 14, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .2s", boxShadow: sel ? `0 4px 20px ${C.accentGlow}` : "none" }}>
                    <div style={{ textAlign: "left" }}><div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 300, fontSize: 22, color: "#fff" }}>{t.label}</div><div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{t.desc}</div></div>
                    {sel && <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>✓</div>}
                  </button>); })}
              </div>
              <div style={{ marginTop: 16, position: "relative", zIndex: 1 }}><button className="btn-primary" disabled={!selectedTime} onClick={startLesson}>Generate my lesson ✦</button></div>
            </Screen>
          )}

          {/* LOADING */}
          {user && screen === "loading" && (
            <Screen style={{ alignItems: "center", justifyContent: "center", padding: 32, position: "relative" }}>
              <GlowOrb top={80} left={60} color="rgba(160,100,255,0.1)" size={220} />
              <GlowOrb top={320} left={180} color="rgba(255,60,120,0.06)" size={160} />
              <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div style={{ animation: "breathe 2.8s ease-in-out infinite" }}><MindPlanetIcon size={52} /></div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTop: `2px solid ${C.accent}`, animation: "spin .9s linear infinite" }} />
                <div><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, color: "#fff", marginBottom: 6, fontWeight: 200 }}>Composing your lesson…</div><div style={{ color: C.textMuted, fontSize: 12 }}>Something worth your in-between time</div></div>
              </div>
            </Screen>
          )}

          {/* LESSON */}
          {user && screen === "lesson" && lesson && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s cubic-bezier(.22,.68,0,1.1) forwards", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 20px", position: "relative" }}>
                <GlowOrb top={-40} left={160} color={topicGlow} size={180} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
                  <button onClick={() => setScreen("time")} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", padding: 0 }}>← Exit</button>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{selectedTime?.label} read</div>
                </div>
                {error && <div style={{ background: "rgba(245,158,11,0.06)", border: "0.5px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "8px 12px", color: "#f59e0b", fontSize: 11, marginBottom: 12, position: "relative", zIndex: 1 }}>⚠ {error}</div>}
                <div style={{ height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1, marginBottom: 16, overflow: "hidden", position: "relative", zIndex: 1 }}><div style={{ width: "65%", height: "100%", background: C.gradient, borderRadius: 1 }} /></div>
                <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                  <span style={{ display: "inline-block", fontSize: 8, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: topicColor, border: `0.5px solid ${topicColor}44`, borderRadius: 4, padding: "3px 8px", background: topicGlow }}>{lesson.badge}</span>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 300, fontSize: 22, color: "#fff", lineHeight: 1.3, marginTop: 10 }}>{lesson.title}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{topicObj?.icon} {topicObj?.label}</div>
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg, ${topicColor}33, transparent)`, marginBottom: 16, position: "relative", zIndex: 1 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
                  <div style={{ borderLeft: `1.5px solid ${topicColor}`, paddingLeft: 14, boxShadow: `-3px 0 12px ${topicGlow}` }}><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontStyle: "italic", color: C.text, lineHeight: 1.6, fontWeight: 200 }}>{lesson.hook}</div></div>
                  <div style={{ color: C.textSub, fontSize: 13, lineHeight: 1.8, fontWeight: 300 }}>{lesson.body}</div>
                  <Glass style={{ padding: 16 }}><div style={{ fontSize: 8, color: topicColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>{lesson.insightLabel}</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.65, fontWeight: 300 }}>{lesson.insight}</div></Glass>
                  <div style={{ background: "rgba(100,180,255,0.04)", border: "0.5px solid rgba(100,180,255,0.1)", borderRadius: 16, padding: 16 }}><div style={{ fontSize: 8, color: C.blue, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Try it</div><div style={{ color: C.textSub, fontSize: 13, lineHeight: 1.65, fontWeight: 300 }}>{lesson.apply}</div></div>
                  {Array.isArray(lesson.furtherReading) && lesson.furtherReading.length > 0 && (
                    <div style={{ marginTop: 2 }}>
                      <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Go deeper</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {lesson.furtherReading.map((item, i) => { const typeIcons = { book: "📖", article: "📄", paper: "📑", talk: "🎤" }; return (
                          <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(item.title+" "+item.author)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12, textDecoration: "none", transition: "all .2s" }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{typeIcons[item.type?.toLowerCase()]||"📌"}</span>
                            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 11, color: C.text, fontWeight: 400, lineHeight: 1.4 }}>{item.title}</div><div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>{item.author}{item.type ? ` · ${item.type.charAt(0).toUpperCase()+item.type.slice(1)}` : ""}</div></div>
                            <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, marginTop: 2 }}>↗</span>
                          </a>); })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ flexShrink: 0, padding: "12px 24px 26px", position: "relative", zIndex: 1, background: `linear-gradient(0deg, ${C.bg} 60%, transparent)` }}><button className="btn-primary" onClick={() => setScreen("quiz")}>Quick reflection →</button></div>
            </div>
          )}

          {/* QUIZ */}
          {user && screen === "quiz" && lesson && (
            <Screen style={{ padding: "16px 24px 24px", position: "relative" }}>
              <GlowOrb top={320} left={-30} color="rgba(74,222,128,0.06)" size={160} />
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 20, position: "relative", zIndex: 1 }}>Reflection</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, color: "#fff", lineHeight: 1.5, marginBottom: 22, fontWeight: 300, position: "relative", zIndex: 1 }}>{lesson.quiz?.question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, position: "relative", zIndex: 1 }}>
                {(lesson.quiz?.options||[]).map((opt, i) => { const isCorrect = i === lesson.quiz?.answerIndex; const isSelected = quizAnswer === i; const revealed = quizAnswer !== null; let bg = C.surface, borderC = C.border, color = C.textSub, shadow = "none"; if (revealed) { if (isCorrect) { bg = "rgba(74,222,128,0.08)"; borderC = "rgba(74,222,128,0.25)"; color = C.green; shadow = "0 2px 12px rgba(74,222,128,0.1)"; } else if (isSelected) { bg = "rgba(248,113,113,0.06)"; borderC = "rgba(248,113,113,0.2)"; color = C.red; } } return (
                  <button key={i} onClick={() => !revealed && submitQuiz(i)} style={{ background: bg, border: `0.5px solid ${borderC}`, borderRadius: 14, padding: "13px 16px", cursor: revealed ? "default" : "pointer", textAlign: "left", color, fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: (isSelected||(revealed&&isCorrect)) ? 500 : 300, transition: "all .2s", boxShadow: shadow }}>
                    {revealed && isCorrect && "✓  "}{revealed && isSelected && !isCorrect && "✗  "}{opt}
                  </button>); })}
              </div>
              {quizAnswer !== null && (
                <div style={{ marginTop: 18, position: "relative", zIndex: 1 }}>
                  <div style={{ textAlign: "center", marginBottom: 12, color: quizAnswer === lesson.quiz?.answerIndex ? C.green : C.textMuted, fontStyle: "italic", fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 200 }}>{quizAnswer === lesson.quiz?.answerIndex ? "+20 XP — well done." : "Keep exploring — understanding deepens over time."}</div>
                  <button className="btn-primary" onClick={() => setScreen("done")}>Complete session</button>
                </div>
              )}
            </Screen>
          )}

          {/* DONE */}
          {user && screen === "done" && (
            <Screen style={{ padding: "32px 24px 28px", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" }}>
              <GlowOrb top={50} left={60} color="rgba(160,100,255,0.1)" size={220} />
              <GlowOrb top={400} left={180} color="rgba(255,60,120,0.06)" size={160} />
              <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                <div style={{ animation: "pulseGlow 3s ease-in-out infinite", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", background: "rgba(160,100,255,0.08)", border: "0.5px solid rgba(160,100,255,0.2)" }}><MindPlanetIcon size={42} /></div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 200, fontSize: 26, color: "#fff", marginBottom: 6 }}>Session complete.</div>
                <div style={{ color: C.textMuted, marginBottom: 26, fontStyle: "italic", fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 200 }}>Another moment well spent.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
                  {[{ label: "XP earned", val: quizAnswer === lesson?.quiz?.answerIndex ? "+20" : "+5", color: C.accent, bg: "rgba(160,100,255,0.06)", bc: "rgba(160,100,255,0.1)" }, { label: "Streak", val: `${(user.streak||0)+1} days`, color: C.pink, bg: "rgba(255,60,120,0.05)", bc: "rgba(255,60,120,0.1)" }, { label: "Lesson", val: "Complete", color: C.green, bg: "rgba(74,222,128,0.05)", bc: "rgba(74,222,128,0.1)" }, { label: "Time", val: selectedTime?.label||"—", color: C.blue, bg: "rgba(100,180,255,0.05)", bc: "rgba(100,180,255,0.1)" }].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `0.5px solid ${s.bc}`, borderRadius: 14, padding: 14, textAlign: "center" }}><div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 300, fontSize: 18, color: s.color }}>{s.val}</div><div style={{ fontSize: 8, color: C.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: 1.2 }}>{s.label}</div></div>))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><button className="btn-primary" onClick={startLesson}>Another lesson ✦</button><button className="btn-secondary" onClick={finishAndHome}>Return home</button></div>
              </div>
            </Screen>
          )}

          {/* PROGRESS */}
          {user && screen === "progress" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s cubic-bezier(.22,.68,0,1.1) forwards", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px", position: "relative" }}>
              <GlowOrb top={-40} left={100} color="rgba(160,100,255,0.1)" size={200} />
              <div style={{ position: "relative", zIndex: 1, paddingBottom: 20 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, color: "#fff", marginBottom: 4, fontWeight: 200 }}>Your progress</div>
                <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 20 }}>{totalLessonsAllTopics} lesson{totalLessonsAllTopics !== 1 ? "s" : ""} completed across {topicProgress.length} topic{topicProgress.length !== 1 ? "s" : ""}</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(() => {
                    // Combine preset topics with any custom topics from history
                    const presetIds = TOPICS.map(t => t.id);
                    const customFromHistory = topicProgress
                      .filter(p => !presetIds.includes(p.topicId))
                      .map(p => ({ id: p.topicId, icon: "✨", label: p.topicId, color: "#c084fc", glow: "rgba(192,132,252,.2)" }));
                    const allTopics = [...TOPICS, ...customFromHistory];

                    return allTopics.map(t => {
                      const prog = topicProgress.find(p => p.topicId === t.id);
                      const count = prog?.lessonCount || 0;
                      const correct = prog?.correctCount || 0;
                      const xp = prog?.totalXp || 0;
                      const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0;
                      const level = getLevel(count);
                      if (!presetIds.includes(t.id) && count === 0) return null; // don't show empty custom topics
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: count > 0 ? `linear-gradient(135deg, ${t.glow} 0%, rgba(255,255,255,0.01) 100%)` : C.surface, border: `0.5px solid ${count > 0 ? t.color + "33" : C.border}`, borderRadius: 16, transition: "all .3s" }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <ProgressRing percent={level.progress} color={t.color} size={48} strokeWidth={3} />
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{t.icon}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 13, color: "#fff", fontWeight: 400 }}>{t.label}</span>
                              {count > 0 && <span style={{ fontSize: 8, color: t.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, background: t.glow, padding: "2px 6px", borderRadius: 3 }}>{level.name}</span>}
                            </div>
                            {count > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.textSub }}>
                                  <span>{count} lesson{count !== 1 ? "s" : ""}</span>
                                  <span>{xp} XP</span>
                                  <span>{accuracy}%</span>
                                </div>
                                {level.next && <div style={{ fontSize: 9, color: C.textMuted }}>{level.lessonsToNext} more to {level.next}</div>}
                              </div>
                            ) : (
                              <div style={{ fontSize: 10, color: C.textMuted }}>Not started yet</div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {totalLessonsAllTopics === 0 && (
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, color: C.textSub, fontWeight: 200, marginBottom: 14 }}>Complete your first lesson to see progress here.</div>
                    <button className="btn-primary" onClick={() => setScreen("topics")}>Start learning →</button>
                  </div>
                )}

                {/* Streak Milestones */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Streak milestones</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STREAK_MILESTONES.map(m => {
                      const reached = (user.streak || 0) >= m.days;
                      return (
                        <div key={m.days} style={{ padding: "8px 12px", background: reached ? "rgba(255,60,120,0.08)" : C.surface, border: `0.5px solid ${reached ? "rgba(255,60,120,0.2)" : C.border}`, borderRadius: 10, textAlign: "center", minWidth: 70 }}>
                          <div style={{ fontSize: 12, color: reached ? C.pink : C.textMuted, fontWeight: reached ? 500 : 300 }}>{m.label}</div>
                          <div style={{ fontSize: 9, color: reached ? "rgba(255,60,120,0.6)" : C.textMuted, marginTop: 2 }}>+{m.bonus} XP</div>
                          {reached && <div style={{ fontSize: 8, color: C.green, marginTop: 2 }}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achievement Badges */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Achievements</span>
                    <span style={{ fontSize: 10, color: C.accent }}>{getUnlockedBadges(user, topicProgress).length}/{ACHIEVEMENTS.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ACHIEVEMENTS.map(a => {
                      const unlocked = a.check(user, topicProgress);
                      return (
                        <div key={a.id} style={{ padding: "12px", background: unlocked ? "linear-gradient(135deg, rgba(160,100,255,0.08) 0%, rgba(255,60,120,0.04) 100%)" : C.surface, border: `0.5px solid ${unlocked ? "rgba(160,100,255,0.2)" : C.border}`, borderRadius: 14, transition: "all .3s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 18, filter: unlocked ? "none" : "grayscale(1) opacity(0.3)" }}>{a.icon}</span>
                            <span style={{ fontSize: 11, color: unlocked ? "#fff" : C.textMuted, fontWeight: unlocked ? 500 : 300 }}>{a.name}</span>
                          </div>
                          <div style={{ fontSize: 9, color: unlocked ? C.textSub : C.textMuted, lineHeight: 1.4 }}>{a.desc}</div>
                          {unlocked && <div style={{ fontSize: 8, color: C.green, marginTop: 4, fontWeight: 500 }}>Unlocked</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Learning Profile */}
                {totalLessonsAllTopics >= 1 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Your learning profile</div>
                    <Glass style={{ padding: 16 }}>
                      {(() => {
                        const totalCorrect = topicProgress.reduce((s, p) => s + p.correctCount, 0);
                        const overallAccuracy = totalLessonsAllTopics > 0 ? Math.round((totalCorrect / totalLessonsAllTopics) * 100) : 0;
                        const favTopic = topicProgress.length > 0 ? topicProgress.reduce((a, b) => a.lessonCount > b.lessonCount ? a : b) : null;
                        const favTopicObj = favTopic ? TOPICS.find(t => t.id === favTopic.topicId) : null;
                        const strongTopic = topicProgress.filter(p => p.lessonCount >= 2).length > 0
                          ? topicProgress.filter(p => p.lessonCount >= 2).reduce((a, b) => (a.correctCount / a.lessonCount) > (b.correctCount / b.lessonCount) ? a : b)
                          : null;
                        const strongTopicObj = strongTopic ? TOPICS.find(t => t.id === strongTopic.topicId) : null;
                        const diffLevel = overallAccuracy >= 80 ? "Advanced" : overallAccuracy >= 50 ? "Intermediate" : "Foundations";
                        const diffColor = overallAccuracy >= 80 ? C.accent : overallAccuracy >= 50 ? C.blue : C.green;
                        const diffDesc = overallAccuracy >= 80 ? "Lessons are tuned to challenge you with nuance and depth." : overallAccuracy >= 50 ? "Lessons balance clarity with complexity." : "Lessons focus on clear explanations and building confidence.";

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>Difficulty level</div>
                              <div style={{ fontSize: 12, color: diffColor, fontWeight: 500 }}>{diffLevel}</div>
                            </div>
                            <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.5, marginTop: -6 }}>{diffDesc}</div>
                            <div style={{ height: 0.5, background: C.border }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>Overall accuracy</div>
                              <div style={{ fontSize: 12, color: overallAccuracy >= 70 ? C.green : C.textSub, fontWeight: 500 }}>{overallAccuracy}%</div>
                            </div>
                            {favTopicObj && (
                              <>
                                <div style={{ height: 0.5, background: C.border }} />
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>Most explored</div>
                                  <div style={{ fontSize: 12, color: favTopicObj.color, fontWeight: 500 }}>{favTopicObj.icon} {favTopicObj.label}</div>
                                </div>
                              </>
                            )}
                            {strongTopicObj && strongTopicObj.id !== favTopicObj?.id && (
                              <>
                                <div style={{ height: 0.5, background: C.border }} />
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>Strongest topic</div>
                                  <div style={{ fontSize: 12, color: strongTopicObj.color, fontWeight: 500 }}>{strongTopicObj.icon} {strongTopicObj.label}</div>
                                </div>
                              </>
                            )}
                            <div style={{ height: 0.5, background: C.border }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>Topics explored</div>
                              <div style={{ fontSize: 12, color: C.textSub, fontWeight: 500 }}>{topicProgress.length} of {TOPICS.length}</div>
                            </div>
                            <div style={{ marginTop: 4, padding: "8px 12px", background: "rgba(160,100,255,0.04)", borderRadius: 8, border: "0.5px solid rgba(160,100,255,0.1)" }}>
                              <div style={{ fontSize: 10, color: C.textSub, lineHeight: 1.5 }}>
                                {overallAccuracy >= 80
                                  ? "The AI adapts to your level — expect deeper dives, counterintuitive angles, and advanced connections."
                                  : overallAccuracy >= 50
                                    ? "The AI is calibrating to your pace — lessons balance accessibility with depth."
                                    : "The AI is keeping things clear and approachable — as your accuracy grows, lessons will get more challenging."}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </Glass>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {user && screen === "history" && !viewingLesson && (
            <Screen style={{ padding: "16px 24px 24px", position: "relative" }}>
              <GlowOrb top={-30} left={200} color="rgba(100,180,255,0.08)" size={160} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, color: "#fff", marginBottom: 4, fontWeight: 200 }}>Lesson history</div>
                <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 20 }}>{lessonHistory.length} lesson{lessonHistory.length !== 1 ? "s" : ""} completed</div>

                {lessonHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {lessonHistory.map((l) => {
                      const t = TOPICS.find(tp => tp.id === l.topicId);
                      return (
                        <button key={l.id} onClick={() => setViewingLesson(l)} style={{ padding: "14px 16px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 14, transition: "all .2s", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "'Outfit',sans-serif" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <span style={{ fontSize: 14 }}>{t?.icon || "📚"}</span>
                                <span style={{ fontSize: 8, color: t?.color || C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, background: (t?.glow || "rgba(160,100,255,0.1)"), padding: "2px 6px", borderRadius: 3 }}>{l.badge}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "#fff", fontWeight: 400, lineHeight: 1.4, marginBottom: 4 }}>{l.title}</div>
                              <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.5, fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{l.hook}</div>
                            </div>
                            <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, marginTop: 4 }}>→</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `0.5px solid ${C.border}` }}>
                            <div style={{ display: "flex", gap: 10, fontSize: 10, color: C.textMuted }}>
                              <span>{l.duration} min</span>
                              <span style={{ color: l.quizCorrect ? C.green : C.textMuted }}>{l.quizCorrect ? "✓ Correct" : "✗ Missed"}</span>
                              <span>+{l.xpEarned} XP</span>
                            </div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{timeAgo(l.createdAt)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, color: C.textSub, fontWeight: 200, marginBottom: 14 }}>No lessons yet. Start your first one!</div>
                    <button className="btn-primary" onClick={() => setScreen("topics")}>Start learning →</button>
                  </div>
                )}
              </div>
            </Screen>
          )}

          {/* HISTORY DETAIL — read-only lesson view */}
          {user && screen === "history" && viewingLesson && (() => {
            const vt = TOPICS.find(tp => tp.id === viewingLesson.topicId);
            const vc = vt?.color || C.accent;
            const vg = vt?.glow || C.accentGlow;
            return (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", animation: "fadeUp 0.4s cubic-bezier(.22,.68,0,1.1) forwards", overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 20px", position: "relative" }}>
                  <GlowOrb top={-40} left={160} color={vg} size={180} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
                    <button onClick={() => setViewingLesson(null)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", padding: 0 }}>← Back to history</button>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{viewingLesson.duration} min read</div>
                  </div>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <span style={{ display: "inline-block", fontSize: 8, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: vc, border: `0.5px solid ${vc}44`, borderRadius: 4, padding: "3px 8px", background: vg }}>{viewingLesson.badge}</span>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 300, fontSize: 22, color: "#fff", lineHeight: 1.3, marginTop: 10 }}>{viewingLesson.title}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{vt?.icon} {vt?.label} · {new Date(viewingLesson.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                  <div style={{ height: 1, background: `linear-gradient(90deg, ${vc}33, transparent)`, marginBottom: 16, position: "relative", zIndex: 1 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
                    <div style={{ borderLeft: `1.5px solid ${vc}`, paddingLeft: 14, boxShadow: `-3px 0 12px ${vg}` }}><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontStyle: "italic", color: C.text, lineHeight: 1.6, fontWeight: 200 }}>{viewingLesson.hook}</div></div>
                    {viewingLesson.body && <div style={{ color: C.textSub, fontSize: 13, lineHeight: 1.8, fontWeight: 300 }}>{viewingLesson.body}</div>}
                    {viewingLesson.insight && (
                      <Glass style={{ padding: 16 }}>
                        <div style={{ fontSize: 8, color: vc, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>{viewingLesson.insightLabel || "Key insight"}</div>
                        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.65, fontWeight: 300 }}>{viewingLesson.insight}</div>
                      </Glass>
                    )}
                    {viewingLesson.apply && (
                      <div style={{ background: "rgba(100,180,255,0.04)", border: "0.5px solid rgba(100,180,255,0.1)", borderRadius: 16, padding: 16 }}>
                        <div style={{ fontSize: 8, color: C.blue, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Try it</div>
                        <div style={{ color: C.textSub, fontSize: 13, lineHeight: 1.65, fontWeight: 300 }}>{viewingLesson.apply}</div>
                      </div>
                    )}
                    {/* Quiz result */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surface, borderRadius: 10, border: `0.5px solid ${C.border}` }}>
                      <span style={{ color: viewingLesson.quizCorrect ? C.green : C.red, fontSize: 13 }}>{viewingLesson.quizCorrect ? "✓" : "✗"}</span>
                      <div style={{ fontSize: 11, color: C.textSub, fontWeight: 300 }}>{viewingLesson.quizCorrect ? "Quiz answered correctly" : "Quiz missed"} · +{viewingLesson.xpEarned} XP</div>
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0, padding: "12px 24px 26px", position: "relative", zIndex: 1, background: `linear-gradient(0deg, ${C.bg} 60%, transparent)` }}>
                  <button className="btn-secondary" onClick={() => setViewingLesson(null)}>← Back to history</button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* NAV — 4 tabs */}
        {user && ["home","progress","history","topics","time"].includes(screen) && (
          <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0 22px", borderTop: `0.5px solid ${C.border}`, flexShrink: 0, background: `linear-gradient(0deg, ${C.bg} 80%, transparent)`, position: "relative", zIndex: 11 }}>
            {[
              { label: "Home", s: "home", Icon: NavHome },
              { label: "Progress", s: "progress", Icon: NavProgress },
              { label: "History", s: "history", Icon: NavHistory },
              { label: "Learn", s: "topics", Icon: NavLearn },
            ].map(n => (
              <button key={n.label} onClick={() => { setShowAccountMenu(false); setViewingLesson(null); setScreen(n.s); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 12px" }}>
                <n.Icon active={screen === n.s || (n.s === "topics" && screen === "time")} />
                <span style={{ fontSize: 8, color: (screen === n.s || (n.s === "topics" && screen === "time")) ? C.accent : C.textMuted, fontWeight: 500, letterSpacing: .8, textTransform: "uppercase" }}>{n.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
