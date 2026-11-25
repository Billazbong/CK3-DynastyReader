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

- Show the selected character with their direct parents, siblings, spouse(s), and children.
- Order the selected character and siblings in one horizontal row by saved birth date.
- Show one parent in the selected character's dynasty line above that row when the saved dynasty relationship is known.
- Show spouse(s) in compact, non-expandable nodes beside the selected character and expanded siblings or children.
- Show the selected character's children directly below, ordered by saved birth date.
- Center each expanded character's card over their child cohort.
- Expanding a parent shows that parent's dynasty-line parent above them and their siblings beside them.
- Expanding a child or sibling shows that character's spouse(s) and children.
- Keep graph expansion in the Family tab and highlight the expanded character.
- Provide a separate keyboard-accessible action to open a character profile.
- The tree should expose relationships to keyboard users.
- Use a legend for key states such as living, deceased, spouse, and dynasty branch.
- Avoid rendering every character in the save at once.
- Preserve a selected character and depth when a filter changes, if still valid.

## Rendering requirements

- Reflow sibling and child cohorts when a branch expands so nodes do not overlap.
- Handle large families and many spouses without overlap-heavy layouts.
- Use the full available page width for the graph rather than constraining it to the profile column.
- Support click-and-drag panning with a mouse or pen, native touch panning, and controls to move left/right and recenter the selected character.
- Keep spouse cards in a separate adjacent column that reserves enough vertical space for large spouse groups.
- Keep zoom and pan optional; start with a stable, readable default.
- Represent remarriages accurately rather than inferring them from child order.
- Do not connect adopted, bastard, or concubine relationships unless the parser explicitly distinguishes them.

## Acceptance criteria

- The player's character is included and identifiable.
- Direct family relationships reflect parsed IDs.
- Expanding a node displays only the relationship branch requested for that node.
- Character profile navigation is separate from graph expansion.
- The view remains usable for a character with a large descendant set.
- Empty or missing relationship data is labeled rather than shown as an unknown parent.

