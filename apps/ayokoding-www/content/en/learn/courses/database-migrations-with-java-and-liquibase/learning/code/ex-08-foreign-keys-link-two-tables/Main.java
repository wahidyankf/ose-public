// Example 8: Foreign Keys Link Two Tables.
// A bare author_id integer accepts any number, including ids no author has.
// addForeignKeyConstraint turns that integer into a relationship the
// database enforces: every book points at a real author or the write fails.
// This program migrates both tables plus the key, then proves an orphan
// book is rejected, an honest book lands, and the catalog records the link.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.SQLException; // => the checked failure JDBC raises for refused rows
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
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    Properties props = new Properties();
    // => trust auth accepts any password, so only the user matters
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
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      Liquibase liquibase = new Liquibase(
        // => three changesets: two tables, then the link between them
        "changelog.sql",
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the unit directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => close the migration transaction: verifications manage their own
      conn.commit();
      // => the update ran quiet, so the transcript holds only our own prints
      try (Statement st = conn.createStatement()) {
        // => one statement serves the probes and both verification queries
        st.execute("DELETE FROM books");
        // => children delete first: the key forbids orphaning authors instead
        st.execute("DELETE FROM authors");
        // => delete-then-insert keeps the seeds idempotent on the double run
        st.execute("INSERT INTO authors (pen_name) VALUES ('sari')");
        // => one author exists now; the orphan probe below points at 999
        conn.commit();
        // => commit the seed so the later rollback only undoes the probe
        boolean orphanRejected = false;
        // => the flag records the outcome without printing driver internals
        try {
          // => author 999 exists never, so the key must refuse this book
          st.execute("INSERT INTO books (author_id, title) VALUES (999, 'Ghost')");
        } catch (SQLException expected) {
          // => the exception type is stable; its message text is not asserted
          orphanRejected = true;
          // => the failed write aborts the transaction, so roll back before
          // => the next insert or every later command is ignored until then
          conn.rollback();
          // => catching proves the database enforced the relationship itself
        } // => no stack trace: the rejection is the expected behaviour
        System.out.println("orphan book rejected: " + orphanRejected);
        // => Output: orphan book rejected: true
        int authorId;
        // => SERIAL sequences never restart on DELETE, so read the live id
        try (ResultSet key = st.executeQuery("SELECT id FROM authors WHERE pen_name = 'sari'")) {
          // => the seed above guarantees exactly one row with this pen name
          key.next();
          authorId = key.getInt(1);
          // => the id differs per run; hardcoding 1 breaks the double run
        } // => reading generated keys back beats assuming their values
        st.execute("INSERT INTO books (author_id, title) VALUES (" + authorId + ", 'Migrations')");
        // => the honest book points at the real author and lands fine
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM information_schema.referential_constraints")) {
          // => the catalog records one enforced link between the two tables
          rs.next();
          System.out.println("foreign keys recorded: " + rs.getInt(1));
          // => Output: foreign keys recorded: 1
        } // => catalog counts verify the migration without vendor internals
      } // => closing the statement releases the database resources
    } // => closing the connection ends the program with history intact
  } // => main migrates first, verifies second, prints last
}
