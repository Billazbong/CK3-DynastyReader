# Landed titles and holdings

## Section structure

`landed_titles` contains title records keyed by numeric internal title ID:

```text
landed_titles={
    7055={
        key=b_paris
        de_facto_liege=7054
        de_jure_liege=7054
        holder=199166
        date=1157.2.20
        capital=7054
        title_name_data={
            name="Paris"
            map="Paris"
        }
    }
}
```

## Direct fields

| Field | Meaning |
|---|---|
| Numeric record key | Internal title-record ID |
| `key` | CK3 title key, for example `k_france` or `b_paris` |
| `holder` | Numeric character ID of the current holder |
| `date` | Date assigned to the title's current holder state |
| `de_facto_liege` | Current de facto liege title ID |
| `de_jure_liege` | De jure liege title ID |
| `de_jure_vassals` | Child title IDs |
| `capital` | Capital title ID |
| `capital_barony` | Whether this record is a capital barony |
| `duchy_capital_barony` | Whether this record is a duchy capital barony |
| `title_name_data.name` | Localized title name found in the save |
| `history` | Dated title ownership/change history |
| `claim` | Character IDs with claims |
| `heir` | Candidate/heir character IDs |

## Rank inference

Infer display rank from the `key` prefix:

| Prefix | Rank |
|---|---|
| `e_` | Empire |
| `k_` | Kingdom |
| `d_` | Duchy |
| `c_` | County |
| `b_` | Barony |
| `h_` | Hegemony |
| Other | Special or unknown |

The title key is preferred over assuming rank from name text.

## Acquisition date

The `date` field is the direct title-holder date. It should be labeled "holder since" or "acquired" only for the current holder.

For a historical cause, inspect `history`:

```text
history={
    1095.10.12={
        type=granted
        holder=199166
    }
}
```

A matching entry should be used when:

- The date is before or equal to the current holder date.
- `holder` equals the player character ID.
- `type` is available.

Do not infer "granted", "conquest", or "inheritance" from title rank or context.

## Common history types

Observed or commonly parseable types include:

- `granted`
- `conquest_claim`
- `conquest`
- `created`
- `revoked`
- `destroyed`
- `leased_out`
- `lease_revoked`
- `usurped`
- `inherited`
- `succession`

Unknown types should remain visible and readable instead of being mapped to a guessed category.

## Holdings

County/barony holdings are title records with `c_` or `b_` keys and a matching holder. For a player profile:

- Barony keys can represent direct holdings.
- County keys can represent direct county holdings.
- A title hierarchy does not prove the player personally holds every de jure sub-title.

Use `holder=characterId` to identify ownership. Do not infer holdings only from `de_jure_vassals`.

## Name fallback

Name resolution order:

1. `title_name_data.name`
2. `title_name_data.map`
3. `key`
4. Numeric title record ID
