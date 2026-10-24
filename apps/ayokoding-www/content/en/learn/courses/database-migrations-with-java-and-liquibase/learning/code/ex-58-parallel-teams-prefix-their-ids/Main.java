// Example 58: Parallel Teams Prefix Their IDs.
// Two teams sharing one history never collide when every id carries its
// team's prefix: the namespace is visible in the file name and in the
// history row alike. This program runs a master over two teams' prefixed
// files, then prints the identity triples to prove both teams share one
// ordered history without sharing an id space.
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

  // => Liquibase stores the changelog path; only the file name is stable here
  static String shortName(String filename) {
    // => the logical path can carry directories, so keep the last segment
    int slash = filename.lastIndexOf('/');
    // => lastIndexOf returns -1 when there is no directory to strip
    return slash < 0 ? filename : filename.substring(slash + 1);
  } // => stable names keep golden output byte-identical on every machine

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the two-team run and the triple read
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => the master delegates to both teams' prefixed files
        "db.changelog-master.yaml",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => prefixes interleave the teams into one alphabetical sequence
      try (
        Statement st = conn.createStatement();
        // => orderexecuted preserves the order Liquibase actually used
        ResultSet rs = st.executeQuery("SELECT id, author, filename FROM databasechangelog ORDER BY orderexecuted")
      ) {
        // => each row is the identity triple of one applied changeset
        // => a rerun adds zero rows, so these lines are stable on double runs
        while (rs.next()) {
          // => printing the triple shows what the history table remembers
          System.out.println(rs.getString(1) + " | " + rs.getString(2) + " | " + shortName(rs.getString(3)));
          // => the filename is Liquibase's logical path, stable across machines
        } // => two triples prove two teams share one history cleanly
      } // => reading history back is a habit every later example repeats
    } // => closing the connection ends the program with teams un-collided
  } // => main runs both teams, then prints their shared history
}
