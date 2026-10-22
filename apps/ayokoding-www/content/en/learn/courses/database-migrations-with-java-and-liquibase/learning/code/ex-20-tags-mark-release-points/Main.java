// Example 20: Tags Mark Release Points.
// A tag writes a name onto the latest history row, so later moves can say
// "back to v1" instead of counting changesets. Tags are data in the same
// history table, queryable like everything else. This program tags after
// the second changeset, applies a third, then prints each row's tag to
// prove the name landed exactly on the release point.
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

  // => Liquibase narrates on updates and tags alike, so one quiet runner
  // => covers the two updates and the tag between them
  static void runQuiet(Liquibase liquibase, String step) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the step name selects the Liquibase move below
        if (step.equals("tag")) {
          // => name the current release point v1 for later rollbacks
          liquibase.tag("v1");
        } else if (step.equals("pair")) {
          // => apply the first two changesets, leaving the third pending
          liquibase.update(2, "");
        } else {
          // => apply whatever the history still lacks
          liquibase.update("");
        } // => each branch is one honest Liquibase move, nothing hidden
      }
    );
    // => every branch stays inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

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
      // => one connection serves the release, the tag, and the tag read
      conn.setAutoCommit(false);
      // => manual commit makes the preamble reset explicit and replayable
      try (Statement st = conn.createStatement()) {
        // => leftover tables would move the tag this example must place
        st.execute("DROP TABLE IF EXISTS tolls");
        // => dropping last-created first unwinds the release in reverse
        st.execute("DROP TABLE IF EXISTS locks");
        // => the tagged table goes so the tag below lands fresh
        st.execute("DROP TABLE IF EXISTS canals");
        // => dropping first keeps the release replayable on double runs
      } // => a clean slate replays the same tag placement on every run
      clearHistory(conn);
      // => forgetting past releases lets this run tag its own fresh
      conn.commit();
      // => committing pins the clean slate before the release pair below
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => three changesets: two for the release, one after it
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, "pair");
      // => the release pair applies; the third changeset stays pending
      runQuiet(liquibase, "tag");
      // => the v1 tag lands on the latest history row, the second changeset
      runQuiet(liquibase, "rest");
      // => the post-release changeset applies without disturbing the tag
      try (
        Statement st = conn.createStatement();
        // => orderexecuted lists the release in the order it shipped
        ResultSet rs = st.executeQuery("SELECT id, tag FROM databasechangelog ORDER BY orderexecuted")
      ) {
        // => three rows prove the release plus its follow-up all applied
        // => a rerun replays pair, tag, and rest to the identical history
        while (rs.next()) {
          // => untagged rows print a dash so the tagged row stands out
          String tag = rs.getString(2);
          // => the driver returns null for the untagged history rows
          System.out.println(rs.getString(1) + " | tag " + (tag == null ? "-" : tag));
          // => exactly one row carries v1: the release point itself
        } // => the tag column is the release map future rollbacks read
      } // => reading history back is a habit every later example repeats
    } // => closing the connection ends the program with history intact
  } // => main releases two, tags the point, then shows the tags
}
