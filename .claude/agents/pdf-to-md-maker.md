---
description: |-
  Converts PDF files to verbatim Markdown: text PDFs via pdftotext, image-only PDFs via OCR (tesseract), diagrams to Mermaid, and large files in 50-page chunks. By default it writes the .md beside the PDF under the same name.
effort: xhigh
model: sonnet
name: pdf-to-md-maker
skills:
  - docs-converting-pdf-to-markdown
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pdf-to-md-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
