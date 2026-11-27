# Security Policy

## Supported versions

Only the latest commit on `main` is supported. There are no maintained release branches.

## Reporting a vulnerability

Report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/egarlepp/businesscase_studio/security/advisories/new).
Do not open a public issue.

Include the affected file or feature, reproduction steps, and the impact you expect. You should
receive an acknowledgement within 7 days.

## Data-handling model

Business Case Studio is a client-side single-page application. It has no backend, no
authentication, and does not transmit model inputs anywhere.

- **Browser storage:** the current model is autosaved to `localStorage` under the key
  `business-case-studio:draft` so it survives a refresh. It stays on that device and browser
  profile, and anyone with access to the profile can read it. **Reset** replaces it with the
  sample defaults; clearing site data removes it entirely. Do not use the app on a shared browser
  profile for confidential models.
- **Exports:** "Save file" (a JSON case file) and "Cash flow (CSV)" write files to your machine. They can
  contain labor rates, headcount, pipeline, and cost data. Store them according to your
  organization's data-classification policy.
- **Imports:** opened case files are treated as untrusted. They are parsed as JSON (never executed),
  validated field by field against the expected types, capped in size (5 MB) and length, and
  results are always recalculated rather than read from the file. CSV text cells are guarded
  against spreadsheet formula injection.
- **Third-party requests:** the stylesheet loads the Inter font from Google Fonts, which exposes the
  viewer's IP address and user agent to Google. Self-host the font if that is unacceptable in your
  environment.
