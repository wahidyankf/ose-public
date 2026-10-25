// Migrations for Example 38: readers move before the drop.
// The new projection reads Handle only; Nick stays until the last reader moves.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ReadersDb))] // => bind this version to the ReadersDb context
[Migration("20260101000001_CreateReaders")] // => first version: the create
public partial class CreateReaders : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Readers", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Nick = table.Column<string>(type: "text", nullable: false), // => old nick, still serving
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Readers", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Readers"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ReadersDb))] // => bind this version to the ReadersDb context
[Migration("20260101000002_AddHandle38")] // => second version: the expand step
public partial class AddHandle38 : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new column readers move to
            name: "Handle", // => new column the program reads back
            table: "Readers", // => the table M01 created
            type: "text", // => free-form handle text
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Handle", // => the column Up added
            table: "Readers"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(ReadersDb))] // => bind this version to the ReadersDb context
[Migration("20260101000003_FillHandle38")] // => third version: the catch-up step
public partial class FillHandle38 : Migration // => old rows join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Readers\" SET \"Handle\" = \"Nick\" WHERE \"Handle\" IS NULL"); // => copy every missing handle
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Readers\" SET \"Handle\" = NULL"); // => undo clears the copied handles
    } // => reverse change ends
} // => third migration ends here
