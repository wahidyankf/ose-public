// Kata 4 starter migrations: create plus the bad column.
// Fix me: add M03 dropping the BadFlag column M02 added by mistake.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000001_CreateKatas4")] // => first version: the create
public partial class CreateKatas4 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas4", // => table name the program queries back
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
                table.PrimaryKey("PK_Katas4", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas4"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000002_AddBadFlag")] // => second version: the bad deploy
public partial class AddBadFlag : Migration // => the mistake the fix removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => the mistaken column M03 drops
            name: "BadFlag", // => bad-deployer flag, removed by the fix
            table: "Katas4", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing rows start calm
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "BadFlag", // => the column Up added
            table: "Katas4"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

// Fix me: add M03 here dropping the BadFlag column going forward.
