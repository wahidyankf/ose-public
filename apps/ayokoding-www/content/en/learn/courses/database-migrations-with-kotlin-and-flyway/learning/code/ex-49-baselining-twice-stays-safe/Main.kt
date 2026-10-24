// Example 49: Baselining Twice Stays Safe.
// the second stamp changes nothing.
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
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => connect before Flyway exists
        conn.createStatement().use { st -> // => plain DDL outside any migration
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_parts (id SERIAL PRIMARY KEY, name TEXT NOT NULL)") // => the pre-Flyway schema
            st.executeUpdate("DELETE FROM legacy_parts") // => reset to the pre-import state
        } // => statement closed here
    } // => connection closed: the legacy schema stands ready
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    flyway.baseline() // => first call stamps the schema as version 1
    println("baselined=true") // => the schema is now stamped
    flyway.baseline() // => second call finds the stamp and changes nothing
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the baseline count
            st.executeQuery("SELECT count(*) FROM flyway_schema_history WHERE type = 'BASELINE'").use { rs -> // => exactly one stamp survives
                rs.next() // => move to the single result row
                println("baselines=" + rs.getInt(1)) // => Output: baselines=1
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
