// Migrations for Example 10: a linear history stays mergeable.
// Three sequential IDs with no gaps and no duplicates merge cleanly.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(QueuesDb))] // => bind this version to the QueuesDb context
[Migration("20260101000001_CreateQueues")] // => first version: the create
public partial class CreateQueues : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Queues", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Job = table.Column<string>(type: "text", nullable: false), // => job name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Queues", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Queues"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(QueuesDb))] // => bind this version to the QueuesDb context
[Migration("20260101000002_AddPriority")] // => second version: only the alter
public partial class AddPriority : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Priority", // => new column the program reads back
            table: "Queues", // => the table M01 created
            type: "integer", // => whole-unit priority rank
            nullable: false, // => every row gets a value
            defaultValue: 0
        ); // => existing rows start at zero
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Priority", // => the column Up added
            table: "Queues"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(QueuesDb))] // => bind this version to the QueuesDb context
[Migration("20260101000003_IndexPriority")] // => third version: the index
public partial class IndexPriority : Migration // => each version stays reviewable alone
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateIndex( // => one index, its own versioned step
            name: "IX_Queues_Priority", // => index name the database catalog holds
            table: "Queues", // => the table M01 created
            column: "Priority"
        ); // => the column M02 added
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropIndex( // => undo removes the added index
            name: "IX_Queues_Priority", // => the index Up added
            table: "Queues"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
