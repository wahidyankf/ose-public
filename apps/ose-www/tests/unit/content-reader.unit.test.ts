import { describe, expect, it } from "vitest";
import { calculateReadingTime, stripMarkdown } from "@/features/content/core/reader";

describe("stripMarkdown", () => {
  it("removes code blocks and inline code", () => {
    expect(stripMarkdown("Before\n```ts\nconst x = 1;\n```\nAfter `code` end")).toBe("Before\nAfter  end");
  });

  it("keeps the words of headings, emphasis, and links, and drops their markup", () => {
    expect(stripMarkdown("## Title\n\n**bold** and *soft* and [a link](https://example.com)")).toBe(
      "Title\nbold and soft and a link",
    );
  });

  it("removes Hugo shortcodes and HTML tags", () => {
    expect(stripMarkdown("{{< note >}}Kept{{< /note >}} <span>tag</span> {{% ref %}}")).toBe("Kept tag");
  });
});

describe("calculateReadingTime", () => {
  it("reads at 200 words per minute and never returns less than one minute", () => {
    expect(calculateReadingTime("")).toBe(1);
    expect(calculateReadingTime(Array.from({ length: 200 }, () => "word").join(" "))).toBe(1);
    expect(calculateReadingTime(Array.from({ length: 201 }, () => "word").join(" "))).toBe(2);
  });
});
