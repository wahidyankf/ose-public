---
description: The six compliance checks for an FP-variant page, which are checker-automated versus AI-judgement, and the maker/checker/fixer agents that implement this convention.
when_to_use: Use when auditing an FP-variant page for compliance or looking up which agent creates, checks, or fixes FP-variant content.
---

# Validation and Tools and Automation

## Validation

The following checks determine whether an FP-variant by-example page complies with this convention:

1. **Tabs format**: Does every code example use `{{< tabs items="F#,Clojure" >}}` with F# as the first tab?
2. **F# idiomatic patterns**: Does the F# tab use DUs, records, smart constructors, `Result`, computation expressions, `|>` pipelines, and pattern matching at the appropriate level? Does it avoid untyped maps or runtime dispatch as primary patterns?
3. **Clojure idiomatic patterns**: Does the Clojure tab use maps with namespaced keywords, multimethods or protocols, threading macros, and spec/malli at the appropriate level? Does it avoid forced record or class simulations as primary patterns?
4. **Bidirectional rule**: Is idiomatic divergence between tabs retained rather than normalised?
5. **Cross-paradigm annotations**: When a concept is language-specific, does the other tab include a `// [Clojure: ...]` or `; [F#: ...]` annotation?
6. **Annotation density**: Does each tab's code block meet the 1.0–2.25 comment-to-code ratio?

`tutorial-by-example-checker` enforces checks 1, 5, and 6. Checks 2, 3, and 4 require AI semantic judgement and are part of the checker's content audit pass.

## Tools and Automation

- **`apps-ayokoding-www-by-example-maker`** — creates FP-variant by-example content; responsible for applying this convention when generating or updating F# + Clojure tabs.
- **`tutorial-by-example-checker`** — validates tabs format, annotation density, and cross-paradigm annotation presence.
- **`tutorial-by-example-fixer`** — applies fixes to non-compliant pages (adds missing tabs, adds missing annotations, adjusts annotation density).
