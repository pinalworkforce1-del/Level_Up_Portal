import type { Session } from "@supabase/supabase-js";
import { Check, ChevronRight, Cloud, Compass, LockKeyhole, LogOut, Mail, Play, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { configured, redirectUrl, supabase } from "./supabase";

type ProgressRow = { module_id: string; xp: number; is_complete: boolean; journey_state: { scene?: number; completed?: string[] } | null; updated_at: string };
type Module = { id: string; title: string; subtitle: string; color: string; href?: string; prerequisite?: string; expansion?: boolean };

const MODULES: Module[] = [
  { id: "discovery", title: "Discovery", subtitle: "Know your strengths, values, purpose, and support.", color: "cyan", href: "https://pinalworkforce1-del.github.io/LU_Discovery/" },
  { id: "resume-district", title: "Resume District", subtitle: "Build your story. Show your strengths.", color: "blue", prerequisite: "discovery" },
  { id: "interview-arena", title: "Interview Arena", subtitle: "Prepare confidently. Show up. Stand out.", color: "purple", prerequisite: "resume-district", href: "https://pinalworkforce1-del.github.io/Interview_Arena/" },
  { id: "first-day-challenge", title: "First Day Challenge", subtitle: "Show up. Step up. Level up.", color: "orange", prerequisite: "interview-arena", href: "https://pinalworkforce1-del.github.io/Level_Up_Portal/first-day-challenge/" },
  { id: "shadow-passage", title: "Shadow Passage", subtitle: "See where today's money habits can travel.", color: "purple", prerequisite: "first-day-challenge", href: "https://pinalworkforce1-del.github.io/Level_Up_Portal/shadow-passage/" },
  { id: "money-moves", title: "Money Moves", subtitle: "Manage today. Build tomorrow.", color: "green", prerequisite: "shadow-passage" },
  { id: "career-skill-tree", title: "Career Skill Tree", subtitle: "Learn, grow, and unlock more.", color: "cyan", prerequisite: "discovery", expansion: true },
  { id: "leadership-peak", title: "Leadership Peak", subtitle: "Build the skills to lead and influence.", color: "gold", prerequisite: "discovery", expansion: true },
];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) { setAuthReady(true); setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) { if (authReady) setLoading(false); return; }
    let active = true;
    setLoading(true);
    Promise.all([
      supabase.from("profiles").select("display_name").eq("user_id", session.user.id).maybeSingle(),
      supabase.from("module_progress").select("module_id,xp,is_complete,journey_state,updated_at").eq("user_id", session.user.id),
    ]).then(([profile, progress]) => {
      if (!active) return;
      setName(profile.data?.display_name || session.user.email?.split("@")[0] || "Explorer");
      setRows((progress.data as ProgressRow[] | null) ?? []);
      setMessage(progress.error ? "Your journey could not be refreshed. Try again shortly." : "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.user.id, authReady]);

  const progressById = useMemo(() => new Map(rows.map((row) => [row.module_id, row])), [rows]);
  const totalXp = rows.reduce((sum, row) => sum + (row.xp || 0), 0);
  const completedCount = rows.filter((row) => row.is_complete).length;
  const coreModuleCount = MODULES.filter((module) => !module.expansion).length;
  const currentPath = useMemo(() => {
    const core = MODULES.filter((module) => !module.expansion);
    const next = core.find((module) => {
      if (progressById.get(module.id)?.is_complete) return false;
      return !module.prerequisite || Boolean(progressById.get(module.prerequisite)?.is_complete);
    });
    if (!next) return "Core journey complete";
    return next.id === "discovery" ? "Complete Discovery" : `${next.title} unlocked`;
  }, [progressById]);

  async function signIn() {
    if (!supabase || !email.trim()) return;
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl() } });
    if (error) return setMessage(error.message);
    setSent(true);
  }

  async function signOut() { await supabase?.auth.signOut(); setSession(null); setRows([]); }

  if (!authReady || loading) return <main className="loading"><span className="brand-mark">LU</span><p>Loading your Level Up journey…</p></main>;
  if (configured && !session) return <SignIn email={email} setEmail={setEmail} sent={sent} message={message} onSubmit={signIn} />;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div className="brand"><span className="brand-mark">LU</span><div><strong>LEVEL UP</strong><span>MY JOURNEY</span></div></div>
        <div className="header-stats"><span><Trophy /> <b>{totalXp}</b> XP</span><span><Check /> <b>{completedCount}</b> complete</span><span className="cloud"><Cloud /> Cloud synced</span></div>
        {session ? <button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut /></button> : null}
      </header>

      <section className="hero">
        <div><p className="eyebrow">WELCOME BACK, {name.toUpperCase()}</p><h1>Your next level is waiting.</h1><p>Every module adds new skills, reflections, and evidence to your Level Up journey.</p></div>
        <div className="journey-meter"><span>{completedCount} MODULE{completedCount === 1 ? "" : "S"} COMPLETE</span><div><i style={{ width: `${Math.min(100, (completedCount / coreModuleCount) * 100)}%` }} /></div><b>{totalXp} XP EARNED</b></div>
      </section>

      {message ? <div className="notice">{message}</div> : null}

      <section className="world-map" aria-label="Level Up city progression map">
        <img src={`${import.meta.env.BASE_URL}assets/level-up-map.webp`} alt="A glowing Level Up city with districts representing the learning journey." />
        <div className="map-callout"><Compass /><div><small>CURRENT PATH</small><strong>{currentPath}</strong></div></div>
      </section>

      <section className="module-section">
        <div className="section-heading"><div><p className="eyebrow">CORE JOURNEY</p><h2>Build your path</h2></div><span>Progress unlocks each district</span></div>
        <div className="module-grid">
          {MODULES.filter((module) => !module.expansion).map((module, index) => <ModuleCard key={module.id} module={module} index={index} progress={progressById.get(module.id)} prerequisiteComplete={!module.prerequisite || Boolean(progressById.get(module.prerequisite)?.is_complete)} />)}
        </div>
      </section>

      <section className="module-section expansion">
        <div className="section-heading"><div><p className="eyebrow">MORE WAYS TO LEVEL UP</p><h2>Expansion paths</h2></div><span>New learning worlds will appear here</span></div>
        <div className="module-grid expansion-grid">
          {MODULES.filter((module) => module.expansion).map((module, index) => <ModuleCard key={module.id} module={module} index={index} progress={progressById.get(module.id)} prerequisiteComplete={!module.prerequisite || Boolean(progressById.get(module.prerequisite)?.is_complete)} />)}
        </div>
      </section>
    </main>
  );
}

