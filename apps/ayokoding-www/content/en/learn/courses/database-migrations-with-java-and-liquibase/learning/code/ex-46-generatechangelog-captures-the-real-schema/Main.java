// Example 46: generateChangeLog Captures the Real Schema.
// A legacy database becomes a changelog when generateChangeLog snapshots
// its schema into changeset form: the draft baseline the team reviews,
// never blindly trusts. This program hand-builds a legacy widgets table,
// generates a changelog from the live database, then counts how many
// generated changesets describe that table.
import java.nio.file.Files; // => reads the generated changelog the diff wrote
import java.nio.file.Path; // => names the generated file without string paths
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.Statement; // => carries the verification queries to the database
import java.util.List; // => holds the generated lines for counting
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.command.CommandScope; // => runs diff-class commands outside update
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

  // => commands narrate through the UI service too, so generation runs
  // => inside the same quiet scope shape as every update
  static void generateQuiet(String url) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the command snapshots the live database into a changelog file
        CommandScope generate = new CommandScope("generateChangeLog");
        // => generateChangeLog is Liquibase's own snapshot-to-file command
        generate.addArgumentValue("url", url);
        // => the url points the snapshot at our service database
        generate.addArgumentValue("username", "postgres");
        // => trust auth accepts the user without a password
        generate.addArgumentValue("password", "");
        // => the empty password matches the trust-auth service container
        generate.addArgumentValue("changelogFile", "gen.yaml");
        // => the draft baseline lands beside the program, never committed
        generate.addArgumentValue("overwriteOutputFile", true);
        // => overwriting keeps regeneration idempotent on the double run
        generate.addArgumentValue("author", "course");
        // => a fixed author keeps the draft readable for the review below
        generate.execute();
        // => the snapshot ran quiet, so only our own prints reach stdout
      }
    );
  } // => quiet commands keep golden output identical on double runs

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => the same host feeds JDBC and the snapshot command together
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => one url addresses the database from every angle in this program
    try (Connection conn = connect()) {
      conn.setAutoCommit(false);
      // => manual commit makes every preamble statement explicit and replayable
      // => one connection hand-builds the legacy shape to snapshot
      try (Statement st = conn.createStatement()) {
        // => the legacy table predates Liquibase: no changeset ever built it
        st.execute("DROP TABLE IF EXISTS legacy_widgets");
        // => dropping first keeps the hand-build idempotent on double runs
        st.execute("CREATE TABLE legacy_widgets (id SERIAL PRIMARY KEY, sku VARCHAR(30))");
        // => the legacy shape the snapshot below must capture faithfully
        conn.commit();
        // => committing pins the legacy shape before the snapshot below
      } // => hand-built history is exactly what snapshots are for
    } // => closing first lets the snapshot open its own connection cleanly
    generateQuiet(url);
    // => the draft baseline now sits in gen.yaml beside the program
    List<String> lines = Files.readAllLines(Path.of("gen.yaml"));
    // => the generated file is read, never printed: only counts leave it
    int mentions = 0;
    // => the counter keeps the stable fact: our table was captured once
    for (String line : lines) {
      // => each generated line is inspected, none is printed raw
      if (line.contains("legacy_widgets")) {
        // => our table name appears in its own createTable changeset
        mentions++;
        // => counting names survives generator-layout changes across versions
      } // => the draft's shape may evolve; its subject cannot
    } // => the review below starts from this count, not from blind trust
    System.out.println("generated lines naming our table: " + mentions);
    // => Output: generated lines naming our table: 2
    // => a rerun rebuilds the legacy shape and snapshots the identical draft
  } // => main snapshots the legacy table, then counts its capture
}
