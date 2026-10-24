// Example 75: Test Rollbacks in a Scratch Database.
// Rollback blocks rot when nothing exercises them: the testing rollback
// applies every changeset, rolls each one back, then re-applies, proving
// every reverse works while leaving the database fully migrated. This
// program runs the full test cycle over two changesets, then proves the
// migration stands complete with a trace row only a real reversal writes.
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

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the test cycle and the trace read
      conn.setAutoCommit(false);
      // => manual commit makes the cycle's reset explicit and replayable
      try (Statement st = conn.createStatement()) {
        // => leftovers would collide with the cycle's own creates below
        st.execute("DROP TABLE IF EXISTS sigma");
        // => dropping first keeps the test cycle replayable on double runs
        st.execute("DROP TABLE IF EXISTS tau");
        // => the second table goes too, every run alike
        st.execute("DROP TABLE IF EXISTS rb_proof");
        // => the proof table rebuilds fresh; traces never carry across runs
      } // => a clean stage cycles identically on the harness double run
      clearHistory(conn);
      // => forgetting past cycles lets this run test the reverses fresh
      conn.commit();
      // => committing pins the clean slate before the test cycle below
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets whose reverses the test cycle must run
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => the test cycle narrates too, so it stays inside a quiet scope
        () -> liquibase.updateTestingRollback("")
      );
      // => the cycle applies all, reverses all, then re-applies all again
      try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT count(*) FROM rb_proof")) {
        // => the reversal wrote its trace row mid-cycle; re-apply kept it
        rs.next();
        System.out.println("reverses proven by trace rows: " + rs.getInt(1));
        // => Output: reverses proven by trace rows: 1
      } // => one trace row proves a reverse really executed, not just parsed
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery(
          "SELECT count(*) FROM information_schema.tables " + "WHERE table_name IN ('sigma', 'tau')"
        )
      ) {
        // => the cycle ends migrated: both tables stand after the test
        rs.next();
        System.out.println("tables migrated after the test: " + rs.getInt(1));
        // => Output: tables migrated after the test: 2
        // => a rerun applies, reverses, and re-applies identically again
      } // => two tables prove the test leaves the database migrated, not empty
    } // => closing the connection ends the program with reverses proven
  } // => main tests every reverse, then proves the traces and the tables

  // => the history table may not exist before the test cycle, so forgetting
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
