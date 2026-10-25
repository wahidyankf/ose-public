// Example 11: Checksums Catch Edited History.
// Each history row stores a checksum of the changeset that produced it.
// Editing an already-applied changeset changes its checksum, and the next
// update refuses to run: history is append-only by default. This program
// applies two changesets, tampers one stored checksum through JDBC to stand
// in for an edit, then proves the next update fails checksum validation
// while the history stays intact.
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
  static void runQuiet(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.update("")
    );
    // => update("") runs every changeset with no context filter
  } // => quiet updates keep golden output identical on the harness double run

  // => a fresh demo slate keeps this program deterministic on double runs
  static void resetDemo(Connection conn) throws Exception {
    conn.setAutoCommit(false);
    // => manual commit makes every reset statement explicit and replayable
    // => the tampered checksum below persists, so every run starts clean
    try (Statement st = conn.createStatement()) {
      // => one statement serves the whole reset
      st.execute("DROP TABLE IF EXISTS gadgets");
      // => dropping last-created first unwinds the pair in reverse
      st.execute("DROP TABLE IF EXISTS widgets");
      // => dropping first removes the evidence of the previous run
      clearHistory(conn);
      // => deleting only our own rows leaves every other course untouched
      conn.commit();
      // => committing the reset makes the fresh update that follows honest
    } // => the next update always meets an empty history for our changesets
  } // => reset-then-run prints identical lines on the harness double run

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
          forget.execute("DELETE FROM databasechangelog WHERE author = 'course'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the migration, the tamper, and the retry
      resetDemo(conn);
      // => a clean slate means the tamper below behaves identically always
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets: widgets first, then gadgets
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => both changesets apply against the clean slate
      conn.commit();
      // => committing pins the history rows the tamper below will edit
      try (Statement st = conn.createStatement()) {
        // => one statement tampers, then counts, then reports
        st.executeUpdate("UPDATE databasechangelog SET md5sum = '9:tampered' WHERE id = '001-make-widgets'");
        // => rewriting the stored checksum stands in for editing history
        // => a real edit changes the computed checksum; the effect matches
        conn.commit();
        // => the tampered row persists, so the retry below must confront it
        String failure = "none";
        // => the failure name records the outcome without printing internals
        try {
          // => the retry recomputes checksums and meets the tampered row
          runQuiet(
            new Liquibase(
              // => a second handle on the same changelog retries the run
              "changelog.sql",
              new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
              database
            )
          );
        } catch (LiquibaseException expected) {
          // => the exception type is stable; its message text is not asserted
          failure = expected.getClass().getSimpleName();
          // => catching proves validation refused the edited history
          conn.rollback();
          // => rolling back leaves the history exactly as the tamper left it
        } // => no stack trace: the refusal is the expected behaviour
        System.out.println("checksum failure: " + failure);
        // => Output: checksum failure: CommandExecutionException
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")) {
          // => the failed retry must not add, remove, or repair any row
          rs.next();
          System.out.println("history rows intact: " + rs.getInt(1));
          // => Output: history rows intact: 2
        } // => intact history plus a loud failure is the whole guarantee
      } // => closing the statement releases the database resources
    } // => closing the connection ends the program with history intact
  } // => main migrates, tampers, retries, and reports the refusal
}
