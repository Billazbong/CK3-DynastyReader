# Character profiles

## Goal

Provide a focused historical profile for each character selected in the application.

## Scope

- Show identity, lifespan, house, dynasty, title, and allegiance.
- Show family relationships.
- Show skills and traits available in the save.
- Show selected life events and relationships.
- Identify the current player character.

## Data required

- Character ID
- Name and nickname
- Birth and death dates
- Sex
- Culture and faith
- Dynasty and house
- Primary spouse and former spouse IDs
- Parent and child IDs
- Traits
- Skills
- Held titles
- Optional inventory or story data only when explicitly implemented

## UI requirements

- Use a consistent profile layout across living and dead characters.
- Link relatives and titles to their dedicated views.
- Omit unavailable fields instead of guessing.
- State when data is from the current save rather than reconstructed history.
- Do not display generated portraits or names as factual when they are unavailable.

## Acceptance criteria

- Profile data resolves against character records by ID.
- The player character is clearly identified.
- Missing spouses, children, traits, or titles do not cause rendering errors.
- Relational links lead to valid records.

## Initial player recap

The first profile view presents only:

- First name
- Nickname or nickname text when present
- House name
- Dynasty name
- Held titles
- County and barony holdings
- Trait IDs from the character record

Trait IDs are shown as IDs until stable localized trait-name data is available. Missing names and values are labeled rather than guessed.

