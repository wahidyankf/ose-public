// Migrations for Example 22: two tables or none.
// M02 creates Alpha and Beta, then fails: transactional DDL keeps neither.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(TwinsDb))] // => bind this version to the TwinsDb context
[Migration("20260101000001_CreateLedger22")] // => first version: the anchor create
public partial class CreateLedger22 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("CREATE TABLE \"Ledger22\" (\"Id\" integer NOT NULL)"); // => the anchor the failure must not touch
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"Ledger22\""); // => undo drops the anchor table
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(TwinsDb))] // => bind this version to the TwinsDb context
[Migration("20260101000002_BrokenTwinPair")] // => second version: the broken pair
public partial class BrokenTwinPair : Migration // => both tables share one transaction
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("CREATE TABLE \"Alpha\" (\"Id\" integer NOT NULL)"); // => first table: valid alone
        migrationBuilder.Sql("CREATE TABLE \"Beta\" (\"Id\" integer NOT NULL)"); // => second table: valid alone
        migrationBuilder.Sql("CREATE TABLE \"Alpha\" (\"Id\" integer NOT NULL)"); // => third statement: 42P07, Alpha exists
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"Alpha\""); // => undo drops the first table
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"Beta\""); // => undo drops the second table
    } // => reverse change ends
} // => second migration ends here
