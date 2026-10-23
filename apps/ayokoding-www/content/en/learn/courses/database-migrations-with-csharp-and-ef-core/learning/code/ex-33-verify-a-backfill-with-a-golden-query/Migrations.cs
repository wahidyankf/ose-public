// Migrations for Example 33: verify the backfill with a golden query.
// One ordered aggregation proves every derived value at once.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Ledger33Db))] // => bind this version to the Ledger33Db context
[Migration("20260101000001_CreateLedger33")] // => first version: the create
public partial class CreateLedger33 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Ledger33", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Account = table.Column<string>(type: "text", nullable: false), // => account name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Ledger33", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Ledger33"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Ledger33Db))] // => bind this version to the Ledger33Db context
[Migration("20260101000002_AddBalance")] // => second version: only the schema step
public partial class AddBalance : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Balance", // => new column the backfill fills
            table: "Ledger33", // => the table M01 created
            type: "integer", // => whole-unit money amounts
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Balance", // => the column Up added
            table: "Ledger33"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Ledger33Db))] // => bind this version to the Ledger33Db context
[Migration("20260101000003_FillBalance")] // => third version: the tiered data step
public partial class FillBalance : Migration // => tiers derive from the name length
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Ledger33\" SET \"Balance\" = length(\"Account\") * 10 WHERE \"Balance\" IS NULL"
        ); // => ten per letter, no exceptions
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Ledger33\" SET \"Balance\" = NULL"); // => undo clears the derived balances
    } // => reverse change ends
} // => third migration ends here
