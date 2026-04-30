import { Data } from "effect";

export class NotFound extends Data.TaggedError("NotFound")<{
  readonly id: string;
}> {}

export class StorageUnavailable extends Data.TaggedError("StorageUnavailable")<{
  readonly cause: unknown;
}> {}

export class InvalidPayload extends Data.TaggedError("InvalidPayload")<{
  readonly issues: ReadonlyArray<{
    readonly path: string;
    readonly message: string;
  }>;
}> {}

export class EmptyBatch extends Data.TaggedError("EmptyBatch")<{}> {}

export type StoreError = NotFound | StorageUnavailable | InvalidPayload | EmptyBatch;
