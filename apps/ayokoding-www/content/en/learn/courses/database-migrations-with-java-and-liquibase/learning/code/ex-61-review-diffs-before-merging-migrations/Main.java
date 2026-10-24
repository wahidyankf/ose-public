// Example 61: Review Diffs Before Merging Migrations.
// Merges deserve a preview: the update-SQL move renders every statement
// an update would run, without running any of it, so reviewers read the
// exact DDL the merge will execute. This program renders the SQL for two
// pending changesets into memory, counts its CREATE TABLE statements,
// then proves the history stayed empty because nothing ran.
import java.io.StringWriter; // => captures the rendered diff without touching the filesystem
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Contexts; // => selects the environment-gated changes to run
import liquibase.LabelExpression; // => selects the labeled subset to run
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

  // => a fresh demo slate keeps the preview deterministic on double runs
  static void resetDemo(Connection conn) throws Exception {
    conn.setAutoCommit(false);
    // => manual commit makes every reset statement explicit and replayable
    // => applied history would shrink the preview, so every run starts clean
    try (Statement st = conn.createStatement()) {
      // => one statement serves the whole reset
      st.execute("DROP TABLE IF EXISTS deltas");
      // => dropping first removes the evidence of the previous run
      st.execute("DROP TABLE IF EXISTS epsilons");
      // => both reviewed tables go, so the preview always sees two pending
      clearHistory(conn);
      // => deleting only our own rows leaves every other course untouched
      conn.commit();
      // => committing the reset makes the preview that follows honest
    } // => the rendered SQL always covers the same two changesets
  } // => reset-then-render prints identical lines on the harness double run

  // => the history table may not exist before the first update, so forgetting
  // => our rows is guarded by an existence check on every run
  static void clearHistory(Connection conn) throws Exception {
    // => information_schema tells whether any history exists to forget
    try (
      Statement check = conn.createStatement();
      // => a separate statement keeps the check isolated from the delete
      ResultSet rs = check.executeQuery(
        "SELECT count(*) FROM information_schema.tables " + "WHERE table_name = 'databasechangelog'"
      )
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => forgetting runs only where a history table already exists
      if (rs.getInt(1) > 0) {
        // => deleting only our own rows leaves every other course untouched
        try (Statement forget = conn.createStatement()) {
          // => the delete runs only after the check proved the table exists
          forget.execute("DELETE FROM databasechangelog WHERE author = 'course'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the reset, the preview, and the count
      resetDemo(conn);
      // => a clean slate means the preview below always sees two pending
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets awaiting merge review
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      StringWriter rendered = new StringWriter();
      // => the writer captures the SQL instead of executing it anywhere
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => rendering narrates too, so it stays inside a quiet scope
        () -> liquibase.update(new Contexts(), new LabelExpression(), rendered)
      );
      // => the Writer overload renders SQL; the database stays untouched
      int previews = 0;
      // => the counter keeps the stable fact: two changesets await the merge
      for (String line : rendered.toString().split("\n")) {
        // => each rendered line is inspected, none is printed raw
        // => the render carries hostnames and timestamps, so only counts leave it
        if (line.startsWith("-- Changeset ")) {
          // => one header per pending changeset, infrastructure excluded
          previews++;
          // => counting headers survives rendering-layout changes
        } // => the layout may evolve; the changesets it must name cannot
      } // => the count is the review; the SQL stays out of the golden
      System.out.println("changesets the merge would run: " + previews);
      // => Output: changesets the merge would run: 2
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery(
          "SELECT count(*) FROM information_schema.tables " + "WHERE table_name = 'databasechangelog'"
        )
      ) {
        // => rendering runs nothing: not even the history table exists
        rs.next();
        System.out.println("history tables created by preview: " + rs.getInt(1));
        // => Output: history tables created by preview: 0
        // => a rerun resets, renders the same two, and counts identically
      } // => zero history tables prove the preview executed nothing at all
    } // => closing the connection ends the program with nothing applied
  } // => main renders the merge first, and the database never notices
}
