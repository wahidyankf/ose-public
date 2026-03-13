package com.organiclever.demojavx.support;

import com.organiclever.demojavx.auth.JwtService;
import com.organiclever.demojavx.auth.PasswordService;
import com.organiclever.demojavx.db.SchemaInitializer;
import com.organiclever.demojavx.repository.AttachmentRepository;
import com.organiclever.demojavx.repository.ExpenseRepository;
import com.organiclever.demojavx.repository.TokenRevocationRepository;
import com.organiclever.demojavx.repository.UserRepository;
import com.organiclever.demojavx.repository.pg.PgAttachmentRepository;
import com.organiclever.demojavx.repository.pg.PgExpenseRepository;
import com.organiclever.demojavx.repository.pg.PgTokenRevocationRepository;
import com.organiclever.demojavx.repository.pg.PgUserRepository;
import io.vertx.core.Vertx;
import io.vertx.pgclient.PgBuilder;
import io.vertx.pgclient.PgConnectOptions;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.PoolOptions;
import java.net.URI;
import java.util.concurrent.TimeUnit;

/**
 * Singleton factory used by integration tests. It initialises a real PostgreSQL
 * connection pool using the {@code DATABASE_URL} environment variable, runs the
 * schema DDL once (idempotent), and exposes a {@link DirectCallService} that
 * step definitions can call without any HTTP transport.
 *
 * <p>Between Cucumber scenarios {@link #reset()} truncates all application
 * tables so each scenario starts with a clean slate.
 */
public final class AppFactory {

    private static Vertx vertx;
    private static Pool pool;
    private static DirectCallService service;
    private static JwtService jwtService;

    private AppFactory() {
    }

    public static synchronized void deploy() throws Exception {
        if (service != null) {
            return;
        }
        vertx = Vertx.vertx();

        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            throw new IllegalStateException(
                    "DATABASE_URL environment variable must be set for integration tests. "
                            + "Example: postgresql://user:pass@host:5432/dbname");
        }

        pool = createPgPool(databaseUrl);

        // Initialise schema (idempotent DDL — safe to call on every test run)
        SchemaInitializer.initialize(pool)
                .toCompletionStage()
                .toCompletableFuture()
                .get(30, TimeUnit.SECONDS);

        jwtService = new JwtService("test-secret-32-chars-or-more-here!!");
        PasswordService passwordService = new PasswordService();

        UserRepository userRepo = new PgUserRepository(pool);
        ExpenseRepository expenseRepo = new PgExpenseRepository(pool);
        AttachmentRepository attachmentRepo = new PgAttachmentRepository(pool);
        TokenRevocationRepository revocationRepo = new PgTokenRevocationRepository(pool);

        service = new DirectCallService(userRepo, expenseRepo, attachmentRepo, revocationRepo,
                jwtService, passwordService);
    }

    public static DirectCallService getService() {
        return service;
    }

    public static JwtService getJwtService() {
        return jwtService;
    }

    /**
     * Truncates all data in every application table. Called before each
     * Cucumber scenario to guarantee full isolation between scenarios.
     */
    public static void reset() throws Exception {
        // Delete in FK-safe order: attachments → revoked_tokens → expenses → users
        pool.query("DELETE FROM attachments").execute()
                .toCompletionStage().toCompletableFuture().get(10, TimeUnit.SECONDS);
        pool.query("DELETE FROM revoked_tokens").execute()
                .toCompletionStage().toCompletableFuture().get(10, TimeUnit.SECONDS);
        pool.query("DELETE FROM expenses").execute()
                .toCompletionStage().toCompletableFuture().get(10, TimeUnit.SECONDS);
        pool.query("DELETE FROM users").execute()
                .toCompletionStage().toCompletableFuture().get(10, TimeUnit.SECONDS);
    }

    public static synchronized void close() {
        if (pool != null) {
            pool.close();
            pool = null;
        }
        if (vertx != null) {
            vertx.close();
            vertx = null;
        }
        service = null;
    }

    // ─────────────────────────── helpers ─────────────────────────────

    private static Pool createPgPool(String databaseUrl) {
        URI uri = URI.create(databaseUrl);
        String host = uri.getHost();
        int pgPort = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getPath();
        String database = path != null && path.startsWith("/") ? path.substring(1) : path;
        String userInfo = uri.getUserInfo();
        String user = "";
        String password = "";
        if (userInfo != null && !userInfo.isBlank()) {
            int colon = userInfo.indexOf(':');
            if (colon >= 0) {
                user = userInfo.substring(0, colon);
                password = userInfo.substring(colon + 1);
            } else {
                user = userInfo;
            }
        }

        PgConnectOptions connectOptions = new PgConnectOptions()
                .setHost(host)
                .setPort(pgPort)
                .setDatabase(database)
                .setUser(user)
                .setPassword(password);

        PoolOptions poolOptions = new PoolOptions().setMaxSize(5);

        return PgBuilder.pool()
                .with(poolOptions)
                .connectingTo(connectOptions)
                .using(vertx)
                .build();
    }
}
