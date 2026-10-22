// Example 11: Out-of-Order Arrival Needs a Flag.
// rank order proves the late landing.
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
    val gap = Flyway.configure() // => first configuration sees only V1 and V3
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/gap") // => the gapped directory
        .load() // => freeze the gap configuration
    try { // => the gapped set applies once; re-runs find it superseded
        gap.migrate() // => V1 and V3 apply; the gap is legal
    } catch (e: Exception) { // => later runs see the admitted V2 and stand down
    } // => either path converges on the same ranked history below
    val loose = Flyway.configure() // => second configuration opts into disorder
        .dataSource(dbUrl(), dbUser(), null) // => same database again
        .locations("filesystem:migrations/full") // => now V2 exists on disk
        .outOfOrder(true) // => the team accepts the late arrival
        .load() // => freeze the lenient configuration
    loose.migrate() // => V2 finally applies after V3
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the rank query
            st.executeQuery("SELECT version FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => true run order
                val order = StringBuilder() // => collect versions in rank order
                while (rs.next()) { // => walk every recorded migration
                    if (order.isNotEmpty()) order.append(",") // => comma between versions
                    order.append(rs.getString(1)) // => rank order, not version order
                } // => loop ends after the last row
                println("ranked=" + order.toString()) // => Output: ranked=1,3,2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
    println("valid=" + loose.validateWithResult().validationSuccessful) // => history and files agree now
} // => main ends: every check printed
