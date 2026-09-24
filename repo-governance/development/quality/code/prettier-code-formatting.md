---
description: "How Prettier formats code in this repository."
when_to_use: "Use when configuring or debugging Prettier formatting."
---

# Prettier - Code Formatting

**Purpose**: Automatically format code to maintain consistent style across the codebase.

**Supported File Types**:

- JavaScript/TypeScript: `*.{js,jsx,ts,tsx,mjs,cjs}`
- JSON: `*.json`
- Markdown: `*.md`
- YAML: `*.{yml,yaml}`
- CSS/SCSS: `*.{css,scss}`
- HTML: `*.html`
- SQL: `*.sql`

**When It Runs**: Automatically on staged files before each commit via the pre-commit hook.

**Configuration**: [`.prettierrc.json`](../../../../.prettierrc.json) sets `printWidth: 120` and
`proseWrap: "preserve"`, loads `prettier-plugin-sql` and `prettier-plugin-tailwindcss`, and points
the Tailwind plugin at its stylesheet; every other option is Prettier's default.
[`.prettierignore`](../../../../.prettierignore) excludes paths from formatting.

**Manual Formatting**: You can manually format files with:

```bash
npx prettier --write [file-path]
```
