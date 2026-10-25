// Migrations for Example 25: beginner review in one pass.
// Create, alter, compensate: the whole core loop in three versions.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(BadgesDb))] // => bind this version to the BadgesDb context
[Migration("20260101000001_CreateBadges")] // => first version: the create
public partial class CreateBadges : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Badges", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => badge name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Badges", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Badges"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(BadgesDb))] // => bind this version to the BadgesDb context
[Migration("20260101000002_AddLevel")] // => second version: only the alter
public partial class AddLevel : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Level", // => new column the program reads back
            table: "Badges", // => the table M01 created
            type: "integer", // => whole-unit badge level
            nullable: false, // => every row gets a value
            defaultValue: 1
        ); // => existing rows start at level one
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Level", // => the column Up added
            table: "Badges"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(BadgesDb))] // => bind this version to the BadgesDb context
[Migration("20260101000003_AddRetiredFix")] // => third version: the compensating fix
public partial class AddRetiredFix : Migration // => rollback by moving forward
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => the fix retires badges without deleting rows
            name: "Retired", // => new flag the program reads back
            table: "Badges", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing badges stay active
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added flag
            name: "Retired", // => the column Up added
            table: "Badges"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
