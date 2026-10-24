// Example 45: changeLogSync Baselines Without Running.
// Databases that predate Liquibase already hold the schema: running the
// changelog would rebuild what exists and fail. changeLogSync marks every
// changeset as ran without executing any, baselining the database under
// version control from today forward. This program hand-builds a legacy
// table, syncs its matching changelog, then proves the history filled
// while the hand-built rows stayed untouched.
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

  // => the sync narrates too, so it runs inside the same quiet scope shape
  static void syncQuiet(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.changeLogSync("")
    );
    // => changeLogSync marks changesets ran without executing any of them
  } // => quiet syncs keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      conn.setAutoCommit(false);
      // => manual commit makes every preamble statement explicit and replayable
      // => one connection hand-builds the legacy shape, then syncs it
      try (Statement st = conn.createStatement()) {
        // => the legacy table predates Liquibase: no changeset ever built it
        st.execute("DROP TABLE IF EXISTS legacy_invoices");
        // => dropping first keeps the hand-build idempotent on double runs
        st.execute("CREATE TABLE legacy_invoices (id SERIAL PRIMARY KEY, total_cents INTEGER)");
        // => the legacy shape matches the changelog below column for column
        st.execute("DELETE FROM legacy_invoices");
        // => delete-then-insert keeps the seed idempotent on the double run
        st.execute("INSERT INTO legacy_invoices (total_cents) VALUES (9000)");
        // => one legacy row the sync must carry over untouched
        conn.commit();
        // => committing pins the legacy shape before the sync below
      } // => hand-built history is exactly what baselines are for
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => one changeset describing the already-existing table
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      syncQuiet(liquibase);
      // => the sync recorded the changeset; executing it would have failed
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => the baseline is one tracked changeset that never executed
        rs.next();
        System.out.println("baselined changesets: " + rs.getInt(1));
        // => Output: baselined changesets: 1
      } // => one row proves the database joined version control today
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM legacy_invoices")
      ) {
        // => the legacy row survived the sync exactly as hand-built
        rs.next();
        System.out.println("legacy rows kept: " + rs.getInt(1));
        // => Output: legacy rows kept: 1
        // => a rerun rebuilds the legacy shape, then syncs it no-op again
      } // => counts verify data without dumping rows into the transcript
    } // => closing the connection ends the program with history intact
  } // => main hand-builds the past, then baselines it without running
}
