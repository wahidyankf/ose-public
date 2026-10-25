// Migrations for Example 19: reverse by re-adding, not by undo.
// M02 drops Name by mistake; M03 re-adds it. The restore is a new version.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ClubsDb))] // => bind this version to the ClubsDb context
[Migration("20260101000001_CreateClubs")] // => first version: the create
public partial class CreateClubs : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Clubs", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => club name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Clubs", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Clubs"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ClubsDb))] // => bind this version to the ClubsDb context
[Migration("20260101000002_DropNameMistake")] // => second version: the mistaken drop
public partial class DropNameMistake : Migration // => the mistake is versioned too
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the column the team still needs
            name: "Name", // => mistakenly dropped, restored by M03
            table: "Clubs"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo re-adds what Up dropped
            name: "Name", // => the dropped column, restored
            table: "Clubs", // => the table M01 created
            type: "text", // => free-form name text
            nullable: true
        ); // => nullable so surviving rows restore
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(ClubsDb))] // => bind this version to the ClubsDb context
[Migration("20260101000003_ReaddNameFix")] // => third version: the forward restore
public partial class ReaddNameFix : Migration // => restore by re-adding, not by undo
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the fix restores the column going forward
            name: "Name", // => the mistakenly dropped column, back again
            table: "Clubs", // => the table M01 created
            type: "text", // => free-form name text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the restored column
            name: "Name", // => the column Up re-added
            table: "Clubs"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
