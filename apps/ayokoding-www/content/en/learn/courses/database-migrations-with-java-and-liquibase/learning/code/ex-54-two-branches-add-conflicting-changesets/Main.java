// Example 54: Two Branches Add Conflicting Changesets.
// Parallel branches collide when both create the same table: the first
// merge applies cleanly and the second fails on the existing object. The
// failure is loud and the history names the winner. This program applies
// the branch-a changelog, attempts the branch-b changelog that builds the
// same table, then proves the refusal kept exactly one history row.
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

public class Main {

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
          forget.execute("DELETE FROM databasechangelog WHERE author IN ('team-a', 'team-b')");
          // => both branches collide fresh: team-a wins again, team-b loses again
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      conn.setAutoCommit(false);
      // => manual commit makes every preamble statement explicit and replayable
      // => one connection serves both branches and the conflict check
      try (Statement st = conn.createStatement()) {
        // => the losing branch's table persists, so every run starts clean
        st.execute("DROP TABLE IF EXISTS counters");
        // => dropping first keeps the conflict replayable on double runs
        clearHistory(conn);
        // => forgetting past branches lets this run collide them fresh
        conn.commit();
        // => committing pins the clean slate before branch-a below
      } // => a clean slate replays the same collision on every run
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots both branch changelogs in the same folder
      runQuiet(new Liquibase("branch-a/changelog.sql", accessor, database));
      // => branch-a wins the race: its counters table applies cleanly
      String failure = "none";
      // => the failure name records the outcome without printing internals
      try {
        // => branch-b builds the same table, so this update must collide
        runQuiet(new Liquibase("branch-b/changelog.sql", accessor, database));
      } catch (LiquibaseException expected) {
        // => the exception type is stable; its message text is not asserted
        failure = expected.getClass().getSimpleName();
        // => catching proves the collision failed loudly instead of merging
        conn.rollback();
        // => rolling back keeps the winner's history exactly as applied
      } // => no stack trace: the collision is the expected behaviour
      System.out.println("branch conflict failure: " + failure);
      // => Output: branch conflict failure: CommandExecutionException
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => only the winning branch holds a history row after the refusal
        rs.next();
        System.out.println("winning branch rows: " + rs.getInt(1));
        // => Output: winning branch rows: 1
        // => a rerun replays winner then collision to the identical lines
      } // => reading history back is a habit every later example repeats
    } // => closing the connection ends the program with one winner named
  } // => main races two branches, then names the winner and the refusal
}
