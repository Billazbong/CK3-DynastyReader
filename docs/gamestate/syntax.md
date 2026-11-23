# Gamestate syntax

## Basic assignments

CK3 gamestate text uses Paradox Clausewitz-style assignments:

```text
key=value
key="quoted text"
key=yes
key=no
key=123
key=123.45
```

Assignments can occur at the root level, inside named blocks, or inside repeated object blocks.

## Blocks

Braces delimit a block:

```text
meta_data={
    save_game_version=15
    version="1.18.3"
}
```

A block can contain scalar values, nested blocks, arrays, or repeated keys.

## Arrays

Arrays are brace-delimited and generally whitespace-separated:

```text
traits={ 66 57 48 17 }
former_spouses={ 33753953 117545149 }
perk={ a_perk b_perk }
```

Arrays can contain numbers, names, quoted strings, or nested objects. Do not assume every brace-delimited value is a flat list.

## Dates

Most save dates use `year.month.day`:

```text
birth=1085.5.28
date=1157.2.20
```

Dates are not JavaScript `Date` values and should be preserved as strings during parsing. Year `0` or ancient dates can exist in title history.

## Numeric identifiers

Numeric IDs are not JavaScript floating-point values:

```text
199166={
    first_name="Noriko_4"
}
```

Preserve character, title, province, dynasty, and house IDs as strings or exact big-integer types.

## Repeated keys

The same key can appear multiple times:

```text
spouse=33753953
spouse=117545149
spouse=33777269

perk=foo_perk
perk=bar_perk
```

Never use a plain object that overwrites repeated keys. Store lists or collect values by key.

## Nested anonymous records

Some blocks contain anonymous objects rather than named IDs:

```text
legacy={ {
    character=199166
    date=1157.2.20
}
{
    character=187954
    date=1106.5.28
}
}
```

The nested `{ ... }` elements need an array or sequence parser rather than a keyed object parser.

## Quoted text

Quoted values can contain spaces, apostrophes, Unicode, escaped text, or localization-like control content. Trim surrounding quotes, but do not strip internal punctuation.

## Encoding and localization

The save contains already-localized display strings for fields such as title names and nickname text. The parser should prefer these names but retain keys and IDs as fallbacks.

Some internal labels remain keys rather than translated names:

- `nick_the_scholar`
- `dynn_Takayama`
- `k_france`
- `granted`
- `conquest_claim`

## Parser rules

- First validate brace balance.
- Parse text as UTF-8 with a replacement strategy for malformed legacy text.
- Match top-level names at line or brace depth, not with broad text search.
- Preserve exact IDs and dates.
- Collect repeated keys.
- Add a source path for every normalized field.
- Mark unknown, missing, unsupported, and empty values differently.
- Avoid heuristic title or trait acquisition dates.
