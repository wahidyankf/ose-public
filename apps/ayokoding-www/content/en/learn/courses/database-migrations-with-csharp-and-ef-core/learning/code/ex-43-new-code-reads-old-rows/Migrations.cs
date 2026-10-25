// Migrations for Example 43: new code reads old rows.
// The M03 backfill covers every legacy row, so the new reader sees no NULLs.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(PhonesDb))] // => bind this version to the PhonesDb context
[Migration("20260101000001_CreatePhones")] // => first version: the create
public partial class CreatePhones : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Phones", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Number = table.Column<string>(type: "text", nullable: false), // => phone number, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Phones", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Phones"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(PhonesDb))] // => bind this version to the PhonesDb context
[Migration("20260101000002_AddPrefix")] // => second version: only the schema step
public partial class AddPrefix : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Prefix", // => new column the backfill fills
            table: "Phones", // => the table M01 created
            type: "text", // => free-form prefix text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Prefix", // => the column Up added
            table: "Phones"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(PhonesDb))] // => bind this version to the PhonesDb context
[Migration("20260101000003_FillPrefix")] // => third version: the cover-every-row step
public partial class FillPrefix : Migration // => the new reader needs zero NULLs
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Phones\" SET \"Prefix\" = split_part(\"Number\", '-', 1) WHERE \"Prefix\" IS NULL"
        ); // => prefix is the part before the dash
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Phones\" SET \"Prefix\" = NULL"); // => undo clears the derived prefixes
    } // => reverse change ends
} // => third migration ends here
