// Migrations for Example 44: intermediate review in one program.
// Expand, backfill, constrain, contract: the whole zero-downtime loop.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(StreetsDb))] // => bind this version to the StreetsDb context
[Migration("20260101000001_CreateStreets")] // => first version: the create
public partial class CreateStreets : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Streets", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Road = table.Column<string>(type: "text", nullable: false), // => old road name, renamed by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Streets", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Streets"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(StreetsDb))] // => bind this version to the StreetsDb context
[Migration("20260101000002_AddStreet")] // => second version: the expand step
public partial class AddStreet : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name beside the old
            name: "Street", // => new column the backfill fills
            table: "Streets", // => the table M01 created
            type: "text", // => free-form street text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Street", // => the column Up added
            table: "Streets"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(StreetsDb))] // => bind this version to the StreetsDb context
[Migration("20260101000003_FillStreet")] // => third version: the catch-up step
public partial class FillStreet : Migration // => old roads join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Streets\" SET \"Street\" = \"Road\" WHERE \"Street\" IS NULL"); // => copy every missing street
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Streets\" SET \"Street\" = NULL"); // => undo clears the copied streets
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(StreetsDb))] // => bind this version to the StreetsDb context
[Migration("20260101000004_DropRoad")] // => fourth version: the contract step
public partial class DropRoad : Migration // => the old name leaves last
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Road", // => the column M03 replaced
            table: "Streets"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Road", // => the dropped column, restored
            table: "Streets", // => the table M01 created
            type: "text", // => free-form road text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => fourth migration ends here
