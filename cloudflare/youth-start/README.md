# Youth Career Tree entry — start.levelupcareers.org

This is a **second entrance** to the existing Level Up platform. The existing
\`levelupcareers.org\` landing page, redirect and login remain unchanged.

## How it works

- The Cloudflare Worker in \`worker.mjs\` serves the **same** Level Up GitHub Pages build under \`https://start.levelupcareers.org\`.
- A server-injected \`level-up-youth-entry\` HTML meta flag is present **only** on the subdomain. The React app uses it to show youth-specific sign-in wording and, following sign-in, launch the illustrated \`/Level_Up_Portal/career-tree-next/\` map. Discover Me (O*NET) remains a participant-selected destination.
- Existing Level Up sign-in methods, county selection, first-name capture, profile and progress synchronization are **reused**. No new Supabase project or user table is created.
- The youth domain and original Level Up domain have independent browser sessions, but both use the **same Supabase project and user accounts**. A participant may need to sign in when switching between domains.
- Career Tree and Discover Me stay on \`start.levelupcareers.org\` through the proxy. The Career Tree header has a route to Opportunity City.
- The worker accepts only GET/HEAD and **does not forward cookies, Authorization or arbitrary inbound headers to GitHub**.

## Deploy (requires Cloudflare account access)

1. In the Cloudflare account that controls \`levelupcareers.org\`, create a new Worker (e.g. \`levelup-youth-start\`).
2. Paste/deploy the content of \`cloudflare/youth-start/worker.mjs\` or upload it using Cloudflare's Workers build/deploy flow.
3. In **Workers & Pages → your Worker → Settings → Domains & Routes**, add a **Custom Domain**: \`start.levelupcareers.org\`. Let Cloudflare manage the DNS and certificate. **Do not edit the existing apex redirect**.
4. In **Supabase → Level Up project (\`dnijrzotfyvmmnmueknk\`) → Authentication → URL Configuration → Redirect URLs**, ADD the exact URL:
   \`https://start.levelupcareers.org/Level_Up_Portal/\`
   Retain all existing redirect URLs and the current Site URL. Email magic links require the new URL in this list.
5. Check the end-to-end behaviors below **before** publishing the new link to youth teams. If necessary, detach the worker's Custom Domain to roll back only the new entrance.

This repository has no Cloudflare zone credentials. Committing the Worker **does not activate** the new domain.

## Acceptance checks

- [ ] \`https://levelupcareers.org\` still shows its original landing/sign-in behavior.
- [ ] \`https://start.levelupcareers.org\` shows "Your Career Tree Starts Here" and requires Level Up sign-in, including county selection.
- [ ] Email magic-link sign-in returns to the **start** subdomain, not the GitHub URL. Pinal SMS login is tested if applicable.
- [ ] First-time name capture still runs if needed, and then the illustrated Career Tree map opens.
- [ ] Sign-in with an existing Level Up account does not create a duplicate account.
- [ ] O*NET questionnaire, score results, resume/re-entry, "Explore Careers" and Supabase progress writes work.
- [ ] Career Tree remains on the start hostname; Opportunity City link works and does not loop to O*NET.
- [ ] \`https://start.levelupcareers.org/career-tree-next/\` and nested pages, stylesheet, scripts, images, offline resources and HTTPS all load.
- [ ] Existing participant sessions and workflows on the original Level Up URLs remain unaffected.

## Implementation notes / caveats

The Worker supplies a proxy hostname, not an iframe or an ordinary HTTP
redirect. Absolute asset paths in the existing Vite build use the
\`/Level_Up_Portal/\` prefix, and the Worker accepts both prefix-bearing and
prefix-free requests. Youth navigation may expose that path prefix on some
links; **the hostname remains the branded start domain**.

The youth auto-launch happens just once per tab/session. Visiting Opportunity
City after entering Career Tree therefore remains possible. A fresh tab on
the youth home route launches the illustrated Career Tree map for an already-authenticated user.
Discover Me / O*NET is never auto-launched; participants select it from the map.

Do not point the main apex host at this Worker. Cloudflare DNS/Workers routing
and Supabase Auth Redirect URLs are the only infrastructure changes required.
