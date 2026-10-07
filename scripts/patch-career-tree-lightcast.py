from pathlib import Path
import base64
import gzip
import json
import re

ROOT = Path("public/career-skill-tree")
DATA = ROOT / "data"
PARTS = DATA / "lightcast"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"Career Tree patch could not find {label}")
    return text.replace(old, new, 1)


# -----------------------------------------------------------------------------
# Reconstruct the checked-in compact Lightcast payload.
# Deployment MUST fail rather than publish a partial/empty LMI snapshot.
# Two upload-corrupted source chunks are replaced by verified half-chunks.
# -----------------------------------------------------------------------------
parts = sorted(PARTS.glob("full.part*.b64"))
if len(parts) != 14:
    raise SystemExit(f"Career Tree requires 14 Lightcast payload parts; found {len(parts)}")

repair_map = {
    "full.part08.b64": ["repair08a.b64", "repair08b.b64"],
    "full.part12.b64": ["repair12a.b64", "repair12b.b64"],
}
encoded_parts = []
for p in parts:
    repairs = repair_map.get(p.name)
    if repairs:
        values = []
        for name in repairs:
            repair = PARTS / name
            if not repair.exists():
                raise SystemExit(f"Missing verified Lightcast repair chunk: {name}")
            values.append(repair.read_text(encoding="utf-8").strip())
        value = "".join(values)
        if len(value) != 12000:
            raise SystemExit(f"Verified Lightcast replacement for {p.name} must be 12000 chars; found {len(value)}")
        encoded_parts.append(value)
    else:
        encoded_parts.append(p.read_text(encoding="utf-8").strip())
encoded = "".join(encoded_parts)

try:
    compact = json.loads(gzip.decompress(base64.b64decode(encoded)).decode("utf-8"))
except Exception as exc:
    raise SystemExit(f"Career Tree Lightcast payload decode failed: {exc}") from exc

catalog_rows = compact.get("c", [])
geo_rows = compact.get("g", {})
labels = compact.get("l", {})
areas = compact.get("a", {})

expected_geos = {
    "pinal", "coconino", "apache", "navajo", "gila", "az",
    "chaves", "curry", "de-baca", "eddy", "guadalupe", "harding",
    "lea", "lincoln", "otero", "quay", "roosevelt", "union", "nm",
}
if len(catalog_rows) != 798:
    raise SystemExit(f"Career Tree Lightcast catalog must contain 798 occupations; found {len(catalog_rows)}")
if set(geo_rows) != expected_geos:
    raise SystemExit(f"Career Tree Lightcast geography set is incomplete: {sorted(set(geo_rows))}")
if areas.get("Pinal") != ["pinal", "az"]:
    raise SystemExit("Career Tree Pinal geography scope is invalid")
if areas.get("Northern") != ["coconino", "apache", "navajo", "gila", "az"]:
    raise SystemExit("Career Tree Northern geography scope is invalid")
ufo = areas.get("UFO - Eastern New Mexico", [])
if len(ufo) != 13 or "nm" not in ufo:
    raise SystemExit("Career Tree Eastern New Mexico geography scope is invalid")

snapshot = {
    "version": compact.get("v", "2026-10-06-full-19geo"),
    "provider": "Lightcast",
    "datarun": compact.get("d", "2026.4"),
    "snapshotYear": 2026,
    "projectionPeriod": compact.get("p", "2026–2035"),
    "sourceStatus": "loaded",
    "geographyCount": 19,
    "occupationCountPerGeography": 798,
    "areas": areas,
    "catalog": {},
    "geographies": {},
}

for row in catalog_rows:
    soc, title, interests, education, experience, ojt = row
    snapshot["catalog"][soc] = {
        "title": title,
        "interests": interests,
        "typicalEducation": education,
        "workExperience": experience,
        "typicalOjt": ojt,
    }


def wage(v):
    return v / 100 if isinstance(v, (int, float)) else v


def growth(v):
    return v / 10 if isinstance(v, (int, float)) else v


