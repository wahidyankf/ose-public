// Example 0: Kata kata-04-resolve-order-conflict.
// Branch A applied `V1`+`V2`. Branch B's same-numbered `V2` differs. Validate B (it fails), then migrate the merged set where B's change is renumbered `V3`. Print the three history versions.
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
    val branchA = Flyway.configure() // => configuration for branch A
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/branch") // => V1 plus branch A's V2
        .load() // => freeze the branch configuration
    try { // => branch A applies once; re-runs find it superseded
        branchA.migrate() // => V1 and V2 apply on the first run
    } catch (e: Exception) { // => later runs see the renumbered V3 and stand down
    } // => either path converges on the same merged history below
    val rival = Flyway.configure() // => configuration for the rival branch files
        .dataSource(dbUrl(), dbUser(), null) // => same database, rival V2
        .locations("filesystem:migrations/rival") // => V1 plus the conflicting V2
        .load() // => freeze the rival configuration
    println("valid=" + rival.validateWithResult().validationSuccessful) // => checksums disagree on V2
    val merged = Flyway.configure() // => configuration for the renumbered merge
        .dataSource(dbUrl(), dbUser(), null) // => same database, merged files
        .locations("filesystem:migrations/merged") // => V1, V2, plus renumbered V3
        .load() // => freeze the merged configuration
    merged.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the version query
            st.executeQuery("SELECT version FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => the merged story
                val order = StringBuilder() // => collect versions in rank order
                while (rs.next()) { // => walk all three rows
                    if (order.isNotEmpty()) order.append(" ") // => space between versions
                    order.append(rs.getString(1)) // => one version per row
                } // => loop ends after the last row
                println(order.toString()) // => Output: 1 2 3
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
