type CloudProgressRow = {
  module_id: string;
  xp: number;
  is_complete: boolean;
  journey_state: Record<string, unknown> | null;
  updated_at: string;
  completed_at?: string | null;
};

type LocalProgressRow = CloudProgressRow & {
  pending?: boolean;
  last_synced_at?: string | null;
};

const BASE_KEY = "level-up-offline-progress-v2";
const keyFor = (userId: string) => `${BASE_KEY}:${userId}`;

function readLocal(userId: string): Record<string, LocalProgressRow> {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(userId: string, data: Record<string, LocalProgressRow>) {
  localStorage.setItem(keyFor(userId), JSON.stringify(data));
}

function newerOrFurther(local: LocalProgressRow, remote?: CloudProgressRow | null) {
  if (!remote) return true;
  if (local.is_complete && !remote.is_complete) return true;
  if ((local.xp || 0) > (remote.xp || 0)) return true;
  const lt = Date.parse(local.updated_at || "") || 0;
  const rt = Date.parse(remote.updated_at || "") || 0;
  return lt >= rt;
}

export function mergeOfflineProgress(rows: CloudProgressRow[] | null | undefined, userId: string): CloudProgressRow[] {
  const remote = new Map((rows || []).map((row) => [row.module_id, row]));
  const local = readLocal(userId);

  for (const entry of Object.values(local)) {
    if (!entry?.module_id) continue;
    const cloud = remote.get(entry.module_id);
    if (entry.pending && newerOrFurther(entry, cloud)) {
      remote.set(entry.module_id, {
        module_id: entry.module_id,
        journey_state: entry.journey_state || {},
        xp: Number(entry.xp || 0),
        is_complete: Boolean(entry.is_complete),
        updated_at: entry.updated_at || new Date().toISOString(),
        completed_at: entry.completed_at || null,
      });
    }
  }

  return [...remote.values()];
}

export function pendingOfflineCount(userId: string) {
  return Object.values(readLocal(userId)).filter((row) => row?.pending).length;
}

export async function flushOfflineProgress(supabase: any, userId: string) {
  if (!supabase || !userId || !navigator.onLine) return null;

  const localMap = readLocal(userId);
  const pending = Object.values(localMap).filter((row) => row?.pending && row.module_id);
  if (!pending.length) return null;

  const ids = pending.map((row) => row.module_id);
  const { data: remoteRows, error: remoteError } = await supabase
    .from("module_progress")
    .select("module_id,xp,is_complete,journey_state,updated_at,completed_at")
    .eq("user_id", userId)
    .in("module_id", ids);

  if (remoteError) return null;
  const remote = new Map<string, CloudProgressRow>(((remoteRows || []) as CloudProgressRow[]).map((row) => [row.module_id, row]));

  let changed = false;
  for (const entry of pending) {
    const cloud = remote.get(entry.module_id);
    if (newerOrFurther(entry, cloud)) {
      const { error } = await supabase.from("module_progress").upsert({
        user_id: userId,
        module_id: entry.module_id,
        journey_state: entry.journey_state || {},
        xp: Number(entry.xp || 0),
        is_complete: Boolean(entry.is_complete),
        updated_at: entry.updated_at || new Date().toISOString(),
        completed_at: entry.is_complete ? (entry.completed_at || entry.updated_at || new Date().toISOString()) : null,
      }, { onConflict: "user_id,module_id" });
      if (error) continue;
    }

    localMap[entry.module_id] = {
      ...entry,
      pending: false,
      last_synced_at: new Date().toISOString(),
    };
    changed = true;
  }

  if (changed) writeLocal(userId, localMap);

  const { data } = await supabase
    .from("module_progress")
    .select("module_id,xp,is_complete,journey_state,updated_at,completed_at")
    .eq("user_id", userId);

  return (data || []) as CloudProgressRow[];
}
