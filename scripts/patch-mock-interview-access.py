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

# Career Tree is an optional exploration hub, not part of Level Up progression.
career_old = '''  career: {
    key: "career",
    title: "Career Skill Tree",
    kicker: "Your first job doesn’t have to be your last stop.",
    what: "Explore career areas, see how your interests might connect, and learn how entry-level experience can grow into new skills and bigger opportunities.",
    practice: "Career exploration • interest alignment • skill growth",
    leave: "A broader view of entry points and future possibilities.",
    special: "Exploring here does not lock you into a career choice.",
    audio: "nova-career.mp3",
  },'''
career_new = '''  career: {
    key: "career",
    title: "Career Skill Tree",
    kicker: "Your first job doesn’t have to be your last stop.",
    what: "Explore career areas, see how your interests might connect, and learn how entry-level experience can grow into new skills and bigger opportunities.",
    practice: "Career exploration • interest alignment • skill growth",
    leave: "A broader view of entry points and future possibilities.",
    special: "Optional exploration — Career Tree does not change your Level Up progression.",
    audio: "nova-career.mp3",
    href: `${BASE}career-skill-tree/?entry=map#home`,
  },'''
if career_old in text:
    text = text.replace(career_old, career_new, 1)
elif 'href: `${BASE}career-skill-tree/?entry=map#home`' not in text:
    raise SystemExit("Opportunity City Career Tree district signature changed; launch link not applied")

explore_old = '            onClick={() => openDistrict(key)}\n'
explore_new = '            onClick={() => key === "career" ? navigate(DISTRICTS.career.href) : openDistrict(key)}\n'
if explore_old in text:
    text = text.replace(explore_old, explore_new, 1)
elif explore_new not in text:
    raise SystemExit("Opportunity City explore-icon signature changed; Career Tree direct launch not applied")

career_action_old = 'activeDistrict.key === "career" ? <button disabled>Explore now • pathway module coming later</button>'
career_action_new = 'activeDistrict.key === "career" ? <button className="primary-action" onClick={() => navigate(activeDistrict.href)}>Open Career Tree <ChevronRight /></button>'
if career_action_old in text:
    text = text.replace(career_action_old, career_action_new, 1)
elif career_action_new not in text:
    raise SystemExit("Opportunity City Career Tree modal action signature changed")

path.write_text(text, encoding="utf-8")

# Career Tree launch context:
# - normal Opportunity City / direct links are self-paced and do not show a mode control
# - a future Level Up Live classroom launch can use ?mode=facilitated or ?from=level-up-live
#   to expose facilitator mode and the facilitator pause prompts.
hub_path = Path("public/career-skill-tree/open-hub.js")
if hub_path.exists():
    hub = hub_path.read_text(encoding="utf-8")

    map_insert_old = "`;grid.before(map);\n    document.querySelectorAll('[data-hub-view]')"
    map_insert_new = "`;grid.before(map);\n    if(new URLSearchParams(location.search).get('entry')==='map')requestAnimationFrame(()=>map.scrollIntoView({behavior:'auto',block:'start'}));\n    document.querySelectorAll('[data-hub-view]')"
    if map_insert_old in hub:
        hub = hub.replace(map_insert_old, map_insert_new, 1)
    elif "get('entry')==='map'" not in hub:
        raise SystemExit("Career Tree map insertion signature changed; direct-map entry not applied")

    # Inject classroom-aware mode behavior into the base Career Tree runtime.
    patch_anchor = "    let next=source;\n"
    mode_patch = '''    let next=source;\n    next=replaceRequired(next,\n"    facilitated:true,",\n"    facilitated:false,",'self-paced default');\n\n    next=replaceRequired(next,\n"  let state = load();",\n`  const launchParams=new URLSearchParams(location.search);\n  const launchFacilitated=launchParams.get('mode')==='facilitated'||launchParams.get('from')==='level-up-live';\n  let state = load();\n  state.facilitated=launchFacilitated;`,'launch-context mode');\n\n    next=replaceRequired(next,\n`    $('facilitatedToggle').setAttribute('aria-pressed',String(state.facilitated));\n    $('facilitatedToggle').textContent=state.facilitated?'🎓 Facilitated Mode':'👤 Self-Paced Mode';\n    $$('[data-facilitator]').forEach(el=>el.hidden=!state.facilitated);`,\n`    const modeToggle=$('facilitatedToggle');\n    modeToggle.hidden=!launchFacilitated;\n    if(launchFacilitated){\n      modeToggle.setAttribute('aria-pressed',String(state.facilitated));\n      modeToggle.textContent=state.facilitated?'🎓 Facilitated Mode':'👤 Self-Paced Mode';\n    }\n    $$('[data-facilitator]').forEach(el=>el.hidden=!launchFacilitated||!state.facilitated);`,'context-aware mode control');\n'''
    if "launchFacilitated=launchParams.get('mode')==='facilitated'" not in hub:
        if patch_anchor not in hub:
            raise SystemExit("Career Tree open-hub patch anchor changed; launch-context mode not applied")
        hub = hub.replace(patch_anchor, mode_patch, 1)

    hub_path.write_text(hub, encoding="utf-8")

index_path = Path("public/career-skill-tree/index.html")
if index_path.exists():
    index = index_path.read_text(encoding="utf-8")
    visible_toggle = '<button id="facilitatedToggle" class="mode-btn" type="button" aria-pressed="true">🎓 Facilitated Mode</button>'
    hidden_toggle = '<button id="facilitatedToggle" class="mode-btn" type="button" aria-pressed="false" hidden>🎓 Facilitated Mode</button>'
    if visible_toggle in index:
        index = index.replace(visible_toggle, hidden_toggle, 1)
    elif hidden_toggle not in index:
        raise SystemExit("Career Tree facilitator toggle signature changed; default-hidden control not applied")
    index_path.write_text(index, encoding="utf-8")

print("Opportunity City access, Career Tree map entry, and classroom-only facilitator mode enabled.")
