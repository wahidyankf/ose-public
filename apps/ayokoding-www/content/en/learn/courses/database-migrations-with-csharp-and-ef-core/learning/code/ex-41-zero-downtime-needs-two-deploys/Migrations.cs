// Migrations for Example 41: zero-downtime needs two deploys.
// Deploy one stops after the expand; deploy two finishes the contract.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(DeploysDb))] // => bind this version to the DeploysDb context
[Migration("20260101000001_CreateDeploys")] // => first version: the create
public partial class CreateDeploys : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Deploys", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Ship = table.Column<string>(type: "text", nullable: false), // => old ship name, renamed by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Deploys", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Deploys"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(DeploysDb))] // => bind this version to the DeploysDb context
[Migration("20260101000002_AddVessel")] // => second version: the expand step
public partial class AddVessel : Migration // => deploy one ends after this version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name beside the old
            name: "Vessel", // => new column the program reads back
            table: "Deploys", // => the table M01 created
            type: "text", // => free-form vessel text
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Vessel", // => the column Up added
            table: "Deploys"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(DeploysDb))] // => bind this version to the DeploysDb context
[Migration("20260101000003_FillVessel")] // => third version: the catch-up step
public partial class FillVessel : Migration // => old rows join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Deploys\" SET \"Vessel\" = \"Ship\" WHERE \"Vessel\" IS NULL"); // => copy every missing vessel
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Deploys\" SET \"Vessel\" = NULL"); // => undo clears the copied vessels
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(DeploysDb))] // => bind this version to the DeploysDb context
[Migration("20260101000004_DropShip")] // => fourth version: deploy two contracts
public partial class DropShip : Migration // => the old name leaves last
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Ship", // => the column M03 replaced
            table: "Deploys"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Ship", // => the dropped column, restored
            table: "Deploys", // => the table M01 created
            type: "text", // => free-form ship text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => fourth migration ends here
