// Migrations for Example 12: pending work is visible before it applies.
// Three versions exist; migrating to ...001 leaves two pending.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(CratesDb))] // => bind this version to the CratesDb context
[Migration("20260101000001_CreateCrates")] // => first version: the create
public partial class CreateCrates : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Crates", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Mark = table.Column<string>(type: "text", nullable: false), // => crate mark, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Crates", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Crates"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(CratesDb))] // => bind this version to the CratesDb context
[Migration("20260101000002_AddWeight")] // => second version: only the alter
public partial class AddWeight : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Weight", // => new column the program reads back
            table: "Crates", // => the table M01 created
            type: "integer", // => whole-unit weight
            nullable: false, // => every row gets a value
            defaultValue: 0
        ); // => existing rows start at zero
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Weight", // => the column Up added
            table: "Crates"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(CratesDb))] // => bind this version to the CratesDb context
[Migration("20260101000003_AddOrigin")] // => third version: another alter
public partial class AddOrigin : Migration // => each version stays reviewable alone
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Origin", // => new column the program reads back
            table: "Crates", // => the table M01 created
            type: "text", // => free-form origin text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Origin", // => the column Up added
            table: "Crates"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
