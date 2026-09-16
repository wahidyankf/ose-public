namespace OseId.Domain.Persistence;

/// <summary>
/// What the backend may conclude about the schema it was pointed at.
///
/// The three outcomes are stable codes rather than messages because readiness reports them to an
/// unauthenticated caller: a code carries no host, credential, or exception text by construction.
/// </summary>
public enum SchemaState
{
    /// <summary>The applied active migration set satisfies the compiled compatible set.</summary>
    Ready,

    /// <summary>The database answered, but its applied set is not one this build can serve.</summary>
    SchemaIncompatible,

    /// <summary>The database could not be reached or refused the read.</summary>
    DatabaseUnavailable,
}
