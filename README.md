# Level Up Portal

The shared learner home for the Level Up journey. It uses the same Supabase authentication and `module_progress` records as Discovery.

## Deployment

1. Add GitHub Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Set **Settings → Pages → Source** to **GitHub Actions**.
3. Add `https://pinalworkforce1-del.github.io/Level_Up_Portal/**` to Supabase Authentication redirect URLs.
4. Push to `main`; the included workflow builds and deploys the portal.
