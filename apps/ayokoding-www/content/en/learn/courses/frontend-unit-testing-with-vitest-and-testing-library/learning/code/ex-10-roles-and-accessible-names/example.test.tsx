// @vitest-environment jsdom
// => DOM pragma again: every query example needs a document to scan.

import { afterEach, expect, test } from "vitest";
// => Runner vocabulary stays minimal: the queries carry the lesson.

import { cleanup, render, screen } from "@testing-library/react";
// => Same three RTL imports as Example 9: the query surface is consistent.

import "@testing-library/jest-dom/vitest";
// => DOM matchers registered again: each file stands alone, no shared setup.

import React from "react";
// => JSX below renders a small page fragment with three named elements.

afterEach(() => {
  cleanup();
  // => Isolation hook repeated: every UI file in this course carries it.
});

test("every landmark names itself accessibly", async () => {
  // => One render, three queries: each asserts a different naming mechanism.
  // => Three naming rules in one case: the priority order made concrete.
  render(
    <main>
      {/* => main gives the page its landmark region for jumping around. */}
      {/* => Landmarks let assistive tech skip straight to content: free wins. */}
      <h1>Checkout</h1>
      {/* => Heading text becomes the heading name with zero extra markup. */}
      {/* => h1 level plus text: level from the tag, name from the content. */}
      <a href="/help">Get help</a>
      {/* => Link text becomes the link name: visible text wins again. */}
      {/* => href carries navigation; the NAME carries meaning: assert both. */}
      <img src="/logo.png" alt="AyoKoding logo" />
      {/* => alt text becomes the img name: images must never be nameless. */}
      {/* => Decorative images take alt="": named or hidden, never ambiguous. */}
    </main>,
    // => main closes the landmark: everything testable lives inside it.
  );
  // => One fragment, three roles: heading, link, img each announce a name.
  // => Fragment renders without extra DOM: queries see exactly these three.
  expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  // => Headings: name comes from text content, level from h1-h6 tag.
  // => Level implied by h1: screen readers announce heading level one.
  expect(screen.getByRole("link", { name: "Get help" })).toHaveAttribute(
    "href",
    "/help",
    // => Attribute name, then value: toHaveAttribute takes both explicitly.
  );
  // => Links: name from text, href asserted separately as behavior, not name.
  // => toHaveAttribute keeps navigation targets pinned without snapshots.
  // => Splitting name from href: copy changes and URL changes fail separately.
  expect(
    screen.getByRole("img", { name: "AyoKoding logo" }),
    // => img query by alt-derived name: the ONLY way to find images accessibly.
  ).toBeInTheDocument();
  // => Images: alt text is the ONLY name source; empty alt hides the image.
  // => Three roles, three naming rules, one query API: that is the priority.
  // => Priority order practiced: role first, name second, nothing else needed.
});
