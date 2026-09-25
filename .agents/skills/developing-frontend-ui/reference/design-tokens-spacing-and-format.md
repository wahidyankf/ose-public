# Design Tokens — Spacing and Format Reference

## Spacing Scale (4pt System)

| Token        | Value     | Tailwind                 | Pixels |
| ------------ | --------- | ------------------------ | ------ |
| `--space-1`  | `0.25rem` | `p-1`, `m-1`, `gap-1`    | 4px    |
| `--space-2`  | `0.5rem`  | `p-2`, `m-2`, `gap-2`    | 8px    |
| `--space-3`  | `0.75rem` | `p-3`, `m-3`, `gap-3`    | 12px   |
| `--space-4`  | `1rem`    | `p-4`, `m-4`, `gap-4`    | 16px   |
| `--space-6`  | `1.5rem`  | `p-6`, `m-6`, `gap-6`    | 24px   |
| `--space-8`  | `2rem`    | `p-8`, `m-8`, `gap-8`    | 32px   |
| `--space-12` | `3rem`    | `p-12`, `m-12`, `gap-12` | 48px   |
| `--space-16` | `4rem`    | `p-16`, `m-16`, `gap-16` | 64px   |

## Token Format Differences

**organiclever-www (double indirection)**:

```css
@theme {
  --color-primary: hsl(var(--primary));
}
:root {
  --primary: 0 0% 9%;
}
```

**ayokoding-web (direct values)**:

```css
@theme {
  --color-primary: hsl(221.2 83.2% 53.3%);
}
```

**Recommended for shared lib**: Direct value approach (ayokoding-web pattern) — simpler, no intermediate variable. Per-app overrides use CSS cascade in their own `@theme` block.

> **Caveat — `@theme` can silently drop a declaration**: Tailwind v4's `@theme {}` block is not a
> transparent pass-through to `:root` — it runs through Lightning CSS's theme-token compiler, which
> has been observed to silently drop a newly added custom-property declaration (no build error, no
> warning) even when it is shaped identically to neighboring declarations that resolve fine. Verify
> any new `@theme` custom property via `getComputedStyle(document.documentElement).getPropertyValue("--your-token")`
> on a live page before trusting it.
