# Leadership Peak — Aria narration

Place the 26 approved `lp_*.mp3` recordings in this folder. Upload the **individual MP3 files**, not the ZIP archive.

## Required names

- `lp_intro.mp3`
- For zones 1–6: `lp_zN_prompt.mp3`, `lp_zN_a.mp3`, `lp_zN_b.mp3`, and `lp_zN_c.mp3`
- `lp_complete.mp3`

All narration is optional. The HTML retains the scenario, the choices, Aria's feedback, and an accessible text transcript for every zone. Playback uses one audio element and stops when leaving a zone or closing feedback.

After uploading, the `Verify Leadership Peak Audio` GitHub Actions workflow checks all 26 file names and MP3 headers before the PR is merged.
