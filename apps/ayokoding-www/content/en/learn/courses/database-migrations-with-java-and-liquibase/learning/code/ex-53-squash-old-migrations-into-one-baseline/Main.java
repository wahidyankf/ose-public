// Example 53: Squash Old Migrations into One Baseline.
// Years of small migrations slow fresh installs: squashing folds them
// into one baseline file that builds the same end state, while the old
// files retire. This program applies a three-file history, syncs its
// single-file squash without executing it, then proves three old rows
// plus one squash row describe the same three tables.
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

  // => history grows file by file here, so the quiet runner takes the
  // => changelog to run plus a flag for syncing instead of executing
  static void runQuiet(Liquibase liquibase, boolean syncOnly) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the flag selects execution for history and sync for the squash
        if (syncOnly) {
          // => the squash describes built tables, so it syncs without running
          liquibase.changeLogSync("");
        } else {
          // => the old files execute normally, building the three tables
          liquibase.update("");
        } // => execute for history, sync for the squash that replaces it
      }
    );
    // => both moves stay inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the history run, the sync, and the checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots the master and the squash in the same folder
      runQuiet(new Liquibase("db.changelog-master.yaml", accessor, database), false);
      // => three old files build the three tables the squash describes
      runQuiet(new Liquibase("squashed.yaml", accessor, database), true);
      // => the squash syncs: executing it would rebuild existing tables
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery(
          "SELECT count(*) FROM information_schema.tables " + "WHERE table_name IN ('harbours', 'piers', 'ferries')"
        )
      ) {
        // => old files plus squash agree on the same three tables
        rs.next();
        System.out.println("tables described by both: " + rs.getInt(1));
        // => Output: tables described by both: 3
      } // => three tables prove the squash captured the whole history
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => three executed rows plus one synced squash row share the history
        rs.next();
        System.out.println("history rows old plus squash: " + rs.getInt(1));
        // => Output: history rows old plus squash: 4
        // => a rerun no-ops the master and the sync to identical counts
      } // => reading history back is a habit every later example repeats
    } // => closing the connection ends the program with history squashed
  } // => main migrates the long way, then baselines the short way
}
