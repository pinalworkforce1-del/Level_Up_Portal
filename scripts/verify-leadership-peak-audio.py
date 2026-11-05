#!/usr/bin/env python3
"""Verify all 26 Aria recordings are present before publishing audio controls."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1] / "public/leadership-peak/assets/audio"
expected = ["lp_intro.mp3", "lp_complete.mp3"] + [
    f"lp_z{n}_{part}.mp3"
    for n in range(1, 7)
    for part in ("prompt", "a", "b", "c")
]
missing = []
bad = []
for name in expected:
    path = root / name
    if not path.is_file():
        missing.append(name)
        continue
    data = path.read_bytes()
    if len(data) < 100_000 or not (data.startswith(b"ID3") or (len(data) > 2 and data[0] == 0xff and (data[1] & 0xe0) == 0xe0)):
        bad.append(name)
extras = sorted(p.name for p in root.glob("lp_*.mp3") if p.name not in expected)
print(f"Leadership Peak Aria clips: {len(expected)-len(missing)-len(bad)} / 26 verified")
if missing:
    print("Missing MP3s:", ", ".join(missing))
if bad:
    print("Invalid MP3s:", ", ".join(bad))
if extras:
    print("Unexpected names:", ", ".join(extras))
if missing or bad or extras:
    sys.exit(1)
print("All 26 recordings are present and have valid MP3 signatures.")
