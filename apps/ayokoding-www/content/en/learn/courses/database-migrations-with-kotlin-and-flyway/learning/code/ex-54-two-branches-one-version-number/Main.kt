// Example 54: Two Branches, One Version Number.
// same version, different content.
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
    val branchA = Flyway.configure() // => configuration for branch A
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/main") // => V1 plus the phone V2
        .load() // => freeze branch A's configuration
    branchA.migrate() // => apply pending migrations; re-runs find nothing new
    val branchB = Flyway.configure() // => configuration for branch B
        .dataSource(dbUrl(), dbUser(), null) // => same database, rival files
        .locations("filesystem:migrations/other") // => V1 plus the address V2
        .load() // => freeze branch B's configuration
    println("valid=" + branchB.validateWithResult().validationSuccessful) // => checksums disagree on V2
} // => main ends: every check printed
