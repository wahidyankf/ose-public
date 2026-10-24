// Migrations for Example 34: backfill, then constrain, in two steps.
// Nullable first, fill second, NOT NULL last: no row is ever rejected.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Codes34Db))] // => bind this version to the Codes34Db context
[Migration("20260101000001_CreateCodes34")] // => first version: the create
public partial class CreateCodes34 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Codes34", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Tag = table.Column<string>(type: "text", nullable: false), // => tag column, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Codes34", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Codes34"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Codes34Db))] // => bind this version to the Codes34Db context
[Migration("20260101000002_AddCode")] // => second version: nullable first
public partial class AddCode : Migration // => the column arrives nullable
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table without rejecting rows
            name: "Code", // => new column the next step fills
            table: "Codes34", // => the table M01 created
            type: "text", // => free-form code text
            nullable: true
        ); // => nullable while old rows catch up
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Code", // => the column Up added
            table: "Codes34"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Codes34Db))] // => bind this version to the Codes34Db context
[Migration("20260101000003_FillCode")] // => third version: fill every gap
public partial class FillCode : Migration // => no NULL survives this version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Codes34\" SET \"Code\" = 'n-a' WHERE \"Code\" IS NULL"); // => every missing code becomes n-a
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Codes34\" SET \"Code\" = NULL WHERE \"Code\" = 'n-a'"); // => undo restores the gaps
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(Codes34Db))] // => bind this version to the Codes34Db context
[Migration("20260101000004_RequireCode")] // => fourth version: constrain last
public partial class RequireCode : Migration // => NOT NULL only when no NULL remains
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AlterColumn<string>( // => tighten the column in place
            name: "Code", // => the column M02 added and M03 filled
            table: "Codes34", // => the table M01 created
            type: "text", // => same type, stricter rule
            nullable: false
        ); // => NULLs are rejected from here on
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AlterColumn<string>( // => loosen the column back
            name: "Code", // => the column Up tightened
            table: "Codes34", // => the table M01 created
            type: "text", // => same type, looser rule
            nullable: true
        ); // => NULLs are tolerated again
    } // => reverse change ends
} // => fourth migration ends here