for geo, rows in geo_rows.items():
    if len(rows) != 798:
        raise SystemExit(f"Career Tree Lightcast {geo} must contain 798 occupations; found {len(rows)}")
    label = labels.get(geo, geo)
    occupations = {}
    for meta, metrics in zip(catalog_rows, rows):
        soc, _title, _interests, education, experience, ojt = meta
        employment, p25, average, hires, p75, openings, median, growth_value = metrics
        occupations[soc] = {
            "employment": employment,
            "entryHourly": wage(p25),
            "averageHourly": wage(average),
            "recentHires": hires,
            "experiencedHourly": wage(p75),
            "annualOpenings": openings,
            "medianHourly": wage(median),
            "growthPct": growth(growth_value),
            "typicalEducation": education,
            "workExperience": experience,
            "typicalOjt": ojt,
        }
    snapshot["geographies"][geo] = {
        "label": label,
        "sourceLabel": f"Lightcast {snapshot['datarun']} • {label}",
        "projectionPeriod": snapshot["projectionPeriod"],
        "occupations": occupations,
    }

out = DATA / "lightcast-lmi.json"
out.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

# Validate the expanded file itself, not only the compact source.
check = json.loads(out.read_text(encoding="utf-8"))
if check.get("sourceStatus") != "loaded" or len(check.get("geographies", {})) != 19:
    raise SystemExit("Expanded Career Tree Lightcast snapshot validation failed")
for key, geo in check["geographies"].items():
    if len(geo.get("occupations", {})) != 798:
        raise SystemExit(f"Expanded Career Tree Lightcast {key} does not contain 798 occupations")

# -----------------------------------------------------------------------------
# Approved Career Exploration XP schedule: 125 + 100 + 200 + 125 = 550.
# -----------------------------------------------------------------------------
base_path = ROOT / "app-base.js"
base = base_path.read_text(encoding="utf-8")
base = replace_once(base, "state.xp=Math.max(state.xp,100);", "state.xp=Math.max(state.xp,125);", "O*NET XP")
base = replace_once(base, "state.xp=Math.max(state.xp,250);", "state.xp=Math.max(state.xp,225);", "alignment XP")
base = replace_once(base, "state.xp=Math.max(state.xp,450);", "state.xp=Math.max(state.xp,425);", "LMI XP")
base = replace_once(base, "state.xp=Math.max(state.xp,600);", "state.xp=Math.max(state.xp,550);", "Career Tree XP")

# The explorer now supplies the LMI; remove the legacy Arizona sector cards.
base = re.sub(
    r"\s+\$\('sectorCards'\)\.innerHTML=SECTORS\.map\(s=>.*?\)\.join\(''\);",
    "\n    $('sectorCards').innerHTML='';",
    base,
    count=1,
)

# Require participant meaning-making for at least three saved careers.
old_gate = """$('lmiContinue').onclick=()=>{\n      const filled=careers.filter(t=>evidenceCount(state.lmi.evidence[t])>=2);\n      if(filled.length<3){\n        alert('Capture at least two pieces of LMI evidence for at least three careers before building your tree.');\n        return;\n      }\n      state.lmi.complete=true;"""
new_gate = """$('lmiContinue').onclick=()=>{\n      const reflected=careers.filter(t=>String(state.lmi.evidence[t]?.takeaway||'').trim());\n      if(reflected.length<3){\n        alert('Add your “What does this mean for me?” reflection for at least three saved careers before building your tree.');\n        return;\n      }\n      state.lmi.complete=true;"""
if old_gate in base:
    base = base.replace(old_gate, new_gate, 1)
elif "const reflected=careers.filter" not in base:
    raise SystemExit("Career Tree LMI reflection gate could not be patched")

# Replace manual evidence transcription with automatic Lightcast evidence + reflection.
start = base.find("  function renderLmiTabs(active){")
end = base.find("\n  function escapeText", start)
if start < 0 or end < 0:
    raise SystemExit("Career Tree LMI workbench function could not be located")
