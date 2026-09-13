module OrganicleverBe.Tests.Unit.Tests.AppDbContextTests

open Microsoft.EntityFrameworkCore
open Xunit
open OrganicleverBe.Infrastructure.AppDbContext

/// A DbContextOptions pointed at an unreachable PostgreSQL host. Building the
/// context and its model from these options never opens a connection — EF Core
/// only connects when a query actually executes — so this exercises the
/// context's own construction, model building, and DbSet accessors without any
/// live database.
let private unreachableOptions () : DbContextOptions<AppDbContext> =
    DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql("Host=127.0.0.1;Port=1;Database=organiclever_be_unit_test;Username=x")
        .UseSnakeCaseNamingConvention()
        .Options

[<Fact>]
let ``AppDbContext builds its model on construction without connecting`` () =
    use ctx = new AppDbContext(unreachableOptions ())
    // Accessing .Model lazily triggers OnModelCreating; this is pure metadata
    // construction and never opens a database connection.
    Assert.NotNull(box ctx.Model)

[<Fact>]
let ``AppDbContext exposes a gettable and settable JournalEntries DbSet`` () =
    use ctx = new AppDbContext(unreachableOptions ())
    let originalSet = ctx.JournalEntries
    Assert.NotNull(box originalSet)
    ctx.JournalEntries <- originalSet
    Assert.Same(originalSet, ctx.JournalEntries)
