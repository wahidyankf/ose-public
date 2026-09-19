using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OseId.Infrastructure.Persistence.Migrations;

/// <summary>
/// The foundation migration. It creates no domain table: the only object this slice owns is
/// Entity Framework's own migration history, which it brings under the universal audit envelope
/// and the no-hard-delete guard before Entity Framework records this migration in it.
///
/// Ordering matters and is not incidental. Entity Framework creates the history table, then runs
/// this <c>Up</c>, then inserts the history row. Adding the audit columns here therefore means
/// the very first history row is written through the finished contract — with safe defaults, by
/// Entity Framework's own two-column insert, which stays compatible because every added column
/// is either defaulted or nullable.
/// </summary>
public partial class CreateIdentityFoundation : Migration
{
    /// <summary>The stable SQLSTATE the hard-delete guard raises. See <see cref="HardDeleteGuard" />.</summary>
    public const string HardDeleteSqlState = "OS001";

    /// <summary>The stable, machine-matchable message the guard raises alongside the SQLSTATE.</summary>
    public const string HardDeleteMessage = "hard_delete_rejected";

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        ArgumentNullException.ThrowIfNull(migrationBuilder);

        // Six audit columns, in the contract's order. Every one is defaulted or nullable so the
        // framework's existing insert keeps working without knowing they exist.
        migrationBuilder.Sql(
            """
            ALTER TABLE ose_id."__EFMigrationsHistory"
              ADD COLUMN created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
              ADD COLUMN created_by character varying(255) NOT NULL DEFAULT 'system',
              ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
              ADD COLUMN updated_by character varying(255) NOT NULL DEFAULT 'system',
              ADD COLUMN deleted_at timestamp with time zone NULL,
              ADD COLUMN deleted_by character varying(255) NULL;
            """
        );

        // Named so a catalog test can assert them by name rather than by shape.
        migrationBuilder.Sql(
            """
            ALTER TABLE ose_id."__EFMigrationsHistory"
              ADD CONSTRAINT ck_ef_migrations_history_soft_delete_pair
                CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),
              ADD CONSTRAINT ck_ef_migrations_history_update_time
                CHECK (updated_at >= created_at),
              ADD CONSTRAINT ck_ef_migrations_history_delete_time
                CHECK (deleted_at IS NULL OR deleted_at >= created_at);
            """
        );

        migrationBuilder.Sql(HardDeleteGuard);

        migrationBuilder.Sql(
            """
            CREATE TRIGGER trg_ef_migrations_history_reject_hard_delete
              BEFORE DELETE ON ose_id."__EFMigrationsHistory"
              FOR EACH ROW EXECUTE FUNCTION ose_id.reject_hard_delete();
            """
        );

        // Least privilege, stated positively and negatively. The serving role receives exactly
        // USAGE and SELECT; PUBLIC receives nothing, so a role granted nothing can do nothing.
        migrationBuilder.Sql(
            """
            REVOKE ALL ON SCHEMA ose_id FROM PUBLIC;
            REVOKE ALL ON ose_id."__EFMigrationsHistory" FROM PUBLIC;
            GRANT USAGE ON SCHEMA ose_id TO ose_id_app;
            GRANT SELECT ON ose_id."__EFMigrationsHistory" TO ose_id_app;
            """
        );
    }

    /// <summary>
    /// The guard. It is <c>BEFORE DELETE ... FOR EACH ROW</c> so that it rejects the statement
    /// before any row is removed, and it raises a fixed SQLSTATE and message so a test can match
    /// the rejection precisely instead of matching prose that a PostgreSQL upgrade could reword.
    /// </summary>
    private const string HardDeleteGuard = """
        CREATE OR REPLACE FUNCTION ose_id.reject_hard_delete() RETURNS trigger
          LANGUAGE plpgsql AS $guard$
          BEGIN
            RAISE EXCEPTION 'hard_delete_rejected'
              USING ERRCODE = 'OS001',
                    DETAIL = 'table ' || TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME
                             || ' retains rows for audit; use the soft-delete columns',
                    HINT = 'set deleted_at and deleted_by instead of issuing DELETE';
          END;
          $guard$;
        """;

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder) =>
        // Migration history is forward-only. Reverting drops the audit envelope and the guard
        // that make the history defensible, so recovery is a new forward migration rather than a
        // downgrade. Failing loudly here keeps that from being discovered during an incident.
        throw new NotSupportedException(
            "OSE ID migrations are forward-only; repair a defect with a new forward migration."
        );
}
