import { describe, it, expect } from "vitest";
import { CREATE_TABLES_SQL } from "../../src/infrastructure/db/schema.js";

describe("CREATE_TABLES_SQL", () => {
  it("is a non-empty string", () => {
    expect(typeof CREATE_TABLES_SQL).toBe("string");
    expect(CREATE_TABLES_SQL.length).toBeGreaterThan(0);
  });

  it("contains users table definition", () => {
    expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS users");
  });

  it("contains expenses table definition", () => {
    expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS expenses");
  });

  it("contains attachments table definition", () => {
    expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS attachments");
  });

  it("contains revoked_tokens table definition", () => {
    expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS revoked_tokens");
  });
});
