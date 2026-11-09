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
authentication, and does not transmit model inputs anywhere. All data lives in browser memory
and is lost on refresh unless you export it.

- **Exports:** "Export model JSON" writes a file to your machine. It can contain labor rates,
  headcount, pipeline, and cost data. Store it according to your organization's data-classification
  policy.
- **Third-party requests:** the stylesheet loads the Inter font from Google Fonts, which exposes the
  viewer's IP address and user agent to Google. Self-host the font if that is unacceptable in your
  environment.
