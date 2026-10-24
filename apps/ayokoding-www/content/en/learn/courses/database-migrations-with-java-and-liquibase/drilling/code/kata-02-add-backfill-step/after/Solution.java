// Kata 02: Add a Backfill Step to an Existing Migration.
// The seed leaves grades empty; the backfill changeset derives every row's
// grade after it. Wire the step, run both changelogs, then prove no row
// stayed ungraded and two distinct grades resulted.
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

public class Solution {

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
      // => one connection serves the seed, the backfill, and the checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots the seed and the backfill in the kata folder
      runQuiet(new Liquibase("changelog.sql", accessor, database));
      // => the seed builds the table with four ungraded rows
      runQuiet(new Liquibase("after/backfill.sql", accessor, database));
      // => wiring the backfill step means running its changelog second
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM ingots WHERE grade IS NULL")
      ) {
        // => the backfill must leave zero rows without a derived grade
        rs.next();
        System.out.println("ungraded rows: " + rs.getInt(1));
        // => Output: ungraded rows: 0
      } // => zero nulls prove the added step reached every seeded row
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(DISTINCT grade) FROM ingots")
      ) {
        // => heavy rows became A, light rows became B
        rs.next();
        System.out.println("distinct grades: " + rs.getInt(1));
        // => Output: distinct grades: 2
        // => a rerun skips both changelogs and prints the identical checks
      } // => two grades prove the step derived values instead of copying one
    } // => closing the connection ends the kata with the backfill wired
  } // => main seeds, backfills, then proves no row was missed
}
