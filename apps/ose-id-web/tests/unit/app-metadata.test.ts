/**
 * The document metadata is part of the "this is not a sign-in page" contract: the title names a
 * status surface and the shell asks not to be indexed, because an inert identity host has nothing
 * a search engine should surface.
 */
import { describe, expect, it } from "vitest";
import { siteMetadata } from "../../src/app/metadata";

describe("site metadata", () => {
  it("titles the document as a status surface", () => {
    expect(siteMetadata.title).toEqual({ default: "OSE ID service status", template: "%s | OSE ID" });
  });

  it("states that authentication is not enabled", () => {
    expect(siteMetadata.description).toContain("Authentication is not enabled");
  });

  it("asks search engines not to index the shell", () => {
    expect(siteMetadata.robots).toEqual({ index: false, follow: false });
  });
});
