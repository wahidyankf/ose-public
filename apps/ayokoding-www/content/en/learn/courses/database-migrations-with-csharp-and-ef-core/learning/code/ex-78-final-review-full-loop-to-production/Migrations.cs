// Migrations for Example 78: the final review, the full loop to production.
// Create, widen, backfill: every stage lands in one triple-version program.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(FinaleDb))] // => bind this version to the FinaleDb context
[Migration("20260101000001_CreateFinale")] // => first version: the create
public partial class CreateFinale : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Finale", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Title = table.Column<string>(type: "text", nullable: false), // => finale title, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Finale", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Finale"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(FinaleDb))] // => bind this version to the FinaleDb context
[Migration("20260101000002_AddScore")] // => second version: only the schema step
public partial class AddScore : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Score", // => new column the backfill fills
            table: "Finale", // => the table M01 created
            type: "integer", // => whole-unit score amounts
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Score", // => the column Up added
            table: "Finale"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(FinaleDb))] // => bind this version to the FinaleDb context
[Migration("20260101000003_FillScore")] // => third version: the data step
public partial class FillScore : Migration // => titles become scores by length
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Finale\" SET \"Score\" = length(\"Title\") * 10 WHERE \"Score\" IS NULL"
        ); // => ten per letter, no exceptions
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Finale\" SET \"Score\" = NULL"); // => undo clears the derived scores
    } // => reverse change ends
} // => third migration ends here
