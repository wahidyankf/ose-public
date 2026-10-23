// Migrations for Example 9: the history table is the source of truth.
// Two migrations apply; the program compares the assembly set to the recorded set.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(LedgerDb))] // => bind this version to the LedgerDb context
[Migration("20260101000001_CreateLedger")] // => first version: the create
public partial class CreateLedger : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Ledger", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Entry = table.Column<string>(type: "text", nullable: false), // => ledger entry, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Ledger", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Ledger"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(LedgerDb))] // => bind this version to the LedgerDb context
[Migration("20260101000002_AddPostedOn")] // => second version: only the alter
public partial class AddPostedOn : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "PostedOn", // => new column the program reads back
            table: "Ledger", // => the table M01 created
            type: "text", // => ISO date text, deterministic
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "PostedOn", // => the column Up added
            table: "Ledger"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
