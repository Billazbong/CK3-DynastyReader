# AGENTS.md

## Purpose

Dynasty Chronicle is a local React application for importing Crusader Kings III save files and presenting an interactive history of the player's dynasty.

This is an independent fan-made project and is not affiliated with or endorsed by Paradox Interactive.

## Read this first

1. Read the relevant feature specification before editing.
2. Keep changes scoped to the requested feature.
3. Preserve the existing design, React patterns, and behavior.
4. Use small, reviewable changes and verify them with the project scripts.
5. Do not place user save data or generated personal campaign data in source-controlled files.

## Feature specifications

- [Save import and parsing](docs/features/save-import.md)
- [Family tree](docs/features/family-tree.md)
- [Historical timeline](docs/features/historical-timeline.md)
- [Title history](docs/features/title-history.md)
- [Character profiles](docs/features/character-profiles.md)
- [Dynasty statistics](docs/features/dynasty-statistics.md)

Read only the specifications needed for the current task. Do not load every feature document into the implementation context.

## Project structure

- `src/main.jsx`: React application entry point.
- `src/App.jsx`: top-level application composition.
- `src/styles.css`: global application styles.
- `docs/features/`: feature-specific requirements and implementation guidance.
- `README.md`: short project overview and setup instructions.

As the application grows, keep feature code grouped by domain rather than creating a large shared component file.

## Technology

- React 19
- Vite 7
- JavaScript and JSX
- ESLint flat configuration
- Browser-local processing for save files

Do not introduce a backend, database, state framework, UI framework, or new package without an explicit requirement or a clear project need.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Run the smallest relevant validation first, then `npm run lint` and `npm run build` for completed code changes.

## Implementation rules

- Use functional React components and hooks.
- Document every function with a concise JSDoc comment describing its purpose, parameters, and return value or side effect.
- Document React components, event handlers, parser helpers, and exported functions when they are added or modified.
- Keep JSDoc accurate as behavior changes; remove it if the function is removed.
- Use semantic HTML and accessible labels.
- Add keyboard support to interactive elements.
- Keep loading, success, and error states explicit.
- Make parsing failures visible and actionable.
- Avoid silent fallbacks; report malformed or unsupported save data.
- Never rely on a player name alone to identify the controlled character.
- Use stable character, title, house, dynasty, and date identifiers from the save.
- Keep derived display data separate from raw parsed records.
- Do not mutate parsed source objects in UI components.
- Preserve the save game's dates and identifiers; format dates only at presentation time.
- Do not transmit save files or campaign data to external services.

## Testing and verification

There is no test suite yet. New behavior should include focused tests when the project gains a test runner.

Until then:

- Verify the production build.
- Verify lint passes.
- Exercise the relevant UI in the browser.
- Test save parsing with representative valid and invalid inputs.
- Test for loading, no-data, malformed-data, and unsupported-version states.

## Change documentation

Update the relevant feature document when implementation adds or changes:

- User-visible behavior
- Data requirements
- Supported CK3 save versions
- Parsing assumptions
- Accessibility behavior
- Explicitly excluded behavior

Update `README.md` when setup or project status changes.

