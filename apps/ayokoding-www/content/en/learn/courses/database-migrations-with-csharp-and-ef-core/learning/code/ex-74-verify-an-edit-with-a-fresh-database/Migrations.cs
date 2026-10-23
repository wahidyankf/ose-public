// Migrations for Example 74: verify an edit with a fresh database.
// Drop the tables, clear the history, migrate from zero: the edit proves itself.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Fresh74Db))] // => bind this version to the Fresh74Db context
[Migration("20260101000001_CreateFresh74")] // => first version: the create
public partial class CreateFresh74 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Fresh74", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => fresh name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Fresh74", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Fresh74"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Fresh74Db))] // => bind this version to the Fresh74Db context
[Migration("20260101000002_AddZone74")] // => second version: the edited file
public partial class AddZone74 : Migration // => the edit under verification
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => edited column the rebuild verifies
            table: "Fresh74", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: false, // => the edit tightened this to required
            defaultValue: "hq"
        ); // => existing rows join the headquarters zone
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Fresh74"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
