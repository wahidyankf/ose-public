namespace OseId.Domain.Routing;

/// <summary>
/// What a caller may learn about the OSE ID route table by addressing it. A dispatcher
/// that matches a method and path pair answers a path it registered under another method
/// differently from a path it never registered, and that difference is the route table:
/// probing every method of every guessed path maps the whole surface without a single
/// request being answered. This policy removes the difference — the two answers become
/// the same answer — so probing returns exactly the information a caller started with.
/// </summary>
public static class RouteDisclosurePolicy
{
    /// <summary>The status a path OSE ID never registered answers with.</summary>
    public const int AbsentRouteStatus = 404;

    /// <summary>
    /// The status a method-and-path dispatcher produces when the path is registered but
    /// the method is not. It is the disclosure itself, so it never leaves the process.
    /// </summary>
    public const int MethodMismatchStatus = 405;

    /// <summary>
    /// Every response header that would name what the addressed path does answer. The
    /// status alone is not the whole disclosure: a bare not-found still carrying
    /// <c>Allow</c> hands back the registered methods in full.
    /// </summary>
    public static IReadOnlyList<string> DisclosingHeaders { get; } = ["Allow"];

    /// <summary>The one answer that replaces a disclosing one.</summary>
    public static AbsentRouteAnswer AbsentRoute { get; } =
        new(AbsentRouteStatus, ContentType: null, ContentLength: null);

    /// <summary>
    /// Whether an answer carrying <paramref name="status" /> would disclose that the
    /// addressed path is registered. Exactly one status does; every other answer,
    /// including the replacement, is left untouched.
    /// </summary>
    public static bool DisclosesRegisteredPath(int status) => status == MethodMismatchStatus;
}
