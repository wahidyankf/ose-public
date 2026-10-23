// Migrations for Example 53: intermediate review in one baseline program.
// Baseline, extend, drift, converge: the whole baseline loop reviewed.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Legacy53Db))] // => bind this version to the Legacy53Db context
[Migration("20260101000001_CreateLegacy53")] // => first version: matches the legacy table
public partial class CreateLegacy53 : Migration // => M01 twins the out-of-band table
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the twin of the legacy CREATE TABLE
            name: "Legacy53", // => table name the program queries back
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
                table.PrimaryKey("PK_Legacy53", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Legacy53"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Legacy53Db))] // => bind this version to the Legacy53Db context
[Migration("20260101000002_AddNote53")] // => second version: the first versioned change
public partial class AddNote53 : Migration // => new work starts after the baseline
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Note", // => new column the program reads back
            table: "Legacy53", // => the table the baseline adopted
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so legacy rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Legacy53"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Legacy53Db))] // => bind this version to the Legacy53Db context
[Migration("20260101000003_DropRogue53")] // => third version: the converging step
public partial class DropRogue53 : Migration // => the fix removes the unversioned change
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => converge: the drifted column leaves
            name: "Rogue", // => the unversioned column the program added
            table: "Legacy53"
        ); // => from the table the baseline adopted
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the drifted column
            name: "Rogue", // => the column Up dropped
            table: "Legacy53", // => the table the baseline adopted
            type: "text", // => free-form rogue text
            nullable: true
        ); // => nullable while the drift returns
    } // => reverse change ends
} // => third migration ends here
