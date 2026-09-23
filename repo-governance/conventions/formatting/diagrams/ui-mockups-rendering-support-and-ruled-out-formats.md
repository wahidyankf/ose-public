---
description: "Compares which mockup formats render properly across viewing surfaces, and lists formats that are ruled out and why."
when_to_use: "Use when choosing a mockup format and need to confirm it will render on GitHub, IDEs, and other required surfaces."
---

# UI Mockups in Plan Docs: Rendering-Support Matrix and Ruled-Out Formats

## Rendering-Support Matrix

The following rendering-support matrix summarises the candidate formats evaluated during the
research that produced this section (research in
tech-docs.md):

| Format                           | VSCode built-in | VSCode + extension      | GitHub.com              | Diffable      | Lint-safe |
| -------------------------------- | --------------- | ----------------------- | ----------------------- | ------------- | --------- |
| **ASCII wireframe (code block)** | Renders         | —                       | Renders                 | Excellent     | Yes       |
| **`.excalidraw.png` + `![]()`**  | Renders (image) | Edit: pomdtr Excalidraw | Renders                 | No (binary)   | Yes       |
| **Plain `.png` screenshot**      | Renders         | —                       | Renders                 | No (binary)   | Yes       |
| `.excalidraw.svg` + `![]()`      | Renders (image) | Edit: pomdtr Excalidraw | Renders (font fallback) | Partial (XML) | Yes       |
| Inline HTML + CSS                | Renders fully   | —                       | **Style stripped**      | Yes           | Yes       |
| Mermaid                          | Renders         | —                       | Renders                 | Yes           | Yes       |
| MDX (`.mdx`)                     | No              | —                       | No                      | Yes           | n/a       |
| Inline `<svg>` in `.md`          | Renders         | —                       | **Stripped**            | Yes           | Yes       |

## Ruled-Out Formats

The following ruled-out table lists formats that MUST NOT be used for plan-doc UI mockups, each
with a one-line reason:

| Option               | Why not (for plan docs)                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Inline HTML + CSS    | GitHub strips `style=`/`class`/`id` → renders unstyled on GitHub; VSCode-only.    |
| MDX (`.mdx`)         | Needs a build/runtime; renders on neither GitHub nor VSCode preview as plan docs. |
| Mermaid as wireframe | No wireframe diagram type; repo validator caps layout. Flowchart ≠ UI.            |
| `.excalidraw.svg`    | Excalidraw fonts blocked by GitHub CSP → text falls back to generic font.         |

**Why inline HTML+CSS fails on GitHub**: GitHub's Markdown sanitizer removes `style=`, `class`,
`id`, `<style>`, and `<script>` entirely — only a legacy set of presentation attributes survives
(`align`, `border`, `color`, `width`, `height`, `colspan`, `rowspan`, `href`, `src`, `alt`).
An `<div style="...">` mockup renders fully in VSCode but becomes an unstyled bare element on
GitHub. [Web-cited: `rhysd/marked-sanitizer-github` confirms `style`, `class`, `id` absent from
the allowed-attribute list; accessed 2026-06-16]

**Why `.excalidraw.png` is required over `.excalidraw.svg`**: Excalidraw's custom hand-drawn fonts
(Virgil, Cascadia) load from a CDN that GitHub's CSP blocks for SVG files, so `.excalidraw.svg`
text labels fall back to a generic font on GitHub. `.excalidraw.png` rasterises the fonts and
renders faithfully. [Web-cited: excalidraw/excalidraw#4855 confirms font CSP fallback on GitHub;
accessed 2026-06-16]
