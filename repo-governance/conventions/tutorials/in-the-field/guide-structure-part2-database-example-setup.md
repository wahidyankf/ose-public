---
description: The worked standard-library JDBC database persistence example.
when_to_use: Use when writing the standard-library database example for a Part 2 section.
---

# Guide Structure Part 2: Standard Library First — Database Example Setup

**Example 3: Database Persistence with JDBC**

```java
import java.sql.*;
// => JDBC standard library (java.sql package)
// => Included in Java SE, no external dependencies
// => No ORM framework required
// => Direct SQL execution

public class DatabaseExample {
    // => Standard library database example
    // => Demonstrates basic JDBC query

    public static void main(String[] args) throws SQLException {
        // => throws SQLException for simplicity
        // => Production code should use try-catch
        // => Or try-with-resources for auto-cleanup

        String url = "jdbc:postgresql:mydb";
        // => Database connection string (JDBC URL)
        // => jdbc: protocol identifier
        // => postgresql: database type (also mysql, oracle, h2)
        // => host and port omitted: the short form defaults to localhost:5432
        // => mydb: database name
        // => Contains database name; host and port use defaults

        Connection conn = DriverManager.getConnection(url, user, pass);
        // => conn is JDBC Connection (AutoCloseable)
        // => DriverManager creates connection from URL
        // => Opens TCP connection to database
        // => Authentication happens here
        // => Must be closed to prevent connection leak
        // => One connection per query (no pooling)

        PreparedStatement stmt = conn.prepareStatement(
            "SELECT * FROM users WHERE id = ?");
        // => PreparedStatement prevents SQL injection
        // => ? is placeholder (parameter binding)
        // => Database pre-compiles query for performance
        // => Can be reused with different parameters
        // => Safer than string concatenation

        stmt.setLong(1, userId);
        // => Sets first parameter (1-indexed, not 0)
        // => Replaces ? with userId safely
        // => Database handles escaping
        // => Type-safe setter (setLong, setString, etc.)

        ResultSet rs = stmt.executeQuery();
        // => rs contains query results
        // => The cursor starts before the first row
        // => Must call next() to access data
        // => Holds database resources until closed

        if (rs.next()) {
            // => next() advances cursor to first row
            // => Returns true if row exists, false if empty
            // => Loop with while(rs.next()) for multiple rows

            User user = new User(
                rs.getLong("id"),          // => Column by name
                rs.getString("username"),  // => Type-safe getters
                rs.getString("email")      // => Automatic conversion
            );
            // => Manual object mapping (tedious for large tables)
            // => Error-prone (typos in column names)
            // => Repetitive for many entities
        }

        rs.close();   // => Release result set resources
        stmt.close(); // => Release statement resources
        conn.close(); // => Close database connection
        // => Failure to close causes connection leaks
        // => Better: use try-with-resources
        // => Production: connection pool manages lifecycle
    }
    // => No connection pooling in standard library
    // => New connection for every request
    // => Connection creation is expensive (TCP handshake, auth)
}
```

Continued in [Guide Structure Part 2 — Database Example Limitations](./guide-structure-part2-database-example-limitations.md).
