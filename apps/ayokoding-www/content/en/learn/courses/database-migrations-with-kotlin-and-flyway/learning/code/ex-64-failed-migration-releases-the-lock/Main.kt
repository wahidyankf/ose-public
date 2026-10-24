// Example 64: Failed Migration Releases the Lock.
// recovery proves the lock freed.
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
    val outcomes = java.util.Collections.synchronizedList(mutableListOf<String>()) // => thread-safe result box
    val workers = (1..2).map { // => two concurrent migrators
        Thread { // => each thread migrates the same pending set
            try { // => the broken V2 fails in exactly one winner
                val n = Flyway.configure().dataSource(dbUrl(), dbUser(), null).locations("filesystem:migrations/race").load().migrate() // => the lock picks one runner
                outcomes.add("applied=" + n.migrationsExecuted) // => winner or zero-work loser
            } catch (e: Exception) { // => the winner reports the failure
                outcomes.add("failed") // => lock released by the failure path
            } // => every thread records exactly one outcome
        } // => thread body ends
    } // => two threads built
    workers.forEach { it.start() } // => both race the broken set
    workers.forEach { it.join() } // => wait until every thread finishes
    println("racers=" + outcomes.size) // => both threads reported
    val fixed = Flyway.configure() // => configuration for the corrected set
        .dataSource(dbUrl(), dbUser(), null) // => same database, corrected files
        .locations("filesystem:migrations/fixed") // => V1 plus the fixed V2
        .load() // => freeze the fixed configuration
    fixed.repair() // => clear any recorded failure state before retrying
    fixed.migrate() // => the fix applies; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the history count
            st.executeQuery("SELECT count(*) FROM flyway_schema_history WHERE success").use { rs -> // => V1 plus the fixed V2
                rs.next() // => move to the single result row
                println("history=" + rs.getInt(1)) // => Output: history=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
    println("valid=" + fixed.validateWithResult().validationSuccessful) // => healed history validates
} // => main ends: every check printed
