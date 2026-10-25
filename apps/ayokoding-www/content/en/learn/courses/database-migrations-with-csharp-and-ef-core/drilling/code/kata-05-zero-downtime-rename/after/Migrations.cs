// Kata 5 solution migrations: expand, backfill, contract.
// Title becomes Label with no downtime: M03 copies, M04 drops.
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
            name: "Label", // => new column the backfill fills
            table: "Katas5", // => the table M01 created
            type: "text", // => free-form label text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Label", // => the column Up added
            table: "Katas5"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000003_FillLabelK5")] // => third version: the catch-up step
public partial class FillLabelK5 : Migration // => old titles join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Katas5\" SET \"Label\" = \"Title\" WHERE \"Label\" IS NULL"); // => copy every missing label
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Katas5\" SET \"Label\" = NULL"); // => undo clears the copied labels
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000004_DropTitleK5")] // => fourth version: the contract step
public partial class DropTitleK5 : Migration // => the old name leaves last
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Title", // => the column M03 replaced
            table: "Katas5"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Title", // => the dropped column, restored
            table: "Katas5", // => the table M01 created
            type: "text", // => free-form title text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => fourth migration ends here
