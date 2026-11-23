"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@open-sharia-enterprise/web-ui";
import { useSearchOpen } from "@/features/search/shell/use-search";
import { trpcClient } from "@/lib/trpc/client";
import type { SearchResult } from "@/features/content/core/types";

export function SearchDialog() {
  const router = useRouter();
  const { open, setOpen } = useSearchOpen();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await trpcClient.search.query.query({ query, limit: 10 });
        setResults(data);
      } catch {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      router.push(`/${slug}/`);
    },
    [router, setOpen],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search for a page...</DialogDescription>
        </DialogHeader>
        {/* Server filters via search.query; disable cmdk client-side filtering so
            results whose slug differs from the query text stay visible. */}
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group]:px-2 **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput placeholder="Search pages..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{query.length < 2 ? "Type to search..." : "No results found."}</CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem key={result.slug} value={result.slug} onSelect={() => handleSelect(result.slug)}>
                    <div>
                      <div className="font-medium">{result.title}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">{result.excerpt}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
