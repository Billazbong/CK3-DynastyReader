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
- Trait keys and display names resolved from the save's `traits_lookup`
- Trait icons converted from the CK3 DDS asset folder

Numeric trait IDs are resolved against `traits_lookup`. Display names come from a bundled CK3 trait-name map. When no matching icon exists, the name remains visible without an image.

Levelled traits use their specific numbered icon when available, such as `blademaster_1`, `blademaster_2`, or `blademaster_3`. Lifestyle aliases use the appropriate CK3 icon mapping, with `_base` or an existing generic icon as a fallback.

The parser handles every numbered or suffixed trait level generically. It also includes a complete registry for tracked lifestyle traits and legacy save XP slots, so Blademaster, Hunter, Physician, Mystic, Reveler, Herbalist, Gardener, and Poet select `_1`, `_2`, or `_3` from saved track XP. Traveler, pilgrim, and tournament traits use their corresponding generic or numbered icon families.

The Traits application page lists every bundled trait name and key with searchable text. Tracked traits show their available levelled icon variants, and unavailable icon files are removed while the trait name and key remain visible.

Education traits are grouped by education family in the Traits catalog. Debug traits are omitted. Knight-Errant has separate Lion, Swan, and Tiger icons. Male and female Child-of-Concubine traits share one concubine icon.

Held titles are ordered from highest to lowest tier: unrecognized or special title, hegemony, empire, kingdom, duchy, county, then barony.

