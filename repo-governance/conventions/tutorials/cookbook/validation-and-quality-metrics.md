---
description: "Defines the recipe-count-by-category coverage metrics and the automated and manual quality validation checks."
when_to_use: "Read when checking whether a cookbook has enough recipes per category or what an automated checker validates."
---

# Validation and Quality Metrics

## Coverage Metrics

**Recipe count by category**:

- Setup and Configuration: 3-5 recipes
- Data Manipulation: 5-8 recipes
- File Operations: 3-5 recipes
- Network and HTTP: 4-6 recipes
- Concurrency: 3-5 recipes
- Testing: 3-4 recipes
- Performance: 2-4 recipes
- Error Handling: 3-5 recipes
- Security: 3-5 recipes
- Database: 3-5 recipes

**Total**: 30+ recipes (minimum for complete cookbook)

## Quality Validation

**Automated checks** (by content-checker):

- ✅ Recipe has all required sections
- ✅ Code is properly annotated (0.5-1.5 ratio)
- ✅ Problem statement is clear and specific
- ✅ Common Pitfalls section has 3-5 items
- ✅ Related Recipes has 2-4 links
- ✅ Code includes all necessary imports
- ✅ Recipe is in correct category folder

**Manual review checks**:

- ✅ Code actually runs (copy-paste test)
- ✅ Solution solves stated problem
- ✅ Pitfalls are realistic and common
- ✅ Explanation is clear and concise
- ✅ Recipe is self-contained
