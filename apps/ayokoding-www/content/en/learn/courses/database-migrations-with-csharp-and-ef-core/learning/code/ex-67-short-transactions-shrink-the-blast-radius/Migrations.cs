// Migrations for Example 67: short transactions shrink the blast radius.
// M01 and M02 commit separately, so the broken M03 strands nothing with them.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(BlastsDb))] // => bind this version to the BlastsDb context
[Migration("20260101000001_CreateBlasts")] // => first version: the create
public partial class CreateBlasts : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Blasts", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => blast code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Blasts", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Blasts"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(BlastsDb))] // => bind this version to the BlastsDb context
[Migration("20260101000002_AddNote67")] // => second version: the committed alter
public partial class AddNote67 : Migration // => M02 commits before M03 runs
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Note", // => committed column the failure keeps
            table: "Blasts", // => the table M01 created
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Blasts"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(BlastsDb))] // => bind this version to the BlastsDb context
[Migration("20260101000003_BrokenTwin67")] // => third version: the broken pair
public partial class BrokenTwin67 : Migration // => both twins share one transaction
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("CREATE TABLE \"TwinA\" (\"Id\" integer NOT NULL)"); // => first twin: valid alone
        migrationBuilder.Sql("CREATE TABLE \"TwinB\" (\"Id\" integer NOT NULL)"); // => second twin: valid alone
        migrationBuilder.Sql("CREATE TABLE \"TwinA\" (\"Id\" integer NOT NULL)"); // => third statement: 42P07, TwinA exists
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"TwinA\""); // => undo drops the first twin
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"TwinB\""); // => undo drops the second twin
    } // => reverse change ends
} // => third migration ends here
