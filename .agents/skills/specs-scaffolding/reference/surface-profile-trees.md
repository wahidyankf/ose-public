# Surface-Profile Directory Trees

## Input Parameters

- `target` — path under `specs/` where content should be created (required).
- `surface-profile` — one of `full-stack`, `web-only`, `cli-only`, `multi-cli` (optional; defaults
  to `full-stack` when not specified and target is a new app-level path).

Example invocations:

```
# Create a new full-stack app spec area (default)
target: specs/apps/organiclever
surface-profile: full-stack

# Create a web-only app spec area
target: specs/apps/wahidyankf
surface-profile: web-only

# Create a CLI-only app spec area
target: upstream Rhino product specifications
surface-profile: cli-only

# Create a missing README in an existing directory
target: specs/apps/organiclever/app-web/behaviours/health

```

## Full-Stack Profile

```
{target}/
├── README.md
├── product/
│   ├── README.md
│   └── overview.md
├── system-context/
│   ├── README.md
│   └── context.md
├── containers/
│   ├── README.md
│   ├── container.md
│   ├── contracts/
│   │   ├── README.md
│   │   └── openapi.yaml          # stub
│   └── deployment.md
├── components/
│   ├── README.md
│   ├── be/
│   │   ├── README.md
│   │   ├── component-be.md
│   │   └── api.md
│   └── web/
│       ├── README.md
│       ├── component-web.md
│       ├── architecture.md
│       ├── design-system.md
│       └── routes-and-screens.md
└── behaviour/
    ├── README.md
    ├── {product}-be/
    │   └── gherkin/
    │       ├── README.md
    │       └── health/
    │           └── health-check.feature
    └── {product}-web/
        └── gherkin/
            ├── README.md
            └── {domain}/
                └── {feature}.feature
```

## Web-Only Profile

```
{target}/
├── README.md
├── product/
│   ├── README.md
│   └── overview.md
├── system-context/
│   ├── README.md
│   └── context.md
├── containers/
│   ├── README.md
│   ├── container.md
│   └── deployment.md
├── components/
│   ├── README.md
│   └── web/
│       ├── README.md
│       ├── component-web.md
│       ├── architecture.md
│       ├── design-system.md
│       └── routes-and-screens.md
└── behaviour/
    ├── README.md
    └── {product}-web/
        └── gherkin/
            ├── README.md
            └── {domain}/
                └── {feature}.feature
```

## CLI-Only Profile

```
{target}/
├── README.md
├── product/
│   ├── README.md
│   └── overview.md
├── system-context/
│   ├── README.md
│   └── context.md
├── containers/
│   ├── README.md
│   ├── container.md
│   └── deployment.md
├── components/
│   ├── README.md
│   └── cli/
│       ├── README.md
│       └── component-cli.md
└── behaviour/
    ├── README.md
    └── {product}-cli/
        └── gherkin/
            ├── README.md
            └── {domain}/           # domain subdir required (same rule as be/web)
                └── {command}.feature
```

## Multi-CLI Profile

Same as CLI-only, with additional `components/web/` and
`app-web/behaviours/` if the app also has a web surface. Use
`surface-profile: full-stack` if the app has both web and backend surfaces.
