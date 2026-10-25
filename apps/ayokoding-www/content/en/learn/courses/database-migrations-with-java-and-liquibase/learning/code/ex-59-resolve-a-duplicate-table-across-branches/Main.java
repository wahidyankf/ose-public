// Example 59: Resolve a Duplicate Table Across Branches.
// When two branches race to build the same table, the merge keeps one
// builder and neutralizes the other with a guard: a precondition that
// fails marks the duplicate as ran without executing it, recording the
// decision instead of failing the release. This program merges a guarded
// duplicate ahead of its builder, then proves the duplicate recorded
// MARK_RAN while the builder's table still landed.
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
      // => one connection serves the guarded merge and the three checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => the master runs the duplicate before its builder table
        "db.changelog-master.yaml",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the guard marked the duplicate ran; the builder built normally
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT exectype FROM databasechangelog WHERE id = '001-b-index'")
      ) {
        // => MARK_RAN records a deliberate skip, distinct from a failure
        rs.next();
        System.out.println("duplicate changeset outcome: " + rs.getString(1));
        // => Output: duplicate changeset outcome: MARK_RAN
      } // => the recorded skip is the merge decision, queryable forever
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM information_schema.tables WHERE table_name = 'cargo'")
      ) {
        // => the builder's table landed right after the duplicate stood down
        rs.next();
        System.out.println("builder table present: " + rs.getInt(1));
        // => Output: builder table present: 1
      } // => one table proves the branches stopped duplicating it
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM pg_indexes WHERE indexname = 'ix_cargo_code'")
      ) {
        // => the skipped duplicate built nothing: its index is absent
        rs.next();
        System.out.println("duplicate index present: " + rs.getInt(1));
        // => Output: duplicate index present: 0
        // => a rerun skips both rows and prints the identical outcomes
      } // => zero indexes prove the guard held instead of half-building
    } // => closing the connection ends the program with the duplicate tamed
  } // => main guards the duplicate, then proves the builder won cleanly
}
