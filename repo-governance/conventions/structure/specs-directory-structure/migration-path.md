---
description: The atomic-commit procedure and path mapping for migrating a five-folder C4 spec tree to the logical owner corpus
when_to_use: Read this when migrating an app's specs/apps/<app-family>/ tree from the retired five-folder layout to the logical owner corpus.
---

# Migration Path (Five-Folder to Logical Owner Corpus)

Every product and library in this repository completed this migration during the
`adopt-beavernest-test-automation` plan. The procedure is kept because a product added from
outside — or restored from an archive — arrives in the retired shape.

1. Decide the owners first. One owner per **deployed** surface, not per behaviour folder: two
   perspectives on one process are one owner whose `behaviours/` nests them.
2. In ONE atomic commit: `git mv` each `behaviour/<product>-<surface>/gherkin/` to its owner's
   `behaviours/`, move any `containers/contracts/` into the owner that serves it, write each
   owner's `README.md` and `architecture.md`, and `git rm -r` the five retired folders. Update
   every path reference in the same commit — Nx `project.json` `inputs`, `repo-config.yml` corpus
   globs, step-file `@covers` references, MSBuild feature-file globs, container bind mounts, and
   governance cross-links.
3. Keep what the retired folders really held. A folder carrying a stub that restates the README is
   deleted; a folder carrying 500 words of specification moves into the owner beside
   `architecture.md`.
4. Verify with `the declared spec-tree check`,
   `the declared spec-count check`, and `./rhino md internal-link validate`.

**Path mapping:**

| Old path                                          | New path                                              |
| ------------------------------------------------- | ----------------------------------------------------- |
| `specs/apps/<p>/behaviour/<p>-<surface>/gherkin/` | `specs/apps/<p>/<owner>/behaviours/`                  |
| `specs/apps/<p>/containers/contracts/`            | `specs/apps/<p>/<serving-owner>/contracts/`           |
| `specs/apps/<p>/system-context/context.md`        | a section of `specs/apps/<p>/<owner>/architecture.md` |
| `specs/apps/<p>/containers/container.md`          | a section of `specs/apps/<p>/<owner>/architecture.md` |
| `specs/apps/<p>/components/<c>/component-<c>.md`  | a section of `specs/apps/<p>/<owner>/architecture.md` |
| `specs/apps/<p>/product/overview.md`              | `specs/apps/<p>/overview.md`                          |
| `specs/libs/<l>/behaviour/gherkin/`               | `specs/libs/<l>/behaviours/`                          |

The atomic commit is mandatory. A product cannot be half in one shape and half in the other —
`the declared spec-tree check` reports a retired folder surviving beside a corpus as a HIGH
finding, precisely so a partial move cannot sit unnoticed.
