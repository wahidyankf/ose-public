# Phase 0 — Preliminary Dependency License Resolution

No `ose-id-be`/`ose-id-web` project exists yet, so no package is "installed" in the Nx-tracked sense.
This table resolves exact target versions and verifies license metadata from the official package
registries (NuGet nuspec `<license>` element, npm registry `license` field) ahead of Phase 2 scaffold.
Phase 2's evidence will capture the actually-installed lockfile/package metadata once the four
projects exist, per the plan's REFACTOR acceptance criteria.

| Package                                                               | Target version                                      | License (registry-verified) | Source                                                                            | Disposition                                     |
| --------------------------------------------------------------------- | --------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| .NET SDK / ASP.NET Core runtime                                       | 10.0.300                                            | MIT                         | dotnet/runtime, dotnet/aspnetcore (GitHub, well-known)                            | Compatible; no fee.                             |
| Npgsql                                                                | 10.0.3                                              | PostgreSQL License          | `npgsql.nuspec` `<license type="expression">PostgreSQL</license>`                 | Permissive, MIT-compatible; no fee.             |
| SqlKata                                                               | 4.0.1                                               | MIT                         | `github.com/sqlkata/querybuilder/LICENSE`                                         | Compatible; no fee.                             |
| SqlKata.Execution                                                     | 4.0.1                                               | MIT                         | Same repository/license as SqlKata                                                | Compatible; no fee.                             |
| Microsoft.EntityFrameworkCore (+.Design, migration-time tooling only) | 10.0.12                                             | MIT                         | `microsoft.entityframeworkcore.nuspec` `<license type="expression">MIT</license>` | Compatible; migration-time only per plan scope. |
| Next.js                                                               | 16.x (match sibling `ose-app-web` pin 16.2.6)       | MIT                         | `npm view next license` = MIT                                                     | Compatible; no fee.                             |
| React / react-dom                                                     | 19.x (match sibling pin 19.2.6)                     | MIT                         | `npm view react license` = MIT                                                    | Compatible; no fee.                             |
| TypeScript                                                            | repository-pinned version (see root `package.json`) | Apache-2.0                  | Well-known upstream license                                                       | Compatible; no fee.                             |

## Phase 3 addendum — EF PostgreSQL provider

Applying an EF Core migration against PostgreSQL needs a provider that Phase 0 did not enumerate,
because Phase 0 resolved the runtime path (SqlKata/Npgsql) rather than the migration-time one. It is
resolved here on the same terms before it is added:

| Package                                 | Target version | License (registry-verified) | Source                                                           | Disposition                                      |
| --------------------------------------- | -------------- | --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.3         | PostgreSQL License          | NuGet registration `catalogEntry.licenseExpression` = PostgreSQL | Permissive, MIT-compatible; migration-time only. |

The version matches the resolved Npgsql 10.0.3 and pairs with EF Core 10.0.12. It carries the same
licence as Npgsql itself, which the table above already accepted, so it introduces no new obligation.

**Acceptance**: OSE-authored source and documentation remain MIT (repository root `LICENSE`); every
third-party component above is a permissive license with no mandatory identity-vendor fee and no
copyleft obligation that would affect OSE-authored code. No incompatible license is introduced.
`OpenIddict.AspNetCore` (Apache-2.0) is explicitly out of scope for this plan — it is reserved for
Plan 04 and is not added to `ose-id-be` here.
