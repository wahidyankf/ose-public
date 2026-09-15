---
title: "Week 38: Learning Paths, Enforced Gates, and a Return to Three Repositories"
date: 2026-08-11T20:00:00+07:00
draft: false
tags:
  [
    "milestone",
    "progress",
    "ayokoding",
    "learning-paths",
    "rhino-cli",
    "ci-cd",
    "governance",
    "beavernest",
    "fsharp",
    "vite",
    "sqlite",
  ]
categories: ["updates"]
summary: "A month after hardening the engineering substrate, OSE turned that foundation into visible work: ayokoding.com gained a broad software-engineering curriculum, a shared course library, and path-aware navigation; a parser fix exposed hundreds of Mermaid violations that a green gate had silently missed; one registry became the source of truth for local and CI checks; measured optimization made quick tests and Rust builds substantially lighter while CI wall-clock time and cache use regressed; ose-infra became the private sibling; and BeaverNest's short-lived fourth repository was folded back into ose-public, leaving the ecosystem focused on three repositories again."
showtoc: true
---

The last update ended with a stronger engineering substrate and very little new product surface. The platform backend and a Kubernetes environment still did not ship. Instead, visible progress came through the education platform, while the delivery machinery underneath it became stricter, more centralized, and — in a few important places — faster.

It was not a straight line. A validator that looked green had skipped most of the diagrams it was supposed to inspect. A plan to rewrite a slow Rust tool turned into an optimization effort after measurement showed Rust was not the bottleneck. BeaverNest became a fourth repository, then returned to `ose-public` after the maintenance cost outweighed the value of keeping a separate fork. That makes the month's theme less tidy than a conventional release note, but more useful: **build, measure, and change course when the evidence disagrees with the plan.**

## ayokoding.com Gets a Learning Spine

