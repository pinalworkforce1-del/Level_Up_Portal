#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
OUT="$ROOT/preview-dist"
WORK="$ROOT/.offline-preview-work"
SUPABASE_URL_DEFAULT="https://dnijrzotfyvmmnmueknk.supabase.co"
SUPABASE_KEY_DEFAULT="sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc"

export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL_DEFAULT}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_KEY_DEFAULT}"

rm -rf "$OUT" "$WORK"
mkdir -p "$OUT" "$WORK"

echo "==> Building Level Up Portal"
mkdir -p public/opportunity-city public/first-day-challenge/assets/media

for zip in public/opportunity-city/opportunity-city-source-a.zip public/opportunity-city/opportunity-city-source-b.zip; do
  [ ! -f "$zip" ] || unzip -o "$zip" -d public/opportunity-city >/dev/null
done
rm -f public/opportunity-city/opportunity-city-source-a.zip public/opportunity-city/opportunity-city-source-b.zip

for zip in public/money-moves/money-moves-source-a.zip public/money-moves/money-moves-source-b.zip; do
  [ ! -f "$zip" ] || unzip -o "$zip" -d public/money-moves >/dev/null
done
rm -f public/money-moves/money-moves-source-a.zip public/money-moves/money-moves-source-b.zip

python3 - <<'PY'
from pathlib import Path
p = Path('public/money-moves/index.html')
if p.exists():
    s = p.read_text()
    if '../offline-progress.js' not in s:
        s = s.replace('</body>', '<script defer src="../offline-client.js"></script><script defer src="../offline-progress.js"></script></body>')
    p.write_text(s)
PY

for zip in public/first-day-challenge/fdc-narration-media-a.zip public/first-day-challenge/fdc-narration-media-b.zip; do
  [ ! -f "$zip" ] || unzip -o "$zip" -d public/first-day-challenge/assets/media >/dev/null
done
rm -f public/first-day-challenge/fdc-narration-media-a.zip public/first-day-challenge/fdc-narration-media-b.zip

npm run build
node scripts/generate-offline-manifest.mjs dist /Level_Up_Portal/
mkdir -p "$OUT/Level_Up_Portal"
cp -a dist/. "$OUT/Level_Up_Portal/"

clone_branch () {
  local repo="$1"
  local dest="$2"
  git clone --depth 1 --branch offline-engine-v1 "https://github.com/pinalworkforce1-del/${repo}.git" "$dest"
}

echo "==> Building Discovery"
DISC="$WORK/LU_Discovery"
clone_branch "LU_Discovery" "$DISC"
pushd "$DISC" >/dev/null
npm ci
mkdir -p public/assets
curl -fsSL https://www.onetcenter.org/dl_files/database/db_31_0_json/occupation_data.json -o /tmp/lu_occ.json
curl -fsSL https://www.onetcenter.org/dl_files/database/db_31_0_json/transferable_skills.json -o /tmp/lu_skills.json
python3 - <<'PY'
import json
from collections import defaultdict
with open('/tmp/lu_occ.json', encoding='utf-8') as f:
    occupations = json.load(f)['row']
with open('/tmp/lu_skills.json', encoding='utf-8') as f:
    ratings = json.load(f)['row']
by_code = defaultdict(dict)
for row in ratings:
    if row.get('scale_name') != 'Importance' or row.get('not_relevant') == 'Y':
        continue
    name = row.get('element_name')
    if not name:
        continue
    score = float(row.get('data_value') or 0)
    by_code[row['onetsoc_code']][name] = max(score, by_code[row['onetsoc_code']].get(name, 0))
compact = []
for occ in occupations:
    ranked = sorted(by_code.get(occ['onetsoc_code'], {}).items(), key=lambda x: (-x[1], x[0]))
    compact.append({
        'code': occ['onetsoc_code'],
        'title': occ['title'],
        'description': occ['description'],
        'skills': [name for name, _ in ranked[:8]],
    })
with open('public/assets/onet-core.json', 'w', encoding='utf-8') as f:
    json.dump({'version':'31.0','occupations':compact}, f, ensure_ascii=False, separators=(',',':'))
PY
npm run build
node scripts/generate-offline-manifest.mjs dist /LU_Discovery/
mkdir -p "$OUT/LU_Discovery"
cp -a dist/. "$OUT/LU_Discovery/"
popd >/dev/null

echo "==> Building Resume District"
RES="$WORK/Resume_District"
clone_branch "Resume_District" "$RES"
pushd "$RES" >/dev/null
npm ci
npm run build
node scripts/generate-offline-manifest.mjs dist /Resume_District/
mkdir -p "$OUT/Resume_District"
cp -a dist/. "$OUT/Resume_District/"
popd >/dev/null

