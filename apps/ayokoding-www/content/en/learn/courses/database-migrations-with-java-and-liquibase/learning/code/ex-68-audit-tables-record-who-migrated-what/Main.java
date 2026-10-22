// Example 68: Audit Tables Record Who Migrated What.
// The history table records what ran; an audit table records who asked
// for it and why, in application terms reviewers understand. This program
// migrates one changeset, writes its audit row naming the actor and the
// ticket, then proves the audit holds exactly that row.
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

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the migration and its audit row
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets: the audited table, then the audit table
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => both tables exist from here on; the audit row is still unwritten
      conn.commit();
      // => committing pins the migration before the audit write below
      try (Statement st = conn.createStatement()) {
        // => the audit names the actor and the ticket in application terms
        st.execute("DELETE FROM migration_audit");
        // => delete-then-insert keeps the audit idempotent on the double run
        st.execute("INSERT INTO migration_audit (actor, action) VALUES ('course', 'migrate:001-make-atolls')");
        // => literals name the actor and ticket; no clocks ever enter audits here
        conn.commit();
        // => committing the audit makes the row below observable
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM migration_audit")) {
          // => exactly one audit row answers who migrated what
          rs.next();
          System.out.println("audit rows recorded: " + rs.getInt(1));
          // => Output: audit rows recorded: 1
        } // => one row proves the migration did not run anonymously
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM migration_audit WHERE actor = 'course'")) {
          // => the actor column names the migrator reviewers can ask
          rs.next();
          System.out.println("audits naming the actor: " + rs.getInt(1));
          // => Output: audits naming the actor: 1
          // => a rerun re-audits the same single row and prints the same
        } // => named actors turn history rows into accountable stories
      } // => closing the statement releases the database resources
    } // => closing the connection ends the program with the audit filed
  } // => main migrates the table, then signs its audit row
}
