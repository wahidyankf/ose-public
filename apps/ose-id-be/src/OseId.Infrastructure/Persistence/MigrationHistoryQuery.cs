using SqlKata;
using SqlKata.Compilers;

namespace OseId.Infrastructure.Persistence;

/// <summary>
/// The single read the serving role is granted, expressed as a SqlKata query and compiled for
/// PostgreSQL.
///
/// Building the query in one place lets a contract test snapshot the exact SQL and parameters
/// without a database. Every identifier below is a compiled constant: nothing here can be supplied
/// by a request, which is why no identifier needs escaping and no value needs interpolation.
/// </summary>
public static class MigrationHistoryQuery
{
    public const string SchemaName = "ose_id";
    public const string TableName = "__EFMigrationsHistory";

    /// <summary>
    /// The closed allowlist of columns this adapter may project. A wildcard projection is not
    /// expressible through this type.
    /// </summary>
    public static readonly string[] ProjectedColumns =
    [
        "MigrationId",
        "ProductVersion",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "deleted_at",
        "deleted_by",
    ];

    /// <summary>The compiler every OSE-owned runtime query is compiled with.</summary>
    public static PostgresCompiler Compiler { get; } = new();

    /// <summary>
    /// Active migration history. The tombstone predicate is explicit rather than implied by a
    /// convention, so a reader of this method can see that a soft-deleted row could never satisfy a
    /// readiness decision.
    ///
    /// Unordered on purpose: <c>SchemaCompatibility.Evaluate</c> compares the result against the
    /// compiled set by membership, never by position, so an <c>ORDER BY</c> would buy nothing but an
    /// extra sort step on every read.
    /// </summary>
    public static Query ActiveHistory() =>
        new Query($"{SchemaName}.{TableName}").Select(ProjectedColumns).WhereNull("deleted_at");

    /// <summary>The compiled SQL and bound parameters, for snapshotting and for execution.</summary>
    public static SqlResult Compile() => Compiler.Compile(ActiveHistory());
}
