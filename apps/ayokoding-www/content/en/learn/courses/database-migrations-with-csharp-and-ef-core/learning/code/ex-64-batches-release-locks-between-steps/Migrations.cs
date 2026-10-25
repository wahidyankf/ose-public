// Migrations for Example 64: batches release locks between steps.
// Three versions fill three slices: five rows each, three commits, small locks.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(SlicesDb))] // => bind this version to the SlicesDb context
[Migration("20260101000001_CreateSlices")] // => first version: the create
public partial class CreateSlices : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Slices", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => slice code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Slices", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Slices"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(SlicesDb))] // => bind this version to the SlicesDb context
[Migration("20260101000002_AddServed")] // => second version: only the schema step
public partial class AddServed : Migration // => schema first, data in slices
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => grow the table by one column
            name: "Served", // => new column the slice loops fill
            table: "Slices", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: true
        ); // => nullable until the slices fill it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Served", // => the column Up added
            table: "Slices"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(SlicesDb))] // => bind this version to the SlicesDb context
[Migration("20260101000003_FillFirstSlice")] // => third version: the first slice
public partial class FillFirstSlice : Migration // => five rows, one commit
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Slices\" SET \"Served\" = true WHERE \"Served\" IS NULL AND \"Id\" BETWEEN 1 AND 5"
        ); // => first slice only
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Slices\" SET \"Served\" = NULL WHERE \"Id\" BETWEEN 1 AND 5"); // => undo clears the first slice
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(SlicesDb))] // => bind this version to the SlicesDb context
[Migration("20260101000004_FillSecondSlice")] // => fourth version: the second slice
public partial class FillSecondSlice : Migration // => five more rows, next commit
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Slices\" SET \"Served\" = true WHERE \"Served\" IS NULL AND \"Id\" BETWEEN 6 AND 10"
        ); // => second slice only
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Slices\" SET \"Served\" = NULL WHERE \"Id\" BETWEEN 6 AND 10"); // => undo clears the second slice
    } // => reverse change ends
} // => fourth migration ends here

[DbContext(typeof(SlicesDb))] // => bind this version to the SlicesDb context
[Migration("20260101000005_FillThirdSlice")] // => fifth version: the last slice
public partial class FillThirdSlice : Migration // => final five rows, last commit
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Slices\" SET \"Served\" = true WHERE \"Served\" IS NULL AND \"Id\" BETWEEN 11 AND 15"
        ); // => third slice only
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Slices\" SET \"Served\" = NULL WHERE \"Id\" BETWEEN 11 AND 15"); // => undo clears the third slice
    } // => reverse change ends
} // => fifth migration ends here
