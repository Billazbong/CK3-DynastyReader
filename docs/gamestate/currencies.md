# Currencies and prestige

## Currency syntax

CK3 stores currencies with nested blocks:

```text
prestige={
    currency=382.2797
    accumulated=37075.2797
}

piety={
    currency=120
    accumulated=1250
}
```

| Field | Meaning |
|---|---|
| `currency` | Current spendable or held amount |
| `accumulated` | Accumulated total associated with the record |

Preserve values as strings or decimal values with enough precision. Do not convert IDs or amounts through JavaScript floating-point IDs.

## Character prestige and piety

A character record can contain:

```text
piety={
    currency=...
    accumulated=...
}

prestige={
    currency=...
    accumulated=...
}
```

For a character profile:

- - `currency` is current spendable fame/prestige or piety.
- `accumulated` is the character's total gained prestige or devotion.
- Use `accumulated` against the level thresholds to derive the reached fame or piety level.

## Fame

CK3's "fame" concept is represented by prestige's `accumulated` total. The accumulated total can be compared against Fame threshold values:

- 0: Disgraced
- 1000: Established
- 2000: Distinguished
- 5000: Illustrious
- 10000: Exalted Among Men
- 20000: Legendary Figure

## Piety

Piety is religious currency and can also appear in nested character data:

```text
piety={
    currency=...
    accumulated=...
}
```

Piety's `accumulated` total can be compared against Devotion thresholds:

- 0: Sinner
- 1000: Dutiful
- 1500: Faithful
- 2500: Devoted Servant
- 4500: Paragon of Virtue
- 8500: Religious Icon

The same accumulated/threshold system applies to other systems that expose total XP and level boundaries.

## Dynasty prestige

Dynasty records can contain:

```text
prestige={
    currency=...
    accumulated=...
}
```

This belongs to the dynasty, not necessarily to the player character.

## Influence

Some character or realm records use:

```text
influence={
    currency=...
    accumulated=...
}
```

Treat influence as separate from prestige and piety.

## Maximum levels

When `accumulated` is present, its level can be derived directly from the applicable threshold list. The parser should preserve both `currency` and `accumulated`, and label whether a UI value is current or total.
