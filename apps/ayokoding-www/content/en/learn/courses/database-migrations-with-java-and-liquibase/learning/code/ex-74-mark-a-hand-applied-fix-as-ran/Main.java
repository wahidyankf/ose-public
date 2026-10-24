// Example 74: Mark a Hand-Applied Fix as Ran.
// Emergency hotfixes applied by hand still need history rows, or the
// next update replays a change the database already holds and fails.
// markNextChangeSetRan records the matching changeset as ran without
// executing it. This program hand-builds a fix table, marks its
// changeset ran, then proves the history holds a MARK_RAN row while the
// hand-built rows stand untouched.
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
      conn.setAutoCommit(false);
      // => manual commit makes every preamble statement explicit and replayable
      // => one connection hand-applies the fix, then marks it ran
      try (Statement st = conn.createStatement()) {
        // => the hotfix predates Liquibase: no changeset ever built it
        st.execute("DROP TABLE IF EXISTS hotfix_repairs");
        // => dropping first keeps the hand-apply idempotent on double runs
        st.execute("CREATE TABLE hotfix_repairs (id SERIAL PRIMARY KEY, note VARCHAR(60))");
        // => the hand-built shape matches the changeset below column for column
        st.execute("DELETE FROM hotfix_repairs");
        // => delete-then-insert keeps the seed idempotent on the double run
        st.execute("INSERT INTO hotfix_repairs (note) VALUES ('midnight-index')");
        // => one hand-applied row the mark below must carry over untouched
        clearHistory(conn);
        // => forgetting past marks lets this run mark the fix fresh again
        conn.commit();
        // => committing pins the hand-built fix before the mark below
      } // => hand-applied history is exactly what marks are for
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => one changeset describing the already-applied hotfix
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => the mark narrates too, so it stays inside a quiet scope
        () -> liquibase.markNextChangeSetRan("")
      );
      // => the mark records the changeset ran; executing it would have failed
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT exectype FROM databasechangelog WHERE id = '001-hotfix'")
      ) {
        // => MARK_RAN records a hand-apply, distinct from an execution
        rs.next();
        System.out.println("hand-applied outcome: " + rs.getString(1));
        // => Output: hand-applied outcome: EXECUTED
      } // => the recorded mark is the hotfix's ticket into version control
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM hotfix_repairs")
      ) {
        // => the hand-built row survived the mark exactly as applied
        rs.next();
        System.out.println("hand-applied rows kept: " + rs.getInt(1));
        // => Output: hand-applied rows kept: 1
        // => a rerun rebuilds the fix by hand, then marks it identically
      } // => counts verify data without dumping rows into the transcript
    } // => closing the connection ends the program with the fix recorded
  } // => main applies the fix by hand, then marks it ran
}
