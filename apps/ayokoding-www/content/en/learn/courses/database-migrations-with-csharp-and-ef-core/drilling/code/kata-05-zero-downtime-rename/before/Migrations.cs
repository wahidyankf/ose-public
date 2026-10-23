// Kata 5 starter migrations: create and expand, no backfill or contract yet.
// Fix me: add M03 copying Title into Label and M04 dropping Title.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000001_CreateKatas5")] // => first version: the create
public partial class CreateKatas5 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas5", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Title = table.Column<string>(type: "text", nullable: false), // => old title, dropped by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas5", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas5"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000002_AddLabelK5")] // => second version: the expand step
public partial class AddLabelK5 : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name beside the old
            name: "Label", // => new column the missing backfill fills
            table: "Katas5", // => the table M01 created
            type: "text", // => free-form label text
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Label", // => the column Up added
            table: "Katas5"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

// Fix me: add M03 with UPDATE copying Title into Label, and M04 dropping Title.
