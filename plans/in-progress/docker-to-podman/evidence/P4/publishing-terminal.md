# docker-to-podman post-merge publication proof

## Merge

Pull request #749 merged by squash on 2026-10-29 after the PR quality gate passed on its exact head
`7660e498f` (every job passed; the Flutter job was skipped) and the pinned head was leak-reviewed. `origin/main` now
holds merge commit `f5f544fe7`, whose tree equals the PR head's tree (`git diff 7660e498f origin/main` is empty).

## Publication run

The merge to `main` triggered `publish-images` as designed (run 40773249804, head `f5f544fe7`). It concluded `success`.

| Job                     | Result  | What its log shows                                                                                                                                                                   |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Detect affected images  | success | Selected both backend images                                                                                                                                                         |
| Publish organiclever-be | success | `podman login ghcr.io --password-stdin` printed `Login Succeeded!`, `podman build --layers --format docker`, then `podman push` of two tags, `Writing manifest to image destination` |
| Publish ose-be          | success | The same sequence for `ose-be`                                                                                                                                                       |

Tags pushed per image, unchanged from before the migration: `ghcr.io/wahidyankf/<image>:latest` and
`ghcr.io/wahidyankf/<image>:<full merge commit SHA>` (`f5f544fe7f885394cf447667b022bb15b8187da5`), for `ose-be` and
`organiclever-be`. The `validate-env` run on the merge commit also concluded `success`.

## What was and was not verified

- Verified from the run: workflow trigger, credential-free login line, build with the Docker image format, both pushes
  for both images, and a successful job conclusion.
- Not verified here: the registry's own version listing and the manifest digests. The GitHub CLI session has no
  `read:packages` scope, and the push logs do not print the digest. A person with that scope can list the versions of
  both packages and confirm the two tags above. This is the one AC-07 item left for a person.
- The pre-merge image runtime proof is in `evidence/P2/publishing.md`.

## Other runs on `main` seen after the merge

`non-product-full-quality-scheduled` and `organiclever-www-test-local-deploy-prod` failed on `main` at `de3bfa14d`,
before this merge, so this change did not cause them. The scheduled run fails on the `ferret-cli` integration baseline
described in `evidence/P2/ci.md`. The `organiclever-www` prod run has failed on every recorded scheduled run since
2026-10-26 at the step `docker compose -f infra/dev/organiclever-www/docker-compose.yml up --build -d`, which was the
Docker-era command. That workflow now uses Podman. The local `organiclever-www` stack proof passed on Podman
(`evidence/P3/compose-stacks.md`), and the first scheduled run after this merge is the CI check of the new path. It was
not run here.
