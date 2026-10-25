// Example 44: Blue-Green Needs Compatible Migrations.
// Blue-green deploys run old and new code against one database during the
// switch, so every migration in the window must serve both: additive and
// nullable, never renaming or dropping. This program adds a nullable tag
// column, then proves the old two-column read still works while the new
// column stands ready beside it.
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
      // => one connection serves the compatible run and both reads
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets: the products table, then the nullable tag
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the additive change serves old and new code at once
      try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT id, name FROM goods")) {
        // => the old two-column read names no new column, by design
        int oldReads = 0;
        // => the counter proves the old shape still serves during the switch
        while (rs.next()) {
          // => each row the old code can still read counts once
          oldReads++;
          // => reading only old columns mimics the blue deploy exactly
        } // => the loop ends with the old deploy's whole worldview counted
        System.out.println("rows the old read still sees: " + oldReads);
        // => Output: rows the old read still sees: 1
      } // => old reads surviving proves the migration stayed compatible
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery(
          "SELECT count(*) FROM information_schema.columns " + "WHERE table_name = 'goods' AND column_name = 'tag'"
        )
      ) {
        // => the new column stands ready for the green deploy beside it
        rs.next();
        System.out.println("new tag column present: " + rs.getInt(1));
        // => Output: new tag column present: 1
        // => a rerun skips both changesets and prints the identical reads
      } // => one new column proves the window carried exactly one addition
    } // => closing the connection ends the program with history intact
  } // => main migrates compatibly, then reads it both ways
}
