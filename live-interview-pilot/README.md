# Interview Intelligence · Isolated live avatar pilot

This is a **development-only** Python LiveKit voice agent using the official Synthesia avatar plugin. Production Rosie remains unchanged.

## Scope
- One fixed Interactive Avatar ID. Swap by changing `SYNTHESIA_INTERACTIVE_AVATAR_ID`.
- Three short simulated employment interview questions.
- Real-time speech + avatar rendering. The worker, NOT Supabase Edge Functions, must stay online while interviews run.
- No résumé, recordings, or participant identity transmitted to Synthesia beyond the session requirements.

## Start safely
1. Create a **LiveKit Cloud agent deployment** (or run this worker on a local development machine). Use Python 3.10–3.14.
2. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, SYNTHESIA_API_KEY in the **worker's** environment. The keys currently set in Supabase are **not automatically available to LiveKit Cloud workers**. Never put them in frontend source code.
3. Install dependencies: `pip install -r requirements.txt`.
4. Start with `python agent.py dev` and connect through a genuine LiveKit room. Console mode will not render video.
5. The join token needs **explicit RoomAgentDispatch for `levelup-interview-pilot`**; the existing Supabase token endpoint does **not** yet include that dispatch, so a browser session will not automatically launch this agent.
6. Connect a development LiveKit browser client and allow microphone access.
7. Expect Synthesia and voice/AI usage charges while the avatar is running. Stop the room when finished.

## Not yet implemented
- Cloud worker deployment / confirmed provider model entitlements
- Authenticated browser pilot and agent dispatch in the token endpoint
- Session feedback persistence and participant completion credit
- Verified live call and avatar ID acceptance

Use Synthesia's [minimal LiveKit quickstart](https://docs.synthesia.io/reference/interactive-avatar-minimal-quickstart) if voice model settings need adjustment.