echo "==> Packaging Confidence Checkpoint"
CONF="$WORK/Confidence_Checkpoint"
clone_branch "Confidence_Checkpoint" "$CONF"
pushd "$CONF" >/dev/null
python3 - <<'PY'
import json
from pathlib import Path
root = Path('.')
paths = []
runtime = [
    'index.html','app.js','styles.css','github.css','ux-standard.css',
    'completion-shell.css','config.js','supabase-sync.js',
    'ux-standard.js','completion-shell.js','offline-sw.js',
    'offline-client.js','offline-progress.js'
]
for name in runtime:
    p = root / name
    if p.is_file():
        paths.append(p)
assets = root / 'assets'
if assets.exists():
    paths.extend(p for p in assets.rglob('*') if p.is_file())
seen = set()
rows = []
total = 0
for p in sorted(paths):
    rel = './' + p.relative_to(root).as_posix()
    if rel in seen:
        continue
    seen.add(rel)
    size = p.stat().st_size
    rows.append({'path': rel, 'bytes': size})
    total += size
manifest = {
    'engine':'Level Up Offline Engine',
    'version':'1.0.0',
    'scope':'/Confidence_Checkpoint/',
    'totalBytes':total,
    'files':rows,
}
Path('offline-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
PY
mkdir -p "$OUT/Confidence_Checkpoint/assets"
for f in index.html app.js styles.css github.css ux-standard.css completion-shell.css config.js supabase-sync.js ux-standard.js completion-shell.js offline-sw.js offline-client.js offline-progress.js offline-manifest.json; do
  [ ! -f "$f" ] || cp "$f" "$OUT/Confidence_Checkpoint/"
done
[ ! -d assets ] || cp -a assets/. "$OUT/Confidence_Checkpoint/assets/"
popd >/dev/null

echo "==> Packaging Interview Arena"
INT="$WORK/Interview_Arena"
clone_branch "Interview_Arena" "$INT"
pushd "$INT" >/dev/null
cat interview-arena-source.tar.gz.part-* > interview-arena-source.tar.gz
mkdir -p restored
tar -xzf interview-arena-source.tar.gz -C restored
cp level-up-standard.css restored/dist/level-up-standard.css
cp level-up-standard.js restored/dist/level-up-standard.js
cp offline-sw.js restored/dist/offline-sw.js
cp offline-client.js restored/dist/offline-client.js
cp offline-progress.js restored/dist/offline-progress.js
python3 - <<'PY'
import json
from pathlib import Path
p = Path('restored/dist/index.html')
s = p.read_text()
if 'level-up-standard.css' not in s:
    s = s.replace('</head>', '<link rel="stylesheet" href="./level-up-standard.css"></head>')
if 'level-up-standard.js' not in s:
    s = s.replace('</body>', '<script src="./level-up-standard.js"></script></body>')
if 'offline-client.js' not in s:
    s = s.replace('</body>', '<script defer src="./offline-client.js"></script><script defer src="./offline-progress.js"></script></body>')
p.write_text(s)
root = Path('restored/dist')
rows = []
total = 0
for f in sorted(root.rglob('*')):
    if not f.is_file() or f.name == 'offline-manifest.json':
        continue
    rel = './' + f.relative_to(root).as_posix()
    size = f.stat().st_size
    rows.append({'path': rel, 'bytes': size})
    total += size
manifest = {
    'engine':'Level Up Offline Engine',
    'version':'1.0.0',
    'scope':'/Interview_Arena/',
    'totalBytes':total,
    'files':rows,
}
(root/'offline-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
PY
mkdir -p "$OUT/Interview_Arena"
cp -a restored/dist/. "$OUT/Interview_Arena/"
popd >/dev/null

echo "==> Rewriting production cross-links for isolated preview"
python3 - <<'PY'
from pathlib import Path
root = Path('preview-dist')
replacements = {
    'https://pinalworkforce1-del.github.io/Level_Up_Portal/': '/Level_Up_Portal/',
    'https://pinalworkforce1-del.github.io/LU_Discovery/': '/LU_Discovery/',
    'https://pinalworkforce1-del.github.io/Resume_District/': '/Resume_District/',
    'https://pinalworkforce1-del.github.io/Confidence_Checkpoint/': '/Confidence_Checkpoint/',
    'https://pinalworkforce1-del.github.io/Interview_Arena/': '/Interview_Arena/',
}
for p in root.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in {'.html','.js','.css','.json'}:
        continue
    try:
        s = p.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    original = s
    for old, new in replacements.items():
        s = s.replace(old, new)
    if s != original:
        p.write_text(s, encoding='utf-8')

(root/'index.html').write_text(
    '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/Level_Up_Portal/">'
    '<title>Level Up Offline Test</title><a href="/Level_Up_Portal/">Open Level Up Offline Test</a>\n',
    encoding='utf-8'
)
PY

echo "==> Offline preview package ready"
du -sh "$OUT" || true
