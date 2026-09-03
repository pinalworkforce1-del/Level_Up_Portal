# Level Up Portal — GitHub Setup

## Supabase

In **Authentication → URL Configuration**, add this Redirect URL:

`https://pinalworkforce1-del.github.io/Level_Up_Portal/**`

The existing Level Up database tables and SQL do not need to change.

## GitHub secrets

Repository secrets do not carry between repositories. In **Level_Up_Portal → Settings → Secrets and variables → Actions**, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the same values as the Discovery repository.

## Upload

Upload these visible items to the root of the empty repository:

- `public`
- `src`
- `index.html`
- `package.json`
- `package-lock.json`
- `README.md`
- `tsconfig.app.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`

The browser may skip hidden files and folders. Create `.github/workflows/deploy-pages.yml` directly in GitHub and paste the workflow included in this package.

## GitHub Pages

Set **Settings → Pages → Source** to **GitHub Actions**. Run **Deploy Level Up Portal** manually if the first upload occurred before the workflow was created.

Live address: `https://pinalworkforce1-del.github.io/Level_Up_Portal/`