function ModuleCard({ module, index, progress, prerequisiteComplete }: { module: Module; index: number; progress?: ProgressRow; prerequisiteComplete: boolean }) {
  const complete = Boolean(progress?.is_complete);
  const inProgress = Boolean(progress && !complete);
  const unlocked = module.id === "discovery" || prerequisiteComplete;
  const status = complete ? "Complete" : inProgress ? "Continue" : unlocked ? module.href ? "Start" : "Unlocked — coming soon" : "Locked";
  const card = <>
    <div className="module-number">{complete ? <Check /> : unlocked ? index + 1 : <LockKeyhole />}</div>
    <div className="module-copy"><small>{module.expansion ? "EXPANSION" : `LEVEL ${index + 1}`}</small><h3>{module.title}</h3><p>{module.subtitle}</p><span className={`status ${complete ? "complete" : inProgress ? "progress" : unlocked ? "unlocked" : "locked"}`}>{complete ? <Check /> : unlocked ? <Play /> : <LockKeyhole />}{status}</span></div>
    <ChevronRight className="arrow" />
  </>;
  return module.href && unlocked ? <a className={`module-card ${module.color}`} href={module.href}>{card}</a> : <article className={`module-card ${module.color} ${unlocked ? "" : "is-locked"}`} aria-label={`${module.title}: ${status}`}>{card}</article>;
}

function SignIn({ email, setEmail, sent, message, onSubmit }: { email: string; setEmail: (value: string) => void; sent: boolean; message: string; onSubmit: () => void }) {
  return <main className="signin-shell"><section className="signin-card"><div className="brand"><span className="brand-mark">LU</span><div><strong>LEVEL UP</strong><span>MY JOURNEY</span></div></div><p className="eyebrow">ONE ACCOUNT. EVERY LEVEL.</p><h1>Enter the Level Up world</h1><p>Sign in to see your completed modules, XP, and next unlocked district.</p>{sent ? <div className="sent"><Mail /><div><strong>Check your email</strong><span>Open the secure link to return to your journey.</span></div></div> : <><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSubmit()} placeholder="you@example.com" autoComplete="email"/><button onClick={onSubmit}>Email my sign-in link <ChevronRight /></button></>}{message ? <div className="error">{message}</div> : null}<small>Your Level Up account securely connects your progress across modules and devices.</small></section></main>;
}
