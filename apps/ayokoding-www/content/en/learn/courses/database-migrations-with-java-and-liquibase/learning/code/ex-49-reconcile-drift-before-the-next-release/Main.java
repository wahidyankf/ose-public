// Example 49: Reconcile Drift Before the Next Release.
// A captured drift is a review ticket, not a migration: the team reads
// the generated file, decides the hotfix table should not exist, and
// applies the generated changelog to remove it before the next release.
// This program captures the drift, applies the capture to the drifted
// side, re-captures, then proves the second capture names nothing.
import java.nio.file.Files; // => reads the generated changelog the diff wrote
import java.nio.file.Path; // => names the generated file without string paths
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.Statement; // => carries the verification queries to the database
import java.util.List; // => holds the generated lines for counting
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

  // => the capture helper runs the same comparison twice: before the fix
  // => and after it, so the second count proves the reconcile worked
  static void captureDrift(String file) throws Exception {
    // => the file name selects which capture the caller is taking
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the command runs inside a quiet scope, main still throws
      () -> {
        // => the command turns the live comparison into a changelog file
        CommandScope diffLog = new CommandScope("diffChangeLog");
        // => diffChangeLog is Liquibase's own drift-to-file command
        diffLog.addArgumentValue("referenceUrl", dbUrl("driftref"));
        // => the reference side holds only the canonical table throughout
        diffLog.addArgumentValue("referenceUsername", "postgres");
        // => trust auth accepts the bare user on the reference too
        diffLog.addArgumentValue("referencePassword", "");
        // => the empty password matches the trust-auth service container
        diffLog.addArgumentValue("url", dbUrl("postgres"));
        // => the comparison side starts drifted and ends reconciled
        diffLog.addArgumentValue("username", "postgres");
        // => the same trust-auth user addresses the comparison side
        diffLog.addArgumentValue("password", "");
        // => identical credentials keep both sides equally reachable
        diffLog.addArgumentValue("changelogFile", file);
        // => each capture lands beside the program under its own name
        diffLog.execute();
        // => the file ran quiet, so only our own prints reach stdout
      }
    );
  } // => quiet captures keep golden output identical on double runs

  // => the file reader counts drift mentions without printing file bytes
  static int driftMentions(String file) throws Exception {
    // => the file name selects the capture the caller is grading
    if (!Files.exists(Path.of(file))) {
      // => an empty diff writes no file: no changesets means no drift
      return 0;
      // => zero without reading is the honest count of an absent capture
    } // => the guard keeps the reconciled capture at a stable zero
    List<String> lines = Files.readAllLines(Path.of(file));
    // => generated files are read, never printed: only counts leave them
    int mentions = 0;
    // => the counter keeps the stable fact each capture must prove
    for (String line : lines) {
      // => each generated line is inspected, none is printed raw
      if (line.contains("drift_orders")) {
        // => the drifted table name appears only while drift remains
        mentions++;
        // => counting names survives generator-layout changes across versions
      } // => the draft's shape may evolve; its subject cannot
    } // => zero mentions after the fix prove the reconcile held
    return mentions;
  } // => helpers that verify stay separate from code that reconciles

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    Files.deleteIfExists(Path.of("drift.yaml"));
    // => deleting first keeps the first capture idempotent on double runs
    Files.deleteIfExists(Path.of("drift-after.yaml"));
    // => the second capture starts absent on every run as well
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
    try (Connection conn = connect()) {
      // => the main handle owns the drifted side from here on
      Database mainDb = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => the factory picks the PostgreSQL implementation from the URL
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots every changelog handle in this program
      runUpdate(new Liquibase("canonical.sql", accessor, mainDb));
      // => the drifted side holds the canonical table from here on
      try (Connection ref = DriverManager.getConnection(dbUrl("driftref"), refProps)) {
        // => the reference handle migrates the clean side beside it
        Database refDb = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(ref));
        // => the same changelog migrates the reference to the identical shape
        runUpdate(new Liquibase("canonical.sql", accessor, refDb));
        // => both sides match until the hotfix below diverges one of them
      } // => the reference closes; only its clean schema matters now
      try (Statement st = conn.createStatement()) {
        // => the hotfix bypasses Liquibase: no changeset, no history row
        st.execute("DROP TABLE IF EXISTS drift_orders");
        // => dropping first keeps the hotfix idempotent on the double run
        st.execute("CREATE TABLE drift_orders (id SERIAL PRIMARY KEY, note VARCHAR(60))");
        // => the untracked table is the drift the captures below track
        st.execute("DELETE FROM databasechangelog WHERE filename LIKE '%drift%.yaml'");
        // => forgetting past captures lets this run apply its own fresh one
        // => generated ids repeat across runs, so stale rows would no-op it
        conn.commit();
        // => committing pins the drift before the first capture below
      } // => drift is a fact about the schema, not about the history
      captureDrift("drift.yaml");
      // => the first capture files the drift for the review below
      System.out.println("drift lines before reconcile: " + driftMentions("drift.yaml"));
      // => Output: drift lines before reconcile: 1
      runUpdate(new Liquibase("drift.yaml", accessor, mainDb));
      // => applying the capture removes the drift the review rejected
      // => the generated drop runs as a tracked changeset like any other
      captureDrift("drift-after.yaml");
      // => the second capture diffs the reconciled side against the reference
      System.out.println("drift lines after reconcile: " + driftMentions("drift-after.yaml"));
      // => Output: drift lines after reconcile: 0
      // => a rerun rebuilds the drift, captures, removes, and recounts it
    } // => closing the main handle ends the program fully reconciled
  } // => main files the drift, removes it, then proves it is gone

  // => Liquibase narrates progress to its console UI by default; those lines
  // => differ between a first run and a rerun, so goldens cannot hold them
  static void runUpdate(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; callers still throw Exception
      () -> liquibase.update("")
    );
    // => update("") runs every changeset with no context filter
  } // => quiet updates keep golden output identical on the harness double run
}
