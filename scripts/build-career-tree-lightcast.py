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


print("Career Tree Lightcast data built and verified: 19 geographies × 798 occupations.")
