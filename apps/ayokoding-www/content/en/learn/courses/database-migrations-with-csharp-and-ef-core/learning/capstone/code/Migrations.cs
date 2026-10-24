// Capstone migrations: an eight-step order-management evolution.
// Create, relate, widen, backfill, rename without downtime, and ship a status.
using Microsoft.EntityFrameworkCore; // => ReferentialAction lives here
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000001_CreateCustomers")] // => first version: the customer create
public partial class CreateCustomers : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Customers", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => customer name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Customers", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Customers"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000002_CreateOrders")] // => second version: orders reference customers
public partial class CreateOrders : Migration // => relations get their own version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Orders", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                CustomerId = table.Column<int>(type: "integer", nullable: false), // => owner reference, required
                Total = table.Column<int>(type: "integer", nullable: false), // => order total, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Orders", x => x.Id); // => primary key on the identity column
                table.ForeignKey( // => the relation this migration owns
                    name: "FK_Orders_Customers_CustomerId", // => constraint name the catalog holds
                    column: x => x.CustomerId, // => the referencing column
                    principalTable: "Customers", // => the referenced table
                    principalColumn: "Id", // => the referenced column
                    onDelete: ReferentialAction.Cascade
                ); // => deleting a customer removes its orders
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Orders"
        ); // => drop what Up created
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000003_AddEmail")] // => third version: only the alter
public partial class AddEmail : Migration // => the alter lives alone, V1 untouched
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Email", // => new column the program reads back
            table: "Customers", // => the table C01 created
            type: "text", // => free-form address text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Email", // => the column Up added
            table: "Customers"
        ); // => from the table Up altered
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000004_BackfillEmail")] // => fourth version: data only, no schema change
public partial class BackfillEmail : Migration // => backfills ride their own version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Customers\" SET \"Email\" = lower(\"Name\") || '@example.test' WHERE \"Email\" IS NULL"
        ); // => derive every missing address
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Customers\" SET \"Email\" = NULL"); // => undo clears the derived addresses
    } // => reverse change ends
} // => fourth migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000005_AddFullName")] // => fifth version: expand for the rename
public partial class AddFullName : Migration // => expand first, contract later
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name lives beside the old one
            name: "FullName", // => new column the program reads back
            table: "Customers", // => the table C01 created
            type: "text", // => free-form full-name text
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "FullName", // => the column Up added
            table: "Customers"
        ); // => from the table Up altered
    } // => reverse change ends
} // => fifth migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000006_BackfillFullName")] // => sixth version: move old names across
public partial class BackfillFullName : Migration // => backfills ride their own version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql(
            "UPDATE \"Customers\" SET \"FullName\" = \"Name\" WHERE \"FullName\" IS NULL"
        ); // => copy every missing full name
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Customers\" SET \"FullName\" = NULL"); // => undo clears the copied names
    } // => reverse change ends
} // => sixth migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000007_DropName")] // => seventh version: contract after the move
public partial class DropName : Migration // => the old column leaves only when unused
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Name", // => the column C06 replaced
            table: "Customers"
        ); // => from the table C01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Name", // => the dropped column, restored
            table: "Customers", // => the table C01 created
            type: "text", // => free-form name text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => seventh migration ends here

[DbContext(typeof(ShopDb))] // => bind this version to the ShopDb context
[Migration("20260101000008_AddStatus")] // => eighth version: the shippable status
public partial class AddStatus : Migration // => each version stays reviewable alone
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow orders by one column
            name: "Status", // => new column the program reads back
            table: "Orders", // => the table C02 created
            type: "text", // => free-form status text
            nullable: false, // => every order carries a status
            defaultValue: "new"
        ); // => existing orders start new
        migrationBuilder.CreateIndex( // => the status gets its own index
            name: "IX_Orders_Status", // => index name the database catalog holds
            table: "Orders", // => the table C02 created
            column: "Status"
        ); // => the column Up added
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropIndex( // => undo removes the added index
            name: "IX_Orders_Status", // => the index Up added
            table: "Orders"
        ); // => from the table Up altered
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Status", // => the column Up added
            table: "Orders"
        ); // => from the table Up altered
    } // => reverse change ends
} // => eighth migration ends here
