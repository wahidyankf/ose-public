// Example 58: Pending Review Gate.
// the pending list is the gate input.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val base = Flyway.configure() // => configuration for what production knows
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/base") // => only V1
        .load() // => freeze the base configuration
    base.migrate() // => apply pending migrations; re-runs find nothing new
    val release = Flyway.configure() // => configuration for the candidate release
        .dataSource(dbUrl(), dbUser(), null) // => same database, release files
        .locations("filesystem:migrations/release") // => V1 plus two newcomers
        .load() // => freeze the release configuration
    val pending = release.info().pending() // => work awaiting approval
    println("pending=" + pending.size) // => Output: pending=2
    for (m in pending) { // => walk each pending migration
        println(m.version.toString() + " " + m.description) // => version plus intent
    } // => every pending migration named
    println("gate=" + if (pending.isNotEmpty()) "open" else "shut") // => non-empty means wait for review
} // => main ends: every check printed
