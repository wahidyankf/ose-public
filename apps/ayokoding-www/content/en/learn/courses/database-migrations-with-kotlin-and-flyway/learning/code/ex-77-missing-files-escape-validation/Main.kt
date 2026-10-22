// Example 77: Missing Files Escape Validation.
// the comparison names the deletion.
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
    val full = Flyway.configure() // => configuration for the complete set
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/full") // => V1 and V2 together
        .load() // => freeze the full configuration
    full.migrate() // => V1 and V2 apply; re-runs find nothing new
    val partial = Flyway.configure() // => configuration missing V2
        .dataSource(dbUrl(), dbUser(), null) // => same database, thinner directory
        .locations("filesystem:migrations/partial") // => V1 only: V2 was deleted
        .load() // => freeze the partial configuration
    println("valid=" + partial.validateWithResult().validationSuccessful) // => Output: valid=true, the blind spot
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the history versions
            st.executeQuery("SELECT version FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => what the database remembers
                while (rs.next()) { // => walk every recorded migration
                    println("history=" + rs.getString(1)) // => V2 is remembered here
                } // => loop ends after the last row
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
    val disk = java.io.File("migrations/partial").listFiles()!!.map { it.name }.sorted() // => what the directory still holds
    for (name in disk) { // => walk every surviving file
        println("disk=" + name) // => V2 is missing here
    } // => every surviving file named
} // => main ends: every check printed
