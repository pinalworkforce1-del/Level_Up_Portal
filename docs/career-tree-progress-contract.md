# Career Tree module progress contract

Career Tree experiences use the existing `public.module_progress` table. No new table or database migration is required.

## Module IDs

- `discover-me`
- `explore-careers`
- `work-life-plan`
- `career-quest:electrician` (reserved for the next wiring phase)

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

## Offline-first behavior

1. The experience continues to write its existing localStorage state.
2. A normalized Career Tree record is mirrored into `LevelUpOfflineProgress` first.
3. When an authenticated Supabase session and network connection are available, the normalized row is upserted into `module_progress` on `(user_id,module_id)`.
4. Failed/offline writes remain pending in the existing Level Up offline queue and are retried when the browser returns online or when the main Level Up app flushes offline progress.

## Experience payloads

### Discover Me

`data` contains:
- `riasec_scores`
- `top_3`
- `answers`
- `answered_count`
- `completion_timestamp`

Completion maps to the existing Discover Me completion flag and timestamp.

### Explore Careers

`data` contains:
- `preferences` (`activity`, `preparation`, `environment`, `people`)
- `geography` (`key`, `label`, `workforce_area`)
- `saved_careers`
- `occupation_reflections` (including each saved reflection's LMI snapshot)
- optional `interest_context`

Explore Careers is intentionally freeplay/incremental, so this phase does not invent a completion rule. The row remains `is_complete=false` while preserving all participant exploration output.

### Work + Life Plan

`data` contains:
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

Reserved for the next phase. The same contract will hold incremental day/scene progress, evidence, decisions, earnings/payday, reflections, Life Happens events, and final completion status without changing the shared envelope.
