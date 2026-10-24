// Example 1: Run Your First Changelog.
// A Liquibase changelog is a versioned list of changesets: each changeset
// runs once, in order, against the database. Liquibase records every run
// in its own DATABASECHANGELOG table, so a second run is a safe no-op.
// This program runs one SQL changelog, then proves the result by asking
// the database what exists now: the new table and the history row.
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

  // => the history table is Liquibase's own record of what already ran
  static int appliedCount(Connection conn) throws Exception {
    // => DATABASECHANGELOG gains one row per executed changeset
    try (
      Statement st = conn.createStatement();
      ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
    ) {
      // => a rerun adds zero rows, so the count is stable on double runs
      rs.next();
      // => the number is the proof that tracking happened, not just DDL
      return rs.getInt(1);
    } // => counting beats assuming the migration ran
  } // => reading history back is a habit every later example repeats

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the migration and both verifications
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => the changelog path is relative to the accessor root below
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the update ran quiet, so the transcript holds only our own prints
      System.out.println("users table present: " + tablePresent(conn, "users"));
      // => Output: users table present: 1
      System.out.println("changesets applied: " + appliedCount(conn));
      // => Output: changesets applied: 1
    } // => closing the connection ends the program with history intact
  } // => main migrates first, verifies second, prints last
}
