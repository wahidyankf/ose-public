import { Data } from "effect";

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly status: number;
  readonly message: string;
}> {}

export class ApiError extends Data.TaggedError("ApiError")<{
  readonly code: string;
  readonly message: string;
}> {}
