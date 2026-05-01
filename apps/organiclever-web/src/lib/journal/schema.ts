import { Schema } from "effect";

export const EntryId = Schema.String.pipe(Schema.brand("EntryId"));
export type EntryId = typeof EntryId.Type;

export const IsoTimestamp = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/),
  Schema.brand("IsoTimestamp"),
);
export type IsoTimestamp = typeof IsoTimestamp.Type;

export const EntryName = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(64),
  Schema.pattern(/^[a-z][a-z0-9-]*$/),
  Schema.brand("EntryName"),
);
export type EntryName = typeof EntryName.Type;

export const EntryPayload = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown,
});
export type EntryPayload = typeof EntryPayload.Type;

export const JournalEntry = Schema.Struct({
  id: EntryId,
  name: EntryName,
  payload: EntryPayload,
  createdAt: IsoTimestamp,
  updatedAt: IsoTimestamp,
  startedAt: IsoTimestamp,
  finishedAt: IsoTimestamp,
  labels: Schema.Array(Schema.String),
});
export type JournalEntry = typeof JournalEntry.Type;

export const NewEntryInput = Schema.Struct({
  name: EntryName,
  payload: EntryPayload,
  startedAt: IsoTimestamp,
  finishedAt: IsoTimestamp,
  labels: Schema.optionalWith(Schema.Array(Schema.String), { default: () => [] as string[] }),
});
export type NewEntryInput = typeof NewEntryInput.Type;

export const UpdateEntryInput = Schema.Struct({
  name: Schema.optional(EntryName),
  payload: Schema.optional(EntryPayload),
});
export type UpdateEntryInput = typeof UpdateEntryInput.Type;

export const PayloadFromJsonString = Schema.parseJson(EntryPayload);
