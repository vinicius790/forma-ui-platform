# Release and security model

## Release

Changesets define package-level SemVer changes. A release must build all packages, verify export maps, run unit/a11y/browser tests, inspect packed tarballs and publish only from a protected main branch. Publish with npm trusted publishing (OIDC) where configured; do not commit long-lived registry credentials.

## Package quality

Run `publint` and Are the Types Wrong against packed packages. Keep peer dependencies explicit, avoid bundled copies of framework runtimes, mark only truly side-effect-free packages as such and test ESM/CJS/type entry points.

## Security

- Pin GitHub Actions by full commit SHA in production releases.
- Use read-only workflow permissions by default.
- Enable CodeQL and Dependabot/Renovate review.
- Review transitive dependencies and licenses before release.
- Never execute untrusted HTML in the docs playground.
- Treat provenance as an auditable chain-of-origin signal, not a vulnerability guarantee.
