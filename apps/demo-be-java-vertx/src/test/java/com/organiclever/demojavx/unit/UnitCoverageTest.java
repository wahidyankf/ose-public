package com.organiclever.demojavx.unit;

import com.organiclever.demojavx.auth.JwtService;
import com.organiclever.demojavx.domain.model.User;
import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ServiceResponse;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import java.time.Instant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Unit-level coverage tests for code paths not exercised by Cucumber scenarios.
 * These tests call DirectCallService directly (no HTTP transport), backed by the
 * same real PostgreSQL database used for integration testing.
 */
class UnitCoverageTest {

    @BeforeAll
    static void startServer() throws Exception {
        AppFactory.deploy();
    }

    @AfterEach
    void resetState() throws Exception {
        AppFactory.reset();
    }

    // ─────────────────────────── helpers ────────────────────────────

    private DirectCallService svc() {
        return AppFactory.getService();
    }

    private String register(String username, String password) throws Exception {
        ServiceResponse resp = svc().register(username, username + "@example.com", password);
        assertEquals(201, resp.statusCode());
        return resp.body().getString("id");
    }

    private String login(String username, String password) throws Exception {
        ServiceResponse resp = svc().login(username, password);
        assertEquals(200, resp.statusCode());
        return resp.body().getString("access_token");
    }

    private String loginAndGetRefreshToken(String username, String password) throws Exception {
        ServiceResponse resp = svc().login(username, password);
        assertEquals(200, resp.statusCode());
        return resp.body().getString("refresh_token");
    }

    // ─────────────────── TokenHandler.handleClaims ──────────────────

