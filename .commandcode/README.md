# Command Code Repository Binding

This directory holds repository settings and native agent routes for Command Code. `repo-config.yml` declares the
canonical leaf set and the RHINO emitter owns `.commandcode/agents/`; edit canonical `.agents/` sources and regenerate.
Roles that dispatch nested agents remain canonical main-session instructions, rather than native leaves.

## Contents

- [Settings](settings.json) — Repository policy and three FERRET lifecycle registrations.
- [Hooks](hooks/README.md) — Native policy transport and its synthetic checks.

No repository model or reasoning-effort pin is declared. Personal settings in `settings.local.json` and the entire
`taste/` learning tree stay outside Git and repository checks; learning remains enabled. See the
[platform catalog](../docs/reference/platform-bindings.md) for representation and runtime proof limits.
