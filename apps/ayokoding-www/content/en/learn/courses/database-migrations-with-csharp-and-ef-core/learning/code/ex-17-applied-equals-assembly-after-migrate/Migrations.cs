// Migrations for Example 17: applied equals assembly after a full migrate.
// Reflection counts the Migration classes; the history must match that count.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Seals17Db))] // => bind this version to the Seals17Db context
[Migration("20260101000001_CreateSeals17")] // => first version: the create
public partial class CreateSeals17 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Seals17", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Mark = table.Column<string>(type: "text", nullable: false), // => seal mark, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Seals17", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Seals17"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Seals17Db))] // => bind this version to the Seals17Db context
[Migration("20260101000002_AddGrade17")] // => second version: only the alter
public partial class AddGrade17 : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Grade", // => new column the program reads back
            table: "Seals17", // => the table M01 created
            type: "text", // => free-form grade text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Grade", // => the column Up added
            table: "Seals17"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Seals17Db))] // => bind this version to the Seals17Db context
[Migration("20260101000003_IndexGrade17")] // => third version: the index
public partial class IndexGrade17 : Migration // => each version stays reviewable alone
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateIndex( // => one index, its own versioned step
            name: "IX_Seals17_Grade", // => index name the database catalog holds
            table: "Seals17", // => the table M01 created
            column: "Grade"
        ); // => the column M02 added
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropIndex( // => undo removes the added index
            name: "IX_Seals17_Grade", // => the index Up added
            table: "Seals17"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
