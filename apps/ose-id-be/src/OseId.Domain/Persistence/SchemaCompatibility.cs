using System.Collections.Immutable;

namespace OseId.Domain.Persistence;

/// <summary>
/// The migration set this build is compiled against, and the rule that compares it with what the
/// database actually has applied.
///
/// The comparison is set containment rather than "latest migration wins": a database may legitimately
/// carry migrations from a newer deployment while this build still serves, but a database missing any
/// migration this build compiled against cannot serve it. Readiness therefore never reads a version
/// row it would have to keep updated — it derives the answer from immutable applied history.
/// </summary>
public static class SchemaCompatibility
{
    /// <summary>
    /// Every migration this build requires. It is a compiled constant so that a deployment cannot be
    /// talked into compatibility by a value it read from the database it is judging.
    /// </summary>
    public static readonly ImmutableArray<string> CompatibleMigrationIds = ["20260916060219_CreateIdentityFoundation"];

    /// <summary>
    /// Decides the schema state from the active history rows the serving role could read.
    /// </summary>
    public static SchemaState Evaluate(IReadOnlyCollection<MigrationHistoryRecord> appliedActiveRecords)
    {
        ArgumentNullException.ThrowIfNull(appliedActiveRecords);

        // A tombstone must never satisfy a requirement. Filtering here as well as in SQL keeps the
        // invariant true even if a future adapter forgets the predicate.
        HashSet<string> applied =
        [
            .. appliedActiveRecords.Where(record => record.IsActive).Select(record => record.MigrationId),
        ];

        return CompatibleMigrationIds.All(applied.Contains) ? SchemaState.Ready : SchemaState.SchemaIncompatible;
    }
}
