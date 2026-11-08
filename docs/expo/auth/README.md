# Level Up: Career Expo + Opportunity City secure sign-in

## Recommended shared Magic Link email subject
```
Level Up | Career Expo & Opportunity City — Secure Sign-In
```

The subject is shared with existing Level Up participants. Do not change it to a Career Expo-only subject without separating the two login providers.

## Ready-to-paste HTML email
Use `docs/expo/auth/career-expo-magic-link.html` as the **Magic Link / OTP** email message HTML. GitHub stores the template but **does not activate it** in hosted Supabase automatically.

Supabase dashboard: https://supabase.com/dashboard/project/dnijrzotfyvmmnmueknk/auth/templates

1. Back up the old template.
2. Select the **Magic Link** authentication template; update the subject above.
3. Paste the HTML file contents into the body; save it.
4. Auth URL Configuration: https://supabase.com/dashboard/project/dnijrzotfyvmmnmueknk/auth/url-configuration
5. Add these exact allowed redirects, keeping the old Level Up and GitHub Pages ones:
   - `https://level-up-portal-eight.vercel.app/expo/employer.html`
   - `https://level-up-portal-eight.vercel.app/expo/studio.html`
   - `https://level-up-portal-eight.vercel.app/expo/review.html`
6. Request new sign-ins from all three Expo pages and existing Level Up. Test both the magic link and the code. Old sign-in emails may point to Discovery.
7. Verify employer/staff membership rules and the branding draft → submit → approve → publish workflow are unchanged.

The HTML uses `{{ .ConfirmationURL }}`, `{{ .Token }}` and Go-template `.RedirectTo` for role-appropriate messaging while retaining shared Supabase authentication.

## Required dashboard change
The connected Supabase tools do not provide hosted Auth template or redirect allowlist editing. A project administrator must apply the email and URL configuration in Supabase's dashboard. A GitHub commit alone cannot change outgoing email or subjects.
