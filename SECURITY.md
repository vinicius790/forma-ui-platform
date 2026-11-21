# Security policy

## Supported versions

Security fixes are provided for the latest released minor version while Forma UI is pre-1.0. After 1.0, the support window will be defined by the release policy.

## Reporting a vulnerability

Do not open a public issue for an exploitable vulnerability. Use GitHub's private vulnerability reporting feature for this repository, or contact the maintainers through the security contact configured in the GitHub repository settings.

Include the affected package/version, impact, reproduction, prerequisites and a proposed mitigation where possible. Do not include real user data or credentials.

## Security practices

- Review dependency updates and licenses.
- Run CodeQL and dependency vulnerability checks in CI.
- Keep workflow permissions least-privileged.
- Prefer npm trusted publishing (OIDC) to long-lived registry tokens.
- Never commit secrets, `.env` files, registry tokens or generated authentication files.
- Do not render untrusted HTML in playground or docs pages.
- Treat npm provenance as traceability evidence, not as a guarantee that a package is safe.
