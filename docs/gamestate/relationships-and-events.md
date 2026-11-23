# Relationships, opinions, schemes, wars, and events

## Relationships

The `relations` section contains relation records. Records can use nested owner/target structure:

```text
owner=199166
target=33764062
```

Preserve:

- `owner`
- `target`
- Dated opinion/relation values
- `reason`
- `type`
- Optional province or involved-character IDs

Do not infer a family relation from the relations section. Use `family_data` for direct spouse/child links.

## Opinions

The `opinions` section contains opinion records for character pairs or character state.

Record fields can include:

- Numeric owner
- Numeric target
- Opinion type or modifier
- Start date
- Expiration date
- Value
- Reason

Repeated opinion modifiers can exist for the same pair. Aggregate only by explicit value semantics.

## Schemes

The `schemes` section contains active and historical scheme records.

Useful fields include:

- Scheme type
- Owner/participant IDs
- Target IDs
- Start date
- Progress
- Success or exposure state
- Province or artifact IDs

Do not assume every scheme is complete or successful.

## Wars

The `wars` section contains war records. A character or title can be a war target, attacker, defender, or participant.

Do not infer a character's role from file position. Resolve all participant and claim fields explicitly.

## Combats

The `combats` section contains battle/combat records with their own IDs, participants, locations, outcomes, and dates.

Display only fields that can be normalized safely.

## Secrets

The `secrets` section contains:

- Secret type
- Owner
- Target
- Participant IDs
- Secret state

Some target structures use:

```text
target={
    type=char
    identity=195008
}
```

Resolve `identity` only for `type=char`.

## Triggered events

`triggered_event` is repeated at the top level. Each record can describe a previously triggered event.

Collect every matching block instead of returning only the first.

Do not treat arbitrary event text or variable flags as a direct trait acquisition record unless the save links the event to the exact trait and date.

## Memories and variables

The character memory manager and character `alive_data.variables` can contain:

- Flags
- Dates/ticks
- Character references
- Lists
- Province references
- Story or activity references

These fields are useful for research but need provenance labels. A flag does not establish a human-readable event by itself.
