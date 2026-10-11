from pathlib import Path
import base64
import gzip
import json

ROOT = Path("public/career-skill-tree")
DATA = ROOT / "data"
PARTS = DATA / "lightcast"


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
# Shared geography context: Career Alignment -> LMI -> Work + Life Simulator.
# Keep these as deployment-time patches so the large participant pages remain
# readable source files while every published build gets the current behavior.
# -----------------------------------------------------------------------------
index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")
index = index.replace(
    '../offline-progress.js?v=20261007-2',
    '../offline-progress.js?v=20261011-geo2',
)
index_path.write_text(index, encoding="utf-8")

life_paths = [
    ROOT / "life-plan-completion.html",
    ROOT / "life-plan.html",
    ROOT / "life-plan-narration.html",
]

old_entry = """  function entryCounty(){let entry=localStorage.getItem('level-up-pending-county')||'';try{entry ||= JSON.parse(localStorage.getItem('level-up-career-skill-tree-v1')||'{}')?.profile?.county||''}catch{};const n=entry.toLowerCase().replace(/[^a-z]/g,'');return Object.keys(labels).find(k=>n.includes(k.replace(/[^a-z]/g,''))||n.includes(labels[k].toLowerCase().replace(/[^a-z]/g,'')))||''}"""
new_entry = """  function sharedCareerGeo(){try{const s=JSON.parse(localStorage.getItem('level-up-career-skill-tree-v1')||'{}');return s?.alignment?.geography||s?.lmi?.explorer?.geography||''}catch{return ''}}\n  function entryCounty(){const shared=sharedCareerGeo();if(Object.hasOwn(labels,shared))return shared;let entry=localStorage.getItem('level-up-pending-county')||'';try{entry ||= JSON.parse(localStorage.getItem('level-up-career-skill-tree-v1')||'{}')?.profile?.county||''}catch{};const n=entry.toLowerCase().replace(/[^a-z]/g,'');return Object.keys(labels).find(k=>n.includes(k.replace(/[^a-z]/g,''))||n.includes(labels[k].toLowerCase().replace(/[^a-z]/g,'')))||''}"""

old_area = """  function areaFromEntry(){let entry=localStorage.getItem('level-up-pending-county')||'';try{entry ||= JSON.parse(localStorage.getItem('level-up-career-skill-tree-v1')||'{}')?.profile?.county||''}catch{};if(Object.hasOwn(AREA_GEOS,entry))return entry;if(/northern|apache|coconino|navajo|gila/i.test(entry))return 'Northern';if(/eastern|ufo|new mexico|chaves|curry|de.?baca|eddy|guadalupe|harding|lea|lincoln|otero|quay|roosevelt|union/i.test(entry))return 'UFO - Eastern New Mexico';return 'Pinal'}"""
new_area = """  function areaFromEntry(){const shared=sharedCareerGeo();if(shared==='pinal'||shared==='az')return 'Pinal';if(['coconino','apache','navajo','gila'].includes(shared))return 'Northern';if(shared==='nm'||['chaves','curry','de-baca','eddy','guadalupe','harding','lea','lincoln','otero','quay','roosevelt','union'].includes(shared))return 'UFO - Eastern New Mexico';let entry=localStorage.getItem('level-up-pending-county')||'';try{entry ||= JSON.parse(localStorage.getItem('level-up-career-skill-tree-v1')||'{}')?.profile?.county||''}catch{};if(Object.hasOwn(AREA_GEOS,entry))return entry;if(/northern|apache|coconino|navajo|gila/i.test(entry))return 'Northern';if(/eastern|ufo|new mexico|chaves|curry|de.?baca|eddy|guadalupe|harding|lea|lincoln|otero|quay|roosevelt|union/i.test(entry))return 'UFO - Eastern New Mexico';return 'Pinal'}"""

old_county_row = """    <div class=\"county-row\"><div class=\"field\"><label for=\"areaSelect\">Career Tree area</label><select id=\"areaSelect\"></select></div><div class=\"field\"><label for=\"countySelect\">County for local wages and housing</label><select id=\"countySelect\"></select></div></div>"""
new_county_row = """    <div class=\"county-row\"><div class=\"field\"><label for=\"areaSelect\">Career Tree area</label><select id=\"areaSelect\"></select></div><div class=\"field\"><label for=\"countySelect\">County for local wages and housing</label><select id=\"countySelect\"></select></div></div><div id=\"sharedGeoNote\" class=\"hint hidden\"></div>"""

old_init = """  function initAreas(){const area=$('#areaSelect');area.innerHTML=Object.keys(AREA_GEOS).map(k=>`<option value=\"${esc(k)}\">${esc(AREA_LABELS[k])}</option>`).join('');state.area=areaFromEntry();area.value=state.area;fillCounties();area.addEventListener('change',()=>{state.area=area.value;fillCounties();state.selectedJob=null;state.query='';render();updateSummary()});$('#countySelect').addEventListener('change',e=>{state.county=e.target.value;state.rent=null;state.selectedJob=null;render();updateSummary()})}"""
new_init = """  function initAreas(){const area=$('#areaSelect');area.innerHTML=Object.keys(AREA_GEOS).map(k=>`<option value=\"${esc(k)}\">${esc(AREA_LABELS[k])}</option>`).join('');state.area=areaFromEntry();area.value=state.area;fillCounties();const shared=sharedCareerGeo(),note=$('#sharedGeoNote');if(note){if(Object.hasOwn(labels,shared)){note.classList.remove('hidden');note.innerHTML=`<strong>Carried forward from Career Alignment:</strong> ${esc(labels[shared])}. Local wages and housing use this same county.`}else if(shared==='az'||shared==='nm'){note.classList.remove('hidden');note.innerHTML=`<strong>Career Alignment used ${shared==='az'?'Arizona':'New Mexico'} statewide.</strong> Choose a county here because housing and cost-of-living estimates require a local market.`}else note.classList.add('hidden')}area.addEventListener('change',()=>{state.area=area.value;fillCounties();state.selectedJob=null;state.query='';render();updateSummary()});$('#countySelect').addEventListener('change',e=>{state.county=e.target.value;state.rent=null;state.selectedJob=null;render();updateSummary()})}"""

for path in life_paths:
    text = path.read_text(encoding="utf-8")
    if old_entry in text:
        text = text.replace(old_entry, new_entry, 1)
    elif 'function sharedCareerGeo()' not in text:
        raise SystemExit(f"Career Tree shared geography entry patch could not be applied: {path}")
    if old_area in text:
        text = text.replace(old_area, new_area, 1)
    elif "const shared=sharedCareerGeo()" not in text:
        raise SystemExit(f"Career Tree shared geography area patch could not be applied: {path}")
    if old_county_row in text:
        text = text.replace(old_county_row, new_county_row, 1)
    elif 'id="sharedGeoNote"' not in text:
        raise SystemExit(f"Career Tree shared geography note could not be inserted: {path}")
    if old_init in text:
        text = text.replace(old_init, new_init, 1)
    elif 'Carried forward from Career Alignment' not in text:
        raise SystemExit(f"Career Tree simulator geography init patch could not be applied: {path}")
    path.write_text(text, encoding="utf-8")

print("Career Tree Lightcast data built and verified: 19 geographies × 798 occupations. Shared geography context patched.")