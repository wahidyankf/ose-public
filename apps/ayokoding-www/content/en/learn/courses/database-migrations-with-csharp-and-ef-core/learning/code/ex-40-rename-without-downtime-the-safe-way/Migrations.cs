// Migrations for Example 40: the safe rename recipe end to end.
// Expand, dual-write, backfill, contract: Title becomes Label with no downtime.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Products40Db))] // => bind this version to the Products40Db context
[Migration("20260101000001_CreateProducts40")] // => first version: the create
public partial class CreateProducts40 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Products40", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Title = table.Column<string>(type: "text", nullable: false), // => old title, renamed by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Products40", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Products40"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Products40Db))] // => bind this version to the Products40Db context
[Migration("20260101000002_AddLabel")] // => second version: the expand step
public partial class AddLabel : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name beside the old
            name: "Label", // => new column the backfill fills
            table: "Products40", // => the table M01 created
            type: "text", // => free-form label text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Label", // => the column Up added
            table: "Products40"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Products40Db))] // => bind this version to the Products40Db context
[Migration("20260101000003_FillLabel")] // => third version: the catch-up step
public partial class FillLabel : Migration // => old titles join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Products40\" SET \"Label\" = \"Title\" WHERE \"Label\" IS NULL"); // => copy every missing label
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Products40\" SET \"Label\" = NULL"); // => undo clears the copied labels
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(Products40Db))] // => bind this version to the Products40Db context
[Migration("20260101000004_DropTitle")] // => fourth version: the contract step
public partial class DropTitle : Migration // => the old name leaves last
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Title", // => the column M03 replaced
            table: "Products40"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Title", // => the dropped column, restored
            table: "Products40", // => the table M01 created
            type: "text", // => free-form title text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => fourth migration ends here
