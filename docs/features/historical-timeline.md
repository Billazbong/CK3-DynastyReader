# Historical timeline

## Goal

Present the player's dynasty history and significant campaign events in chronological order.

## Scope

- Filter events by date range.
- Filter by event category.
- Filter by participant or character.
- Highlight the player's character and dynasty.
- Navigate from an event to relevant character or title data.

## Data required

- Event date
- Event type or category
- Human-readable summary
- Participant character IDs
- Involved title, house, dynasty, or province IDs
- Optional location
- Optional source or save-game record

## Interaction requirements

- Let users jump to a date or detected era.
- Keep event ordering independent of UI locale.
- Use clear labels for approximate or unresolved dates.
- Keep dense event ranges readable.
- Preserve filters when returning to the timeline.

## UI requirements

- Show loading, empty, and no-match states.
- Use a stable event card layout.
- Do not invent missing event explanations.
- Mark inferred or derived events separately from directly parsed events.

## Acceptance criteria

- Events are sorted chronologically.
- Date and category filters combine predictably.
- Participants are resolved by ID.
- Empty timelines do not show fabricated events.

