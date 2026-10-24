// Example 14: Labels Select Change Subsets.
// Contexts name environments; labels name change batches instead, so one
// update can carry a release train subset while the rest stays pending.
// This program updates with the v1 label expression, then proves only the
// v1 changeset ran while the v2 changeset waits for its own release.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Contexts; // => selects the environment-gated changes to run
import liquibase.LabelExpression; // => selects the labeled subset to run
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

  // => labels select a release subset, so the quiet runner takes the label
  // => expression beside the Liquibase handle
  static void runQuietLabels(Liquibase liquibase, LabelExpression labels) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.update(new Contexts(), labels)
    );
    // => update with empty contexts plus labels selects by label alone
  } // => quiet updates keep golden output identical on the harness double run

  // => the history table is Liquibase's own record of what already ran
  static int appliedCount(Connection conn) throws Exception {
    // => DATABASECHANGELOG gains one row per executed changeset
    try (
      Statement st = conn.createStatement();
      ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => one row here proves the label selected exactly one changeset
      return rs.getInt(1);
    } // => counting beats assuming the migration ran
  } // => reading history back is a habit every later example repeats

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
      // => one connection serves the label run and the three checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets, one per release label
        "changelog.yaml",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuietLabels(liquibase, new LabelExpression("v1"));
      // => the v1 expression selects the v1 changeset and skips v2
      System.out.println("v1 table present: " + tablePresent(conn, "carts"));
      // => Output: v1 table present: 1
      System.out.println("v2 table present: " + tablePresent(conn, "coupons"));
      // => Output: v2 table present: 0
      System.out.println("changesets applied: " + appliedCount(conn));
      // => Output: changesets applied: 1
      // => a rerun selects the same single changeset and skips it as applied
    } // => closing the connection ends the program with history intact
  } // => main updates under one label, then proves the subset ran
}
