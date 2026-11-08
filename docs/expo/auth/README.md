# Level Up authentication and one-off Career Expo events

## Default shared Magic Link email subject
```
Level Up | Your Secure Sign-In Link
```

**Do not include Career Expo in the default Magic Link subject.** Expo events are occasional; changing the shared subject would put Expo messaging in every ordinary Level Up authentication email.

The shared Supabase email should remain generally branded Level Up. The included HTML template may display an Expo-specific heading *only when* the sign-in request originates from an Expo URL, using the `.RedirectTo` condition; ordinary Level Up users see the regular Opportunity City messaging.

## One-off Expo invitation and reminder messages
Use a separate, event-triggered invitation (for example through the event's communications workflow) with an event-specific subject such as `Level Up Career Expo | [Event name] — Your Invitation`. Send these only to people associated with that particular Expo. The event invitation should link to the relevant Expo registration, Employer Dashboard, or Booth Studio page and **must not reuse or construct authentication tokens**.

The current code commit prepares Expo-specific login wording and one-time-code entry but does not implement event invitation delivery.

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

The HTML uses `{{ .ConfirmationURL }}`, `{{ .Token }}` and Go-template `.RedirectTo` for context-specific page messaging, while ordinary authentication retains neutral Level Up branding.

## Required dashboard change
The connected Supabase tools do not provide hosted Auth template or redirect allowlist editing. A project administrator must apply the email and URL configuration in Supabase's dashboard. A GitHub commit alone cannot change outgoing email or subjects.
