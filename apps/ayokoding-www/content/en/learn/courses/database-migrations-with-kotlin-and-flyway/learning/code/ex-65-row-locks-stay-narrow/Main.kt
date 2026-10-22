// Example 65: Row Locks Stay Narrow.
// one row's lock never stops a count.
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
    val seen = java.util.Collections.synchronizedList(mutableListOf<Int>()) // => thread-safe result box
    val reader = Thread { // => a concurrent reader during live writes
        DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => its own connection
            conn.createStatement().use { st -> // => a statement for the count
                st.executeQuery("SELECT count(*) FROM parcels").use { rs -> // => readers never block on one row
                    rs.next() // => move to the single result row
                    seen.add(rs.getInt(1)) // => both rows visible throughout
                } // => result set closed here
            } // => statement closed here
        } // => reader connection closed
    } // => reader thread built
    reader.start() // => the reader runs beside the committed backfill
    reader.join() // => wait until the reader finishes
    println("seen=" + seen.sum()) // => Output: seen=2
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the status check
            st.executeQuery("SELECT count(*) FROM parcels WHERE status = 'sent'").use { rs -> // => the backfilled row
                rs.next() // => move to the single result row
                println("sent=" + rs.getInt(1)) // => Output: sent=1
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
