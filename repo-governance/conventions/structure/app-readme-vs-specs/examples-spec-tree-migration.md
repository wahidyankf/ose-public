---
description: A worked before/after example and checklist for migrating a five-folder C4 spec tree to the logical owner corpus.
when_to_use: Use when you need a concrete worked example of migrating an existing spec tree to the logical owner corpus.
---

# Example: Spec Tree Migration (Five-Folder to Logical Owner Corpus)

**Before** (the five-folder C4 layout):

```
specs/apps/organiclever/
├── product/
├── system-context/
├── containers/
│   └── contracts/
├── components/
│   ├── be/
│   └── web/
└── behaviour/
    ├── organiclever-be/gherkin/
    ├── organiclever-app-web/gherkin/
    ├── organiclever-www/gherkin/
    └── organiclever-www-be/gherkin/
```

**After** (one [logical owner corpus](../specs-directory-structure/logical-owner-corpus.md) per
deployed surface):

```
specs/apps/organiclever/
├── README.md
├── app-web/
│   ├── README.md
│   ├── architecture.md
│   └── behaviours/<domain>/
├── be/
│   ├── README.md
│   ├── architecture.md
│   ├── contracts/          # the OpenAPI spec the backend serves
│   └── behaviours/<domain>/
└── www/
    ├── README.md
    ├── architecture.md
    └── behaviours/
        ├── frontend/<domain>/
        └── backend/<domain>/
```

Four behaviour surfaces became three corpora because one deployed site owns both its frontend and
its tRPC backend; `behaviours/` nests them rather than splitting the site in two.

**Migration checklist**:

1. In one atomic `git mv` commit: move each `behaviour/<product>-<surface>/gherkin/` to its owner's
   `behaviours/`, and any `containers/contracts/` into the owner that serves it. Feature files keep
   their domain subdirectory.
2. In the same commit: write each owner's `README.md` and `architecture.md`, then `git rm -r` the
   five legacy folders. A product cannot be half in one shape and half in the other.
3. In the same commit: update Nx `project.json` `inputs`, `repo-config.yml` corpus globs, step-file
   `@covers` references, MSBuild feature-file globs, and governance cross-links.
4. Run `the declared spec-tree check` and `the declared spec-count check`
   to verify.
