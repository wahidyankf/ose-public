// Example 65: Transactions Wrap Migrations That Allow It.
// Each changeset runs inside its own transaction where the database
// allows it: when the second statement fails, the first is undone with
// it, and the history records nothing. This program runs a changeset
// whose insert targets a missing table, then proves the created table
// vanished with the failed insert instead of lingering half-built.
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

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      conn.setAutoCommit(false);
      // => manual commit makes every preamble statement explicit and replayable
      // => one connection serves the wrapped run and the failure check
      try (Statement st = conn.createStatement()) {
        // => a leftover table would mask the atomicity this proves
        st.execute("DROP TABLE IF EXISTS zeta");
        // => dropping first keeps the wrapped run replayable on double runs
        conn.commit();
        // => committing pins the clean slate before the wrapped changeset
      } // => atomicity needs a witness-free stage to prove itself on
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => one changeset: a create plus an insert that cannot succeed
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      String failure = "none";
      // => the failure name records the outcome without printing internals
      try {
        // => the create succeeds, then the insert fails inside one transaction
        Scope.child(
          java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
          // => the wrapped run narrates too, so it stays inside a quiet scope
          () -> liquibase.update("")
        );
      } catch (LiquibaseException expected) {
        // => the exception type is stable; its message text is not asserted
        failure = expected.getClass().getSimpleName();
        // => catching proves the wrapped changeset failed as one unit
        conn.rollback();
        // => rolling back keeps the stage exactly as the failure left it
      } // => no stack trace: the atomic failure is the expected behaviour
      System.out.println("wrapped failure: " + failure);
      // => Output: wrapped failure: CommandExecutionException
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM information_schema.tables WHERE table_name = 'zeta'")
      ) {
        // => the transaction undid the create with the failed insert
        rs.next();
        System.out.println("half-built table present: " + rs.getInt(1));
        // => Output: half-built table present: 0
        // => a rerun drops nothing, fails identically, and prints the same
      } // => zero tables prove the changeset committed nothing at all
    } // => closing the connection ends the program with nothing half-built
  } // => main wraps two statements, then proves both vanished together
}
