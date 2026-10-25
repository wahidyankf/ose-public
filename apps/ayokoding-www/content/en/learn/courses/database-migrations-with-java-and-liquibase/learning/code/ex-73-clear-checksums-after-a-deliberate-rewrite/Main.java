// Example 73: Clear Checksums After a Deliberate Rewrite.
// Sometimes history is rewritten on purpose: a reviewed fix to an old
// changeset that every environment must accept. clearCheckSums wipes the
// stored values so the next update recomputes them from the rewritten
// file. This program tampers a checksum, clears all checksums, updates,
// then proves the full history applied with fresh checksums recorded.
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

  // => the rewrite story runs update, tamper, clear, and update again, so
  // => one quiet runner covers all four moves in the same scope shape
  static void runQuiet(Liquibase liquibase, String move) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the move name selects the Liquibase operation below
        if (move.equals("clear")) {
          // => wipe stored checksums so the rewrite recomputes them
          liquibase.clearCheckSums();
        } else {
          // => apply whatever the history still lacks, recomputing checks
          liquibase.update("");
        } // => clear-then-update accepts the deliberate rewrite as one story
      }
    );
    // => every move stays inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  // => a fresh demo slate keeps this program deterministic on double runs
  static void resetDemo(Connection conn) throws Exception {
    conn.setAutoCommit(false);
    // => manual commit makes every reset statement explicit and replayable
    // => cleared checksums persist, so every run starts clean
    try (Statement st = conn.createStatement()) {
      // => one statement serves the whole reset
      st.execute("DROP TABLE IF EXISTS pi");
      // => dropping the rewritten tables removes the previous run's evidence
      st.execute("DROP TABLE IF EXISTS rho");
      // => both tables go, so the rewrite below runs them fresh
      clearHistory(conn);
      // => deleting only our own rows leaves every other course untouched
      conn.commit();
      // => committing the reset makes the fresh rewrite that follows honest
    } // => the next rewrite always meets an empty history for our changesets
  } // => reset-then-rewrite prints identical lines on the harness double run

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
      // => one connection serves the rewrite and its acceptance proof
      resetDemo(conn);
      // => a clean slate means the rewrite below behaves identically always
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets: the rewrite story plays out on both
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, "update");
      // => both changesets apply against the clean slate first
      conn.commit();
      // => committing pins the history rows the rewrite below will clear
      try (Statement st = conn.createStatement()) {
        // => the deliberate rewrite starts by invalidating the stored checks
        st.executeUpdate("UPDATE databasechangelog SET md5sum = '9:rewritten'");
        // => rewriting every checksum stands in for the reviewed file rewrite
        conn.commit();
        // => the rewritten rows persist, so the clear below must confront them
      } // => rewrites are deliberate: reviewed, agreed, and recorded as such
      runQuiet(liquibase, "clear");
      // => clearing wipes the stored values; the file is now the truth
      runQuiet(liquibase, "update");
      // => the update recomputes checksums and accepts the rewritten file
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => the accepted rewrite kept both history rows in place
        rs.next();
        System.out.println("history rows after rewrite: " + rs.getInt(1));
        // => Output: history rows after rewrite: 2
      } // => two rows prove the rewrite was accepted, not re-applied
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog WHERE md5sum = '9:rewritten'")
      ) {
        // => no rewritten marker may survive the clear-and-recompute
        rs.next();
        System.out.println("stale rewritten checksums: " + rs.getInt(1));
        // => Output: stale rewritten checksums: 0
        // => a rerun rewrites, clears, and accepts identically again
      } // => zero stale rows prove fresh checksums replaced every rewrite
    } // => closing the connection ends the program with history rewritten cleanly
  } // => main rewrites deliberately, then proves the rewrite was accepted
}
