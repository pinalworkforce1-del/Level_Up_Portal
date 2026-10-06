from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "src/App.tsx")
text = path.read_text(encoding="utf-8")

nav_old = """  function navigate(href?: string) {
    if (href) window.location.assign(href);
  }
"""
nav_new = """  function navigate(href?: string) {
    if (href) window.location.assign(href);
  }

  function launchMockInterview() {
    const target = new URL("https://pinalworkforce1-del.github.io/LU_Discovery/mock-interview.html");
    target.searchParams.set("mode", "selfpaced");
    target.searchParams.set("returnTo", window.location.href);
    window.location.assign(target.toString());
  }
"""

if "function launchMockInterview()" not in text:
    if nav_old not in text:
        raise SystemExit("Opportunity City navigate signature changed; mock interview helper not applied")
    text = text.replace(nav_old, nav_new, 1)

actions_old = """              {activeDistrict.key === "plaza" ? <button disabled>Opportunity Plaza is the hub</button> : activeDistrict.key === "career" ? <button disabled>Explore now • pathway module coming later</button> : <button className={activeState === "locked" ? "locked-action" : "primary-action"} disabled={activeState === "locked"} onClick={() => enterDistrict(activeDistrict)}>{activeState === "complete" ? "Revisit District" : activeState === "started" ? "Continue District" : activeState === "current" ? "Enter District" : "Locked — complete the previous step"}<ChevronRight /></button>}
"""
actions_new = actions_old + """              {activeDistrict.key === "interview" && activeState === "complete" ? <button className="primary-action" onClick={launchMockInterview}><Sparkles /> Practice Mock Interview</button> : null}
"""

if "Practice Mock Interview" not in text:
    if actions_old not in text:
        raise SystemExit("Opportunity City district action signature changed; mock interview button not applied")
    text = text.replace(actions_old, actions_new, 1)

area_old = 'if (!county) setMessage("Choose Pinal or Northern before signing in.");'
area_new = 'if (!county) setMessage("Choose your area before signing in.");'
if area_old in text:
    text = text.replace(area_old, area_new, 1)
elif area_new not in text:
    raise SystemExit("Opportunity City area validation signature changed; area copy not updated")

path.write_text(text, encoding="utf-8")
print("Opportunity City mock interview access and area validation copy enabled.")
