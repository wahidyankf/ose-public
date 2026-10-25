// Migrations for Example 30: batch backfills avoid long locks.
// One DO block fills fifty rows in tens, committing slices instead of one mass write.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Batch30Db))] // => bind this version to the Batch30Db context
[Migration("20260101000001_CreateBatch30")] // => first version: the create
public partial class CreateBatch30 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Batch30", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => batch code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Batch30", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Batch30"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Batch30Db))] // => bind this version to the Batch30Db context
[Migration("20260101000002_AddDone")] // => second version: only the schema step
public partial class AddDone : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => grow the table by one column
            name: "Done", // => new column the batch loop fills
            table: "Batch30", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Done", // => the column Up added
            table: "Batch30"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Batch30Db))] // => bind this version to the Batch30Db context
[Migration("20260101000003_FillDoneBatches")] // => third version: the batched data step
public partial class FillDoneBatches : Migration // => batches keep each lock short
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "DO $$ BEGIN WHILE (SELECT count(*) FROM \"Batch30\" WHERE \"Done\" IS NULL) > 0 LOOP UPDATE \"Batch30\" SET \"Done\" = true WHERE \"Id\" IN (SELECT \"Id\" FROM \"Batch30\" WHERE \"Done\" IS NULL ORDER BY \"Id\" LIMIT 10); END LOOP; END $$"
        ); // => ten rows per pass until none remain
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Batch30\" SET \"Done\" = NULL"); // => undo clears the filled flags
    } // => reverse change ends
} // => third migration ends here
