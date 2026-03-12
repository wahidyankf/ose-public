import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly reason: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly reason: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly message: string;
}> {}

export class FileTooLargeError extends Data.TaggedError("FileTooLargeError")<Record<never, never>> {}

export class UnsupportedMediaTypeError extends Data.TaggedError("UnsupportedMediaTypeError")<Record<never, never>> {}

export type DomainError =
  | ValidationError
  | NotFoundError
  | UnauthorizedError
  | ForbiddenError
  | ConflictError
  | FileTooLargeError
  | UnsupportedMediaTypeError;
