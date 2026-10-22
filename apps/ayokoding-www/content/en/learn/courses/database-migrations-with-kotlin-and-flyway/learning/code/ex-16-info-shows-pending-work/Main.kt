// Example 16: Info Shows Pending Work.
// pending names the next deploy.
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
    val partial = Flyway.configure() // => configuration that knows only V1
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/one") // => the small directory
        .load() // => freeze the partial configuration
    partial.migrate() // => apply pending migrations; re-runs find nothing new
    val full = Flyway.configure() // => configuration that knows the release branch
        .dataSource(dbUrl(), dbUser(), null) // => same database, fuller directory
        .locations("filesystem:migrations/all") // => V1 plus the two newcomers
        .load() // => freeze the full configuration
    val pending = full.info().pending() // => resolved but not applied, in version order
    println("pending=" + pending.size) // => Output: pending=2
    for (m in pending) { // => walk each pending migration
        println(m.version.toString() + " " + m.description) // => version plus intent
    } // => every pending migration named
} // => main ends: every check printed
