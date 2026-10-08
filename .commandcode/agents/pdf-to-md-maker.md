---
description: |-
  Converts PDF files to verbatim Markdown: text PDFs via pdftotext, image-only PDFs via OCR (tesseract), diagrams to Mermaid, and large files in 50-page chunks. By default it writes the .md beside the PDF under the same name.
disallowedTools: |-
  agent, agent_output
name: pdf-to-md-maker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pdf-to-md-maker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
