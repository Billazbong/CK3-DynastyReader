# Title history

## Goal

Track title creation, ownership, succession, and territorial evolution.

## Scope

- List empire, kingdom, duchy, county, and barony titles found in the save.
- Show title holder history.
- Show ownership changes and succession events.
- Highlight titles held by the player dynasty.
- Navigate from a title to the holder or claimant.

## Data required

- Title ID
- Title name or localization key
- Rank
- De jure territory or parent title IDs
- Held title assignments
- Historical holder IDs and dates
- Succession or de facto changes
- Claims and claimants, if supported

## Rendering requirements

- Prefer derived holder intervals over duplicated raw history.
- Resolve title names safely without relying on an English localization file.
- Clearly distinguish currently held, formerly held, and unheld titles.
- Represent no holder or missing dates explicitly.

## Acceptance criteria

- Ownership intervals do not overlap without an explained succession state.
- Title links resolve to existing character IDs.
- Missing title localization is handled visibly.
- The current holder agrees with the save's latest title state.

## Acquisition detail

Each title or holding may include:

- Current holder acquisition date
- Matching dated `history.type`
- A holder ID for the acquisition event
- "Cause unavailable" when no matching dated holder event exists

Cause labels must come directly from CK3 history types. The UI must not infer inheritance, conquest, or grant from title rank or context.

