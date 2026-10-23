// Migrations for Example 15: a partial migrate stays partial.
// Migrate to ...002; ...003 stays pending until the release wants it.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ParcelsDb))] // => bind this version to the ParcelsDb context
[Migration("20260101000001_CreateParcels")] // => first version: the create
public partial class CreateParcels : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Parcels", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => parcel code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Parcels", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Parcels"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ParcelsDb))] // => bind this version to the ParcelsDb context
[Migration("20260101000002_AddFragile")] // => second version: only the alter
public partial class AddFragile : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => grow the table by one column
            name: "Fragile", // => new column the program reads back
            table: "Parcels", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing rows start intact
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Fragile", // => the column Up added
            table: "Parcels"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(ParcelsDb))] // => bind this version to the ParcelsDb context
[Migration("20260101000003_AddInsured")] // => third version: held back this release
public partial class AddInsured : Migration // => pending until the release wants it
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => grow the table by one column
            name: "Insured", // => new column a later release reads
            table: "Parcels", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing rows start uninsured
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Insured", // => the column Up added
            table: "Parcels"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here
