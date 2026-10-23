// Migrations for Example 46: the baseline keeps legacy data.
// Three hand-inserted rows survive the baseline and the M02 alter.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Legacy46Db))] // => bind this version to the Legacy46Db context
[Migration("20260101000001_CreateLegacy46")] // => first version: matches the legacy table
public partial class CreateLegacy46 : Migration // => M01 twins the out-of-band table
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the twin of the legacy CREATE TABLE
            name: "Legacy46", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => legacy code column, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Legacy46", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Legacy46"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Legacy46Db))] // => bind this version to the Legacy46Db context
[Migration("20260101000002_AddNote46")] // => second version: the first versioned change
public partial class AddNote46 : Migration // => new work starts after the baseline
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Note", // => new column the program reads back
            table: "Legacy46", // => the table the baseline adopted
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so legacy rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Legacy46"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
