// Example 7: Indexes Speed the New Query Path.
// Queries by handle scan the whole table until an index gives PostgreSQL a
// shortcut. The createIndex change type builds a B-tree over one column,
// and the database keeps it current on every later write. This program
// migrates the table, adds the index, then proves the catalog records it
// and a lookup by handle returns the seeded row.
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
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    Properties props = new Properties();
    // => trust auth accepts any password, so only the user matters
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
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      Liquibase liquibase = new Liquibase(
        // => two changesets: create the table, then index its handle
        "changelog.sql",
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the update ran quiet, so the transcript holds only our own prints
      try (Statement st = conn.createStatement()) {
        // => one statement serves the seed and both verification queries
        st.execute("DELETE FROM members");
        // => delete-then-insert keeps the seed idempotent on the double run
        st.execute("INSERT INTO members (handle) VALUES ('citra')");
        // => the indexed column holds a row the lookup below must find
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM pg_indexes WHERE indexname = 'ix_members_handle'")) {
          // => pg_indexes lists every index including the primary key's own,
          // => so the check names our index instead of counting the table
          rs.next();
          System.out.println("members indexes recorded: " + rs.getInt(1));
          // => Output: members indexes recorded: 1
        } // => catalog counts verify the migration without explaining plans
        try (ResultSet rs = st.executeQuery("SELECT handle FROM members WHERE handle = 'citra'")) {
          // => the indexed lookup returns exactly the seeded row
          rs.next();
          System.out.println("lookup by handle finds: " + rs.getString(1));
          // => Output: lookup by handle finds: citra
        } // => behaviour plus catalog together prove the index works
      } // => closing the statement releases the database resources
    } // => closing the connection ends the program with history intact
  } // => main migrates first, verifies second, prints last
}
