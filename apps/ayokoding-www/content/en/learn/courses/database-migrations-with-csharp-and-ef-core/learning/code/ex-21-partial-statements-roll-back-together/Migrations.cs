// Migrations for Example 21: partial statements roll back together.
// M02 holds two statements and the second fails, so neither lands.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ReceiptsDb))] // => bind this version to the ReceiptsDb context
[Migration("20260101000001_CreateReceipts")] // => first version: the create
public partial class CreateReceipts : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Receipts", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Total = table.Column<int>(type: "integer", nullable: false), // => receipt total, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Receipts", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Receipts"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ReceiptsDb))] // => bind this version to the ReceiptsDb context
[Migration("20260101000002_BrokenPair")] // => second version: the broken pair
public partial class BrokenPair : Migration // => both statements share one transaction
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("CREATE TABLE \"Stamps\" (\"Id\" integer NOT NULL)"); // => first statement: valid alone
        migrationBuilder.Sql("CREATE TABLE \"Stamps\" (\"Id\" integer NOT NULL)"); // => second statement: 42P07, table exists
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"Stamps\""); // => undo drops the partial table
    } // => reverse change ends
} // => second migration ends here
