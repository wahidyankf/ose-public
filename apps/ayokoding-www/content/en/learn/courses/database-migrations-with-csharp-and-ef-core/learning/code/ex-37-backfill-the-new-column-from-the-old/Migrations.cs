// Migrations for Example 37: backfill the new column from the old.
// M03 copies Nick into Handle for every row the dual-write missed.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Members37Db))] // => bind this version to the Members37Db context
[Migration("20260101000001_CreateMembers37")] // => first version: the create
public partial class CreateMembers37 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Members37", // => table name the program queries back
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
                table.PrimaryKey("PK_Members37", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Members37"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Members37Db))] // => bind this version to the Members37Db context
[Migration("20260101000002_AddHandle37")] // => second version: the expand step
public partial class AddHandle37 : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new column old rows still lack
            name: "Handle", // => new column the backfill fills
            table: "Members37", // => the table M01 created
            type: "text", // => free-form handle text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Handle", // => the column Up added
            table: "Members37"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Members37Db))] // => bind this version to the Members37Db context
[Migration("20260101000003_FillHandle")] // => third version: the catch-up step
public partial class FillHandle : Migration // => old rows join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Members37\" SET \"Handle\" = \"Nick\" WHERE \"Handle\" IS NULL"); // => copy every missing handle
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Members37\" SET \"Handle\" = NULL"); // => undo clears the copied handles
    } // => reverse change ends
} // => third migration ends here
