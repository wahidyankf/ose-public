// Example 76: Repair After Fixing the Cause.
// the four-step runbook in code.
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
    val broken = Flyway.configure() // => configuration for the failing set
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/broken") // => V1 plus the broken V2
        .load() // => freeze the failing configuration
    try { // => the broken V2 is expected to fail
        broken.migrate() // => V1 commits, V2 explodes
        println("migrated=true") // => never reached: V2 always fails
    } catch (e: Exception) { // => Flyway wraps the SQL error
        println("migrated=false") // => Output: migrated=false
    } // => the failure is data, not a crash
    val healed = Flyway.configure() // => configuration for the corrected set
        .dataSource(dbUrl(), dbUser(), null) // => same database, corrected files
        .locations("filesystem:migrations/healed") // => V1 plus the healed V2
        .load() // => freeze the healed configuration
    healed.repair() // => step three: align the record with the corrected files
    healed.migrate() // => step four: apply the fix; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the history count
            st.executeQuery("SELECT count(*) FROM flyway_schema_history WHERE success").use { rs -> // => V1 plus the healed V2
                rs.next() // => move to the single result row
                println("history=" + rs.getInt(1)) // => Output: history=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
    println("valid=" + healed.validateWithResult().validationSuccessful) // => recovery proven green
} // => main ends: every check printed
