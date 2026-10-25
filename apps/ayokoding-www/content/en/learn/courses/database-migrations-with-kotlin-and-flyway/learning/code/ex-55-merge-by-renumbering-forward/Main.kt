// Example 55: Merge by Renumbering Forward.
// the loser becomes the next version.
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
    val branchA = Flyway.configure() // => configuration for the winning branch
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/branch") // => V1 plus the phone V2
        .load() // => freeze the branch configuration
    try { // => the winning branch applies once; re-runs find it superseded
        branchA.migrate() // => V1 and V2 apply on the first run
    } catch (e: Exception) { // => later runs see the merged V3 and stand down
    } // => either path converges on the same history below
    val merged = Flyway.configure() // => configuration for the merged set
        .dataSource(dbUrl(), dbUser(), null) // => same database, merged files
        .locations("filesystem:migrations/merged") // => V1, V2, plus renumbered V3
        .load() // => freeze the merged configuration
    merged.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the history query
            st.executeQuery("SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => history rows in apply order
                while (rs.next()) { // => walk every recorded migration
                    println(rs.getString(1) + " " + rs.getString(2) + " " + rs.getBoolean(3)) // => one line per migration
                } // => loop ends after the last applied migration
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
