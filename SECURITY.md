# Security Policy

## Supported versions

The project is at `0.x`: the public API may still change in minor releases.
Fixes are shipped for the current minor branch — `0.2.x` today — and nothing
older is patched.

## Reporting a vulnerability

**Do not open a public issue for a vulnerability.**

Report it privately through GitHub Security Advisories:
<https://github.com/maxyotka/rostra/security/advisories/new>

Where possible, include:

- the package version (`npm ls rostra-ui`) and how it is loaded — CSS only, the
  React layer, or the legacy build;
- a minimal reproduction;
- an assessment of the impact;
- a suggested patch, if you have one.

We will acknowledge receipt within 72 hours and agree on a disclosure timeline.

## Scope

A UI library handles no secrets and makes no network requests, so the attack
surface is narrow. In scope:

- Markup injection through props that are documented as accepting text.
- Data leaking across themes and portals — layer content rendered outside its
  own container.
- Bugs in `scripts/*.mjs` that write outside the repository.
- Any dependency of the package with a known vulnerability.

Out of scope:

- Markup the application itself passes to `dangerouslySetInnerHTML`.
- Vulnerabilities in React itself, or in anything else the application
  installs — report those upstream. The package has no dependencies of its own.
- Issues reproducible only in browsers below the documented support floor.

## Caveats

- `rostra.css` makes no network requests. If you load `fonts.css`, the browser
  contacts `fonts.googleapis.com` — in a closed network use a local copy of the
  font instead.
- `rostra.legacy.css` targets browsers that stopped receiving security updates
  years ago. Supporting them does not make them safe: whether to allow them is
  the operator's decision.
