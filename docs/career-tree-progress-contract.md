# Career Tree module progress contract

Career Tree experiences use the existing `public.module_progress` table. No new table or database migration is required.

## Module IDs

- `discover-me`
- `explore-careers`
- `work-life-plan`
- `career-quest:electrician`

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

Career Tree does not use XP as its participant progress model. Career Tree records save `xp = 0`; each experience exposes native progress inside `journey_state.data.progress` instead.

## Offline-first behavior

1. Career Tree requires an authenticated Level Up participant session. A cached authenticated session may continue offline on the same device.
2. The experience continues to write its existing localStorage state.
3. A normalized Career Tree record is mirrored into `LevelUpOfflineProgress` first.
4. When an authenticated Supabase session and network connection are available, the normalized row is upserted into `module_progress` on `(user_id,module_id)`.
5. Failed/offline writes remain pending in the existing Level Up offline queue and are retried when the browser returns online or when the main Level Up app flushes offline progress.

## Completion and native progress rules

### Discover Me

Native progress:
- answered questions out of 30
- status: `not_started`, `in_progress`, or `complete`

`data` contains:
- `progress`
- `riasec_scores`
- `top_3`
- `answers`
- `answered_count`
- `completion_timestamp`

Completion occurs when the existing Discover Me assessment completion flag is set after all 30 questions are completed.

### Explore Careers

Native progress:
- saved career count
- reflected occupation count
- status: `not_started`, `in_progress`, or `complete`

`data` contains:
- `progress`
- `preferences` (`activity`, `preparation`, `environment`, `people`)
- `geography` (`key`, `label`, `workforce_area`)
- `saved_careers`
- `occupation_reflections` (including each saved reflection's LMI snapshot)
- optional `interest_context`

Completion occurs when the participant has saved at least one occupation reflection. The participant may continue to return, change preferences/geography, save additional occupations, and create additional reflections after completion.

### Work + Life Plan

Native progress:
- status: `in_progress` or `complete`
- activity-complete flag

`data` contains:
- `progress`
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

Completion maps to the existing final **Save my plan** path. Later edits preserve the existing completion state. No XP is awarded.

### Career Quest: Electrician

Career Quest uses its own work-and-earnings progression rather than XP.

The participant-facing and coach-facing native progress should include:
- current day out of 10
- completed days/scenes
- earnings earned out of possible earnings
- work evidence and decisions
- reflections
- Life Happens events
- final completion status/timestamp

The module ID is `career-quest:electrician`. It should save incrementally after meaningful quest actions, restore the participant to the correct point when returning, remain usable offline for an already authenticated participant, and set `module_progress.is_complete=true` only when the 10-day quest is completed.

## Relationship to core Level Up progression

Career Tree is freeplay. These four records do not change or depend on the core Level Up sequence, district unlocking, checkpoint logic, or Work Ready Series completion. Coaches may view Career Tree activity alongside core Level Up progress, but Career Tree completion is informational and exploratory rather than a prerequisite for progression.
