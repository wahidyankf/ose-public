// Capstone: Order Management Across Eight Migrations.
// Eight releases build one order-management schema the way the course
// teaches: tables with keys first, a backfill second, a three-release
// rename third, a validated rule fourth, and a concurrent index last,
// sealed with a release tag. Run the master, tag the release, then prove
// every technique landed with five verification reads.
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

  // => Liquibase narrates on updates and tags alike, so one quiet runner
  // => covers the master run and the release tag between the checks
  static void runQuiet(Liquibase liquibase, boolean tag) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the flag selects the release move after the migration below
        if (tag) {
          // => name the current release point v1 for future rollbacks
          liquibase.tag("v1");
        } else {
          // => apply the whole eight-release master in prefix order
          liquibase.update("");
        } // => migrate first, tag second, verify last
      }
    );
    // => both moves stay inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  // => one helper asks every capstone check in the same shape
  static int askCount(Connection conn, String query) throws Exception {
    // => every check is a count query with exactly one row and one number
    try (
      Statement st = conn.createStatement();
      // => try-with-resources closes the statement on every path
      ResultSet rs = st.executeQuery(query)
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => the number is the check's answer, printed by the caller
      return rs.getInt(1);
    } // => counts verify releases without dumping state into the transcript
  } // => helpers that verify stay separate from code that ships

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the capstone run, the tag, and the checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => the master delegates to the eight release files
        "db.changelog-master.yaml",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the capstone folder keeps releases beside the program
        database
      );
      runQuiet(liquibase, false);
      // => eight releases apply in prefix order; the history holds eight rows
      runQuiet(liquibase, true);
      // => the v1 tag lands on the latest history row, the concurrent index
      System.out.println("capstone changesets applied: " + askCount(conn, "SELECT count(*) FROM databasechangelog"));
      // => Output: capstone changesets applied: 8
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT tag FROM databasechangelog ORDER BY orderexecuted DESC LIMIT 1")
      ) {
        // => the latest row carries the release tag the program just set
        rs.next();
        System.out.println("release tag on latest: " + rs.getString(1));
        // => Output: release tag on latest: v1
      } // => the tag is the release's return ticket, readable from history
      System.out.println(
        "high priority orders: " + askCount(conn, "SELECT count(*) FROM orders WHERE priority = 'high'")
      );
      // => Output: high priority orders: 1
      System.out.println(
        "customers under new name: " + askCount(conn, "SELECT count(*) FROM customers WHERE display_name IS NOT NULL")
      );
      // => Output: customers under new name: 2
      System.out.println(
        "concurrent indexes: " +
          askCount(conn, "SELECT count(*) FROM pg_indexes WHERE indexname = 'ix_orders_customer'")
      );
      // => Output: concurrent indexes: 1
      // => a rerun skips all eight releases, re-tags, and prints the same
    } // => closing the connection ends the capstone with the release tagged
  } // => main migrates eight releases, tags one, and proves all five checks
}
