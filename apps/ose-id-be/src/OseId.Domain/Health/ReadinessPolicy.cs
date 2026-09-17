namespace OseId.Domain.Health;

/// <summary>
/// The stable codes readiness may report. Every failure collapses to one of these two
/// rows: a caller learns which dependency stopped it, never a host, a credential, or an
/// exception message, because the code and title are fixed literals rather than anything
/// built from the read that failed.
/// </summary>
public static class ReadinessPolicy
{
    /// <summary>The status literal a successful readiness body reports.</summary>
    public const string ReadyStatus = "ready";

    /// <summary>The PostgreSQL component value a successful readiness body reports.</summary>
    public const string PostgresqlComponentReady = "ready";

    /// <summary>The schema component value a successful readiness body reports.</summary>
    public const string SchemaComponentCompatible = "compatible";

    /// <summary>The HTTP status every readiness failure answers with.</summary>
    public const int ProblemStatus = 503;

    /// <summary>The stable reason when PostgreSQL could not be reached.</summary>
    public const string DatabaseUnavailableCode = "database_unavailable";

    /// <summary>The human-readable summary for an unreachable database, naming no host.</summary>
    public const string DatabaseUnavailableTitle = "PostgreSQL is not reachable";

    /// <summary>The stable reason when the applied schema is not one this build can serve.</summary>
    public const string SchemaIncompatibleCode = "schema_incompatible";

    /// <summary>The human-readable summary for an incompatible schema, naming no migration.</summary>
    public const string SchemaIncompatibleTitle = "The applied schema is not compatible with this build";
}
