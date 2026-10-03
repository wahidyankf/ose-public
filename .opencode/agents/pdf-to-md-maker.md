---
description: |-
  Converts PDF files to verbatim Markdown: text PDFs via pdftotext, image-only PDFs via OCR (tesseract), diagrams to Mermaid, and large files in 50-page chunks. By default it writes the .md beside the PDF under the same name.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pdf-to-md-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
