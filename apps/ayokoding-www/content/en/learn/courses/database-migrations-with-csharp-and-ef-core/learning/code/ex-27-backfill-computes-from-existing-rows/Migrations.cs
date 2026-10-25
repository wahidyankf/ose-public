// Migrations for Example 27: the backfill computes from existing rows.
// M03 derives Full from First and Last; no row is hand-edited.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(PeopleDb))] // => bind this version to the PeopleDb context
[Migration("20260101000001_CreatePeople")] // => first version: the create
public partial class CreatePeople : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "People", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                First = table.Column<string>(type: "text", nullable: false), // => given name, required
                Last = table.Column<string>(type: "text", nullable: false), // => family name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_People", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "People"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(PeopleDb))] // => bind this version to the PeopleDb context
[Migration("20260101000002_AddFull")] // => second version: only the schema step
public partial class AddFull : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Full", // => new column the backfill fills
            table: "People", // => the table M01 created
            type: "text", // => free-form full-name text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Full", // => the column Up added
            table: "People"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(PeopleDb))] // => bind this version to the PeopleDb context
[Migration("20260101000003_FillFull")] // => third version: only the data step
public partial class FillFull : Migration // => data rides its own version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"People\" SET \"Full\" = \"First\" || ' ' || \"Last\" WHERE \"Full\" IS NULL"
        ); // => derive every missing full name
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"People\" SET \"Full\" = NULL"); // => undo clears the derived names
    } // => reverse change ends
} // => third migration ends here
