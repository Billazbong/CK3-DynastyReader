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

The character Traits tab lists traits and health traits for the selected character. Tracked traits show their available levelled icon variants, and unavailable icon files are removed while the trait name and key remain visible.

Education traits are grouped by education family in the Traits catalog. Debug traits are omitted. Knight-Errant has separate Lion, Swan, and Tiger icons. Male and female Child-of-Concubine traits share one concubine icon.

Held titles are ordered from highest to lowest tier: unrecognized or special title, hegemony, empire, kingdom, duchy, county, then barony.

## Expanded character detail

Held titles and county/barony holdings include the landed-title `date` and a directly matching dated `history.type` cause when the save provides it.

The profile separates diseases and injuries from ordinary traits. Disease/injury acquisition dates remain unavailable unless a directly linked dated event exists.

Prestige/fame and piety values use nested `currency` and `accumulated` fields. `currency` is current; `accumulated` is total gained. Fame and Piety levels are derived from accumulated total thresholds.

Trait acquisition date and event fields remain unavailable until the save structure provides a direct dated record for the character trait.

## Tabbed character profile

The character view uses three tabs:

- Traits: ordinary traits, diseases, injuries, Fame, and Piety
- Titles & holdings: held titles and county/barony holdings
- Family: a relationship graph around the selected character, including direct parents, shared-parent siblings, spouses, children, and primary heir

The Family tab identifies a primary heir. The parser first uses saved character or landed-title heir IDs. If no saved heir registry exists for a deceased character, it infers one from title ownership changes at or after the saved death date, prioritizing the most important transferred title and then the number of titles transferred. Inferred relationships are labeled separately from saved heir records.

The full-width family graph orders siblings with the selected character in one row by saved birth date, shows one parent in the selected character's dynasty line above that row when known, compact non-expandable spouse nodes beside the selected character and expanded siblings or children, and the selected character's children in a birth-ordered row centered below them. Expanding a parent reveals that parent's dynasty-line parent above and siblings beside them; expanding a child or sibling reveals that character's children centered below, with the spouse beside the character. Branches reflow surrounding nodes to avoid overlap, and spouse columns reserve space for larger spouse groups. Graph expansion keeps the Family tab open and highlights the expanded character. A separate action opens that character in their profile. The graph supports mouse/pen click-and-drag panning, touch scrolling, and controls to move left/right and recenter the selected character.

Selecting a dynasty or family member opens that member in the same tabbed profile layout. Direct family links are derived only from saved parent, spouse, and child IDs. Sibling links require an explicit shared saved parent; the dynasty directory is resolved by the character's saved `dynasty_house` and dynasty ID.

Selecting any dynasty or family member opens the member's Traits tab directly. A "Select player character" action restores the player profile.

The Dynasty directory search matches a character's saved character ID as well as their name and nickname, when those values are available.

## Relationship-rooted dynasty discovery

The dynasty directory resolves the player character's `dynasty_house` ID, finds the house's `dynasty` ID, and collects every house record linked to that dynasty. It then adds all living or dead character records whose `dynasty_house` belongs to one of those houses.

A spouse is resolved as a directly accessible family profile but is not followed into the Dynasty tab unless that spouse also belongs to a house in the player dynasty. Parent and child links do not infer marriage or dynasty membership.

## Living and dead status

Character status is resolved from the save's `living`, `dead_unprunable`, and `dead_prunable` collections first. `dead_data` and an explicit death date are fallbacks. Dynasty filters use this explicit status instead of assuming every character is alive.

