// Example 5: addColumn Extends a Live Table.
// Real tables gain columns after they already hold rows: the alter must not
// disturb existing data. The addColumn change type appends one column with a
// declared type, and Liquibase records it like any other changeset. This
// program creates the table, adds the column in a second changeset, then
// proves the column exists and accepts writes.
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
        // => two changesets: create the table, then extend it
        "changelog.sql",
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the update ran quiet, so the transcript holds only our own prints
      try (Statement st = conn.createStatement()) {
        // => one statement serves the seed and both verification queries
        st.execute("DELETE FROM players");
        // => delete-then-insert keeps the seed idempotent on the double run
        st.execute("INSERT INTO players (handle) VALUES ('anisa')");
        // => the insert uses only the original column, proving old writes still work
        try (
          ResultSet rs = st.executeQuery(
            "SELECT count(*) FROM information_schema.columns " +
              "WHERE table_name = 'players' AND column_name = 'level'"
          )
        ) {
          // => the new column must exist after the second changeset runs
          rs.next();
          System.out.println("players.level present: " + rs.getInt(1));
          // => Output: players.level present: 1
        } // => schema checks read information_schema, never pg internals
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM players")) {
          // => the seed row is the only row after the idempotent rewrite
          rs.next();
          System.out.println("players rows kept: " + rs.getInt(1));
          // => Output: players rows kept: 1
        } // => alters that lose rows are the failure this check guards against
      } // => closing the statement releases the database resources
    } // => closing the connection ends the program with history intact
  } // => main migrates first, verifies second, prints last
}
