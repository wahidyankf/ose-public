import { describe, it, expect } from "vitest";

const FILENAME_RX = /^(\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60})\.ts$/;

describe("gen-migrations filename validation", () => {
  it("accepts valid migration filename", () => {
    expect(FILENAME_RX.test("2026_04_28T14_05_30__create_journal_entries_table.ts")).toBe(true);
  });

  it("rejects filename without timestamp prefix", () => {
    expect(FILENAME_RX.test("bad_filename.ts")).toBe(false);
  });

  it("rejects filename with uppercase letters in description", () => {
    expect(FILENAME_RX.test("2026_04_28T14_05_30__BadName.ts")).toBe(false);
  });

  it("rejects filename with spaces", () => {
    expect(FILENAME_RX.test("2026_04_28T14_05_30__bad name.ts")).toBe(false);
  });

  it("rejects filename with wrong date separator (dashes instead of underscores)", () => {
    expect(FILENAME_RX.test("2026-04-28T14-05-30__some_name.ts")).toBe(false);
  });

  it("rejects filename with description containing hyphens", () => {
    // hyphens not allowed in the description part (only a-z0-9_)
    expect(FILENAME_RX.test("2026_04_28T14_05_30__some-name.ts")).toBe(false);
  });

  it("rejects filename that does not end in .ts", () => {
    expect(FILENAME_RX.test("2026_04_28T14_05_30__create_table.sql")).toBe(false);
  });

  it("accepts filename with numbers in description", () => {
    expect(FILENAME_RX.test("2026_04_28T14_05_30__add_index_v2.ts")).toBe(true);
  });
});
