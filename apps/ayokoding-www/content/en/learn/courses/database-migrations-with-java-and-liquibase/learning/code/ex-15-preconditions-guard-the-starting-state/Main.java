// Example 15: Preconditions Guard the Starting State.
// A changeset that assumes a table, extension, or row count should say so
// up front: preconditions check the assumption and fail loudly instead of
// letting half a migration run against the wrong database. This program
// runs a changelog whose last changeset demands a table that does not
// exist, then proves the update refused while the earlier work stayed put.
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

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the guarded run and the three checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => three changesets: build, guarded build, impossible guard
        "changelog.yaml",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      String failure = "none";
      // => the failure name records the outcome without printing internals
      try {
        // => the run applies the first two changesets, then meets the guard
        runQuiet(liquibase);
      } catch (LiquibaseException expected) {
        // => the exception type is stable; its message text is not asserted
        failure = expected.getClass().getSimpleName();
        // => catching proves the guard refused instead of half-applying
        conn.rollback();
        // => rolling back leaves the two applied changesets exactly as run
      } // => no stack trace: the refusal is the expected behaviour
      System.out.println("precondition failure: " + failure);
      // => Output: precondition failure: CommandExecutionException
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM information_schema.tables WHERE table_name = 'ledger'")
      ) {
        // => the first changeset built the ledger before any guard ran
        rs.next();
        System.out.println("ledger table present: " + rs.getInt(1));
        // => Output: ledger table present: 1
      } // => earlier work stays put when a later guard refuses
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => exactly the two runnable changesets were recorded, nothing more
        rs.next();
        System.out.println("changesets applied: " + rs.getInt(1));
        // => Output: changesets applied: 2
        // => a rerun replays the same story: two skips, then the same refusal
      } // => reading history back is a habit every later example repeats
    } // => closing the connection ends the program with history intact
  } // => main runs the guarded changelog, then proves the guard held
}
