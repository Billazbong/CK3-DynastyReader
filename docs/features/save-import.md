# Save import and parsing

## Goal

Allow a user to select a Crusader Kings III save file and turn it into structured local data for the application.

## Scope

- Accept a local `.ck3` or extracted plaintext save file.
- Read the file in the browser.
- Identify the save metadata and player-controlled character.
- Parse only the data sections needed by active features.
- Surface unsupported, malformed, or unreadable saves clearly.
- Keep raw and derived data local to the user's browser session.

## Out of scope

- Server upload or remote storage.
- Automatic save-folder discovery.
- Modded localization or localization-file integration.
- Exhaustive support for every CK3 version.

## Known save structure

CK3 saves contain a metadata block followed by data blocks using Paradox text syntax. The save is currently known to include:

- `meta_date`
- `meta_player_name`
- `meta_title_name`
- `meta_player_tier`
- `meta_house_name`
- `played_character`
- Character records keyed by numeric character ID
- A player block containing `owner=<character_id>`

The player-controlled character must be identified by the numeric ID in `played_character.character` or `player.owner`, not by matching the player name.

## Observed player identification

In a current save example:

- `played_character.character=199166`
- `player.owner=199166`
- Character record `199166={ ... }`

This character block contains fields such as `first_name`, `birth`, `female`, `nickname`, `culture`, `faith`, `dynasty_house`, `skill`, `traits`, and `family_data`.

## Data model

Future parser output should include normalized sections similar to:

```text
Save
  metadata
  currentDate
  playerCharacterId
  characters
  houses
  dynasties
  titles
  relations
  events
```

Start with only the fields required by the feature being implemented. Define explicit types or schemas before adding more parser records.

## Parser requirements

- Stream or chunk large files where practical.
- Keep memory use bounded during parsing.
- Detect parse failures with a useful line or section context.
- Preserve numeric IDs as strings or exact integers, not JavaScript floating-point IDs.
- Reject blank, directory, or unreadable files.
- Show file name and size while processing.
- Disable repeated imports while parsing is in progress.
- Offer a reset action to replace or clear a loaded save.
- Report named parsing stages with a determinate progress bar.

## UI requirements

- Provide a clearly labeled file import control.
- Show progress or a loading state for large files.
- Show success only after player character resolution succeeds.
- Show specific errors for unsupported versions and malformed syntax.
- Never display a save as loaded if required player data is missing.

## Acceptance criteria

- A valid save resolves the player character without relying on display name.
- An unsupported or malformed save does not crash the app.
- No save content is sent over the network.
- Re-importing a save replaces the previous parsed state.
- The app can clear an imported save and return to an empty state.

## Initial character recap implementation

The `.ck3` importer is browser-local and:

- Uses JSZip to locate and decompress `gamestate`.
- Resolves the player from `played_character.character`, or validates against `player.owner`.
- Normalizes character, house, dynasty, trait, and landed-title records.
- Uses title `title_name_data.name` values for readable names.
- Falls back to title keys and trait IDs when localization is unavailable.

