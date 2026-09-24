---
description: The most common errors an on-demand Commitlint run reports, and how to fix each one.
when_to_use: Use when an on-demand Commitlint run or a reviewer flags a malformed message and you need to fix the specific error.
---

# Common Errors and Fixes

No hook runs Commitlint; these are the errors it reports when you run it yourself, as described in
[How It's Checked](./how-its-enforced.md). Reviewers flag the same problems.

## Error: "type may not be empty"

**Problem**: Missing commit type

```bash
FAIL: update documentation
```

**Fix**: Add a valid type

```bash
PASS: docs: update documentation
```

## Error: "subject may not be empty"

**Problem**: Missing description after colon

```bash
FAIL: feat:
```

**Fix**: Add description

```bash
PASS: feat: add login functionality
```

## Error: "header must not be longer than 100 characters"

**Problem**: Header line too long. Commitlint's limit is 100; the 50-character figure elsewhere in
these docs is a readability target, not what Commitlint rejects.

```bash
FAIL: feat(auth): add multi-provider authentication covering OAuth 2.0, SAML, API keys, and session refresh
```

**Fix**: Shorten description, add details to body

```bash
PASS: feat(auth): add multi-provider authentication

Supports OAuth 2.0, SAML, and API key authentication.
```

## Error: "type must be lowercase"

**Problem**: Type in wrong case

```bash
FAIL: Feat: add login
FAIL: FEAT: add login
```

**Fix**: Use lowercase

```bash
PASS: feat: add login
```

## Error: "body's lines must not be longer than 100 characters"

**Problem**: Body line exceeds character limit

**Fix**: Break into multiple lines

```bash
PASS: feat: add new feature

This is a longer explanation that has been broken into
multiple lines to ensure each line stays under 100
characters for better readability.
```
