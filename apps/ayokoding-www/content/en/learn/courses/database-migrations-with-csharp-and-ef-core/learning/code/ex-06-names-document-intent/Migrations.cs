// Migrations for Example 6: names document intent.
// Timestamped IDs with verb phrases read as a change log.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ToolsDb))] // => bind this version to the ToolsDb context
[Migration("20260101000001_CreateTools")] // => verb-first name: what the change does
public partial class CreateTools : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Tools", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Handle = table.Column<string>(type: "text", nullable: false), // => tool handle, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Tools", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Tools"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ToolsDb))] // => bind this version to the ToolsDb context
[Migration("20260101000002_AddSerialNumber")] // => verb-first name: what the change does
public partial class AddSerialNumber : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "SerialNumber", // => new column the program reads back
            table: "Tools", // => the table M01 created
            type: "text", // => free-form serial text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "SerialNumber", // => the column Up added
            table: "Tools"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(ToolsDb))] // => bind this version to the ToolsDb context
[Migration("20260101000003_IndexSerialNumber")] // => verb-first name: what the change does
public partial class IndexSerialNumber : Migration // => indexes get their own migration too
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateIndex( // => one index, its own versioned step
            name: "IX_Tools_SerialNumber", // => index name the database catalog holds
            table: "Tools", // => the table M01 created
            column: "SerialNumber"
        ); // => the column M02 added
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropIndex( // => undo removes the added index
            name: "IX_Tools_SerialNumber", // => the index Up added
            table: "Tools"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
