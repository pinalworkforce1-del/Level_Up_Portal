# Career Tree — Annual Lightcast LMI Import

Career Tree uses Lightcast as the primary participant-facing labor-market source and O*NET as the occupation / interest taxonomy.

## Geography plan

Arizona annual exports:
- Pinal County
- Coconino County
- Apache County
- Navajo County
- Gila County
- Arizona statewide (recommended comparison export)

New Mexico annual exports will be added in a second phase for the 12 Eastern New Mexico counties plus New Mexico statewide if desired.

## Normalized occupation record

Each imported geography should normalize occupation rows to this shape inside `lightcast-lmi.json`:

```json
"47-2111": {
  "employment": 1234,
  "entryHourly": 21.15,
  "medianHourly": 29.42,
  "experiencedHourly": 36.80,
  "medianAnnual": 61194,
  "growthPct": 8.4,
  "annualOpenings": 96,
  "typicalEducation": "High school diploma or equivalent",
  "projectionPeriod": "2026-2036",
  "sourceLabel": "Lightcast 2026 • Pinal County"
}
```

Career Tree accepts either a 6-digit SOC key (`47-2111`) or a full O*NET-SOC key (`47-2111.00`). The UI must never substitute a statewide or regional figure and label it as county-specific.

## Participant experience

1. O*NET Mini Interest Profiler produces RIASEC clues.
2. Career Explorer defaults to occupations aligned with those clues.
3. Participant may switch to All Occupations or search any occupation.
4. Participant chooses an allowed geography based on Level Up entry area.
5. Participant explores employment, wages, growth, openings, preparation, O*NET details, and CareerOneStop videos.
6. Participant saves up to five occupations for deeper Career Tree exploration.
7. Saved market evidence can populate the Career Tree LMI workbench.

## Source roles

- **O*NET**: occupation titles, descriptions, RIASEC / career-interest alignment.
- **Lightcast**: employment, wages, growth, openings, education / preparation and local geography comparisons.
- **CareerOneStop**: career videos.

## Refresh cadence

Replace the Lightcast snapshot annually. Keep the snapshot year and source label on every normalized occupation record so the participant-facing UI and coach dashboard can show provenance.
