// Migrations for Example 68: independent tables do not block each other.
// The holder locks Isla; M02 alters Playas alone and sails through.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ShoresDb))] // => bind this version to the ShoresDb context
[Migration("20260101000001_CreateIslas")] // => first version: two independent tables
public partial class CreateIslas : Migration // => Isla and Playa share nothing
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the first create this migration owns
            name: "Islas", // => locked table: the holder sits on it
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => isla code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Islas", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
        migrationBuilder.CreateTable( // => the second create this migration owns
            name: "Playas", // => free table: the migration alters it
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => playa code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Playas", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo drops the second table
            name: "Playas"
        ); // => drop what Up created
        migrationBuilder.DropTable( // => undo drops the first table
            name: "Islas"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ShoresDb))] // => bind this version to the ShoresDb context
[Migration("20260101000002_AddNote68")] // => second version: the free-table alter
public partial class AddNote68 : Migration // => Isla stays locked, Playas moves
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the free table by one column
            name: "Note", // => new column the program reads back
            table: "Playas", // => the table nobody locked
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Playas"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
