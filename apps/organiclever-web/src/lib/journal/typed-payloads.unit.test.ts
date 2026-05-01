import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  TypedEntry,
  WorkoutPayload,
  ReadingPayload,
  LearningPayload,
  MealPayload,
  FocusPayload,
  CustomPayload,
} from "./typed-payloads";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseEnvelope = {
  id: "entry-001",
  startedAt: "2026-05-01T08:00:00.000Z",
  finishedAt: "2026-05-01T09:00:00.000Z",
  labels: [],
  createdAt: "2026-05-01T08:00:00.000Z",
  updatedAt: "2026-05-01T08:00:00.000Z",
};

const decode = Schema.decodeUnknownSync(TypedEntry);

// ---------------------------------------------------------------------------
// Workout kind
// ---------------------------------------------------------------------------

describe("TypedEntry — workout", () => {
  const validWorkoutEntry = {
    ...baseEnvelope,
    name: "workout",
    payload: {
      routineName: "Kettlebell Day",
      durationSecs: 2700,
      exercises: [
        {
          id: "ex-1",
          name: "Kettlebell Swing",
          type: "reps",
          targetSets: 3,
          targetReps: 20,
          targetWeight: "24 kg",
          targetDuration: null,
          timerMode: "countdown",
          bilateral: false,
          dayStreak: 5,
          restSeconds: 60,
          sets: [{ reps: 20, weight: "24 kg", duration: null, restTaken: 58 }],
        },
      ],
    },
  } as const;

  it("decodes a valid workout entry", () => {
    const result = decode(validWorkoutEntry);
    expect(result.name).toBe("workout");
    const payload = result.payload as WorkoutPayload;
    expect(payload.durationSecs).toBe(2700);
    expect(payload.exercises).toHaveLength(1);
    expect(payload.exercises[0]?.name).toBe("Kettlebell Swing");
  });

  it("accepts null routineName", () => {
    const entry = { ...validWorkoutEntry, payload: { ...validWorkoutEntry.payload, routineName: null } };
    const result = decode(entry);
    expect((result.payload as WorkoutPayload).routineName).toBeNull();
  });

  it("accepts empty exercises array", () => {
    const entry = { ...validWorkoutEntry, payload: { ...validWorkoutEntry.payload, exercises: [] } };
    const result = decode(entry);
    expect((result.payload as WorkoutPayload).exercises).toHaveLength(0);
  });

  it("rejects workout name with reading payload fields", () => {
    const bad = {
      ...baseEnvelope,
      name: "workout",
      payload: {
        title: "Clean Code",
        author: "Robert Martin",
        pages: 431,
        durationMins: 45,
        completionPct: 100,
        notes: null,
      },
    };
    expect(() => decode(bad)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Reading kind
// ---------------------------------------------------------------------------

describe("TypedEntry — reading", () => {
  const validReadingEntry = {
    ...baseEnvelope,
    name: "reading",
    payload: {
      title: "Clean Code",
      author: "Robert C. Martin",
      pages: 431,
      durationMins: 45,
      completionPct: 100,
      notes: "Great chapter on naming conventions",
    },
  } as const;

  it("decodes a valid reading entry", () => {
    const result = decode(validReadingEntry);
    expect(result.name).toBe("reading");
    const payload = result.payload as ReadingPayload;
    expect(payload.title).toBe("Clean Code");
    expect(payload.author).toBe("Robert C. Martin");
  });

  it("accepts all nullable fields as null", () => {
    const entry = {
      ...baseEnvelope,
      name: "reading",
      payload: {
        title: "Minimal Book",
        author: null,
        pages: null,
        durationMins: null,
        completionPct: null,
        notes: null,
      },
    };
    const result = decode(entry);
    const payload = result.payload as ReadingPayload;
    expect(payload.author).toBeNull();
    expect(payload.pages).toBeNull();
    expect(payload.completionPct).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Learning kind
// ---------------------------------------------------------------------------

describe("TypedEntry — learning", () => {
  it("decodes a valid learning entry", () => {
    const entry = {
      ...baseEnvelope,
      name: "learning",
      payload: {
        subject: "Effect-TS Schema",
        source: "Official docs",
        durationMins: 60,
        rating: 5,
        notes: "Excellent library",
      },
    };
    const result = decode(entry);
    expect(result.name).toBe("learning");
    const payload = result.payload as LearningPayload;
    expect(payload.subject).toBe("Effect-TS Schema");
    expect(payload.rating).toBe(5);
  });

  it("accepts null optional fields", () => {
    const entry = {
      ...baseEnvelope,
      name: "learning",
      payload: {
        subject: "TypeScript",
        source: null,
        durationMins: null,
        rating: null,
        notes: null,
      },
    };
    const result = decode(entry);
    expect((result.payload as LearningPayload).source).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Meal kind
// ---------------------------------------------------------------------------

describe("TypedEntry — meal", () => {
  it("decodes a valid meal entry", () => {
    const entry = {
      ...baseEnvelope,
      name: "meal",
      payload: {
        name: "Nasi Goreng",
        mealType: "lunch",
        energyLevel: 4,
        notes: "Light and healthy",
      },
    };
    const result = decode(entry);
    expect(result.name).toBe("meal");
    const payload = result.payload as MealPayload;
    expect(payload.name).toBe("Nasi Goreng");
    expect(payload.energyLevel).toBe(4);
  });

  it("accepts null optional fields", () => {
    const entry = {
      ...baseEnvelope,
      name: "meal",
      payload: { name: "Snack", mealType: null, energyLevel: null, notes: null },
    };
    const result = decode(entry);
    const payload = result.payload as MealPayload;
    expect(payload.mealType).toBeNull();
    expect(payload.energyLevel).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Focus kind
// ---------------------------------------------------------------------------

describe("TypedEntry — focus", () => {
  it("decodes a valid focus entry", () => {
    const entry = {
      ...baseEnvelope,
      name: "focus",
      payload: {
        task: "Write typed-payloads module",
        durationMins: 90,
        quality: 5,
        notes: "Deep flow state",
      },
    };
    const result = decode(entry);
    expect(result.name).toBe("focus");
    const payload = result.payload as FocusPayload;
    expect(payload.task).toBe("Write typed-payloads module");
    expect(payload.quality).toBe(5);
  });

  it("accepts all null fields", () => {
    const entry = {
      ...baseEnvelope,
      name: "focus",
      payload: { task: null, durationMins: null, quality: null, notes: null },
    };
    const result = decode(entry);
    const payload = result.payload as FocusPayload;
    expect(payload.task).toBeNull();
    expect(payload.quality).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Custom kind
// ---------------------------------------------------------------------------

describe("TypedEntry — custom", () => {
  it("decodes a custom-meditation entry", () => {
    const entry = {
      ...baseEnvelope,
      name: "custom-meditation",
      payload: {
        name: "Meditation",
        hue: "teal",
        icon: "timer",
        durationMins: 20,
        notes: "Morning session",
      },
    };
    const result = decode(entry);
    expect(result.name).toBe("custom-meditation");
    const payload = result.payload as CustomPayload;
    expect(payload.hue).toBe("teal");
    expect(payload.icon).toBe("timer");
  });

  it("decodes a custom entry with null optional fields", () => {
    const entry = {
      ...baseEnvelope,
      name: "custom-journaling",
      payload: {
        name: "Journaling",
        hue: "plum",
        icon: "plus-circle",
        durationMins: null,
        notes: null,
      },
    };
    const result = decode(entry);
    const payload = result.payload as CustomPayload;
    expect(payload.durationMins).toBeNull();
    expect(payload.notes).toBeNull();
  });

  it("rejects a custom entry with an invalid hue", () => {
    const entry = {
      ...baseEnvelope,
      name: "custom-yoga",
      payload: {
        name: "Yoga",
        hue: "purple",
        icon: "zap",
        durationMins: 30,
        notes: null,
      },
    };
    expect(() => decode(entry)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Unknown / invalid name rejection
// ---------------------------------------------------------------------------

describe("TypedEntry — invalid names", () => {
  it("rejects an unknown name 'unknown'", () => {
    const entry = {
      ...baseEnvelope,
      name: "unknown",
      payload: { title: "Irrelevant", author: null, pages: null, durationMins: null, completionPct: null, notes: null },
    };
    expect(() => decode(entry)).toThrow();
  });

  it("rejects an empty name string", () => {
    const entry = {
      ...baseEnvelope,
      name: "",
      payload: { name: "X", hue: "sage", icon: "zap", durationMins: null, notes: null },
    };
    expect(() => decode(entry)).toThrow();
  });

  it("rejects 'custom' without a suffix (must be 'custom-*')", () => {
    const entry = {
      ...baseEnvelope,
      name: "custom",
      payload: { name: "X", hue: "sage", icon: "zap", durationMins: null, notes: null },
    };
    expect(() => decode(entry)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Field-level error surfacing
// ---------------------------------------------------------------------------

describe("TypedEntry — field-level decode errors", () => {
  it("surfaces an error when durationSecs is missing from workout payload", () => {
    const entry = {
      ...baseEnvelope,
      name: "workout",
      payload: {
        routineName: null,
        // durationSecs intentionally omitted
        exercises: [],
      },
    };
    let caughtMessage = "";
    try {
      decode(entry);
    } catch (e) {
      caughtMessage = String(e);
    }
    expect(caughtMessage).not.toBe("");
  });

  it("surfaces an error when reading payload is missing required title field", () => {
    const entry = {
      ...baseEnvelope,
      name: "reading",
      payload: {
        // title intentionally omitted
        author: null,
        pages: null,
        durationMins: null,
        completionPct: null,
        notes: null,
      },
    };
    expect(() => decode(entry)).toThrow();
  });
});
