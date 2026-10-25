// Example 22: Two Tables or None.
// M02 creates Alpha and Beta, then fails: neither table survives the rollback.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new TwinsDb( // => one context per program run
    new DbContextOptionsBuilder<TwinsDb>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

string Scalar(string sql) // => one-row, one-column inspection queries
{ // => scalar block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => read-only inspection SQL
    object? value = cmd.ExecuteScalar(); // => the single answer
    return value?.ToString() ?? "null"; // => text for printing, null-safe
} // => scalar helper ends here

ctx.Database.Migrate("20260101000001_CreateLedger22"); // => apply only M01 first
try // => the broken pair is expected to throw
{ // => try block opens
    ctx.Database.Migrate(); // => M02 fails on the duplicate Alpha table
} // => try ends after the failing call
catch (Exception) // => any provider error counts: the kind is fixed by SQLSTATE
{ // => catch block opens
} // => catch ends here: the failure is the lesson
string Present(string table) // => one check names one table present or absent
{ // => check block opens
    return
        Scalar($"SELECT count(*) FROM information_schema.tables WHERE table_name = '{table}'")
        == "0"
        ? "absent"
        : "present"; // => zero rows means absent
} // => check ends here
Console.WriteLine($"alpha={Present("Alpha")} beta={Present("Beta")}"); // => Output: alpha=absent beta=absent

public class TwinsDb : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public TwinsDb(DbContextOptions<TwinsDb> options)
        : base(options) { } // => options carry the connection string
} // => context ends here
