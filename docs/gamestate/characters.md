# Player and character records

## Player identity

The save has two useful player-identity fields:

```text
played_character={
    name="Billabøng"
    character=199166
    player=1
}

player={
    owner=199166
}
```

Resolve the player by ID:

1. Read `played_character.character`.
2. Confirm or fall back to `player.owner`.
3. Reject the save if the IDs conflict instead of silently choosing a name.
4. Resolve the character record.

The account name and localized title are UI/profile metadata. They are not stable character IDs.

## Character locations

Character records can appear in:

- `living`
- `dead_unprunable`
- `characters`
- ID-indexed lookup data

The parser should search the live character collections first and fall back to the character section or lookup metadata. The exact collection can vary by save version.

## Representative character record

Numeric record `199166` contains:

```text
199166={
    first_name="Noriko_4"
    birth=1085.5.28
    female=yes
    nickname=nick_the_scholar
    nickname_text="l’Érudite"
    ethnicity=asian_han_chinese
    culture=256
    faith=141
    dynasty_house=28229
    skill={ 7 10 9 10 8 6 }
    trait_xp_amounts={ ... }
    traits={ 66 57 48 17 ... }
    family_data={ ... }
    alive_data={ ... }
    landed_data={ ... }
}
```

Field meanings:

| Field | Meaning |
|---|---|
| `first_name` | Raw character name/key; may contain `_N` numeric suffixes |
| `birth` | Birth date |
| `female` | Sex marker; absence or another field can be version-dependent |
| `nickname` | Internal nickname key |
| `nickname_text` | Localized nickname text already present in the save |
| `culture` | Numeric culture ID |
| `faith` | Numeric faith ID |
| `dynasty_house` | Numeric house ID |
| `skill` | Skill array |
| `trait_xp_amounts` | Legacy tracked-lifestyle XP values |
| `traits` | Numeric trait lookup IDs |
| `family_data` | Spouses and children |
| `alive_data` | Variables and lists for a living character |
| `dead_data` | Historical state for a dead character |
| `claims` | Claimed titles |

## Traits

`traits_lookup` stores the trait key in lookup order:

```text
traits_lookup={
    education_intrigue_1
    education_intrigue_2
    ...
}
```

For a character:

```text
traits={ 66 57 48 }
```

Resolve numeric index `66` against `traits_lookup[66]`.

Trait acquisition dates are not guaranteed to be in this array. `trait_xp_amounts` tracks XP for legacy lifestyle tracks, not trait-acquisition events.

Debug traits should be excluded from user-facing catalogs and profiles.

## Family data

`family_data` commonly contains:

```text
family_data={
    primary_spouse=33777269
    spouse=33753953
    spouse=117545149
    spouse=33777269
    former_spouses={ 33753953 117545149 }
    child={ 33764062 16979018 117519574 50495227 }
}
```

Repeated `spouse` keys must be collected. Do not infer the primary spouse from the first repeated spouse unless `primary_spouse` is absent.

## Alive-data variables

`alive_data.variables.data` contains repeated anonymous records:

```text
{
    flag=former_camp_leader
    data={
        type=char
        identity=157715
    }
}
```

Preserve variable keys and types. They are script state, not guaranteed human-facing event history.

## Character currency fields

Character records can contain nested or direct fields for:

- `piety`
- `prestige`
- `gold`
- `dread`
- `legitimacy`
- `influence`
- `health`

Use nested `currency` and `accumulated` values carefully:

```text
piety={
    currency=123
    accumulated=456
}
```

`currency` is the current currency value. `accumulated` is the total fame or devotion gained. Compare it with the applicable Fame or Piety thresholds to derive the reached level.
