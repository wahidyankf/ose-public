// Kata 7 starter migrations: two branches, one stamp.
// Fix me: renumber the second ...002 to ...003 and keep both columns.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000001_CreateKatas7")] // => first version: the agreed create
public partial class CreateKatas7 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas7", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas7", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas7"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000002_AddZoneK7")] // => Ana's version: same stamp as Ben's
public partial class AddZoneK7Ana : Migration // => Ana's branch wrote ...002 first
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => Ana's column, collides with Ben's stamp
            table: "Katas7", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Katas7"
        ); // => from the table Up altered
    } // => reverse change ends
} // => Ana's migration ends here

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000002_AddZoneK7")] // => Ben's version: the same stamp, the conflict
public partial class AddZoneK7Ben : Migration // => Ben's branch wrote ...002 too
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Color", // => Ben's column, same stamp as Ana's
            table: "Katas7", // => the table M01 created
            type: "text", // => free-form color text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Color", // => the column Up added
            table: "Katas7"
        ); // => from the table Up altered
    } // => reverse change ends
} // => Ben's migration ends here

// Fix me: renumber Ben's ID to 20260101000003_AddColorK7 and rename its class.
