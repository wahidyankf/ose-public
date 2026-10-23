// Migrations for Example 57: the merge keeps one line.
// Winner and renumbered loser form one linear history: the check proves it.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Units57Db))] // => bind this version to the Units57Db context
[Migration("20260101000001_CreateUnits57")] // => first version: the agreed create
public partial class CreateUnits57 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Units57", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => unit name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Units57", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Units57"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Units57Db))] // => bind this version to the Units57Db context
[Migration("20260101000002_AddZone57")] // => second version: the winner's change
public partial class AddZone57 : Migration // => Ana's ...002 lands first
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => winner column, keeps its stamp
            table: "Units57", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Units57"
        ); // => from the table Up altered
    } // => reverse change ends
} // => winner's migration ends here

[DbContext(typeof(Units57Db))] // => bind this version to the Units57Db context
[Migration("20260101000003_AddColor57")] // => third version: the renumbered loser
public partial class AddColor57 : Migration // => Ben's change, renumbered from ...002
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Color", // => loser column, renumbered to ...003
            table: "Units57", // => the table M01 created
            type: "text", // => free-form color text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Color", // => the column Up added
            table: "Units57"
        ); // => from the table Up altered
    } // => reverse change ends
} // => loser's migration ends here
