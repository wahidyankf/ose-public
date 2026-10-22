// Example 52: Baseline a Multi-Table Database.
// one stamp covers the whole schema.
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
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_shops (id SERIAL PRIMARY KEY, name TEXT NOT NULL)") // => first legacy table
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_visits (id SERIAL PRIMARY KEY, shop_id INTEGER NOT NULL REFERENCES legacy_shops(id))") // => second legacy table
            st.executeUpdate("TRUNCATE legacy_visits, legacy_shops RESTART IDENTITY") // => reset rows and sequences together
            st.executeUpdate("INSERT INTO legacy_shops (name) VALUES ('toko')") // => seed the parent row
            st.executeUpdate("INSERT INTO legacy_visits (shop_id) VALUES (1)") // => seed the child row
        } // => statement closed here
    } // => connection closed: the two-table legacy stands ready
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    try { // => first run stamps; re-runs find the stamp already there
        flyway.baseline() // => one stamp covers both tables
    } catch (e: Exception) { // => the stamp persists, so later runs stand down
    } // => either path converges on the same stamped history
        flyway.migrate() // => bring the database current; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the parity query
            st.executeQuery("SELECT (SELECT count(*) FROM legacy_shops), (SELECT count(*) FROM legacy_visits)").use { rs -> // => both tables intact
                rs.next() // => move to the single result row
                println("shops=" + rs.getInt(1) + " visits=" + rs.getInt(2)) // => Output: shops=1 visits=1
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
