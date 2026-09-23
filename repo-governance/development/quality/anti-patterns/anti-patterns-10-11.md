---
description: "Formatting the entire repo on every commit, mixing test levels."
when_to_use: "Use when reviewing for these two quality anti-patterns."
---

# Anti-Patterns 10-11

## Anti-Pattern 10: Formatting Entire Repo on Every Commit

**Problem**: Pre-commit hook formats all files, not just staged.

**Bad Example:**

```bash
# .husky/pre-commit
prettier --write .  # Formats ALL files (slow!)
git add .           # Stages unintended changes!
```

**Solution:**

```yaml
# repo-config.yml — the format-staged gate receives the staged paths only
- id: format-staged
  type: mutation
  inputs:
    staged:
      kind: files
  mutation:
    local: apply-index # write formatted bytes back to the index
    ci: verify-clean # on pull requests, fail if formatting would change a byte
  command:
    executable: ./scripts/format-staged
    args:
      - input: staged.paths
        expand: repeat
  run-on:
    pre-commit:
      bind:
        staged:
          source: git-index
```

**Rationale:**

- Fast pre-commit (only staged files)
- No unintended changes
- Gradual quality improvement
- Developer-friendly

## Anti-Pattern 11: Mixing Test Levels

**Problem**: Using HTTP dispatch in integration tests, or using a real database in unit tests, conflating what each level is meant to verify.

**Bad Example:**

```rust
// Integration test using HTTP dispatch (wrong for integration level)
#[tokio::test]
async fn create_product() {
    let response = app.oneshot(
        Request::builder().method("POST").uri("/api/products").body(body).unwrap()
    ).await.unwrap();
    assert_eq!(response.status(), StatusCode::CREATED); // HTTP dispatch — belongs in E2E!
}
```

**Solution:**

```rust
// Integration test calling service directly (correct)
#[tokio::test]
async fn create_product() {
    let result = product_service.create(product_data, &real_repo).await;
    assert!(result.is_ok()); // direct call, no HTTP layer
}
```

**Rationale:**

- Integration tests verify persistence and transactions, not HTTP routing
- HTTP contract is verified at E2E level with Playwright
- Mixing levels obscures which concern fails when a test breaks
- Real databases in unit tests make them slow, non-deterministic, and uncacheable

**See**: [Behaviour-Driven Development](../../behaviour-driven-development.md) for the full level definitions and boundaries.
