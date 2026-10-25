// Example 24: Count-Based Rollbacks Span Files.
// Rollback counts ignore file boundaries: rolling back two undoes the two
// latest changesets wherever they live, which is exactly how a release
// rollback crosses the master file's includes. This program runs a master
// over three single-changeset files, rolls back two, then proves only the
// oldest file's table and history row survived.
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

  // => Liquibase narrates on updates and rollbacks alike, so one quiet
  // => runner covers the master run and the cross-file rollback
  static void runQuiet(Liquibase liquibase, boolean forward) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the flag selects the direction of the Liquibase move
        if (forward) {
          // => run every included changeset across all three files
          liquibase.update("");
        } else {
          // => reverse the two latest changesets, wherever they live
          liquibase.rollback(2, "");
        } // => the count crosses the file boundary between 003 and 002
      }
    );
    // => both directions stay inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  // => every example counts tables through information_schema, never pg internals
  static int tablePresent(Connection conn, String table) throws Exception {
    // => information_schema is the portable way to ask what exists
    try (
      Statement st = conn.createStatement();
      // => try-with-resources closes the statement on every path
      ResultSet rs = st.executeQuery(
        // => a fixed literal is safe here: the table name is our constant
        "SELECT count(*) FROM information_schema.tables WHERE table_name = '" + table + "'"
      )
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => 1 means the migration created the table, 0 means it did not
      return rs.getInt(1);
    } // => the count answers the only question this check asks
  } // => helpers that verify stay separate from code that migrates

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the master run, the rollback, and checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => the master delegates to the three single-changeset files
        "db.changelog-master.yaml",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, true);
      // => three files apply in prefix order; the history holds three rows
      runQuiet(liquibase, false);
      // => rolling back two removes the 003 and 002 tables across files
      System.out.println("quays table present: " + tablePresent(conn, "quays"));
      // => Output: quays table present: 1
      System.out.println("docks table present: " + tablePresent(conn, "docks"));
      // => Output: docks table present: 0
      System.out.println("marinas table present: " + tablePresent(conn, "marinas"));
      // => Output: marinas table present: 0
      // => a rerun re-applies the two pending files, then removes them again
    } // => closing the connection ends the program with history intact
  } // => main runs the master forward, then steps two files back
}