new_tabs = r'''  function renderLmiTabs(active){
    const careers=state.alignment.selected;
    $('lmiCareerTabs').innerHTML=careers.map(t=>`<button class="tab-btn ${t===active?'active':''}" data-tab="${escapeAttr(t)}" type="button">${t}</button>`).join('');
    $$('.tab-btn').forEach(b=>b.onclick=()=>{
      sessionStorage.setItem('career-tree-lmi-active',b.dataset.tab);
      renderLmiTabs(b.dataset.tab);
    });
    const e=state.lmi.evidence[active]||blankEvidence();
    $('lmiCareerPanel').innerHTML=`<div class="lmi-panel">
      <span class="eyebrow">AUTOMATIC LIGHTCAST EVIDENCE</span>
      <h3>${active}</h3>
      <p class="source-note">${escapeText(e.geographyLabel||'Choose a geography above')} • ${escapeText(e.source||'Lightcast')}</p>
      <div class="evidence-grid">
        <label>2026 employment<input readonly value="${escapeAttr(e.employment||'Not available')}"></label>
        <label>Lower wage • P25<input readonly value="${escapeAttr(e.entry||'Not available')}"></label>
        <label>Median wage<input readonly value="${escapeAttr(e.median||'Not available')}"></label>
        <label>Experienced wage • P75<input readonly value="${escapeAttr(e.experienced||'Not available')}"></label>
        <label>Growth / outlook<input readonly value="${escapeAttr(e.outlook||'Not available')}"></label>
        <label>Annual openings<input readonly value="${escapeAttr(e.openings||'Not available')}"></label>
        <label style="grid-column:1/-1">Typical preparation<input readonly value="${escapeAttr(e.prep||'Not available')}"></label>
        <label style="grid-column:1/-1">What does this mean for <em>you</em>?<textarea data-reflection="${escapeAttr(active)}" placeholder="The wages, demand, preparation, or fit tell me...">${escapeText(e.takeaway||'')}</textarea></label>
      </div>
      <p class="source-note">Lightcast evidence is populated automatically. Your job is to interpret it—not retype it.</p>
    </div>`;
    const reflection=document.querySelector('[data-reflection]');
    if(reflection)reflection.oninput=evt=>{
      state.lmi.evidence[active]=state.lmi.evidence[active]||blankEvidence();
      state.lmi.evidence[active].takeaway=evt.target.value;
      save();
    };
  }
'''
if "AUTOMATIC LIGHTCAST EVIDENCE" not in base:
    base = base[:start] + new_tabs + base[end:]

old_eligible = "return state.alignment.selected.filter(t=>evidenceCount(state.lmi.evidence[t])>=2);"
new_eligible = "return state.alignment.selected.filter(t=>String(state.lmi.evidence[t]?.takeaway||'').trim());"
if old_eligible in base:
    base = base.replace(old_eligible, new_eligible, 1)
elif new_eligible not in base:
    raise SystemExit("Career Tree eligible-career reflection rule could not be patched")

base_path.write_text(base, encoding="utf-8")

# Cache-bust the participant-facing explorer after each full-data release.
index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")
index = re.sub(r"az-lmi-explorer\.js\?v=[^\"]+", "az-lmi-explorer.js?v=20261006-4", index)
index = re.sub(r"az-lmi-explorer\.css\?v=[^\"]+", "az-lmi-explorer.css?v=20261006-4", index)
index = index.replace(
    "Arizona labor-market sources: Arizona Office of Economic Opportunity. Occupation descriptions and interest relationships: O*NET®. Career videos: CareerOneStop.",
    "Primary labor-market source: Lightcast 2026.4 local snapshot. Occupation and interest relationships: O*NET®. Career videos: CareerOneStop.",
)
index_path.write_text(index, encoding="utf-8")

print("Career Tree Lightcast validated: 19 geographies x 798 occupations; full automatic LMI experience ready.")
