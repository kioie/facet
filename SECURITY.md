# Security Policy

## Reporting a vulnerability

If you find a security issue in Facet, please report it privately rather than opening a public issue.

**Preferred:** [GitHub Security Advisories](https://github.com/kioie/facet/security/advisories/new) on this repository.

**Alternative:** email **security@kioie.dev** with a description, steps to reproduce, and impact if known.

We aim to acknowledge reports within a few business days and will coordinate disclosure once a fix is available.

## Supported versions

Security fixes are applied to the latest release on npm (`@kioie/facet`). Older versions are not routinely backported unless the issue is critical.

## npm publishing

Releases are published to npm under the `@kioie` scope. The maintainer account requires **npm two-factor authentication (2FA)** for publishes and other sensitive account actions.

New versions are only published after `npm test`, `npm run build`, and eval checks pass locally (`prepublishOnly`).

## Scope

Facet routes MCP tool schemas and reads optional local config (`facet.json`). It does not execute shell commands, fetch remote code at runtime, or read files outside paths you pass to the CLI. Report issues in those boundaries; out-of-scope items (e.g. compromised upstream MCP servers) should be directed to the relevant project.
