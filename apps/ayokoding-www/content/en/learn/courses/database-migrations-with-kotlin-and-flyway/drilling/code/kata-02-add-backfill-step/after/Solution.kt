// Example 0: Kata kata-02-add-backfill-step.
// Extend the `items` table with a `qty` column and backfill every existing row to `1` in the same migration. Print the leftover-null count (zero) and the filled count.
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
    flyway.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the check queries
            st.executeQuery("SELECT count(*) FROM items WHERE qty IS NULL").use { rs -> // => leftovers must be zero
                rs.next() // => move to the single result row
                println("unfilled=" + rs.getInt(1)) // => Output: unfilled=0
            } // => result set closed here
            st.executeQuery("SELECT count(*) FROM items WHERE qty = 1").use { rs -> // => every row backfilled
                rs.next() // => move to the single result row
                println("filled=" + rs.getInt(1)) // => Output: filled=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
