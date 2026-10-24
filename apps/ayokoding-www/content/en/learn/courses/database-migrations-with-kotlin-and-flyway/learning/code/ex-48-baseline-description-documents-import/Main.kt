// Example 48: Baseline Description Documents Import.
// imports deserve descriptions too.
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
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_skus (id SERIAL PRIMARY KEY, sku TEXT NOT NULL)") // => the pre-Flyway schema
            st.executeUpdate("DELETE FROM legacy_skus") // => reset to the pre-import state
            st.executeUpdate("INSERT INTO legacy_skus (sku) VALUES ('A1')") // => real data the baseline must keep
        } // => statement closed here
    } // => connection closed: the old inventory system lives here
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .baselineDescription("import legacy inventory") // => the story future auditors read
        .load() // => freeze the configuration into a Flyway instance
    try { // => first run stamps; re-runs find the stamp already there
        flyway.baseline() // => stamp with the description attached
    } catch (e: Exception) { // => the stamp persists, so later runs stand down
    } // => either path converges on the same stamped history
    flyway.migrate() // => bring the database current; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the description query
            st.executeQuery("SELECT description FROM flyway_schema_history WHERE type = 'BASELINE'").use { rs -> // => the import story
                rs.next() // => move to the single baseline row
                println("baseline=" + rs.getString(1)) // => the documented import
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
