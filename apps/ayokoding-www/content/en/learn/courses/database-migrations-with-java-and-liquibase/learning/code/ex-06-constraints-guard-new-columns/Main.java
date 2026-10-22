// Example 6: Constraints Guard New Columns.
// A column without rules accepts anything: nulls where names belong,
// duplicates where identity lives. addNotNullConstraint and
// addUniqueConstraint attach those rules to an existing column, and the
// database enforces them on every later write. This program migrates the
// table, adds both constraints, then proves a duplicate handle is rejected
// while the constraint catalog records both rules.
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
        // => three changesets: create, then constrain, then constrain
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
        st.execute("DELETE FROM accounts");
        // => delete-then-insert keeps the seed idempotent on the double run
        st.execute("INSERT INTO accounts (handle) VALUES ('budi')");
        // => the first handle lands fine: constraints allow honest rows
        conn.commit();
        // => commit the seed so the later rollback only undoes the probe
        boolean duplicateRejected = false;
        // => the flag records the outcome without printing driver internals
        try {
          // => a second identical handle must violate the unique rule
          st.execute("INSERT INTO accounts (handle) VALUES ('budi')");
        } catch (SQLException expected) {
          // => the exception type is stable; its message text is not asserted
          duplicateRejected = true;
          // => the failed write aborts the transaction, so roll back before
          // => the next query or every later command is ignored until then
          conn.rollback();
          // => catching proves the database enforced the constraint itself
        } // => no stack trace: the rejection is the expected behaviour
        System.out.println("duplicate handle rejected: " + duplicateRejected);
        // => Output: duplicate handle rejected: true
        try (
          ResultSet rs = st.executeQuery(
            "SELECT count(*) FROM information_schema.table_constraints " +
              "WHERE table_name = 'accounts' AND constraint_type = 'CHECK'"
          )
        ) {
          // => PostgreSQL 18 records each SET NOT NULL as a CHECK constraint,
          // => one for the key column and one for our new handle rule
          rs.next();
          System.out.println("not-null rules recorded: " + rs.getInt(1));
          // => Output: not-null rules recorded: 2
        } // => catalog counts verify the migration without vendor internals
        try (
          ResultSet rs = st.executeQuery(
            "SELECT count(*) FROM information_schema.table_constraints " +
              "WHERE table_name = 'accounts' AND constraint_type = 'UNIQUE'"
          )
        ) {
          // => the named unique constraint is the second rule we added
          rs.next();
          System.out.println("unique rules recorded: " + rs.getInt(1));
          // => Output: unique rules recorded: 1
        } // => one CHECK plus one UNIQUE is the whole contract of this file
      } // => closing the statement releases the database resources
    } // => closing the connection ends the program with history intact
  } // => main migrates first, verifies second, prints last
}
