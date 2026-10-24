// Migrations for Example 36: dual-write both columns.
// Writers update Name and DisplayName together until every reader moves.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ProfilesDb))] // => bind this version to the ProfilesDb context
[Migration("20260101000001_CreateProfiles")] // => first version: the create
public partial class CreateProfiles : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Profiles", // => table name the program queries back
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
                table.PrimaryKey("PK_Profiles", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Profiles"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ProfilesDb))] // => bind this version to the ProfilesDb context
[Migration("20260101000002_AddHandle")] // => second version: the expand step
public partial class AddHandle : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new column writers fill alongside
            name: "Handle", // => new column the program reads back
            table: "Profiles", // => the table M01 created
            type: "text", // => free-form handle text
            nullable: true
        ); // => nullable while old rows catch up
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Handle", // => the column Up added
            table: "Profiles"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
