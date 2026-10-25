// Example 33: Data Rollback Strategies Compared.
// Two data changes need two reverses: an inserted batch un-inserts with a
// delete, while a corrected value un-corrects with a compensating update.
// This program applies both strategies, rolls back both changesets, then
// proves each table returned to its pre-change state by its own reverse.
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
  // => runner covers the forward pair and the reverse pair
  static void runQuiet(Liquibase liquibase, boolean forward) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the flag selects the direction of the Liquibase move
        if (forward) {
          // => apply the tables plus both data changes
          liquibase.update("");
        } else {
          // => reverse both data changesets, keeping both tables
          liquibase.rollback(2, "");
        } // => each reverse restores its own table's pre-change state
      }
    );
    // => both directions stay inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the strategies and both checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => four changesets: two tables, then one change per strategy
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, true);
      // => both data changes apply on top of their prepared tables
      runQuiet(liquibase, false);
      // => both reverses run: delete for the insert, update for the correction
      try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT count(*) FROM coupons")) {
        // => the delete reverse removed exactly the inserted batch
        rs.next();
        System.out.println("coupon rows after rollback: " + rs.getInt(1));
        // => Output: coupon rows after rollback: 0
      } // => zero rows prove the insert strategy reversed cleanly
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM prices WHERE amount_cents = 5000")
      ) {
        // => the compensating update restored the original corrected price
        rs.next();
        System.out.println("prices at original value: " + rs.getInt(1));
        // => Output: prices at original value: 1
        // => a rerun re-applies both changes, then reverses them identically
      } // => one restored row proves the correction strategy reversed cleanly
    } // => closing the connection ends the program with history intact
  } // => main applies both strategies, then proves both reverses
}
