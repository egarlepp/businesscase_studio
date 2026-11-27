# Contributing

Thanks for your interest in Business Case Studio. Issues and pull requests are welcome.

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you agree to uphold it.

## Development setup

```bash
npm ci
```

```bash
npm run dev
```

Before opening a pull request, run the same checks CI runs:

```bash
npm run check
```

## Guidelines

- **Calculation changes need tests.** Every formula lives in `src/calculations/engine.ts`. If you
  add or change one, add a test in `src/calculations/engine.test.ts` that pins the expected value,
  and update `docs/METHODOLOGY.md`.
- **Keep the formula registry in sync.** `src/calculations/formulas.ts` powers the in-app
  explanations. `formulas.test.ts` fails if a listed input does not affect a result, or if a leaf
  formula depends on an input it does not list. Update the registry alongside the engine.
- **New inputs need a UI location.** Add every new `Inputs` field to `src/ui/fields.ts` and to
  `defaultInputs`. Saved drafts fill missing fields from the defaults, so additive changes need no
  migration. Renaming or removing a field requires bumping `DRAFT_VERSION` in
  `src/persistence/draft.ts` and adding a migration.
- **UI changes need UI tests.** Add or update tests in `src/App.test.tsx`, and keep controls
  keyboard-accessible with an accessible name.
- **Keep the engine pure.** `calculateBusinessCase` must not depend on React, the DOM, or global
  state.
- **Be conservative with defaults.** Values in `src/data/defaults.ts` are what new users see first.
  Changes should be defensible and should not inflate ROI.
- **No confidential data.** Do not include real company figures in code, tests, issues, or
  screenshots.
- **Screenshots** live in `docs/screenshots` and are shown in filename order, with the caption taken
  from the filename: `03-build-vs-buy.png` is captioned "Build vs buy" (number dropped, dashes become
  spaces). Use two-digit prefixes (`01-`, not `1-`) so `10-` sorts after `09-`, and capture them in
  demo mode.
- **Releases need notes.** When you bump `version` in `package.json`, update `APP_VERSION` in
  `src/version.ts` and add an entry at the top of `src/data/changelog.ts`. The "What's new" dialog
  reads it, and `changelog.test.ts` fails if the newest entry does not match the app version.
  The changelog keeps only the five most recent releases (`MAX_CHANGELOG_ENTRIES`), so delete the
  oldest entry when you add one.
- **Formatting** is enforced by Prettier; run `npm run format` before committing.
- **Dependency overrides.** `package.json` forces `minimatch` to `^11.0.1` to patch a
  denial-of-service advisory (GHSA-g3hv-75wg-m249) that ESLint and typescript-eslint still pull in
  through `minimatch@^10`. It is dev-only: minimatch never ships in the built app. Remove the
  override once both packages depend on `minimatch@^11` directly (`npm ls minimatch`).

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not file public issues for vulnerabilities.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
