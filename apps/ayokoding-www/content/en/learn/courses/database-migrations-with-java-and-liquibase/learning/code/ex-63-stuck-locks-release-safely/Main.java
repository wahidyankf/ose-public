// Example 63: Stuck Locks Release Safely.
// A crashed migrator can leave the lock held forever, blocking every later
// deploy until a human releases it deliberately: force-release is a
// conscious act, never an automatic one. This program sticks the lock by
// hand to stand in for the crash, force-releases it, then proves the lock
// reads free on both sides of the rescue.
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

  // => one helper reads the lock flag, so both sides of the rescue ask alike
  static boolean lockedNow(Connection conn) throws Exception {
    // => the lock table's single row answers whether a runner holds it
    try (
      Statement st = conn.createStatement();
      // => try-with-resources closes the statement on every path
      ResultSet rs = st.executeQuery("SELECT locked FROM databasechangeloglock")
    ) {
      // => the query returns exactly one row with exactly one flag
      rs.next();
      // => true means a crash story is unfolding; false means runners flow
      return rs.getBoolean(1);
    } // => the flag is the rescue's before-and-after photograph
  } // => helpers that verify stay separate from code that rescues

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection sticks the lock, rescues it, and checks both
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => the marker changeset applies first under a normal lock hold
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => the marker update narrates too, so it stays inside a quiet scope
        () -> liquibase.update("")
      );
      // => the marker applied and released its lock; the crash story starts now
      try (Statement st = conn.createStatement()) {
        // => the crash story starts with a lock no runner will release
        st.execute("UPDATE databasechangeloglock SET locked = TRUE, lockedby = 'crashed-runner'");
        // => the hand-stuck row stands in for the crashed migrator's lock
        conn.commit();
        // => committing pins the stuck lock before the rescue below
      } // => stuck locks persist; that persistence is the incident
      System.out.println("locked before rescue: " + lockedNow(conn));
      // => Output: locked before rescue: true
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => the rescue narrates too, so it stays inside a quiet scope
        () -> liquibase.forceReleaseLocks()
      );
      // => force-release is deliberate: a human decided the holder is dead
      System.out.println("locked after rescue: " + lockedNow(conn));
      // => Output: locked after rescue: false
      // => a rerun re-sticks the lock and rescues it identically
    } // => closing the connection ends the program with runners unblocked
  } // => main sticks the lock on purpose, then deliberately frees it
}
