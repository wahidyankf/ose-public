---
description: |-
  Creates LinkedIn posts in social-media-posts/linkedin/ from completed origin/main updates across the ose-public and private-sibling repos, enforcing the 3,000-character body limit (from the "OPEN SHARIA ENTERPRISE" line down) in a professional, engaging tone.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/social-linkedin-post-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
