// Example 51: Existing Data Survives Baselining.
// the stamp touches no rows.
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
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_coffee (id SERIAL PRIMARY KEY, bean TEXT NOT NULL)") // => the pre-Flyway schema
            st.executeUpdate("DELETE FROM legacy_coffee") // => reset to the pre-import state
            st.executeUpdate("INSERT INTO legacy_coffee (bean) VALUES ('arabika'), ('robusta'), ('liberika')") // => three rows to protect

        } // => statement closed here
    } // => connection closed: the legacy harvest stands ready
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    try { // => first run stamps; re-runs find the stamp already there
        flyway.baseline() // => stamp metadata only, rows untouched
    } catch (e: Exception) { // => the stamp persists, so later runs stand down
    } // => either path converges on the same stamped history
        flyway.migrate() // => bring the database current; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the survival count
            st.executeQuery("SELECT count(*) FROM legacy_coffee").use { rs -> // => all three rows must remain
                rs.next() // => move to the single result row
                println("rows=" + rs.getInt(1)) // => Output: rows=3
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