The most visible progress landed on [ayokoding.com](https://ayokoding.com). The Fundamentally Strong Software Engineer curriculum shipped its first three passes, moving from short tool primers through software-engineering foundations and capstones.

The original plan closed as `delivered-as-descoped`. The completed material stayed live, while the remaining subjects moved into a successor course-library program instead of stretching one plan indefinitely.

That successor work changed the site's information architecture. Courses now live in a shared, flat namespace rather than being copied into each path. A prerequisite schema and path-aware interface can render category pages, career and skill paths, a path rail, and path-aware previous/next navigation.

The real ordered path manifests have not shipped yet, so the navigation foundation is ahead of the learner journeys it will eventually carry. They are unfinished work, not a deadline. We will get there when we get there.

The URL design deliberately allows different depths. Career paths use a shape such as `careers/<arc>/<role>`, while skill paths use `skills/<subject>`. Instead of assuming every path has the same number of segments, the parser validates whether an identifier resolves to a manifest.

Course authoring continued on top of that structure. New material covered AI engineering, data systems, web and backend development, platform delivery, mobile and desktop application development, and concurrency. A bilingual, source-cited coding-model benchmark also joined the site, comparing models as they are exposed through several coding-agent harnesses rather than pretending a model name alone tells the whole story.

Several smaller changes made the growing library easier to use. The documentation sidebar became resizable and scrollable, and code blocks gained a copy button from the shared web UI library.

Elsewhere on the public sites, portfolio and content routes moved toward prerendered output, and the cost-of-living dataset was refreshed. The Vercel billing effect remains unverified, so there is no cost-savings claim attached to that work.

## A Green Diagram Gate That Was Not Running

The sharpest lesson started with one line of parser logic. The Mermaid validator treated the first line of a diagram as its diagram type. When that line was a `%%` comment — including the color-palette comment required by this repository's own convention — the validator saw an unknown type and stopped without applying the diagram rules.

As a result, 2,851 of 3,905 Mermaid blocks in `ose-public` had passed without real validation. Fixing the parser surfaced 665 violations here and more in the sibling repositories. The immediately actionable problems were repaired; the large tutorial-content remainder received an explicit, documented exclusion and a remediation brief instead of being hidden behind another silent pass.

The important part is not the count. It is the failure mode: **a green check that did not run created more confidence than the system had earned.** That same concern shaped the rest of the month's gate work.

## One Registry Now Defines the Quality Gates

Pre-commit, pre-push, pull-request CI, and the old main-branch workflow had drifted into separate hand-maintained command lists. Some checks ran only on a developer's machine. Others ran only after a merge. Formatting coverage differed by language, and no local surface could prove the shared `rhino-cli` boundary had stayed aligned.

The new gate registry moves that composition into `repo-config.yml`. Each check declares its command, scope, and surfaces once. The Husky hooks are now small shims that ask `rhino-cli` to run the registered surface, while the PR gate matrix comes from the same declarations. A few CI jobs remain deliberately hand-wired; conformance checks that they exist and aggregate correctly.

The registry conformance command checks the shims, generated `lint-staged` block, and CI wiring for drift. A separate registered parity gate validates the shared `rhino-cli` manifest.

The redundant `main-ci.yml` workflow was retired after its unique checks moved into the pull-request gate. That choice has a documented trade-off: the repository no longer re-runs an unconditional whole-workspace check after every merge, so cross-PR interactions rely on affected-project detection. The system records that risk rather than describing the new layout as strictly stronger in every dimension.

## Optimization Started With a Disproved Hypothesis

Once the registry made the gate system visible, the next question was cost. The optimization plan began with a plausible idea: `rhino-cli` felt slow, so perhaps rewriting the Rust CLI in Go would make commits and CI faster. Measurement rejected the premise. The compiled binary started in about 3.2 milliseconds; repeatedly launching it through `cargo run`, starting commands through `npx`, and paying for a large CI job matrix created the real overhead.

The delivered changes replaced hot-path wrappers with a resolver shim, reduced repeated build profiles, grouped registry-driven CI work, and tightened Rust build settings. The quick pre-push test chain fell from 124.3 seconds to 70.6 seconds, while the Rust build footprint fell from 2,747 MiB to 1,022 MiB.

The wider result was mixed. CI runner time fell by 48.7%, and pre-commit became 38.5% faster. Pull-request wall-clock time rose by 23.4% because the TypeScript quality job set the critical path, while GitHub Actions cache use climbed from 77.12% to 99.29% of its ceiling and exposed the need for a real eviction policy.

![Before-and-after comparison of pre-commit time, quick pre-push time, CI runner-seconds, CI wall-clock time, Rust build footprint, and GitHub Actions cache use.](/images/updates/2026-08-11-week-38-ci-before-after.png)

Four of the six before-and-after measures shown above improved, while two regressed. The system is lighter where the evidence says it is lighter, the checks stayed intact, and the regressions now have measurements instead of guesses. Reporting all of that as a blanket speedup would erase the most useful part of the exercise.

## Pull-Request Delivery Becomes More Explicit

Those savings matter because every delivery now passes through a pull request. The review workflow also matured: AI-authored work merges by default after the hardened preconditions pass, rather than waiting for a ceremonial human merge.

For changes that can affect executable behavior, review begins with a scout that maps the diff and its risks, then selects the relevant discipline specialists, including a dedicated type-soundness review. One synthesis agent remains the sole poster of record, so the result reads like one review instead of a wall of overlapping comments. Static prose takes the ordinary PR quality-gate path.

The repository also added practical limits around concurrent work. One plan may use at most one worktree per repository, and the pull request remains the merge unit. Independent delivery units may reuse that worktree sequentially, but they do not get folded into one pull request merely to reduce the PR count.

A plan handover now has both a read side and a write side. A departing session records its state and file ledger, while the incoming session checks those notes against the repository before it continues.

These rules are less about ceremony than about shared-disk reality. Multiple agents and engineers can touch the same Git object store and runner pool at once; the workflow now treats that as normal operating context.

## Four Repositories, Then Three Again

That same concern with coordination overhead also reshaped the repository map. The ecosystem briefly expanded when BeaverNest split into its own repository. The goal was an open-source personal operating layer built around one maintainer's real workflows, not a generic starter. Its foundation reached `main`: an F#/Giraffe backend, a Vite/React client, contracts, SQLite readiness and migrations, recovery behavior, end-to-end tests, and one combined same-origin runtime.

The split also copied a full governance and CI harness. Within days, the cost became clear. A fourth lane meant another set of rules, bindings, plans, gates, and a diverging `rhino-cli` fork for a product that was still only a walking skeleton.

The endpoint is simpler. BeaverNest now lives inside `ose-public` as `beavernest-be` and `beavernest-app-web`, with its specs, scheduled local-test workflow, product vision, and unique idea briefs.

The standalone repository was archived rather than deleted, preserving its history and existing links. The generic governance fork was discarded in favor of the upstream source of truth.

This consolidation does **not** mean BeaverNest is a finished product. It still has no assistant, content builder, posting workflow, or live staging or production deployment. It means the product can grow without forcing the same small team to maintain a fourth engineering-governance surface.

At the same time, `ose-infra` became the private sibling, which better describes its actual role: private infrastructure, operations, and product-support work around the public platform. The official OSE family is therefore back to three repositories. `ose-public` holds the public products, libraries, documentation, and governance source of truth. `ose-primer` remains the downstream starter and polyglot reference repository, while the private sibling holds proprietary infrastructure and operational work.

The operational boundary is settled, but the wording has not fully converged yet. A few active documents in the sibling repositories still describe the short-lived four-repository state. Those references need normal cross-repository reconciliation; they are not evidence that the archived repository remains live.

## Infrastructure: Better Diagnosis, Different Destination

With the repository roles clearer, the private sibling remained focused on the operational work. The twin-k3s-cluster milestone still did not ship. During the month, the design first moved toward a shared three-node on-premise cluster, then Kubernetes moved back into the cloud backlog. The local hosts now focus on CI and platform virtual machines instead.

That change followed real operational learning. Repeated host disappearances were traced to an onboard network adapter whose transmit path could wedge while the physical link still appeared up. The response disabled aggravating offloads, added a watchdog for the failure signature, and moved alerting away from the same interface it needed to diagnose. Runner recovery, probes, and jobs were validated on additional runner lanes, while later lockups were recorded rather than prematurely declared solved.

The private sibling also tightened its local CoralPolyp sandbox so Linux test processes cannot escape the intended network boundary or interfere with the host user's service manager. CoralPolyp's full CI E2E recovery remains an open plan, not a completed result.

## ose-primer: A Clearer First Run

Meanwhile, `ose-primer` absorbed the shared governance and gate changes on its own synchronization cadence.

Its reader path improved as well. Setup became noninteractive, generated Next.js declarations stopped polluting Git status, cross-platform validation recovered, and the frontend examples now make their reference role explicit instead of implying that every client is equally complete.

The larger onboarding refresh is still in progress across all three repositories. Its goal is simple to state and harder to deliver: a newcomer should understand what each repository is for, run one representative surface, see the expected result, and recover from common failures without reconciling contradictory READMEs.

## Numerical Snapshot

At the endpoint, 72 course directories sit in the shared ayokoding.com course library. The prerequisite schema and path-aware interface are live, while the real ordered manifests remain pending.

On validation, the Mermaid parser fix turned 2,851 previously skipped blocks into genuinely checked content and exposed 665 violations in `ose-public`.

One `repo-config.yml` registry now declares the commit-message, pre-commit, pre-push, and CI surfaces. The PR matrix derives most jobs from it, while conformance covers the deliberately hand-wired jobs. Quick tests and the Rust build footprint fell substantially, CI runner time nearly halved, and CI wall-clock and cache use regressed.

The short-lived BeaverNest repository was archived after its product surface moved into `ose-public`, returning the maintained OSE family to three repositories.

## What's Next

The immediate work is narrower than last month's ambition list.

Across the three repositories, the onboarding and README refresh still needs clean-checkout verification.

In the private sibling, CoralPolyp's CI E2E path needs recovery before the private backend can be treated as deployable.

BeaverNest can begin its first real capability inside `ose-public` when that capability is clear, without overstating the current skeleton as a usable personal operating system.

We will take another pass at CI performance in the near future.

The platform backend and a production Kubernetes environment remain unshipped. Even so, readers gained useful material, maintainers gained gates they can inspect, and several plans changed course when the evidence demanded it.

Every commit is visible on [GitHub](https://github.com/wahidyankf/ose-public). `ose-primer` lives at <https://github.com/wahidyankf/ose-primer>. Updates are published here on oseplatform.com, with educational content on [ayokoding.com](https://ayokoding.com) and the personal portfolio at [wahidyankf.com](https://www.wahidyankf.com/).

We continue to publish rolling platform updates. Subscribe to the RSS feed or check back as the work evolves, Insha Allah.
