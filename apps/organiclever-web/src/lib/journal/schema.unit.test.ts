import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { ArrayFormatter } from "effect/ParseResult";
import { EntryId, IsoTimestamp, EntryName, JournalEntry, PayloadFromJsonString } from "./schema";

describe("schema - EntryId", () => {
  it("accepts a plain string as EntryId", () => {
    const result = Schema.decodeUnknownSync(EntryId)("test-id");
    expect(result).toBe("test-id");
  });

  it("rejects non-string as EntryId", () => {
    expect(() => Schema.decodeUnknownSync(EntryId)(42)).toThrow();
  });
});

describe("schema - IsoTimestamp", () => {
  it("accepts valid ISO timestamp with milliseconds and Z", () => {
    const result = Schema.decodeUnknownSync(IsoTimestamp)("2024-01-15T10:30:00.000Z");
    expect(result).toBe("2024-01-15T10:30:00.000Z");
  });

  it("accepts valid ISO timestamp without milliseconds", () => {
    const result = Schema.decodeUnknownSync(IsoTimestamp)("2024-01-15T10:30:00Z");
    expect(result).toBe("2024-01-15T10:30:00Z");
  });

  it("accepts ISO timestamp with timezone offset", () => {
    const result = Schema.decodeUnknownSync(IsoTimestamp)("2024-01-15T10:30:00+07:00");
    expect(result).toBe("2024-01-15T10:30:00+07:00");
  });

  it("rejects non-ISO formatted string", () => {
    expect(() => Schema.decodeUnknownSync(IsoTimestamp)("not-a-timestamp")).toThrow();
  });

  it("rejects date-only string", () => {
    expect(() => Schema.decodeUnknownSync(IsoTimestamp)("2024-01-15")).toThrow();
  });
});

describe("schema - EntryName", () => {
  it("accepts valid lowercase kebab-case name", () => {
    const result = Schema.decodeUnknownSync(EntryName)("workout");
    expect(result).toBe("workout");
  });

  it("accepts name with numbers", () => {
    const result = Schema.decodeUnknownSync(EntryName)("workout-set-1");
    expect(result).toBe("workout-set-1");
  });

  it("rejects name with uppercase letters", () => {
    expect(() => Schema.decodeUnknownSync(EntryName)("INVALID")).toThrow();
  });

  it("rejects name starting with a number", () => {
    expect(() => Schema.decodeUnknownSync(EntryName)("1-invalid")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => Schema.decodeUnknownSync(EntryName)("")).toThrow();
  });

  it("rejects name with spaces", () => {
    expect(() => Schema.decodeUnknownSync(EntryName)("has space")).toThrow();
  });

  it("rejects name longer than 64 characters", () => {
    const longName = "a" + "-b".repeat(32); // 65 chars
    expect(() => Schema.decodeUnknownSync(EntryName)(longName)).toThrow();
  });
});

describe("schema - JournalEntry", () => {
  it("decodes a valid JournalEntry", () => {
    const raw = {
      id: "entry-1",
      name: "workout",
      payload: { reps: 12 },
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-15T10:30:00.000Z",
    };
    const result = Schema.decodeUnknownSync(JournalEntry)(raw);
    expect(result.id).toBe("entry-1");
    expect(result.name).toBe("workout");
    expect(result.payload).toEqual({ reps: 12 });
  });

  it("rejects JournalEntry with invalid name", () => {
    const raw = {
      id: "entry-1",
      name: "INVALID_NAME",
      payload: {},
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-15T10:30:00.000Z",
    };
    expect(() => Schema.decodeUnknownSync(JournalEntry)(raw)).toThrow();
  });
});

describe("schema - PayloadFromJsonString", () => {
  it("accepts valid JSON string representing a record", () => {
    const result = Schema.decodeUnknownSync(PayloadFromJsonString)('{"reps":12}');
    expect(result).toEqual({ reps: 12 });
  });

  it("rejects non-JSON string", () => {
    expect(() => Schema.decodeUnknownSync(PayloadFromJsonString)("not json")).toThrow();
  });

  it("rejects JSON array (not a record)", () => {
    expect(() => Schema.decodeUnknownSync(PayloadFromJsonString)("[1,2,3]")).toThrow();
  });
});

describe("schema - ArrayFormatter error paths", () => {
  it("produces field-level paths on JournalEntry decode failure", () => {
    const raw = {
      id: "entry-1",
      name: "INVALID_NAME",
      payload: {},
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-15T10:30:00.000Z",
    };
    const result = Schema.decodeUnknownEither(JournalEntry)(raw);
    if (result._tag === "Left") {
      const issues = ArrayFormatter.formatErrorSync(result.left);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty("path");
      expect(issues[0]).toHaveProperty("message");
    } else {
      throw new Error("Expected decode to fail");
    }
  });
});
