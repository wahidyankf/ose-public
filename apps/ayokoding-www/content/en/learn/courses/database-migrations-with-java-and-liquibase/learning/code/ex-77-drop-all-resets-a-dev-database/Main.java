// Example 77: Drop All Resets a Dev Database.
// Development databases accumulate experiments that no changelog
// describes; dropAll removes every object so the next update rebuilds
// from the changelog alone. It never runs against shared databases.
// This program migrates two tables, drops everything, then proves both
// tables are gone while the changelog stands ready to rebuild them.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.command.CommandScope; // => runs diff-class commands outside update
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

  // => the drop runs through the command layer, so it takes the database
  // => url beside the same quiet scope shape as every update
  static void dropQuiet(String url) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the command removes every object from the addressed database
        CommandScope drop = new CommandScope("dropAll");
        // => dropAll is Liquibase's own full-reset command for dev databases
        drop.addArgumentValue("url", url);
        // => the url points the reset at our service database
        drop.addArgumentValue("username", "postgres");
        // => trust auth accepts the user without a password
        drop.addArgumentValue("password", "");
        // => the empty password matches the trust-auth service container
        drop.addArgumentValue("force", true);
        // => force confirms the reset is deliberate, never accidental
        drop.execute();
        // => the reset ran quiet, so only our own prints reach stdout
      }
    );
  } // => quiet commands keep golden output identical on double runs

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => the same host feeds JDBC and the reset command together
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => one url addresses the database from every angle in this program
    try (Connection conn = connect()) {
      // => one connection serves the migration before the reset below
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets: the experiments the reset will remove
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => the pre-reset update narrates too, so it stays quietly scoped
        () -> liquibase.update("")
      );
      // => both experiment tables exist from here until the reset below
      conn.commit();
      // => committing pins the experiments before the reset removes them
    } // => closing first lets the reset open its own connection cleanly
    dropQuiet(url);
    // => the reset removed every object, tracked or hand-built alike
    try (
      Connection conn = connect();
      // => a fresh handle reads the reset database below
      Statement st = conn.createStatement();
      ResultSet rs = st.executeQuery(
        "SELECT count(*) FROM information_schema.tables " + "WHERE table_name IN ('psi', 'omega')"
      )
    ) {
      // => information_schema survives resets; the experiment tables do not
      rs.next();
      System.out.println("experiment tables after reset: " + rs.getInt(1));
      // => Output: experiment tables after reset: 0
      // => a rerun rebuilds the experiments, then resets them identically
    } // => zero tables prove the reset returned the database to empty
  } // => main experiments twice, then resets to an empty database
}
