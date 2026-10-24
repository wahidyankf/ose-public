// Migrations for Example 20: a failed migration leaves earlier work intact.
// M01 seeds one row; M02 fails on a duplicate column, so M01 stays the truth.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(InvoicesDb))] // => bind this version to the InvoicesDb context
[Migration("20260101000001_CreateInvoices")] // => first version: the create
public partial class CreateInvoices : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Invoices", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Total = table.Column<int>(type: "integer", nullable: false), // => invoice total, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Invoices", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Invoices"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(InvoicesDb))] // => bind this version to the InvoicesDb context
[Migration("20260101000002_BrokenAddPaid")] // => second version: the broken alter
public partial class BrokenAddPaid : Migration // => this migration always fails
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("ALTER TABLE \"Invoices\" ADD COLUMN \"Paid\" boolean NOT NULL"); // => the intended alter, valid SQL
        migrationBuilder.Sql("ALTER TABLE \"Invoices\" ADD COLUMN \"Paid\" boolean NOT NULL"); // => the same column twice: 42701
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Paid", // => the column Up meant to add
            table: "Invoices"
        ); // => from the table M01 created
    } // => reverse change ends
} // => second migration ends here
