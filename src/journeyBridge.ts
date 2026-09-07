import { supabase } from "./supabase";

const SESSION_BRIDGE_KEY = "level-up-supabase-session-v1";
const FDC_STORAGE_KEY = "level-up-first-day-challenge-v1";

type LocalJourneyState = {
  xp?: number;
  complete?: boolean;
  completed?: string[];
  startedAt?: string;
  completedAt?: string | null;
  savedAt?: string;
  [key: string]: unknown;
};

function readFdcState(): LocalJourneyState | null {
  try {
    const raw = localStorage.getItem(FDC_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalJourneyState) : null;
  } catch {
    return null;
  }
}

function removeCompletionQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("completed");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export async function prepareJourneyBridge() {
  if (!supabase) return;

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return;

  // Same-origin Level Up modules can use this short-lived tab bridge instead of
  // guessing Supabase's internal localStorage serialization.
  sessionStorage.setItem(SESSION_BRIDGE_KEY, JSON.stringify({
    access_token: session.access_token,
    user: session.user,
  }));

  const completedModule = new URLSearchParams(window.location.search).get("completed");
  if (completedModule !== "first-day-challenge") return;

  const state = readFdcState();
  const complete = Boolean(state?.complete || state?.completed?.includes("reflection"));
  if (!state || !complete) return;

  const now = new Date().toISOString();
  const { error } = await supabase.from("module_progress").upsert({
    user_id: session.user.id,
    module_id: "first-day-challenge",
    journey_state: { ...state, complete: true },
    xp: Number(state.xp || 0),
    is_complete: true,
    started_at: state.startedAt || now,
    completed_at: state.completedAt || now,
    updated_at: now,
  }, { onConflict: "user_id,module_id" });

  if (!error) removeCompletionQuery();
}
