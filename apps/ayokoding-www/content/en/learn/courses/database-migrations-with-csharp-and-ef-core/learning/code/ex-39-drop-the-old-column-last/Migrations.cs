// Migrations for Example 39: drop the old column last.
// M04 removes Nick only after every row and reader uses Handle.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Members39Db))] // => bind this version to the Members39Db context
[Migration("20260101000001_CreateMembers39")] // => first version: the create
public partial class CreateMembers39 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Members39", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Nick = table.Column<string>(type: "text", nullable: false), // => old nick, dropped by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Members39", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Members39"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Members39Db))] // => bind this version to the Members39Db context
[Migration("20260101000002_AddHandle39")] // => second version: the expand step
public partial class AddHandle39 : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new column old rows still lack
            name: "Handle", // => new column the backfill fills
            table: "Members39", // => the table M01 created
            type: "text", // => free-form handle text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Handle", // => the column Up added
            table: "Members39"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Members39Db))] // => bind this version to the Members39Db context
[Migration("20260101000003_FillHandle39")] // => third version: the catch-up step
public partial class FillHandle39 : Migration // => old rows join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Members39\" SET \"Handle\" = \"Nick\" WHERE \"Handle\" IS NULL"); // => copy every missing handle
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Members39\" SET \"Handle\" = NULL"); // => undo clears the copied handles
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(Members39Db))] // => bind this version to the Members39Db context
[Migration("20260101000004_DropNick")] // => fourth version: the contract step
public partial class DropNick : Migration // => the old column leaves last
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Nick", // => the column M03 replaced
            table: "Members39"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Nick", // => the dropped column, restored
            table: "Members39", // => the table M01 created
            type: "text", // => free-form nick text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => fourth migration ends here
