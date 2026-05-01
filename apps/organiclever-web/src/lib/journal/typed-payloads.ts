import { Schema } from "effect";

// ---------------------------------------------------------------------------
// Primitive enumerations
// ---------------------------------------------------------------------------

export const Hue = Schema.Literal("terracotta", "honey", "sage", "teal", "sky", "plum");
export type Hue = typeof Hue.Type;

export const ExerciseType = Schema.Literal("reps", "duration", "oneoff");
export type ExerciseType = typeof ExerciseType.Type;

export const TimerMode = Schema.Literal("countdown", "countup");
export type TimerMode = typeof TimerMode.Type;

// ---------------------------------------------------------------------------
// Exercise sub-types
// ---------------------------------------------------------------------------

export const ExerciseTemplate = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  type: ExerciseType,
  targetSets: Schema.Number,
  targetReps: Schema.Number,
  targetWeight: Schema.NullOr(Schema.String),
  targetDuration: Schema.NullOr(Schema.Number),
  timerMode: TimerMode,
  bilateral: Schema.Boolean,
  dayStreak: Schema.Number,
  restSeconds: Schema.NullOr(Schema.Number),
});
export type ExerciseTemplate = typeof ExerciseTemplate.Type;

export const CompletedSet = Schema.Struct({
  reps: Schema.NullOr(Schema.Number),
  weight: Schema.NullOr(Schema.String),
  duration: Schema.NullOr(Schema.Number),
  restTaken: Schema.NullOr(Schema.Number),
});
export type CompletedSet = typeof CompletedSet.Type;

export const ActiveExercise = Schema.Struct({
  ...ExerciseTemplate.fields,
  sets: Schema.Array(CompletedSet),
});
export type ActiveExercise = typeof ActiveExercise.Type;

// ---------------------------------------------------------------------------
// Per-kind payload structs
// ---------------------------------------------------------------------------

export const WorkoutPayload = Schema.Struct({
  routineName: Schema.NullOr(Schema.String),
  durationSecs: Schema.Number,
  exercises: Schema.Array(ActiveExercise),
});
export type WorkoutPayload = typeof WorkoutPayload.Type;

export const ReadingPayload = Schema.Struct({
  title: Schema.String,
  author: Schema.NullOr(Schema.String),
  pages: Schema.NullOr(Schema.Number),
  durationMins: Schema.NullOr(Schema.Number),
  completionPct: Schema.NullOr(Schema.Number),
  notes: Schema.NullOr(Schema.String),
});
export type ReadingPayload = typeof ReadingPayload.Type;

export const LearningPayload = Schema.Struct({
  subject: Schema.String,
  source: Schema.NullOr(Schema.String),
  durationMins: Schema.NullOr(Schema.Number),
  rating: Schema.NullOr(Schema.Number),
  notes: Schema.NullOr(Schema.String),
});
export type LearningPayload = typeof LearningPayload.Type;

export const MealPayload = Schema.Struct({
  name: Schema.String,
  mealType: Schema.NullOr(Schema.String),
  energyLevel: Schema.NullOr(Schema.Number),
  notes: Schema.NullOr(Schema.String),
});
export type MealPayload = typeof MealPayload.Type;

export const FocusPayload = Schema.Struct({
  task: Schema.NullOr(Schema.String),
  durationMins: Schema.NullOr(Schema.Number),
  quality: Schema.NullOr(Schema.Number),
  notes: Schema.NullOr(Schema.String),
});
export type FocusPayload = typeof FocusPayload.Type;

export const CustomPayload = Schema.Struct({
  name: Schema.String,
  hue: Hue,
  icon: Schema.String,
  durationMins: Schema.NullOr(Schema.Number),
  notes: Schema.NullOr(Schema.String),
});
export type CustomPayload = typeof CustomPayload.Type;

// ---------------------------------------------------------------------------
// Shared entry envelope fields (common to every TypedEntry member)
// Use plain Schema.String to accept both branded and unbranded string values
// coming from decoded JournalEntry rows.
// ---------------------------------------------------------------------------

const EntryEnvelope = {
  id: Schema.String,
  startedAt: Schema.String,
  finishedAt: Schema.String,
  labels: Schema.Array(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
} as const;

// ---------------------------------------------------------------------------
// TypedEntry — discriminated union on the `name` field (kind slug)
// ---------------------------------------------------------------------------

export const TypedEntry = Schema.Union(
  Schema.Struct({
    ...EntryEnvelope,
    name: Schema.Literal("workout"),
    payload: WorkoutPayload,
  }),
  Schema.Struct({
    ...EntryEnvelope,
    name: Schema.Literal("reading"),
    payload: ReadingPayload,
  }),
  Schema.Struct({
    ...EntryEnvelope,
    name: Schema.Literal("learning"),
    payload: LearningPayload,
  }),
  Schema.Struct({
    ...EntryEnvelope,
    name: Schema.Literal("meal"),
    payload: MealPayload,
  }),
  Schema.Struct({
    ...EntryEnvelope,
    name: Schema.Literal("focus"),
    payload: FocusPayload,
  }),
  // Custom kinds use a "custom-" prefix; no fixed literal — use filter instead
  Schema.Struct({
    ...EntryEnvelope,
    name: Schema.String.pipe(
      Schema.filter((s): s is string => s.startsWith("custom-"), {
        message: () => "custom entry name must start with 'custom-'",
      }),
    ),
    payload: CustomPayload,
  }),
);
export type TypedEntry = typeof TypedEntry.Type;
