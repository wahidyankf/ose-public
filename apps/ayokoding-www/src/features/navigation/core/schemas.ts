import { z } from "zod";

// Re-export from i18n BC for cross-BC consumption (per i18n glossary)
export { localeSchema, type Locale } from "@/features/i18n/core/schemas";

export const treeNodeSchema: z.ZodType<TreeNodeType> = z.lazy(() =>
  z.object({
    title: z.string(),
    slug: z.string(),
    weight: z.number(),
    isSection: z.boolean(),
    category: z.string().optional(),
    children: z.array(treeNodeSchema),
  }),
);

interface TreeNodeType {
  title: string;
  slug: string;
  weight: number;
  isSection: boolean;
  category?: string;
  children: TreeNodeType[];
}
