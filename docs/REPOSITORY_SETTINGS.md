# Repository settings

What to switch on in GitHub when this repository is **public**, and what changes if it goes back
to **private**. Settings live in GitHub, not in the code, so this file is the record of what they
should be. Rulesets to import are in [`.github/rulesets/`](../.github/rulesets/).

## When the repository is public

### 1. Code security (Settings → Advanced Security)

| Setting                               | Value   | Why                                                                         |
| ------------------------------------- | ------- | --------------------------------------------------------------------------- |
| Private vulnerability reporting       | Enabled | `SECURITY.md` and the issue chooser link to it; the link 404s otherwise     |
| Dependency graph                      | Enabled | Required for Dependabot alerts                                              |
| Dependabot alerts                     | Enabled | Flags vulnerable npm packages and Actions                                   |
| Dependabot security updates           | Enabled | Opens fix PRs for alerts; version updates already run from `dependabot.yml` |
| Secret scanning                       | Enabled | Free on public repositories                                                 |
| Push protection                       | Enabled | Blocks a push that contains a detected secret                               |
| Code scanning (CodeQL), default setup | Enabled | Free on public repositories; scans the TypeScript on every push and PR      |

### 2. Rulesets (Settings → Rules → Rulesets → New ruleset → Import a ruleset)

Import both files from `.github/rulesets/`:

- **`protect-main.json`**: on `main`, blocks deletion and force-pushes, requires a pull request
  (0 approvals, because GitHub does not let an author approve their own PR in a single-maintainer
  repository), requires review threads to be resolved, and requires the CI `check` job to pass.
  Repository admins can bypass **only by merging a pull request**, not by pushing directly. Use
  that bypass when CI cannot run (for example an Actions billing block) and say why in the PR.
- **`protect-release-tags.json`**: release tags `v*` cannot be deleted, moved, or force-updated.

After importing, open a test PR and confirm the `check` status appears as required. If GitHub
shows the check as "Expected — waiting for status", the job name changed in `ci.yml`; update the
ruleset to match.

### 3. Actions (Settings → Actions → General)

| Setting                                        | Value                                                      |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Actions permissions                            | Allow actions created by GitHub (CI only uses `actions/*`) |
| Approval for workflows from fork pull requests | Require approval for all external contributors             |
| Workflow permissions                           | Read repository contents and packages permissions          |
| Allow GitHub Actions to create and approve PRs | Off                                                        |

`ci.yml` already sets `permissions: contents: read` and runs on `pull_request`, so a fork PR gets
a read-only token and no secrets. Never switch it to `pull_request_target` or add
`runs-on: self-hosted`: on a public repository a fork PR could then run its own code with write
access or on a maintainer's machine.

### 4. General (Settings → General)

- **Automatically delete head branches**: on, so merged PR branches do not pile up.
- **Features**: turn off Wiki and Projects if unused (they accept public edits or add noise).
  Discussions are optional; `CONTRIBUTING.md` already handles "when enabled".
- **Social preview**: upload `docs/screenshots/01-overview-dashboard.png` or a branded card.
- **About** (repository home page, gear icon): description, website (the Pages URL), and topics
  such as `business-case`, `roi`, `tco`, `react`, `typescript`.

### 5. Your account (github.com/settings/emails)

- **Keep my email addresses private**: on.
- **Block command line pushes that expose my email**: on.

Commits on `main` use the `noreply` address. Five early commits (August 2026) with a personal
address still exist in the hidden pull request refs of PRs #1–#5 and #20–#22, which anyone can
fetch. Only GitHub Support can remove those refs; see "Known exposure" below.

## When the repository is private

This repository belongs to a personal account. On GitHub Free, going private turns several of
the protections above off or makes them paid.

| Item                                | Public (free)                 | Private on GitHub Free                                 | What to do                                                        |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Rulesets and branch protection      | Enforced                      | Saved but **not enforced** (needs GitHub Pro)          | Keep them; they apply again when public or on Pro                 |
| Actions minutes                     | Unlimited on standard runners | 2,000 minutes per month, then billing applies          | Watch usage; a spending limit or failed payment stops all CI jobs |
| Private vulnerability reporting     | Available                     | Not available                                          | Nothing; it comes back when public                                |
| Secret scanning and push protection | Free                          | Repository scanning needs a paid plan                  | Keep account-level push protection on (section 5)                 |
| CodeQL code scanning                | Free                          | Needs a paid plan                                      | Run `npm run lint` and `npm test` locally instead                 |
| Dependabot alerts and updates       | Free                          | Free                                                   | Leave on                                                          |
| GitHub Pages                        | Free                          | Needs GitHub Pro; the site goes offline                | Expect the demo site to stop                                      |
| Forks and stars                     | Public forks stay public      | Existing public forks are **detached and stay public** | Assume anything ever published remains available                  |

### Before making it public again

1. Re-run the release audit over **every** ref, including `refs/pull/*`
   (`git clone --mirror`), for secrets, personal email addresses, and internal references.
2. Confirm `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `LICENSE` are current.
3. Delete merged branches, then flip visibility and work through sections 1–5 the same day.

## Known exposure

| Item                                                       | Where                                 | Risk                                       | Fix                                                                              |
| ---------------------------------------------------------- | ------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| Personal email in 5 commits from 2026-08-06                | `refs/pull/{1,2,3,4,5,20,21,22}/head` | Address is harvestable by spam crawlers    | Ask GitHub Support to remove those PR refs, or accept it; `main` itself is clean |
| Google Fonts request on every page load (`src/styles.css`) | Visitors' browsers                    | Visitor IP sent to Google                  | Self-host Inter (for example `@fontsource/inter`)                                |
| Actions pinned to tags (`@v7`), not commit SHAs            | `.github/workflows/ci.yml`            | A moved tag would run different code in CI | Pin to SHAs; Dependabot keeps them current                                       |
