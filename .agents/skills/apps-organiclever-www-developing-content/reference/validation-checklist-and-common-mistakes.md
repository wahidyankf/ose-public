# organiclever-www — Content Validation Checklist and Common Mistakes

## Content Validation Checklist

Before committing changes:

- [ ] TypeScript types are correct (no `any` without justification)
- [ ] Client components have `"use client"` directive
- [ ] Server components do NOT have `"use client"` directive
- [ ] Images use Next.js `<Image>` component (not `<img>`)
- [ ] Links use Next.js `<Link>` component (not `<a>` for internal links)
- [ ] All interactive elements are keyboard accessible
- [ ] `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www:lint`
      exits 0 (0 boundary errors)

## Common Mistakes

### ❌ Mistake 1: Putting business logic in `src/app/` page files

**Wrong**: Business logic in `page.tsx`

**Right**: Business logic in the feature context's `application/` or `presentation/` layers; `page.tsx` only renders the screen component.

### ❌ Mistake 2: Importing from another context's internal files

**Wrong**: `import { journalStore } from "@/contexts/journal/infrastructure/journal-store"` from settings

**Right**: `import { appendEntry } from "@/contexts/journal/application"` — always go through the barrel

### ❌ Mistake 3: Forgetting `"use client"` for interactive components

```typescript
// Wrong - useState in server component causes runtime error
export default function Counter() {
  const [count, setCount] = useState(0); // Error!
}

// Right
("use client");
export default function Counter() {
  const [count, setCount] = useState(0);
}
```

### ❌ Mistake 4: Direct commits to prod-organiclever-www

**Wrong**: `git checkout prod-organiclever-www && git commit`

**Right**: Commit to `main`, use `apps-organiclever-app-web-deployer` agent to force-push
