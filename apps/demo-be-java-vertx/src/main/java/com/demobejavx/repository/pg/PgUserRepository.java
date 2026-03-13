package com.demobejavx.repository.pg;

import com.demobejavx.domain.model.User;
import com.demobejavx.repository.UserRepository;
import io.vertx.core.Future;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public class PgUserRepository implements UserRepository {

    private final Pool pool;

    public PgUserRepository(Pool pool) {
        this.pool = pool;
    }

    @Override
    public Future<User> save(User user) {
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        return pool.preparedQuery(
                        "INSERT INTO users (id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at, updated_at)"
                                + " VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
                                + " RETURNING id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at")
                .execute(Tuple.of(
                        id,
                        user.username(),
                        user.email(),
                        user.displayName(),
                        user.passwordHash(),
                        user.role(),
                        user.status(),
                        user.failedLoginAttempts(),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC)))
                .map(rows -> rowToUser(rows.iterator().next()));
    }

    @Override
    public Future<User> update(User user) {
        Instant now = Instant.now();
        return pool.preparedQuery(
                        "UPDATE users SET email = $2, display_name = $3, password_hash = $4,"
                                + " role = $5, status = $6, failed_login_attempts = $7,"
                                + " updated_at = $8"
                                + " WHERE id = $1::uuid"
                                + " RETURNING id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at")
                .execute(Tuple.of(
                        user.id(),
                        user.email(),
                        user.displayName(),
                        user.passwordHash(),
                        user.role(),
                        user.status(),
                        user.failedLoginAttempts(),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC)))
                .map(rows -> rowToUser(rows.iterator().next()));
    }

    @Override
    public Future<Optional<User>> findById(String id) {
        if (!isValidUuid(id)) {
            return Future.succeededFuture(Optional.empty());
        }
        return pool.preparedQuery(
                        "SELECT id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at"
                                + " FROM users WHERE id = $1::uuid")
                .execute(Tuple.of(id))
                .map(rows -> {
                    if (rows.size() == 0) {
                        return Optional.empty();
                    }
                    return Optional.of(rowToUser(rows.iterator().next()));
                });
    }

    private static boolean isValidUuid(String id) {
        if (id == null) {
            return false;
        }
        try {
            UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Override
    public Future<Optional<User>> findByUsername(String username) {
        return pool.preparedQuery(
                        "SELECT id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at"
                                + " FROM users WHERE username = $1")
                .execute(Tuple.of(username))
                .map(rows -> {
                    if (rows.size() == 0) {
                        return Optional.empty();
                    }
                    return Optional.of(rowToUser(rows.iterator().next()));
                });
    }

    @Override
    public Future<List<User>> findAll() {
        return pool.preparedQuery(
                        "SELECT id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at"
                                + " FROM users ORDER BY created_at ASC")
                .execute()
                .map(rows -> {
                    List<User> result = new ArrayList<>();
                    rows.forEach(row -> result.add(rowToUser(row)));
                    return result;
                });
    }

    @Override
    public Future<List<User>> findByEmail(@Nullable String emailFilter) {
        if (emailFilter == null || emailFilter.isBlank()) {
            return pool.preparedQuery(
                            "SELECT id, username, email, display_name, password_hash,"
                                    + " role, status, failed_login_attempts, created_at"
                                    + " FROM users ORDER BY created_at ASC")
                    .execute()
                    .map(rows -> {
                        List<User> result = new ArrayList<>();
                        rows.forEach(row -> result.add(rowToUser(row)));
                        return result;
                    });
        }
        return pool.preparedQuery(
                        "SELECT id, username, email, display_name, password_hash,"
                                + " role, status, failed_login_attempts, created_at"
                                + " FROM users WHERE LOWER(email) LIKE $1 ORDER BY created_at ASC")
                .execute(Tuple.of("%" + emailFilter.toLowerCase() + "%"))
                .map(rows -> {
                    List<User> result = new ArrayList<>();
                    rows.forEach(row -> result.add(rowToUser(row)));
                    return result;
                });
    }

    @Override
    public Future<Boolean> existsByUsername(String username) {
        return pool.preparedQuery("SELECT 1 FROM users WHERE username = $1")
                .execute(Tuple.of(username))
                .map(rows -> rows.size() > 0);
    }

    public Pool getPool() {
        return pool;
    }

    private User rowToUser(Row row) {
        OffsetDateTime createdAt = row.getOffsetDateTime("created_at");
        Instant instant = createdAt != null ? createdAt.toInstant() : Instant.now();
        return new User(
                row.getUUID("id").toString(),
                row.getString("username"),
                row.getString("email"),
                row.getString("display_name"),
                row.getString("password_hash"),
                row.getString("role"),
                row.getString("status"),
                row.getInteger("failed_login_attempts"),
                instant);
    }
}
