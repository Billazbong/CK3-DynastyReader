# Dynasties and houses

## Sections

Dynasty and house records are stored under the `dynasties` top-level section. The exact subsection layout can include:

- Dynasty records
- `dynasty_house` records
- Unity state
- Prestige and accumulated prestige
- Coat of arms data

## House fields

A representative house record observed in the save is:

```text
28229={
    localized_name="Yasutomi"
    found_date=1029.12.19
    head_of_house=199166
    dynasty=11327
    parent_dynasty_house=11878
    historical={ 135210 157715 187954 199166 }
}
```

Direct fields:

| Field | Meaning |
|---|---|
| Numeric record ID | House ID |
| `localized_name` | Localized house name |
| `found_date` | House founding date |
| `head_of_house` | Current numeric character ID |
| `dynasty` | Numeric dynasty ID |
| `parent_dynasty_house` | Parent house ID |
| `historical` | Character IDs historically associated with the house |
| `coat_of_arms_id` | Coat-of-arms record ID |

## Character relationship

A character record can point to a house:

```text
dynasty_house=28229
```

Resolve in this order:

1. Find house ID `28229`.
2. Read `localized_name`.
3. Read house `dynasty`.
4. Resolve dynasty ID `11327`.
5. Read the dynasty name or key.

## Dynasty fields

A dynasty record can contain:

```text
name="dynn_Takayama"
prestige={ ... }
```

Observed name fields include internal keys such as `dynn_Takayama`. For display:

1. Prefer a localized dynasty name field when available.
2. Otherwise strip `dynn_` for a readable fallback.
3. Keep the raw key available for debugging and localization work.

## Dynasty prestige

Dynasty records can contain nested prestige data:

```text
prestige={
    currency=...
    accumulated=...
}
```

`currency` is current dynasty prestige. `accumulated` is accumulated prestige. It is not a level maximum unless a separate level-history field proves it.
