// Migrations for Example 54: two branches, one history.
// Ana and Ben both wrote ...002: the duplicate ID fails before anything applies.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(TeamsDb))] // => bind this version to the TeamsDb context
[Migration("20260101000001_CreateTeams")] // => first version: the agreed create
public partial class CreateTeams : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Teams", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => team name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Teams", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Teams"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(TeamsDb))] // => bind this version to the TeamsDb context
[Migration("20260101000002_AddZone")] // => Ana's version: same stamp as Ben's
public partial class AddZoneAna : Migration // => Ana's branch wrote ...002 first
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => Ana's column, collides with Ben's stamp
            table: "Teams", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Teams"
        ); // => from the table Up altered
    } // => reverse change ends
} // => Ana's migration ends here

[DbContext(typeof(TeamsDb))] // => bind this version to the TeamsDb context
[Migration("20260101000002_AddZone")] // => Ben's version: the same stamp, the conflict
public partial class AddZoneBen : Migration // => Ben's branch wrote ...002 too
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs: discovery fails
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Color", // => Ben's column, same stamp as Ana's
            table: "Teams", // => the table M01 created
            type: "text", // => free-form color text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Color", // => the column Up added
            table: "Teams"
        ); // => from the table Up altered
    } // => reverse change ends
} // => Ben's migration ends here
