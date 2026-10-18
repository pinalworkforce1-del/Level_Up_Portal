BOOST READY 2 WORK — FIRST RUN ASSEMBLY

This build extends the earlier prototype format into the current first-run scene bank.

Included:
- Soft Skills Base Camp: Scenes 1–12
- Resume Retreat: Scenes 21–25
- Interview Landing: Scenes 31–35
- 22 total scenarios
- Persistent six-competency Work Ready Skills HUD
- Centered skill-impact overlay after each decision
- Hidden weighted scoring from the v6 production roadmap
- Prompt audio + selected-impact audio flow
- CC transcript toggle
- Browser-local progress persistence

Media status:
- Scenes 5–12, 21–25, and 31–35 use the supplied production MP3/VTT assets.
- Scenes 3–4 use the supplied prototype prompt audio and impact audio.
- Scenes 1–2 retain browser text-to-speech for the combined prompt, matching the earlier prototype voice-mix placeholder. Their available impact recordings are included; Scene 1 choice C uses browser text-to-speech because no matching MP3 was present in the prototype package.
- Scene 23 Impact D uses the corrected replacement audio/caption.
- Caption copies in this package normalize minor '&' spacing issues for display.

Not yet implemented in this assembly:
- Adaptive stage gating/remediation
- Resume Builder
- Mock Interview Simulator
- Rosie overlay/coaching card
- Supabase/cloud save
- Certificate / Work Ready Summit

To test locally:
1. Unzip the folder.
2. Serve the folder with any simple local web server (recommended because browsers can restrict local media/VTT behavior).
3. Example: python -m http.server 8000
4. Open http://localhost:8000

Entry point: index.html
