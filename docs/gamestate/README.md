# CK3 gamestate documentation

This directory documents the observed text structure of Crusader Kings III `gamestate` saves. It is intended for parser development, not as a claim that every save format or DLC layout is complete.

## Observed format

The representative save used for this documentation is:

- `save_game_version=15`
- `version="1.18.3"`
- Approximately 26.1 million lines
- Plaintext Paradox text format
- Player character ID `199166`

Newer and older saves can add, rename, reorder, or omit sections. Do not rely on line numbers or global text offsets.

## Documents

- [Syntax and parsing rules](syntax.md)
- [Top-level section index](top-level-sections.md)
- [Player and character records](characters.md)
- [Landed titles and holdings](landed-titles.md)
- [Dynasties and houses](dynasties.md)
- [Currencies, prestige, and piety](currencies.md)
- [Relationships, opinions, schemes, wars, and events](relationships-and-events.md)

## Core model

A parser can derive a stable normalized view from this hierarchy:

```text
Save
  metadata
  playerCharacterId
  characters
  living
  dead
  houses
  dynasties
  landedTitles
  relationships
  wars
  schemes
  currencies
  events
```

Preserve raw IDs and date strings. Build display values only after parsing.

## Reliable identification rules

1. Read `played_character.character` for the current player character.
2. Validate against `player.owner`.
3. Resolve the character from `characters` or the living/dead character collections.
4. Resolve `dynasty_house` and then `dynasty`.
5. Resolve titles by numeric landed-title record ID.
6. Never identify the player by display name.

## Evidence levels

Use these labels when presenting parsed information:

- **Direct**: The save contains the exact field or record.
- **Derived**: The app joins direct records, such as character ID to house or title holder.
- **Unavailable**: The save format or this parser does not expose the fact.
- **Unsupported**: A value exists but cannot be interpreted reliably for this save version.

Do not present unavailable or unsupported values as zero or false.
