# Career Tree module progress contract

Career Tree experiences use the existing `public.module_progress` table. No new table or database migration is required.

## Module IDs

- `discover-me`
- `explore-careers`
- `work-life-plan`
- `career-quest:electrician`

All four Career Tree experiences intentionally keep `module_progress.xp = 0`. Career Tree progress is represented by each experience's native activity model rather than the core Level Up XP system.

## Shared `journey_state` envelope

```json
{
  "schema_version": 1,
  "contract": "career-tree/v1",
  "experience": "discover-me",
  "updated_at": "2026-10-13T00:00:00.000Z",
  "data": {}
}
```

`module_progress.is_complete` and `module_progress.completed_at` remain the canonical completion fields. `started_at` is supplied by the existing database default on first insert.

## Authentication and offline-first behavior

1. Career Tree requires a Level Up participant login.
2. A participant with a previously cached authenticated session may continue Career Tree while offline.
3. A participant without a cached authenticated session is redirected to the existing Opportunity City sign-in.
4. Each experience continues to write its existing localStorage state.
5. A normalized Career Tree record is mirrored into `LevelUpOfflineProgress` first.
6. When an authenticated Supabase session and network connection are available, the normalized row is upserted into `module_progress` on `(user_id,module_id)`.
7. Failed/offline writes remain pending in the existing Level Up offline queue and are retried when the browser returns online or when the main Level Up app flushes offline progress.

Career Tree does not alter the existing Level Up `CORE_SEQUENCE`, module unlock rules, or XP progression.

## Experience payloads and completion semantics

### Discover Me

`data` contains:
- `progress` (`status`, `answered`, `total_questions`)
- `riasec_scores`
- `top_3`
- `answers`
- `answered_count`
- `completion_timestamp`

Progress is `answered_count / 30`. Completion maps to the existing Discover Me completion flag and timestamp.

### Explore Careers

`data` contains:
- `progress` (`status`, `careers_saved`, `occupations_reflected`)
- `preferences` (`activity`, `preparation`, `environment`, `people`)
- `geography` (`key`, `label`, `workforce_area`)
- `saved_careers`
- `occupation_reflections` (including each saved reflection's LMI snapshot)
- optional `interest_context`

Explore Careers remains freeplay. It becomes complete when the participant saves the first occupation reflection. Participants may continue to explore, save careers, and add additional reflections after completion.

### Work + Life Plan

`data` contains:
- `progress` (`status`)
- `area`
- `county`
- `housing`
- `transportation`
- `monthly_plan`
- `selected_occupation`
- `selected_wage_level`
- `target_hourly_wage`
- `reflections`
- `saved_at`

Completion maps to the existing final **Save my plan** path. Later edits preserve the existing completion state.

### Career Quest: Electrician

`data` contains:
- `progress`
  - `status`
  - `current_day`
  - `completed_days`
  - `total_days` = 10
  - `earnings_earned`
  - `earnings_possible`
- `occupation`
- existing Career Quest hub state
- existing quest-specific local state
- visible Day/Earnings snapshot from the same-origin quest screen when available
- completion timestamp

Career Quest uses its native 10-day work simulation rather than XP. Coach-facing progress should display **Day X of 10** and **earnings earned out of possible earnings**. Completion occurs when the Electrician quest itself reports completion. Progress is synced incrementally so participants can return on the same device offline and cloud-sync when a connection becomes available.

## Coach-facing interpretation

The four Career Tree records should later be presented as informational coaching signals, not prerequisite or compliance flags:

- Discover Me — assessment progress / complete
- Explore Careers — careers saved, occupations reflected / complete after first reflection
- Work + Life Plan — in progress / complete
- Career Quest: Electrician — Day X of 10, earnings earned out of possible / complete

Coach access should be provided through the existing staff/participant assignment model and a controlled server-side read path. Do not broaden participant-owned `module_progress` RLS to allow unrestricted coach SELECT access.
