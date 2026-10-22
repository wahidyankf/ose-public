// Example 47: Diffs Find Drift from the Changelog.
// Hand-applied hotfixes diverge the database from its changelog: the diff
// command compares a clean reference against the drifted database and
// names every unexpected object. This program migrates a canonical table
// into two databases, hotfixes an extra table into one, diffs them, then
// counts how many report lines name the drifted table.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
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

  // => the reference database name is the one constant both runs share
  static String dbUrl(String db) {
    // => every handle in this program addresses one of two databases
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => the same host feeds JDBC urls and diff command urls together
    return "jdbc:postgresql://" + host + ":5432/" + db;
  } // => one builder keeps all four addresses spelled identically

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
    try (Connection admin = connect()) {
      // => the admin handle owns the reference database lifecycle
      try (Statement st = admin.createStatement()) {
        // => dropping first keeps the reference idempotent on double runs
        st.execute("DROP DATABASE IF EXISTS driftref");
        // => a missing reference would diff against stale drift, so rebuild
        st.execute("CREATE DATABASE driftref");
        // => CREATE DATABASE commits itself; no transaction wraps it
      } // => the reference starts empty on every run, by construction
    } // => closing first releases the handle before migrating either side
    Properties refProps = new Properties();
    // => the reference login travels in Properties like every connection here
    refProps.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => trust auth accepts the bare user; the driver needs no password
    try (
      Connection conn = connect();
      // => the main handle migrates the drifted side below
      Connection ref = DriverManager.getConnection(dbUrl("driftref"), refProps)
    ) {
      // => the reference handle migrates the clean side beside it
      Database mainDb = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => the factory picks the PostgreSQL implementation from the URL
      runQuiet(
        new Liquibase("canonical.sql", new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()), mainDb)
      );
      // => the drifted side holds the canonical table from here on
      Database refDb = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(ref));
      // => the same changelog migrates the reference to the identical shape
      runQuiet(
        new Liquibase("canonical.sql", new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()), refDb)
      );
      // => both sides match until the hotfix below diverges one of them
      try (Statement st = conn.createStatement()) {
        // => the hotfix bypasses Liquibase: no changeset, no history row
        st.execute("DROP TABLE IF EXISTS drift_orders");
        // => dropping first keeps the hotfix idempotent on the double run
        st.execute("CREATE TABLE drift_orders (id SERIAL PRIMARY KEY, note VARCHAR(60))");
        // => the untracked table is the drift the diff below must name
        conn.commit();
        // => committing pins the drift before the comparison below
      } // => drift is a fact about the schema, not about the history
      java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
      // => the buffer receives the printed report instead of the console
      java.io.PrintStream kept = System.out;
      // => the kept stream restores the console after the diff below
      System.setOut(new java.io.PrintStream(buffer, true, java.nio.charset.StandardCharsets.UTF_8));
      // => redirecting keeps connection urls out of the golden transcript
      try {
        // => the command prints its report to the redirected console
        Scope.child(
          java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
          // => the diff runs inside a quiet scope, main still throws
          () -> {
            // => the command compares the clean reference to the drifted side
            CommandScope diff = new CommandScope("diff");
            // => diff is Liquibase's own schema-comparison command
            diff.addArgumentValue("referenceUrl", dbUrl("driftref"));
            // => the reference side holds only the canonical table
            diff.addArgumentValue("referenceUsername", "postgres");
            // => trust auth accepts the bare user on the reference too
            diff.addArgumentValue("referencePassword", "");
            // => the empty password matches the trust-auth service container
            diff.addArgumentValue("url", dbUrl("postgres"));
            // => the comparison side holds canonical plus the hotfix table
            diff.addArgumentValue("username", "postgres");
            // => the same trust-auth user addresses the comparison side
            diff.addArgumentValue("password", "");
            // => identical credentials keep both sides equally reachable
            diff.execute();
            // => the report lands in the buffer, never on the console
          }
        );
      } finally {
        // => the console restores even when the comparison itself fails
        System.setOut(kept);
      } // => only our own prints reach stdout from here on
      int mentions = 0;
      // => the counter keeps the stable fact: the drift was named
      for (String line : buffer.toString(java.nio.charset.StandardCharsets.UTF_8).split("\n")) {
        // => each report line is inspected, none is printed raw
        // => the raw report carries connection urls, so only counts leave it
        if (line.contains("drift_orders")) {
          // => the drifted table name appears wherever the report lists it
          mentions++;
          // => counting names survives report-layout changes across versions
        } // => the layout may evolve; the drift it must name cannot
      } // => the count is the finding; the report stays out of the golden
      System.out.println("report lines naming the drift: " + mentions);
      // => Output: report lines naming the drift: 5
      // => a rerun rebuilds both sides and diffs the identical divergence
    } // => closing both handles ends the program with the drift in place
  } // => main diverges one side, then counts the diff's finding
}
