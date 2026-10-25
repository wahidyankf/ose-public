// Kata 04: Resolve an Order Conflict Between Two Branches.
// Branch-a builds the table; branch-b duplicates it and must lose. The
// resolution replaces the duplicate with an index on the winner's table.
// Apply the winner, survive the collision, apply the replacement, then
// prove the failure named itself with two history rows and one index.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.exception.LiquibaseException; // => the stable type every expected failure wears
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  // => each branch runs inside the same quiet scope shape as every update
  static void runQuiet(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.update("")
    );
    // => update("") runs every changeset with no context filter
  } // => quiet updates keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the collision and its resolution
      conn.setAutoCommit(false);
      // => manual commit makes the kata reset explicit and replayable
      try (Statement st = conn.createStatement()) {
        // => the losing branch's table persists, so every run starts clean
        st.execute("DROP TABLE IF EXISTS waypoints");
        // => dropping first keeps the collision replayable on double runs
      } // => a clean slate replays the same collision on every run
      clearHistory(conn);
      // => forgetting past branches lets this run collide them fresh
      conn.commit();
      // => committing pins the clean slate before branch-a below
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots all three branch changelogs in the kata folder
      runQuiet(new Liquibase("changelog-a.sql", accessor, database));
      // => branch-a wins the race: its waypoints table applies cleanly
      String failure = "none";
      // => the failure name records the outcome without printing internals
      try {
        // => branch-b builds the same table, so this update must collide
        runQuiet(new Liquibase("changelog-b.sql", accessor, database));
      } catch (LiquibaseException expected) {
        // => the exception type is stable; its message text is not asserted
        failure = expected.getClass().getSimpleName();
        // => catching proves the collision failed loudly instead of merging
        conn.rollback();
        // => rolling back keeps the winner's history exactly as applied
      } // => no stack trace: the collision is the expected evidence
      runQuiet(new Liquibase("changelog-b-resolved.sql", accessor, database));
      // => the resolution indexes the winner's table instead of duplicating it
      System.out.println("branch conflict failure: " + failure);
      // => Output: branch conflict failure: CommandExecutionException
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => winner plus resolution share the history: two rows, one order
        rs.next();
        System.out.println("merged history rows: " + rs.getInt(1));
        // => Output: merged history rows: 2
      } // => two rows prove the merge resolved into a single line
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM pg_indexes WHERE indexname = 'ix_waypoints_code'")
      ) {
        // => the replacement built exactly the index the duplicate skipped
        rs.next();
        System.out.println("resolution indexes: " + rs.getInt(1));
        // => Output: resolution indexes: 1
        // => a rerun replays winner, collision, and resolution identically
      } // => one index proves the losing branch still shipped value
    } // => closing the connection ends the kata with the conflict resolved
  } // => main races two branches, then merges them into one history

  // => the history table may not exist before the first update, so forgetting
  // => our rows is guarded by an existence check on every run
  static void clearHistory(Connection conn) throws Exception {
    // => information_schema tells whether any history exists to forget
    try (
      Statement check = conn.createStatement();
      // => a separate statement keeps the check isolated from the delete
      ResultSet rs = check.executeQuery(
        "SELECT count(*) FROM information_schema.tables " + "WHERE table_name = 'databasechangelog'"
      )
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => forgetting runs only where a history table already exists
      if (rs.getInt(1) > 0) {
        // => deleting only our own rows leaves every other course untouched
        try (Statement forget = conn.createStatement()) {
          // => the delete runs only after the check proved the table exists
          forget.execute("DELETE FROM databasechangelog WHERE author = 'kata'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates
}
