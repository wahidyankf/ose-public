// journal context — domain layer published API.
//
// Pure types and value objects for the journal aggregate. Effect Schema is
// used here for branded primitive types (`EntryId`, `IsoTimestamp`, etc.)
// and the per-kind typed-payload discriminated union; both are pure value
// representations with no IO.
//
// `errors.ts` defines the tagged error union (`StoreError`) raised by the
// store use-cases. They live in the domain layer because they are pure
// value types describing failure modes of the aggregate, with no
// dependency on Effect runtime services or infrastructure.

export {
  EntryId,
  EntryName,
  EntryPayload,
  IsoTimestamp,
  JournalEntry,
  NewEntryInput,
  UpdateEntryInput,
  PayloadFromJsonString,
} from "./schema";

export type { Hue, ExerciseType, TimerMode } from "./typed-payloads";
export {
  ExerciseTemplate,
  CompletedSet,
  ActiveExercise,
  WorkoutPayload,
  ReadingPayload,
  LearningPayload,
  MealPayload,
  FocusPayload,
  CustomPayload,
  TypedEntry,
} from "./typed-payloads";

export { NotFound, StorageUnavailable, InvalidPayload, EmptyBatch } from "./errors";
export type { StoreError } from "./errors";
