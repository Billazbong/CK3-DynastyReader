# Family tree

## Goal

Visualize generations, marriages, parents, children, and dynasty branches around a character.

## Scope

- Draw the player dynasty and selected character's relationship neighborhood.
- Show direct ancestors and descendants.
- Display spouses and remarriages.
- Distinguish living and deceased characters.
- Support navigating to a selected character profile.
- Support generation-depth limits for readability.

## Data required

- Character ID
- Name and optional nickname
- Birth and death dates
- Sex
- Dynasty and house
- Father and mother IDs
- Real spouse IDs and former spouse IDs
- Child IDs
- Player and dynasty membership status

## Interaction requirements

- Selecting a character opens or highlights that character profile.
- The tree should expose relationships to keyboard users.
- Use a legend for key states such as living, deceased, spouse, and dynasty branch.
- Avoid rendering every character in the save at once.
- Preserve a selected character and depth when a filter changes, if still valid.

## Rendering requirements

- Handle large families and many spouses without overlap-heavy layouts.
- Keep zoom and pan optional; start with a stable, readable default.
- Represent remarriages accurately rather than inferring them from child order.
- Do not connect adopted, bastard, or concubine relationships unless the parser explicitly distinguishes them.

## Acceptance criteria

- The player's character is included and identifiable.
- Direct family relationships reflect parsed IDs.
- The view remains usable for a character with a large descendant set.
- Empty or missing relationship data is labeled rather than shown as an unknown parent.

