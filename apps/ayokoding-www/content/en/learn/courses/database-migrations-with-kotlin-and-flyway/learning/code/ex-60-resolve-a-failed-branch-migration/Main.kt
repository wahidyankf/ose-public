// Example 60: Resolve a Failed Branch Migration.
// fail, repair, apply the fix.
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
    val branch = Flyway.configure() // => configuration for the broken branch
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/branch") // => V1 plus the broken V2
        .load() // => freeze the branch configuration
    try { // => the broken V2 is expected to fail
        branch.migrate() // => V1 commits, V2 explodes
        println("migrated=true") // => never reached: V2 always fails
    } catch (e: Exception) { // => Flyway wraps the SQL error
        println("migrated=false") // => Output: migrated=false
    } // => the failure is data, not a crash
    val fixed = Flyway.configure() // => configuration for the corrected branch
        .dataSource(dbUrl(), dbUser(), null) // => same database, corrected files
        .locations("filesystem:migrations/fixed") // => V1 plus the fixed V2
        .load() // => freeze the fixed configuration
    fixed.repair() // => align the record with the corrected files; re-runs find it aligned
    fixed.migrate() // => the corrected V2 applies; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the history count
            st.executeQuery("SELECT count(*) FROM flyway_schema_history WHERE success").use { rs -> // => V1 plus the fixed V2
                rs.next() // => move to the single result row
                println("history=" + rs.getInt(1)) // => Output: history=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
    println("valid=" + fixed.validateWithResult().validationSuccessful) // => history and files agree
} // => main ends: every check printed
