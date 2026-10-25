// Migrations for Example 66: a concurrent index needs no transaction.
// EF wraps every migration in a transaction, so CONCURRENTLY fails inside.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(LookupsDb))] // => bind this version to the LookupsDb context
[Migration("20260101000001_CreateLookups")] // => first version: the create
public partial class CreateLookups : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Lookups", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => lookup code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Lookups", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Lookups"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(LookupsDb))] // => bind this version to the LookupsDb context
[Migration("20260101000002_BrokenConcurrentIndex")] // => second version: the in-transaction attempt
public partial class BrokenConcurrentIndex : Migration // => this migration always fails
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("CREATE INDEX CONCURRENTLY \"IX_Lookups_Code\" ON \"Lookups\" (\"Code\")"); // => 25001: no transaction block allowed
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("DROP INDEX CONCURRENTLY IF EXISTS \"IX_Lookups_Code\""); // => undo drops the outside index
    } // => reverse change ends
} // => second migration ends here
