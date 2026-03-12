using DemoBeCsas.Domain;

namespace DemoBeCsas.Endpoints;

public static class DomainErrorMapper
{
    public static IResult ToHttpResult(DomainError error) =>
        error switch
        {
            ValidationError e => Results.BadRequest(new { message = e.Message }),
            NotFoundError e => Results.NotFound(new { message = e.Message }),
            ForbiddenError => Results.StatusCode(403),
            ConflictError e => Results.Conflict(new { message = e.Message }),
            UnauthorizedError => Results.Unauthorized(),
            FileTooLargeError e => Results.Json(new { message = e.Message }, statusCode: 413),
            UnsupportedMediaTypeError e => Results.Json(new { message = e.Message }, statusCode: 415),
            _ => Results.Problem(error.Message),
        };
}
