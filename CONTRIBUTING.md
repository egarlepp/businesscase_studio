# Contributing

Thanks for your interest in Business Case Studio. Issues and pull requests are welcome.

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
- **Keep the engine pure.** `calculateBusinessCase` must not depend on React, the DOM, or global
  state.
- **Be conservative with defaults.** Values in `src/data/defaults.ts` are what new users see first.
  Changes should be defensible and should not inflate ROI.
- **No confidential data.** Do not include real company figures in code, tests, issues, or
  screenshots.
- **Formatting** is enforced by Prettier; run `npm run format` before committing.

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not file public issues for vulnerabilities.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
