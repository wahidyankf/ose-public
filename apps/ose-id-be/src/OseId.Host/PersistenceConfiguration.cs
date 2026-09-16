namespace OseId.Host;

/// <summary>
/// The configuration surface for the one outbound persistence port the serving process
/// opens. Named distinctly from the migrator-only <c>OSE_ID_MIGRATION_CONNECTION</c>: that
/// key runs schema changes offline, this key is read by the serving role alone, and the
/// two must never collide or be satisfied by the same privilege.
/// </summary>
public static class PersistenceConfiguration
{
    /// <summary>The key declaring the serving role's PostgreSQL connection string.</summary>
    public const string ConnectionKey = "OSE_ID_CONNECTION";
}
