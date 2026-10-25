// Example 67: Lock Timeouts Fail Fast in CI.
// A runner waiting forever on a stuck lock hangs the pipeline; a lock
// timeout turns the wait into a fast, loud failure the pipeline can
// retry or page on. This program applies one changeset, holds the lock
// row from a second connection to stand in for the stuck runner, attempts
// a second changeset with a five-second lock timeout, then proves the
// attempt failed fast with the pending work still unapplied.
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

  // => Liquibase narrates progress to its console UI by default; those lines
  // => differ between a first run and a rerun, so goldens cannot hold them
  static void runQuiet(Liquibase liquibase, boolean firstOnly) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the flag selects whether the seed stops after one changeset
        if (firstOnly) {
          // => the seed applies the first changeset, leaving one pending
          liquibase.update(1, "");
        } else {
          // => the contender attempts the pending changeset past the lock
          liquibase.update("");
        } // => pending work forces lock acquisition; none would skip it
      }
    );
    // => every move stays inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
    // => one accessor roots the changelog on every handle below
    try (Connection seed = connect()) {
      // => the seed applies the first changeset, leaving the second pending
      seed.setAutoCommit(false);
      // => manual commit makes the seed's reset explicit and replayable
      try (Statement st = seed.createStatement()) {
        // => leftovers would apply the wrong changeset count below
        st.execute("DROP TABLE IF EXISTS theta");
        // => dropping first keeps the seed replayable on double runs
        st.execute("DROP TABLE IF EXISTS iota");
        // => the pending changeset's table goes too, every run alike
      } // => a clean stage applies exactly one changeset, leaving one pending
      clearHistory(seed);
      // => forgetting past runs lets the seed apply its single changeset fresh
      seed.commit();
      // => committing pins the clean slate before the seed update below
      runQuiet(
        new Liquibase(
          // => two changesets: the seed applies one, the contender wants one
          "changelog.sql",
          accessor,
          DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(seed))
        ),
        true
      );
      // => the lock table exists from here on, holding one free row
    } // => the seed closes; its lock released normally like every clean run
    try (Connection holder = connect()) {
      // => the holder stands in for the stuck runner from another pipeline
      holder.setAutoCommit(false);
      // => manual commit keeps the row lock held until the release below
      Statement hold = holder.createStatement();
      // => the hold statement lives until the contender attempt finishes
      ResultSet held = hold.executeQuery("SELECT * FROM databasechangeloglock FOR UPDATE");
      // => FOR UPDATE locks the row; the open transaction keeps it held
      held.next();
      // => fetching the single row pins the lock before the contender moves
      try (Connection conn = connect()) {
        // => the contender attempts its update against the held lock row
        try (Statement st = conn.createStatement()) {
          // => five seconds bounds the wait; CI asks for seconds, not forever
          st.execute("SET lock_timeout = '5s'");
          // => lock_timeout fails lock waits fast instead of hanging pipelines
        } // => the timeout is set before any lock is ever attempted
        Liquibase liquibase = new Liquibase(
          // => one changeset pends here; locking cannot be skipped
          "changelog.sql",
          accessor,
          DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(conn))
        );
        String failure = "none";
        // => the failure name records the outcome without printing internals
        try {
          // => lock acquisition blocks on the held row, then times out
          runQuiet(liquibase, false);
        } catch (LiquibaseException expected) {
          // => the exception type is stable; its message text is not asserted
          failure = expected.getClass().getSimpleName();
          // => catching proves the wait failed fast instead of hanging
          conn.rollback();
          // => rolling back keeps the applied changeset exactly as seeded
        } // => no stack trace: the fast failure is the expected behaviour
        System.out.println("lock timeout failure: " + failure);
        // => Output: lock timeout failure: CommandExecutionException
        try (
          Statement st = conn.createStatement();
          ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
        ) {
          // => the timed-out attempt applied nothing beyond the seed
          rs.next();
          System.out.println("history rows after timeout: " + rs.getInt(1));
          // => Output: history rows after timeout: 1
          // => a rerun reseeds one, re-holds, and times out identically
        } // => reading history back is a habit every later example repeats
      } // => the contender closes; its timeout dies with its connection
      held.close();
      // => closing the held rows ends the demonstration of the stuck lock
      hold.close();
      // => closing the hold statement releases its database resources
      holder.rollback();
      // => releasing the held row unblocks the lock table for later runners
    } // => closing the holder ends the program with the lock table free
  } // => main seeds one, holds the lock elsewhere, then beats the timeout

  // => the history table may not exist before the seed update, so forgetting
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
          forget.execute("DELETE FROM databasechangelog WHERE author = 'course'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates
}
