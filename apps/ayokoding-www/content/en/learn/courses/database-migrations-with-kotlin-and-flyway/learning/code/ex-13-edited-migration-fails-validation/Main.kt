// Example 13: Edited Migration Fails Validation.
// the edited copy fails the checksum.
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
    val original = Flyway.configure() // => configuration for the trusted directory
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/current") // => the files every environment ran
        .load() // => freeze the trusted configuration
    original.migrate() // => apply pending migrations; re-runs find nothing new
    val edited = Flyway.configure() // => configuration for the tampered directory
        .dataSource(dbUrl(), dbUser(), null) // => same database, different files
        .locations("filesystem:migrations/edited") // => V1 with a smuggled column
        .load() // => freeze the suspect configuration
    val verdict = edited.validateWithResult() // => checksum comparison, no changes applied
    println("valid=" + verdict.validationSuccessful) // => Output: valid=false
} // => main ends: every check printed
