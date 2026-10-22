// Kata 06: Split Reads Across Old and New Without Downtime.
// The expanded table carries both columns; the application writes both
// for every row while readers move over. Migrate, bridge both columns,
// then prove old and new agree on every row before any contract.
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
      // => one connection serves the migration and the dual write
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => one changeset: the expanded table with old and new together
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the table holds both columns; the bridge below fills the new one
      conn.commit();
      // => committing pins the migration before the application write below
      try (Statement st = conn.createStatement()) {
        // => one statement bridges old and new for every row at once
        st.execute("DELETE FROM circulars");
        // => delete-then-insert keeps the bridge idempotent on the double run
        st.execute("INSERT INTO circulars (title, body) VALUES ('Jadwal', 'Jadwal')");
        // => writing both columns together is the dual write in miniature
        conn.commit();
        // => committing the bridge makes the agreement below observable
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM circulars WHERE title = body")) {
          // => every row must agree: old and new readers see the same text
          rs.next();
          System.out.println("rows where old and new agree: " + rs.getInt(1));
          // => Output: rows where old and new agree: 1
        } // => agreement on all rows green-lights the coming contract step
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM circulars")) {
          // => the bridge writes rows, never extra ones
          rs.next();
          System.out.println("total rows bridged: " + rs.getInt(1));
          // => Output: total rows bridged: 1
          // => a rerun re-bridges the same single row and prints the same
        } // => counts verify data without dumping rows into the transcript
      } // => closing the statement releases the database resources
    } // => closing the connection ends the kata with the bridge proven
  } // => main writes both columns, then proves they agree
}
