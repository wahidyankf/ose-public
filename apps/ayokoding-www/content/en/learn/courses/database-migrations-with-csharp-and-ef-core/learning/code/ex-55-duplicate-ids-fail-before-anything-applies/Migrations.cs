// Migrations for Example 55: duplicate IDs fail before anything applies.
// The valid M01 never runs: discovery rejects the whole set first.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(PodsDb))] // => bind this version to the PodsDb context
[Migration("20260101000001_CreatePods")] // => first version: the valid create
public partial class CreatePods : Migration // => M01 never runs: the set is rejected first
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Pods", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => pod name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Pods", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Pods"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(PodsDb))] // => bind this version to the PodsDb context
[Migration("20260101000002_AddZone55")] // => second version: one twin of the pair
public partial class AddZone55A : Migration // => first twin of the duplicate stamp
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => twin column, same stamp as its sibling
            table: "Pods", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Pods"
        ); // => from the table Up altered
    } // => reverse change ends
} // => first twin ends here

[DbContext(typeof(PodsDb))] // => bind this version to the PodsDb context
[Migration("20260101000002_AddZone55")] // => the same stamp: the failing twin
public partial class AddZone55B : Migration // => second twin of the duplicate stamp
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Color", // => twin column, same stamp as its sibling
            table: "Pods", // => the table M01 created
            type: "text", // => free-form color text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Color", // => the column Up added
            table: "Pods"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second twin ends here
