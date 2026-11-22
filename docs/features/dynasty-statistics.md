# Dynasty statistics

## Goal

Summarize dynasty growth, influence, continuity, and notable historical characteristics.

## Scope

- Count living and deceased dynasty members.
- Count houses and branches.
- Summarize direct and extended family growth.
- Summarize held titles.
- Summarize member skills or traits only when reliable save fields exist.
- Display trends over save dates.

## Data required

- Dynasty ID and name
- House IDs and names
- Character IDs and dynasty membership
- Birth and death dates
- Held title assignments and dates
- Optional skills and traits

## Calculation rules

- Define each metric explicitly before implementation.
- Separate direct dynasty members from allied, spouse, or house-linked characters.
- Exclude unknown or unparsable members.
- Use half-open or explicitly documented date ranges for period counts.
- Do not count historical title ownership as current ownership.
- Round percentages and averages only at presentation time.

## UI requirements

- Label units and time periods.
- Explain every metric in concise terminology.
- Show no-data and partial-data states.
- Keep charts accessible as tables or text summaries.

## Acceptance criteria

- Totals can be verified against parsed character records.
- House and dynasty counts do not include spouses accidentally.
- Missing dates are excluded or visibly categorized.
- Derived metrics use no fabricated defaults.