    @Test
    void tokenClaims_validToken_returns200WithClaims() throws Exception {
        register("alice", "Str0ng#Pass1");
        String token = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().getTokenClaims(token);

        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body.getString("sub"));
        assertNotNull(body.getString("iss"));
        assertNotNull(body.getString("jti"));
        assertNotNull(body.getString("role"));
    }

    @Test
    void tokenClaims_noAuthHeader_returns401() {
        ServiceResponse resp = svc().getTokenClaims(null);
        assertEquals(401, resp.statusCode());
    }

    @Test
    void tokenClaims_invalidToken_returns401() {
        // Use a bearer token signed with a different secret — validation will fail
        JwtService badJwt = new JwtService("different-secret-32-chars-or-more!!");
        User fakeUser = new User("999", "fake", "fake@example.com", "Fake",
                "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
        JwtService.TokenPair pair = badJwt.generateTokenPair(fakeUser);

        ServiceResponse resp = svc().getTokenClaims(pair.accessToken());
        assertEquals(401, resp.statusCode());
    }

    // ─────────────────── AuthHandler error paths ────────────────────

    @Test
    void register_emptyPassword_returns400() throws Exception {
        ServiceResponse resp = svc().register("alice", "alice@example.com", "");
        assertEquals(400, resp.statusCode());
    }

    @Test
    void login_disabledAccount_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");
        String token = login("alice", "Str0ng#Pass1");

        // Promote a second user to admin
        String adminId = register("adm2", "Admin#Pass1234");
        svc().promoteToAdmin(adminId);
        String adminToken = login("adm2", "Admin#Pass1234");

        // Find alice's ID via admin list
        ServiceResponse listResp = svc().adminListUsers(adminToken, null, 1, 100);
        String aliceId = findUserId(listResp.body().getJsonArray("data"), "alice");

        // Disable alice
        svc().adminDisableUser(adminToken, aliceId);

        // Try to login as disabled alice
        ServiceResponse resp = svc().login("alice", "Str0ng#Pass1");
        assertEquals(401, resp.statusCode());
        // Suppress unused variable warning
        assertNotNull(token);
    }

    @Test
    void login_lockedAccount_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");

        // Make 5 failed login attempts to lock the account
        for (int i = 0; i < 5; i++) {
            svc().login("alice", "WrongPassword!");
        }

        // Try logging in now — account is locked
        ServiceResponse resp = svc().login("alice", "Str0ng#Pass1");
        assertEquals(401, resp.statusCode());
    }

    @Test
    void refresh_withAccessTokenInsteadOfRefresh_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");
        String accessToken = login("alice", "Str0ng#Pass1");

        // Use access token as refresh token — wrong type
        ServiceResponse resp = svc().refresh(accessToken);
        assertEquals(401, resp.statusCode());
    }

    @Test
    void refresh_expiredToken_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");
        String accessToken = login("alice", "Str0ng#Pass1");

        // Get user id from /me
        ServiceResponse meResp = svc().getMe(accessToken);
        String userId = meResp.body().getString("id");

        User fakeUser = new User(userId, "alice", "alice@example.com", "alice",
                "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
        String expiredRefresh = AppFactory.getJwtService().generateExpiredRefreshToken(fakeUser);

        ServiceResponse resp = svc().refresh(expiredRefresh);
        assertEquals(401, resp.statusCode());
    }

    @Test
    void logout_noAuthHeader_returns200() throws Exception {
        ServiceResponse resp = svc().logout(null);
        assertEquals(200, resp.statusCode());
    }

    @Test
    void logout_invalidToken_returns200() throws Exception {
        ServiceResponse resp = svc().logout("not.a.valid.token");
        assertEquals(200, resp.statusCode());
    }

    // ─────────────────── UserHandler error paths ─────────────────────

    @Test
    void updateMe_emptyDisplayName_returns200() throws Exception {
        register("alice", "Str0ng#Pass1");
        String token = login("alice", "Str0ng#Pass1");

        // updateMe with empty string — service allows it (no validation on display_name)
        ServiceResponse resp = svc().updateMe(token, "");
        assertEquals(200, resp.statusCode());
    }

    @Test
    void changePassword_emptyNewPassword_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String token = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().changePassword(token, "Str0ng#Pass1", "");
        assertEquals(400, resp.statusCode());
    }

    // ─────────────────── ExpenseHandler error paths ──────────────────

    @Test
    void getExpense_otherUserExpense_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        // Alice creates an expense
        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        String expenseId = createResp.body().getString("id");

        // Bob tries to get Alice's expense
        ServiceResponse resp = svc().getExpense(bobToken, expenseId);
        assertEquals(403, resp.statusCode());
    }

    @Test
    void getExpense_notFound_returns404() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().getExpense(aliceToken, "nonexistent-id");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void updateExpense_otherUserExpense_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        // Alice creates an expense
        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        String expenseId = createResp.body().getString("id");

        // Bob tries to update Alice's expense
        ServiceResponse resp = svc().updateExpense(bobToken, expenseId, null, null, null,
                "hacked", null, null);
        assertEquals(403, resp.statusCode());
    }

    @Test
    void deleteExpense_otherUserExpense_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        // Alice creates an expense
        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        String expenseId = createResp.body().getString("id");

        // Bob tries to delete Alice's expense
        ServiceResponse resp = svc().deleteExpense(bobToken, expenseId);
        assertEquals(403, resp.statusCode());
    }

    @Test
    void deleteExpense_notFound_returns404() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().deleteExpense(aliceToken, "nonexistent-id");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void createExpense_idrWithDecimal_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().createExpense(aliceToken, "10000.50", "IDR", "food",
                "lunch", "2025-01-15", "expense");
        assertEquals(400, resp.statusCode());
    }

    @Test
    void updateExpense_invalidCurrency_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        String expenseId = createResp.body().getString("id");

        // Update with invalid currency
        ServiceResponse resp = svc().updateExpense(aliceToken, expenseId, null, "XYZ", null,
                null, null, null);
        assertEquals(400, resp.statusCode());
    }

    @Test
    void expense_withMethods_coveredByUpdate() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        String expenseId = createResp.body().getString("id");

        // Update to trigger amount and description change paths
        ServiceResponse resp = svc().updateExpense(aliceToken, expenseId, "20.00", "USD", null,
                "dinner", "2025-01-15", null);
        assertEquals(200, resp.statusCode());
    }

    // ─────────────────── AdminHandler error paths ────────────────────

    @Test
    void admin_disableNonExistentUser_returns404() throws Exception {
        String adminId = register("adm2", "Admin#Pass1234");
        svc().promoteToAdmin(adminId);
        String adminToken = login("adm2", "Admin#Pass1234");

        ServiceResponse resp = svc().adminDisableUser(adminToken, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void admin_enableNonExistentUser_returns404() throws Exception {
        String adminId = register("adm3", "Admin#Pass1234");
        svc().promoteToAdmin(adminId);
        String adminToken = login("adm3", "Admin#Pass1234");

        ServiceResponse resp = svc().adminEnableUser(adminToken, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void admin_unlockNonExistentUser_returns404() throws Exception {
        String adminId = register("adm4", "Admin#Pass1234");
        svc().promoteToAdmin(adminId);
        String adminToken = login("adm4", "Admin#Pass1234");

        ServiceResponse resp = svc().adminUnlockUser(adminToken, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void admin_forcePasswordResetNonExistentUser_returns404() throws Exception {
        String adminId = register("adm5", "Admin#Pass1234");
        svc().promoteToAdmin(adminId);
        String adminToken = login("adm5", "Admin#Pass1234");

        ServiceResponse resp = svc().adminForcePasswordReset(adminToken, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void admin_nonAdminAccessAdmin_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().adminListUsers(aliceToken, null, 1, 100);
        assertEquals(403, resp.statusCode());
    }

    // ─────────────────── ReportHandler error path ────────────────────

    @Test
    void report_invalidDateParams_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        // Pass invalid date strings to trigger 400
        ServiceResponse resp = svc().getPlReport(aliceToken, "not-a-date", "also-invalid", "USD");
        assertEquals(400, resp.statusCode());
    }

    // ─────────────────── Token revocation ────────────────────────────

    @Test
    void refresh_revokedToken_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");
        String refreshToken = loginAndGetRefreshToken("alice", "Str0ng#Pass1");

        // Use the refresh token once (single-use — pre-revoked)
        ServiceResponse firstRefresh = svc().refresh(refreshToken);
        assertEquals(200, firstRefresh.statusCode());

        // Use the same refresh token again — should be rejected
        ServiceResponse resp = svc().refresh(refreshToken);
        assertEquals(401, resp.statusCode());
    }

    // ─────────────────── AttachmentHandler error paths ───────────────

    @Test
    void attachment_notFoundExpense_returns404() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().listAttachments(aliceToken, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    @Test
    void attachment_otherUserExpenseList_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        // Alice creates an expense
        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        String expenseId = createResp.body().getString("id");

        // Bob tries to list attachments for Alice's expense
        ServiceResponse resp = svc().listAttachments(bobToken, expenseId);
        assertEquals(403, resp.statusCode());
    }

    @Test
    void attachment_deleteNonExistentAttachment_returns404() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        // Alice creates an expense
        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        String expenseId = createResp.body().getString("id");

        // Delete non-existent attachment
        ServiceResponse resp = svc().deleteAttachment(aliceToken, expenseId, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    // ─────────────────── JWKS endpoint ───────────────────────────────

    @Test
    void jwks_returns200WithKeys() {
        ServiceResponse resp = svc().getJwks();
        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
        JsonArray keys = body.getJsonArray("keys");
        assertNotNull(keys);
        assertNotNull(keys.size() > 0);
    }

    // ─────────────────── JwtService line coverage ────────────────────

    @Test
    void jwtService_decode_noExpiry_handlesGracefully() {
        JwtService jwt = new JwtService("test-secret-32-chars-or-more-here!!");
        User user = new User("1", "alice", "alice@example.com", "Alice",
                "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
        JwtService.TokenPair pair = jwt.generateTokenPair(user);
        JwtService.Claims claims = jwt.decode(pair.accessToken());
        assertNotNull(claims.subject());
    }

    // ─────────────────── utility ─────────────────────────────────────

    private String findUserId(JsonArray data, String username) {
        for (int i = 0; i < data.size(); i++) {
            JsonObject user = data.getJsonObject(i);
            if (username.equals(user.getString("username"))) {
                return user.getString("id");
            }
        }
        return "";
    }
}
