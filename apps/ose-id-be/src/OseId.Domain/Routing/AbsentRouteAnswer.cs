namespace OseId.Domain.Routing;

/// <summary>
/// The complete answer a request addressing no route OSE ID answers receives: one
/// status and nothing else. Each field is what a path OSE ID never registered already
/// produces, because anything more — a media type, a declared length, a body — is one
/// more field by which two answers that must look alike could be told apart.
/// </summary>
/// <param name="Status">The not-found status, the only thing this answer carries.</param>
/// <param name="ContentType">
/// No media type. An empty answer describes no representation, and naming one would
/// announce that something chose to answer.
/// </param>
/// <param name="ContentLength">
/// No declared length. An unregistered path declares none either and lets the server
/// compute the zero-byte length from a body nothing wrote, so declaring one here would
/// be a difference on the wire even when the number matched.
/// </param>
public sealed record AbsentRouteAnswer(int Status, string? ContentType, long? ContentLength);
