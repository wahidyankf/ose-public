// Migrations for Example 18: rollback means a forward fix.
// M02 adds Email by mistake; M03 drops it. History only moves forward.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(MembersDb))] // => bind this version to the MembersDb context
[Migration("20260101000001_CreateMembers")] // => first version: the create
public partial class CreateMembers : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Members", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Handle = table.Column<string>(type: "text", nullable: false), // => member handle, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Members", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Members"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(MembersDb))] // => bind this version to the MembersDb context
[Migration("20260101000002_AddEmailMistake")] // => second version: the mistaken add
public partial class AddEmailMistake : Migration // => the mistake is versioned too
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the column the team regrets
            name: "Email", // => mistaken column, removed by M03
            table: "Members", // => the table M01 created
            type: "text", // => free-form address text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Email", // => the column Up added
            table: "Members"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(MembersDb))] // => bind this version to the MembersDb context
[Migration("20260101000003_DropEmailFix")] // => third version: the forward fix
public partial class DropEmailFix : Migration // => rollback by moving forward
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the fix undoes M02 going forward
            name: "Email", // => the mistaken column, now gone
            table: "Members"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo re-adds what Up dropped
            name: "Email", // => the mistaken column, restored
            table: "Members", // => the table M01 created
            type: "text", // => free-form address text
            nullable: true
        ); // => nullable so existing rows survive
    } // => reverse change ends
} // => third migration ends here
