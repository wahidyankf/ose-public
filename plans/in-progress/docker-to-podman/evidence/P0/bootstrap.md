# Dependency and toolchain bootstrap

Date: 2026-10-26. Revision: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`.
Working directory for every command: execution worktree root, `worktrees/docker-to-podman/`.

| Command                                                                                                               | Result                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install`                         | Exit 0; 1,539 packages added and Husky prepare completed, session `53849`.                                                              |
| `rtk npm run doctor`                                                                                                  | Exit 1, missing Fantomas, CSharpier, Dart; session `96453`.                                                                             |
| `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply` | Exit 0, zero declared provision vectors; session `8166`.                                                                                |
| `rtk npm run doctor`                                                                                                  | Exit 1, same missing tools; session `21168`.                                                                                            |
| Documented native maintenance fallback, transactional/standard admission                                              | Exit 0; pinned Flutter archive verified before extraction; session `15536`. Existing .NET tools needed invocation PATH correction only. |
| Standalone `rtk npm run doctor` with native tool directories on invocation PATH                                       | Exit 0; all 24 declared toolchains checked, no findings. Doctor supplies its own ephemeral/light admission.                             |

Worktree setup explicitly directs tools without provision vectors to the maintenance tool-inventory
phases. The SWE-debugger verified those existing recipes rather than inventing a provision vector
or weakening doctor. Fantomas 8.0.0 and CSharpier 1.3.0 already matched
`.config/dotnet-tools.json`. Flutter 3.41.5 matches `.fvmrc`; its bundled Dart is 3.11.3.
The official Linux x64 archive also matches the existing runner Flutter Dockerfile:

- Source: [official Flutter release manifest](https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json).
- Archive SHA-256: `18901d456a5e458c4c69fa7859852b64fac29da9f89476a959abfacbac7f4fdb`.
- Verified download size: 1,509,905,744 bytes.

Commands now carry the native .NET tools directory and the installed versioned Flutter SDK bin
directory on their invocation PATH. No shell profile, repository configuration, doctor declaration,
Git identity, or host-security policy changed. Raw commands, native paths, and diagnostic output
remain in ignored `local-tmp/swe-debugger/doctor-provision-diagnosis.md`. The installed SDK is a
persistent native prerequisite; its task-owned downloaded archive is recorded for terminal cleanup.

No Nx baseline, container workload, or runtime implementation is claimed by this bootstrap proof.
The dependency audit output remains a recorded observation, not a claim that dependency audits
passed: npm reported 78 vulnerabilities during installation; later declared gates determine scope.
