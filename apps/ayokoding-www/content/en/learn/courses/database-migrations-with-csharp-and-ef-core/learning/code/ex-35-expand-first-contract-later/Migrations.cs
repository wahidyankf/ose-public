// Migrations for Example 35: expand first, contract later.
// M02 adds DisplayName beside Name; nothing drops until readers move.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Accounts35Db))] // => bind this version to the Accounts35Db context
[Migration("20260101000001_CreateAccounts35")] // => first version: the create
public partial class CreateAccounts35 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Accounts35", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => old name, still serving
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Accounts35", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Accounts35"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Accounts35Db))] // => bind this version to the Accounts35Db context
[Migration("20260101000002_AddDisplayName")] // => second version: the expand step
public partial class AddDisplayName : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new column serves beside the old
            name: "DisplayName", // => new column the program reads back
            table: "Accounts35", // => the table M01 created
            type: "text", // => free-form display text
            nullable: true
        ); // => nullable while readers still use Name
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "DisplayName", // => the column Up added
            table: "Accounts35"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
