using System.Collections.Immutable;

namespace OseId.Domain.Persistence;

/// <summary>
/// What the foundation schema must be, stated once so three different layers can check it.
///
/// This describes the schema; it does not build it. An applied migration's SQL is frozen text —
/// generating it from a value that later edits could change would silently rewrite history that
/// databases have already executed. So the migration keeps its literal SQL, and this contract is
/// what the migration's text, and the live catalog, are each asserted against.
/// </summary>
public static class FoundationSchemaContract
{
    public const string SchemaName = "ose_id";
    public const string HistoryTableName = "__EFMigrationsHistory";

    /// <summary>The role that owns the schema and applies forward migrations.</summary>
    public const string MigrationRole = "ose_id_migrator";

    /// <summary>The role the serving process connects as.</summary>
    public const string ApplicationRole = "ose_id_app";

    public const string PrimaryKeyName = "PK___EFMigrationsHistory";
    public const string SoftDeletePairConstraint = "ck_ef_migrations_history_soft_delete_pair";
    public const string UpdateTimeConstraint = "ck_ef_migrations_history_update_time";
    public const string DeleteTimeConstraint = "ck_ef_migrations_history_delete_time";
    public const string HardDeleteGuardFunction = "reject_hard_delete";
    public const string HardDeleteGuardTrigger = "trg_ef_migrations_history_reject_hard_delete";

    /// <summary>The SQLSTATE the guard raises, stable so a test matches a code and not prose.</summary>
    public const string HardDeleteSqlState = "OS001";

    /// <summary>The message the guard raises alongside the SQLSTATE.</summary>
    public const string HardDeleteMessage = "hard_delete_rejected";

    /// <summary>
    /// Every column, in the physical order the contract fixes. The two framework columns come
    /// first because Entity Framework created them; the six audit columns follow in envelope order.
    /// </summary>
    public static readonly ImmutableArray<SchemaColumn> HistoryColumns =
    [
        new("MigrationId", "character varying", Nullable: false, Default: null),
        new("ProductVersion", "character varying", Nullable: false, Default: null),
        new("created_at", "timestamp with time zone", Nullable: false, Default: "CURRENT_TIMESTAMP"),
        new("created_by", "character varying", Nullable: false, Default: "'system'::character varying"),
        new("updated_at", "timestamp with time zone", Nullable: false, Default: "CURRENT_TIMESTAMP"),
        new("updated_by", "character varying", Nullable: false, Default: "'system'::character varying"),
        new("deleted_at", "timestamp with time zone", Nullable: true, Default: null),
        new("deleted_by", "character varying", Nullable: true, Default: null),
    ];

    /// <summary>The six audit columns, as the universal envelope names them.</summary>
    public static readonly ImmutableArray<string> AuditEnvelopeColumns =
    [
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "deleted_at",
        "deleted_by",
    ];

    /// <summary>
    /// Exactly what the serving role may do to the history table. It is a closed set: anything not
    /// named here is denied, which is why the set is asserted for equality and not containment.
    /// </summary>
    public static readonly ImmutableArray<string> ApplicationRoleTablePrivileges = ["SELECT"];

    /// <summary>
    /// Privileges the serving role must never hold. Listing them explicitly means a future grant
    /// that widens the role fails a test that names the specific danger, not a generic one.
    /// </summary>
    public static readonly ImmutableArray<string> ApplicationRoleForbiddenPrivileges =
    [
        "INSERT",
        "UPDATE",
        "DELETE",
        "TRUNCATE",
        "REFERENCES",
        "TRIGGER",
    ];

    /// <summary>The primary key is the only index this table carries.</summary>
    public static readonly ImmutableArray<string> ExpectedIndexes = [PrimaryKeyName];

    /// <summary>The three named lifecycle checks the envelope requires.</summary>
    public static readonly ImmutableArray<string> ExpectedCheckConstraints =
    [
        SoftDeletePairConstraint,
        UpdateTimeConstraint,
        DeleteTimeConstraint,
    ];
}

/// <summary>One physical column, as the catalog reports it.</summary>
public sealed record SchemaColumn(string Name, string DataType, bool Nullable, string? Default);
