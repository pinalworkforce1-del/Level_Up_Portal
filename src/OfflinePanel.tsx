import { CheckCircle2, Download, HardDriveDownload, Wifi, WifiOff, X } from "lucide-react";
import { useMemo, useState } from "react";

type OfflineApi = {
  prepareScopes: (roots: string[], onProgress?: (event: { phase: string; root: string; index: number; total: number }) => void) => Promise<Array<{ root: string; ok: boolean }>>;
  estimateScopes: (roots: string[]) => Promise<{ totalBytes: number; totalFiles: number }>;
};

declare global {
  interface Window {
    LevelUpOffline?: OfflineApi;
  }
}

const JOURNEY = [
  "discovery",
  "resume-district",
  "confidence-checkpoint",
  "interview-arena",
  "first-day-challenge",
  "shadow-passage",
  "money-moves",
] as const;

const SCOPE_BY_MODULE: Record<(typeof JOURNEY)[number], string> = {
  discovery: "/LU_Discovery/",
  "resume-district": "/Resume_District/",
  "confidence-checkpoint": "/Confidence_Checkpoint/",
  "interview-arena": "/Interview_Arena/",
  "first-day-challenge": "/Level_Up_Portal/",
  "shadow-passage": "/Level_Up_Portal/",
  "money-moves": "/Level_Up_Portal/",
};

const FULL_SCOPES = [...new Set(JOURNEY.map((id) => SCOPE_BY_MODULE[id]))];

function prettyBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return (mb < 100 ? mb.toFixed(1) : mb.toFixed(0)) + " MB";
  return (mb / 1024).toFixed(1) + " GB";
}

function scopeLabel(scope: string) {
  if (scope.includes("LU_Discovery")) return "Discovery";
  if (scope.includes("Resume_District")) return "Resume District";
  if (scope.includes("Confidence_Checkpoint")) return "Confidence Checkpoint";
  if (scope.includes("Interview_Arena")) return "Interview Arena";
  return "Level Up Core Journey";
}

export function OfflinePanel({ currentModuleId }: { currentModuleId: string | null }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const [estimate, setEstimate] = useState("");

  const nextScopes = useMemo(() => {
    const idx = currentModuleId ? JOURNEY.indexOf(currentModuleId as (typeof JOURNEY)[number]) : -1;
    const ids = idx >= 0 ? JOURNEY.slice(idx, Math.min(JOURNEY.length, idx + 2)) : JOURNEY.slice(-1);
    return [...new Set(ids.map((id) => SCOPE_BY_MODULE[id]))];
  }, [currentModuleId]);

  async function prepare(scopes: string[], label: string) {
    if (!navigator.onLine) {
      setStatus("Connect to the internet once to prepare offline access. Your downloaded content will work after that.");
      return;
    }
    const api = window.LevelUpOffline;
    if (!api) {
      setStatus("Offline preparation is still starting. Wait a moment and try again.");
      return;
    }

    setBusy(true);
    setReady(false);
    setStatus("Checking download size…");
    try {
      const info = await api.estimateScopes(scopes);
      setEstimate(prettyBytes(info.totalBytes));
      setStatus("Preparing " + label + " • " + prettyBytes(info.totalBytes) + " • " + info.totalFiles + " files");
      try { await navigator.storage?.persist?.(); } catch (_) {}
      await api.prepareScopes(scopes, ({ root, index, total }) => {
        setStatus("Preparing " + scopeLabel(root) + " • " + (index + 1) + " of " + total);
      });
      setReady(true);
      setStatus("Ready offline" + (info.totalBytes ? " • " + prettyBytes(info.totalBytes) + " stored" : "") + ". Audio, captions, images, and activities are included.");
    } catch (error) {
      console.error("Offline preparation failed", error);
      setStatus("Offline preparation did not finish. Your online experience is unchanged; reconnect and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="offline-access" aria-label="Offline access">
      <button className="offline-launch" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {navigator.onLine ? <Wifi /> : <WifiOff />}
        <span><b>Offline Access</b><small>Optional for unreliable internet</small></span>
        <Download />
      </button>

      {open ? <div className="offline-panel">
        <div className="offline-panel-head">
          <div><p className="eyebrow">LEVEL UP OFFLINE ENGINE v1.0.3</p><h2>Prepare before the signal drops.</h2></div>
          <button onClick={() => setOpen(false)} aria-label="Close offline access"><X /></button>
        </div>
        <p>Download Level Up content while you have a reliable connection. Once prepared, the included modules keep their artwork, narration, captions, and interactive activities even when the internet becomes unstable.</p>

        <div className="offline-options">
          <button disabled={busy} onClick={() => prepare(nextScopes, "your next stops")}>
            <HardDriveDownload />
            <span><b>Current + Next</b><small>Prepare only the next part of your journey.</small></span>
          </button>
          <button disabled={busy} onClick={() => prepare(FULL_SCOPES, "the full Level Up journey")}>
            <Download />
            <span><b>Full Level Up Journey</b><small>Best before travel or work in low-connectivity areas.</small></span>
          </button>
        </div>

        <div className={"offline-status " + (ready ? "ready" : "")}>
          {ready ? <CheckCircle2 /> : navigator.onLine ? <Wifi /> : <WifiOff />}
          <span>{status || ("Nothing downloads unless you choose an option." + (estimate ? " Last estimate: " + estimate + "." : ""))}</span>
        </div>
        <small className="offline-note">AI tools, live labor-market lookups, email sign-in, and live facilitator features still require a connection. Offline progress syncing is handled separately when connectivity returns.</small>
      </div> : null}
    </section>
  );
}
