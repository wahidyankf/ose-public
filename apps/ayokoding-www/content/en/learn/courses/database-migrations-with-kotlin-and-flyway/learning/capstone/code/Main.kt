// Capstone: evolve an order-management schema through eight migrations.
// The shop starts with customers and orders, gains contact columns, renames
// a column without downtime, splits out line items, indexes the new key,
// and adopts a status lookup -- then proves the result with golden queries.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the golden verification queries

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
        .locations("filesystem:db/migrations") // => the eight capstone migrations
        .load() // => freeze the configuration into a Flyway instance
    flyway.migrate() // => apply pending migrations; re-runs find nothing new
    println("valid=" + flyway.validateWithResult().validationSuccessful) // => the final schema coheres
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the golden queries
            st.executeQuery("SELECT c.full_name, count(DISTINCT o.id), count(i.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id LEFT JOIN order_items i ON i.order_id = o.id GROUP BY c.full_name ORDER BY c.full_name").use { rs -> // => per-customer order summary
                while (rs.next()) { // => walk both customers alphabetically
                    println(rs.getString(1) + " orders=" + rs.getInt(2) + " items=" + rs.getInt(3)) // => the golden summary lines
                } // => loop ends after the last customer
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: the shop schema stands verified
