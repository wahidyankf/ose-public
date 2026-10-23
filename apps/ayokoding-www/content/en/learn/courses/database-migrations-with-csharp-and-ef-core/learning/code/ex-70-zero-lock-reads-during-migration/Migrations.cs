// Migrations for Example 70: zero-lock reads during migration.
// Repeatable-read snapshots let readers proceed while the backfill writes.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(SnapsDb))] // => bind this version to the SnapsDb context
[Migration("20260101000001_CreateSnaps")] // => first version: the create
public partial class CreateSnaps : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Snaps", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => snap code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Snaps", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Snaps"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(SnapsDb))] // => bind this version to the SnapsDb context
[Migration("20260101000002_AddServed70")] // => second version: only the schema step
public partial class AddServed70 : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => grow the table by one column
            name: "Served", // => new column the backfill flips
            table: "Snaps", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Served", // => the column Up added
            table: "Snaps"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
