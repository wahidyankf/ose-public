// Example 71: Read the History After a Failure.
// A failed migration leaves forensics, not wreckage: the history shows
// which changesets committed, and the missing rows show where the run
// stopped. Reading that boundary is the first diagnostic move. This
// program runs a good changeset plus a failing one, then proves the
// history boundary sits exactly between them.
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
      // => one connection serves the failed run and its forensics
      try (Statement st = conn.createStatement()) {
        // => leftovers would move the boundary this example must locate
        st.execute("DROP TABLE IF EXISTS mu");
        // => dropping first keeps the failed run replayable on double runs
        clearHistory(conn);
        // => forgetting past runs lets this run fail at the same boundary
        conn.commit();
        // => committing pins the clean slate before the failing changesets
      } // => forensics need a witness-free stage to read clearly
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets: a good table, then an impossible insert
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      try {
        // => the first changeset commits, then the second fails beside it
        Scope.child(
          java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
          // => the failing run narrates too, so it stays inside a quiet scope
          () -> liquibase.update("")
        );
      } catch (LiquibaseException expected) {
        // => the failure is forensics fuel, not the printed story itself
        conn.rollback();
        // => rolling back keeps the committed first step exactly as applied
      } // => no stack trace: the boundary below is the expected evidence
      System.out.println("failed at changeset: 002-bad-insert");
      // => Output: failed at changeset: 002-bad-insert
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT id FROM databasechangelog ORDER BY orderexecuted")
      ) {
        // => the history boundary sits exactly before the failed changeset
        StringBuilder applied = new StringBuilder();
        // => the builder collects the committed ids the failure left behind
        while (rs.next()) {
          // => each id is one changeset that committed before the failure
          if (applied.length() > 0) {
            // => commas separate the steps without extra whitespace
            applied.append(",");
          } // => the first id needs no separator before it
          applied.append(rs.getString(1));
          // => appending preserves the database-reported execution order
        } // => the joined ids end where the failure began, by construction
        System.out.println("applied before failure: " + applied);
        // => Output: applied before failure: 001-make-mu
        // => a rerun recommits the first step, then fails identically again
      } // => reading history back is the first diagnostic move, always
    } // => closing the connection ends the program at the failure boundary
  } // => main fails on purpose, then reads exactly where it stopped
}
