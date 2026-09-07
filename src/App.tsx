import type { Session } from "@supabase/supabase-js";
import {
  Check,
  ChevronRight,
  Cloud,
  Info,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { configured, redirectUrl, supabase } from "./supabase";

type ProgressRow = {
  module_id: string;
  xp: number;
  is_complete: boolean;
  journey_state: Record<string, unknown> | null;
  updated_at: string;
};

type DistrictKey = "discovery" | "resume" | "interview" | "firstday" | "money" | "career" | "plaza";
type JourneyState = "locked" | "current" | "complete" | "started";
type Cue = { start: number; end: number; text: string };
type District = {
  key: DistrictKey;
  moduleId?: string;
  title: string;
  kicker: string;
  what: string;
  practice: string;
  leave: string;
  special?: string;
  audio: string;
  href?: string;
};

const BASE = import.meta.env.BASE_URL;
const ASSET = `${BASE}opportunity-city/`;

const CORE_SEQUENCE = [
  "discovery",
  "resume-district",
  "confidence-checkpoint",
  "interview-arena",
  "first-day-challenge",
  "shadow-passage",
  "money-moves",
] as const;

const HREFS: Record<string, string> = {
  discovery: "https://pinalworkforce1-del.github.io/LU_Discovery/",
  "resume-district": "https://pinalworkforce1-del.github.io/Resume_District/",
  "confidence-checkpoint": "https://pinalworkforce1-del.github.io/Confidence_Checkpoint/",
  "interview-arena": "https://pinalworkforce1-del.github.io/Interview_Arena/",
  "first-day-challenge": `${BASE}first-day-challenge/`,
  "shadow-passage": `${BASE}shadow-passage/`,
  "money-moves": `${BASE}money-moves/`,
};

const DISTRICTS: Record<DistrictKey, District> = {
  discovery: {
    key: "discovery",
    moduleId: "discovery",
    title: "Discovery",
    kicker: "Discover what you already bring.",
    what: "Discovery is where your Level Up journey begins. You’ll explore your interests, strengths, experiences, and the skills you may already be using without even realizing it.",
    practice: "Interests • strengths • experiences • self-awareness",
    leave: "A clearer sense of your strengths and career direction.",
    special: "Nova introduces you to Aria, your guide inside Discovery.",
    audio: "nova-discovery.mp3",
    href: HREFS.discovery,
  },
  resume: {
    key: "resume",
    moduleId: "resume-district",
    title: "Resume District",
    kicker: "Turn your experience into your story.",
    what: "Take the strengths, skills, and experiences you’ve started uncovering and turn them into something an employer can understand.",
    practice: "Identifying skills • describing experience • communicating strengths",
    leave: "A stronger résumé and a clearer employment story.",
    audio: "nova-resume.mp3",
    href: HREFS["resume-district"],
  },
  interview: {
    key: "interview",
    moduleId: "interview-arena",
    title: "Interview Arena",
    kicker: "Prepare to show what you can do.",
    what: "Practice answering questions, listening carefully, talking about your strengths, and handling the moments that can make an interview feel stressful.",
    practice: "Listening • responding • communicating strengths",
    leave: "More interview confidence and readiness.",
    audio: "nova-interview.mp3",
    href: HREFS["interview-arena"],
  },
  firstday: {
    key: "firstday",
    moduleId: "first-day-challenge",
    title: "First Day Challenge",
    kicker: "Getting hired is only the beginning.",
    what: "Work through situations involving communication, reliability, instructions, feedback, teamwork, and the unexpected things that can happen at work.",
    practice: "Reliability • communication • teamwork • responding to feedback",
    leave: "Stronger workplace readiness and professional habits.",
    audio: "nova-first-day.mp3",
    href: HREFS["first-day-challenge"],
  },
  money: {
    key: "money",
    moduleId: "money-moves",
    title: "Money Moves",
    kicker: "Make your paycheck work for you.",
    what: "Explore spending, saving, credit, emergencies, and the habits that can shape what your paycheck allows you to do later.",
    practice: "Saving • spending decisions • credit awareness • planning",
    leave: "A personal Money Move and a simple savings plan.",
    audio: "nova-money.mp3",
    href: HREFS["money-moves"],
  },
  career: {
    key: "career",
    title: "Career Skill Tree",
    kicker: "Your first job doesn’t have to be your last stop.",
    what: "Explore career areas, see how your interests might connect, and learn how entry-level experience can grow into new skills and bigger opportunities.",
    practice: "Career exploration • interest alignment • skill growth",
    leave: "A broader view of entry points and future possibilities.",
    special: "Exploring here does not lock you into a career choice.",
    audio: "nova-career.mp3",
  },
  plaza: {
    key: "plaza",
    title: "Opportunity Plaza",
    kicker: "The center of your Level Up journey.",
    what: "As you complete experiences, your path through Opportunity City will change and new opportunities may appear.",
    practice: "See progress • discover what opens next",
    leave: "A clear view of where you’ve been and what may come next.",
    special: "Opportunity Plaza is your hub — not another assignment.",
    audio: "nova-plaza.mp3",
  },
};

const EXPLORE_POSITIONS: Record<DistrictKey, { left: string; top: string }> = {
  discovery: { left: "29%", top: "76%" },
  resume: { left: "48%", top: "24%" },
  interview: { left: "82%", top: "24%" },
  firstday: { left: "91%", top: "52%" },
  money: { left: "36%", top: "51%" },
  career: { left: "82%", top: "73%" },
  plaza: { left: "70%", top: "59%" },
};

const JOURNEY_POSITIONS: Partial<Record<DistrictKey, { left: string; top: string }>> = {
  discovery: { left: "24.3%", top: "74%" },
  resume: { left: "43.3%", top: "27.6%" },
  interview: { left: "75.3%", top: "30.1%" },
  firstday: { left: "83.6%", top: "54.8%" },
  money: { left: "33.2%", top: "53.4%" },
};

function parseVttTime(value: string) {
  const parts = value.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

function parseVtt(text: string): Cue[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const cues: Cue[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes("-->")) continue;
    const [startText, endText] = lines[i].split("-->").map((part) => part.trim().split(" ")[0]);
    const body: string[] = [];
    i += 1;
    while (i < lines.length && lines[i].trim()) {
      body.push(lines[i].replace(/<[^>]+>/g, "").trim());
      i += 1;
    }
    if (body.length) cues.push({ start: parseVttTime(startText), end: parseVttTime(endText), text: body.join(" ") });
  }
  return cues;
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [activeKey, setActiveKey] = useState<DistrictKey | null>(null);
  const [districtPlaying, setDistrictPlaying] = useState(false);
  const [welcomeGate, setWelcomeGate] = useState(false);
  const [welcomePlaying, setWelcomePlaying] = useState(false);
  const [welcomeMuted, setWelcomeMuted] = useState(false);
  const [welcomeTime, setWelcomeTime] = useState(0);
  const [cues, setCues] = useState<Cue[]>([]);
  const welcomeVideoRef = useRef<HTMLVideoElement>(null);
  const districtAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch(`${ASSET}nova-welcome.vtt`).then((response) => response.text()).then((text) => setCues(parseVtt(text))).catch(() => setCues([]));
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
      const welcomeKey = `level-up-opportunity-city-welcome-seen:${session.user.id}`;
      setWelcomeGate(localStorage.getItem(welcomeKey) !== "1");
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.user.id, authReady]);

  const progressById = useMemo(() => new Map(rows.map((row) => [row.module_id, row])), [rows]);
  const complete = (id: string) => Boolean(progressById.get(id)?.is_complete);
  const totalXp = rows.reduce((sum, row) => sum + (row.xp || 0), 0);
  const completedCount = CORE_SEQUENCE.filter((id) => complete(id)).length;
  const currentModuleId = CORE_SEQUENCE.find((id) => !complete(id)) ?? null;
  const seriesComplete = currentModuleId === null;

  const currentPath = useMemo(() => {
    switch (currentModuleId) {
      case "discovery": return "Begin with Discovery";
      case "resume-district": return "Resume District unlocked";
      case "confidence-checkpoint": return "Confidence Checkpoint revealed";
      case "interview-arena": return "Interview Arena unlocked";
      case "first-day-challenge": return "First Day Challenge unlocked";
      case "shadow-passage": return "Something changed in Opportunity Plaza";
      case "money-moves": return "Money Moves unlocked";
      default: return "Level Up Work Ready Series complete";
    }
  }, [currentModuleId]);

  function districtState(district: District): JourneyState {
    if (!district.moduleId) return "locked";
    if (complete(district.moduleId)) return "complete";
    if (currentModuleId === district.moduleId) return "current";
    if (progressById.has(district.moduleId)) return "started";
    return "locked";
  }

  async function signIn() {
    if (!supabase || !email.trim()) return;
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl() } });
    if (error) return setMessage(error.message);
    setSent(true);
  }

  async function signOut() {
    stopWelcome();
    stopDistrictAudio();
    await supabase?.auth.signOut();
    setSession(null);
    setRows([]);
  }

  function markWelcomeSeen() {
    if (!session) return;
    localStorage.setItem(`level-up-opportunity-city-welcome-seen:${session.user.id}`, "1");
    setWelcomeGate(false);
  }

  function playWelcome() {
    stopDistrictAudio();
    setActiveKey(null);
    markWelcomeSeen();
    setWelcomePlaying(true);
    const video = welcomeVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = welcomeMuted;
    video.play().catch(() => {
      setWelcomeMuted(true);
      video.muted = true;
      video.play().catch(() => setWelcomePlaying(false));
    });
  }

  function stopWelcome() {
    const video = welcomeVideoRef.current;
    if (video) video.pause();
    setWelcomePlaying(false);
    setWelcomeTime(0);
  }

  function skipWelcome() {
    markWelcomeSeen();
    stopWelcome();
  }

  function toggleWelcomeAudio() {
    const next = !welcomeMuted;
    setWelcomeMuted(next);
    if (welcomeVideoRef.current) welcomeVideoRef.current.muted = next;
  }

  function stopDistrictAudio() {
    const audio = districtAudioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setDistrictPlaying(false);
  }

  function openDistrict(key: DistrictKey) {
    stopWelcome();
    stopDistrictAudio();
    setActiveKey(key);
  }

  function closeDistrict() {
    stopDistrictAudio();
    setActiveKey(null);
  }

  function toggleDistrictAudio() {
    const audio = districtAudioRef.current;
    if (!audio || !activeKey) return;
    const src = `${ASSET}${DISTRICTS[activeKey].audio}`;
    if (!audio.src.endsWith(DISTRICTS[activeKey].audio)) audio.src = src;
    if (audio.paused) {
      audio.play().then(() => setDistrictPlaying(true)).catch(() => setDistrictPlaying(false));
    } else {
      audio.pause();
      setDistrictPlaying(false);
    }
  }

  function navigate(href?: string) {
    if (href) window.location.assign(href);
  }

  function enterDistrict(district: District) {
    const state = districtState(district);
    if (!district.href || !district.moduleId) return;
    if (state === "locked") return;
    navigate(district.href);
  }

  const activeDistrict = activeKey ? DISTRICTS[activeKey] : null;
  const activeState = activeDistrict ? districtState(activeDistrict) : "locked";
  const currentCaption = cues.find((cue) => welcomeTime >= cue.start && welcomeTime < cue.end)?.text ?? "";
  const confidenceVisible = complete("resume-district") || progressById.has("confidence-checkpoint");
  const confidenceComplete = complete("confidence-checkpoint");
  const shadowVisible = complete("first-day-challenge") || progressById.has("shadow-passage");
  const shadowComplete = complete("shadow-passage");

  if (!authReady || loading) return <main className="loading"><span className="brand-mark">LU</span><p>Loading Opportunity City…</p></main>;
  if (configured && !session) return <SignIn email={email} setEmail={setEmail} sent={sent} message={message} onSubmit={signIn} />;

  return (
    <main className="portal-shell opportunity-shell">
      <header className="portal-header city-header">
        <div className="brand"><span className="brand-mark">LU</span><div><strong>LEVEL UP</strong><span>OPPORTUNITY CITY</span></div></div>
        <div className="header-stats">
          <span><Trophy /> <b>{totalXp}</b> XP</span>
          <span><Check /> <b>{completedCount}/{CORE_SEQUENCE.length}</b> complete</span>
          <span className="cloud"><Cloud /> Cloud synced</span>
        </div>
        {session ? <button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut /></button> : null}
      </header>

      <section className="city-intro" aria-label="Level Up journey status">
        <div><p className="eyebrow">WELCOME, {name.toUpperCase()}</p><h1>Opportunity City</h1><p>Your progress shapes the city. Explore anywhere, then enter the next unlocked stop on your Level Up journey.</p></div>
        <div className="journey-meter"><span>{seriesComplete ? "WORK READY SERIES COMPLETE" : "CURRENT PATH"}</span><strong>{currentPath}</strong><div><i style={{ width: `${Math.min(100, (completedCount / CORE_SEQUENCE.length) * 100)}%` }} /></div><b>{completedCount} OF {CORE_SEQUENCE.length} EXPERIENCES COMPLETE</b></div>
      </section>

      {message ? <div className="notice">{message}</div> : null}

      <section className="opportunity-stage" aria-label="Interactive Opportunity City map">
        <img className="opportunity-map" src={`${ASSET}opportunity-city.png`} alt="Opportunity City with Discovery, Resume District, Interview Arena, First Day Challenge, Money Moves, Career Skill Tree, and Opportunity Plaza." />
        <div className="map-shade" aria-hidden="true" />

        <div className="map-current-path"><MapPin /><div><small>CURRENT PATH</small><strong>{currentPath}</strong></div></div>
        <div className="map-controls">
          <button onClick={playWelcome}><RotateCcw /> Replay Welcome</button>
          <button onClick={skipWelcome} disabled={!welcomePlaying}>Skip</button>
          <button onClick={toggleWelcomeAudio}>{welcomeMuted ? <VolumeX /> : <Volume2 />} Audio</button>
        </div>

        {welcomeGate ? <div className="welcome-gate"><span className="nova-chip"><Sparkles /> NOVA • CITY GUIDE</span><h2>Welcome to Opportunity City</h2><p>Nova will show you how Level Up works, how progress unlocks your route, and why your career coach remains part of the journey.</p><div><button className="primary-action" onClick={playWelcome}><Play /> Meet Nova</button><button onClick={skipWelcome}>Skip for now</button></div></div> : null}

        <div className={`nova-video-panel ${welcomePlaying ? "show" : ""}`} aria-hidden={!welcomePlaying}>
          <video
            ref={welcomeVideoRef}
            playsInline
            preload="metadata"
            onTimeUpdate={(event) => setWelcomeTime(event.currentTarget.currentTime)}
            onEnded={stopWelcome}
          >
            <source src={`${ASSET}nova-welcome-clean.mp4`} type="video/mp4" />
            <track kind="captions" srcLang="en" label="English" src={`${ASSET}nova-welcome.vtt`} />
          </video>
          <div className="nova-video-tag">NOVA • GUIDE</div>
        </div>
        {welcomePlaying && currentCaption ? <div className="welcome-caption" aria-live="polite">{currentCaption}</div> : null}

        {(Object.keys(EXPLORE_POSITIONS) as DistrictKey[]).map((key) => (
          <button
            key={`explore-${key}`}
            className="explore-icon"
            style={EXPLORE_POSITIONS[key]}
            onClick={() => openDistrict(key)}
            aria-label={`Explore ${DISTRICTS[key].title}`}
            data-label="Explore"
          ><Info /></button>
        ))}

        {(["discovery", "resume", "interview", "firstday", "money"] as DistrictKey[]).map((key) => {
          const district = DISTRICTS[key];
          const state = districtState(district);
          const position = JOURNEY_POSITIONS[key]!;
          const label = state === "complete" ? `${district.title} complete` : state === "current" ? `Enter ${district.title}` : state === "started" ? `Continue ${district.title}` : `${district.title} locked`;
          return <button
            key={`journey-${key}`}
            className={`journey-marker ${state}`}
            style={position}
            onClick={() => state !== "locked" && navigate(district.href)}
            disabled={state === "locked"}
            aria-label={label}
            data-label={state === "complete" ? "Complete" : state === "current" ? "Enter" : state === "started" ? "Continue" : "Locked"}
          >{state === "complete" ? <Check /> : state === "locked" ? <LockKeyhole /> : <MapPin />}</button>;
        })}

        {confidenceVisible ? <button
          className={`checkpoint-marker ${confidenceComplete ? "complete" : currentModuleId === "confidence-checkpoint" ? "current" : "started"}`}
          onClick={() => navigate(HREFS["confidence-checkpoint"])}
          aria-label={confidenceComplete ? "Confidence Checkpoint complete" : "Enter Confidence Checkpoint"}
        >
          {confidenceComplete ? <Check /> : <Sparkles />}
          <span>{confidenceComplete ? "Confidence ✓" : "Confidence Checkpoint"}</span>
        </button> : null}

        {shadowVisible ? shadowComplete ? <div className="shadow-complete" aria-label="Shadow Passage complete"><Check /><span>Passage complete</span></div> : <button
          className="secret-marker"
          onClick={() => navigate(HREFS["shadow-passage"])}
          aria-label="A mysterious path has appeared in Opportunity Plaza"
          data-label="Something changed…"
        ><Sparkles /></button> : null}

        <div className="explore-legend"><Info /> Explore is information only • it never changes your progress</div>

        {activeDistrict ? <div className="district-modal" role="dialog" aria-modal="true" aria-labelledby="district-title" onMouseDown={(event) => event.target === event.currentTarget && closeDistrict()}>
          <div className="district-card">
            <div className="district-card-top">
              <img src={`${ASSET}nova-card.jpg`} alt="Nova, Level Up guide" />
              <div><p className="eyebrow">NOVA’S CITY GUIDE</p><h2 id="district-title">{activeDistrict.title}</h2><p className="district-kicker">{activeDistrict.kicker}</p></div>
              <button className="close-card" onClick={closeDistrict} aria-label="Close"><X /></button>
            </div>
            <div className="district-sections">
              <div className="district-section wide"><b>What happens here</b><span>{activeDistrict.what}</span></div>
              <div className="district-section"><b>What you’ll practice</b><span>{activeDistrict.practice}</span></div>
              <div className="district-section"><b>What you’ll leave with</b><span>{activeDistrict.leave}</span></div>
            </div>
            {activeDistrict.special ? <div className="district-special">{activeDistrict.special}</div> : null}
            <div className="district-actions">
              <button className={districtPlaying ? "audio-playing" : ""} onClick={toggleDistrictAudio}>{districtPlaying ? <Pause /> : <Volume2 />} {districtPlaying ? "Pause Nova" : "Hear Nova"}</button>
              {activeDistrict.key === "plaza" ? <button disabled>Opportunity Plaza is the hub</button> : activeDistrict.key === "career" ? <button disabled>Explore now • pathway module coming later</button> : <button className={activeState === "locked" ? "locked-action" : "primary-action"} disabled={activeState === "locked"} onClick={() => enterDistrict(activeDistrict)}>{activeState === "complete" ? "Revisit District" : activeState === "started" ? "Continue District" : activeState === "current" ? "Enter District" : "Locked — complete the previous step"}<ChevronRight /></button>}
            </div>
            <p className="progress-note">Exploring this card does not write to Supabase, award XP, mark completion, or unlock a district.</p>
            <audio ref={districtAudioRef} preload="none" onEnded={() => setDistrictPlaying(false)} />
          </div>
        </div> : null}
      </section>
    </main>
  );
}

function SignIn({ email, setEmail, sent, message, onSubmit }: { email: string; setEmail: (value: string) => void; sent: boolean; message: string; onSubmit: () => void }) {
  return <main className="signin-shell city-signin">
    <img src={`${ASSET}opportunity-city.png`} alt="" aria-hidden="true" />
    <div className="signin-shade" />
    <section className="signin-card">
      <div className="brand"><span className="brand-mark">LU</span><div><strong>LEVEL UP</strong><span>OPPORTUNITY CITY</span></div></div>
      <p className="eyebrow">ONE ACCOUNT. EVERY LEVEL.</p>
      <h1>Enter Opportunity City</h1>
      <p>Sign in to restore your completed experiences, XP, and next unlocked destination.</p>
      {sent ? <div className="sent"><Mail /><div><strong>Check your email</strong><span>Open the secure link to return to Opportunity City.</span></div></div> : <>
        <label htmlFor="email">Email address</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSubmit()} placeholder="you@example.com" autoComplete="email" />
        <button onClick={onSubmit}>Email my sign-in link <ChevronRight /></button>
      </>}
      {message ? <div className="error">{message}</div> : null}
      <small>Your Level Up account securely connects your progress across the Opportunity City experiences.</small>
    </section>
  </main>;
}
