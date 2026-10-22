// Example 0: Kata kata-03-baseline-existing-database.
// A `legacy_stock` table already exists with two rows. Baseline it, apply `V2` adding a `code` column, and prove both rows survived with codes filled.
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
    var present = 0 // => rows already living in the legacy table
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => connect before Flyway exists
        conn.createStatement().use { st -> // => plain DDL outside any migration
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_stock (id SERIAL PRIMARY KEY, item TEXT NOT NULL)") // => the pre-Flyway schema
            st.executeQuery("SELECT count(*) FROM legacy_stock").use { rs -> // => seed only into an empty table
                rs.next() // => move to the single result row
                present = rs.getInt(1) // => re-runs find the backfilled rows
            } // => result set closed here
            if (present == 0) { // => first run seeds; re-runs keep backfilled data
                st.executeUpdate("INSERT INTO legacy_stock (item) VALUES ('nails'), ('bolts')") // => two rows the baseline must keep
            } // => seeding ends; every run converges here
        } // => statement closed here
    } // => connection closed: the legacy schema stands ready
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    try { // => first run stamps; re-runs find the stamp already there
        flyway.baseline() // => stamp the existing schema as version 1
    } catch (e: Exception) { // => the stamp persists, so later runs stand down
    } // => either path converges on the same stamped history
    flyway.migrate() // => apply V2 with its backfill; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the survival queries
            st.executeQuery("SELECT count(*) FROM legacy_stock").use { rs -> // => both rows must survive
                rs.next() // => move to the single result row
                println("rows=" + rs.getInt(1)) // => Output: rows=2
            } // => result set closed here
            st.executeQuery("SELECT count(*) FROM legacy_stock WHERE code = 'K1'").use { rs -> // => the backfilled column
                rs.next() // => move to the single result row
                println("coded=" + rs.getInt(1)) // => Output: coded=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
