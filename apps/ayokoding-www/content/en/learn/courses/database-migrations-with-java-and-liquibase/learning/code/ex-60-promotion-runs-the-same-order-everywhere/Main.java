// Example 60: Promotion Runs the Same Order Everywhere.
// Dev, test, and production must apply the identical sequence: promotion
// copies the changelog, never rewrites it, and the history order on each
// database is the proof. This program applies one master to the main and
// a promotion database, then proves both histories list the same order.
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

  // => the promotion database name is the one constant both runs share
  static String dbUrl(String db) {
    // => every handle in this program addresses one of two databases
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => the same host feeds JDBC urls on both promotion stages
    return "jdbc:postgresql://" + host + ":5432/" + db;
  } // => one builder keeps both stage addresses spelled identically

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

  // => one helper reads any stage's history order in the same shape
  static String stageOrder(Connection conn) throws Exception {
    // => orderexecuted is the ground truth each promotion stage reports
    try (
      Statement st = conn.createStatement();
      // => try-with-resources closes the statement on every path
      ResultSet rs = st.executeQuery("SELECT id FROM databasechangelog ORDER BY orderexecuted")
    ) {
      // => the order is the promotion contract each stage must match
      StringBuilder order = new StringBuilder();
      // => the builder collects the ids in the order they executed
      while (rs.next()) {
        // => each id is one promoted changeset in its applied position
        if (order.length() > 0) {
          // => commas separate the steps without extra whitespace
          order.append(",");
        } // => the first id needs no separator before it
        order.append(rs.getString(1));
        // => appending preserves the database-reported execution order
      } // => the joined ids read as the stage's whole promotion story
      return order.toString();
    } // => helpers that verify stay separate from code that migrates
  } // => identical strings from both stages prove the promotion held

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection admin = connect()) {
      // => the admin handle owns the promotion database lifecycle
      try (Statement st = admin.createStatement()) {
        // => dropping first keeps the promotion stage idempotent on double runs
        st.execute("DROP DATABASE IF EXISTS promo");
        // => a stale stage would promote against last run's history, so rebuild
        st.execute("CREATE DATABASE promo");
        // => CREATE DATABASE commits itself; no transaction wraps it
      } // => the promotion stage starts empty on every run, by construction
    } // => closing first releases the handle before promoting either stage
    Properties stageProps = new Properties();
    // => the stage login travels in Properties like every connection here
    stageProps.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => trust auth accepts the bare user; the driver needs no password
    try (
      Connection dev = connect();
      // => the dev handle promotes the first stage below
      Connection prod = DriverManager.getConnection(dbUrl("promo"), stageProps)
    ) {
      // => the promotion handle applies the same master to the next stage
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots the same master file on both stages
      runQuiet(
        new Liquibase(
          "db.changelog-master.yaml",
          accessor,
          DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(dev))
        )
      );
      // => the dev stage applies the master first, as promotion starts there
      runQuiet(
        new Liquibase(
          "db.changelog-master.yaml",
          accessor,
          DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(prod))
        )
      );
      // => the promotion stage applies the identical master file, unedited
      String devOrder = stageOrder(dev);
      // => the dev order is the sequence the promotion must repeat
      String prodOrder = stageOrder(prod);
      // => the promotion order must read identically, changeset for changeset
      System.out.println("dev order: " + devOrder);
      // => Output: dev order: 001-make-atolls,002-make-reefs,003-make-lagoons
      System.out.println("promotion order matches: " + devOrder.equals(prodOrder));
      // => Output: promotion order matches: true
      // => a rerun rebuilds the stage and promotes the identical sequence
    } // => closing both handles ends the program with stages in agreement
  } // => main promotes one master twice, then proves the orders match
}
