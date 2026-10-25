// Example 19: Roll Back to a Tag.
// Tags name release points inside the history, and rolling back to a tag
// undoes everything after it in one move: the release goes back whole.
// This program applies the first changeset, tags the release, applies two
// more, rolls back to the tag, then proves only the tagged work remains.
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
  // => runner covers forward moves, tags, and reverse moves
  static void runQuiet(Liquibase liquibase, String step) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the step name selects the Liquibase move below
        switch (step) {
          case "first":
            // => apply only the first changeset, leaving two pending
            liquibase.update(1, "");
            break;
          case "rest":
            // => apply whatever the history still lacks
            liquibase.update("");
            break;
          case "tag":
            // => name the current release point v1 for the rollback below
            liquibase.tag("v1");
            break;
          default:
            // => roll back everything applied after the v1 tag
            liquibase.rollback("v1", "");
            break;
        } // => each branch is one honest Liquibase move, nothing hidden
      }
    );
    // => every branch stays inside the silenced scope, so goldens stay clean
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
      // => one connection serves the release, the tag, and the rollback
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => three changesets: one release, then two more
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, "first");
      // => only the release changeset applies; two stay pending
      runQuiet(liquibase, "tag");
      // => the v1 tag lands on the release changeset's history row
      runQuiet(liquibase, "rest");
      // => the two pending changesets apply on top of the tagged release
      runQuiet(liquibase, "back");
      // => rolling back to v1 reverses both post-release changesets at once
      System.out.println("harbours table present: " + tablePresent(conn, "harbours"));
      // => Output: harbours table present: 1
      System.out.println("piers table present: " + tablePresent(conn, "piers"));
      // => Output: piers table present: 0
      System.out.println("ferries table present: " + tablePresent(conn, "ferries"));
      // => Output: ferries table present: 0
      // => a rerun replays release, tag, rest, and rollback identically
    } // => closing the connection ends the program with history intact
  } // => main releases, tags, extends, then returns to the tag
}
