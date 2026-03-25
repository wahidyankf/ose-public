import path from "node:path";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ContentService } from "@/server/content/service";
import { FileSystemContentRepository } from "@/server/content/repository-fs";

export interface TRPCContext {
  contentService: ContentService;
}

const searchDataPath = path.resolve(process.cwd(), "generated", "search-data.json");
const defaultContentService = new ContentService(new FileSystemContentRepository(), searchDataPath);

export function createTRPCContext(): TRPCContext {
  return { contentService: defaultContentService };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
