// Example 74: Detect Drift with a Check Query.
// the report names the intruder.
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
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    flyway.migrate() // => bring the database current; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the drift
            st.executeUpdate("ALTER TABLE baskets DROP COLUMN IF EXISTS rogue") // => idempotent setup for re-runs
            st.executeUpdate("ALTER TABLE baskets ADD COLUMN rogue TEXT") // => the hand change Flyway never saw
            st.executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'baskets' AND column_name NOT IN ('id', 'owner')").use { rs -> // => anything the migration did not promise
                while (rs.next()) { // => walk every intruder
                    println("unexpected=" + rs.getString(1)) // => Output: unexpected=rogue
                } // => loop ends after the intruder
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
