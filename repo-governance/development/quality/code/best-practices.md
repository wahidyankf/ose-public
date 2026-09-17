---
description: "Best practices for working with the code-quality tooling."
when_to_use: "Use for a quick best-practice reminder on code quality."
---

# Best Practices

1. **Trust the Tools**: Let Prettier handle formatting - don't fight it
2. **Commit Often**: Smaller commits = faster hook execution
3. **Fix Issues Immediately**: Don't accumulate quality debt
4. **Don't Bypass**: Resist temptation to use `--no-verify`
5. **Keep Updated**: Run `./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` after pulling
   changes to sync hook versions
