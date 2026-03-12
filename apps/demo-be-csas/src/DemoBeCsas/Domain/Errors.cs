namespace DemoBeCsas.Domain;

public abstract record DomainError(string Message);

public sealed record ValidationError(string Field, string Message) : DomainError(Message);

public sealed record NotFoundError(string Entity) : DomainError($"{Entity} not found");

public sealed record ForbiddenError(string Message) : DomainError(Message);

public sealed record ConflictError(string Message) : DomainError(Message);

public sealed record UnauthorizedError(string Message) : DomainError(Message);

public sealed record FileTooLargeError(long LimitBytes)
    : DomainError("File size exceeds the maximum allowed limit");

public sealed record UnsupportedMediaTypeError(string Type)
    : DomainError("Unsupported media type");
