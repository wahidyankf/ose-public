package com.organiclever.demojavx.integration;

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
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Additional integration tests that cover code paths not exercised by Cucumber
 * scenarios. All calls go through {@link DirectCallService} — no HTTP transport.
 */
class CoverageIT {

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
        JsonObject body = resp.body();
        assertNotNull(body);
        return body.getString("id");
    }

    private String login(String username, String password) throws Exception {
        ServiceResponse resp = svc().login(username, password);
        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
        return body.getString("access_token");
    }

    private String loginAndGetRefreshToken(String username, String password) throws Exception {
        ServiceResponse resp = svc().login(username, password);
        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
        return body.getString("refresh_token");
    }

    // ─────────────────── TokenHandler.handleClaims ──────────────────

    @Test
    void tokenClaims_validToken_returns200WithClaims() throws Exception {
        register("alice", "Str0ng#Pass1");
        String token = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().getTokenClaims(token);

        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
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
        // Use a token signed with a different key
        JwtService badJwt = new JwtService("different-secret-32-chars-or-more!!");
        User fakeUser = new User("999", "fake", "fake@example.com", "Fake",
                "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
        JwtService.TokenPair pair = badJwt.generateTokenPair(fakeUser);

        ServiceResponse resp = svc().getTokenClaims(pair.accessToken());
        assertEquals(401, resp.statusCode());
    }

    // ─────────────────── AuthHandler error paths ────────────────────

    @Test
    void register_emptyUsername_returns400() throws Exception {
        ServiceResponse resp = svc().register("", "alice@example.com", "Str0ng#Pass1");
        assertEquals(400, resp.statusCode());
    }

    @Test
    void register_emptyPassword_returns400() throws Exception {
        ServiceResponse resp = svc().register("alice", "alice@example.com", "");
        assertEquals(400, resp.statusCode());
    }

    @Test
    void login_nonExistentUser_returns401() throws Exception {
        ServiceResponse resp = svc().login("nobody", "Str0ng#Pass1");
        assertEquals(401, resp.statusCode());
    }

    @Test
    void login_disabledAccount_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");
        String token = login("alice", "Str0ng#Pass1");

        // Register and promote admin
        String adminId = register("adm2", "Admin#Pass1234");
        svc().promoteToAdmin(adminId);
        String adminToken = login("adm2", "Admin#Pass1234");

        // Find alice's ID
        ServiceResponse listResp = svc().adminListUsers(adminToken, null, 1, 100);
        JsonObject listBody = listResp.body();
        assertNotNull(listBody);
        String aliceId = findUserId(listBody.getJsonArray("data"), "alice");

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

        // Get user id to create expired token
        ServiceResponse meResp = svc().getMe(accessToken);
        JsonObject meBody = meResp.body();
        assertNotNull(meBody);
        String userId = meBody.getString("id");

        User fakeUser = new User(userId, "alice", "alice@example.com", "alice",
                "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
        String expiredRefresh = AppFactory.getJwtService().generateExpiredRefreshToken(fakeUser);

        ServiceResponse resp = svc().refresh(expiredRefresh);

        assertEquals(401, resp.statusCode());
    }

    @Test
    void logout_noToken_returns200() throws Exception {
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
    void updateMe_emptyToken_returns401() throws Exception {
        ServiceResponse resp = svc().updateMe(null, "New Name");
        assertEquals(401, resp.statusCode());
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
    void createExpense_unauthenticated_returns401() throws Exception {
        ServiceResponse resp = svc().createExpense(null, "10.00", "USD", "food",
                "lunch", "2025-01-15", "expense");
        assertEquals(401, resp.statusCode());
    }

    @Test
    void getExpense_otherUserExpense_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

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
    void updateExpense_unauthenticated_returns401() throws Exception {
        ServiceResponse resp = svc().updateExpense(null, "some-id", "20.00", "USD",
                "food", "dinner", "2025-01-15", "expense");
        assertEquals(401, resp.statusCode());
    }

    @Test
    void updateExpense_otherUserExpense_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

        ServiceResponse resp = svc().updateExpense(bobToken, expenseId, null, null,
                null, "hacked", null, null);
        assertEquals(403, resp.statusCode());
    }

    @Test
    void deleteExpense_otherUserExpense_returns403() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        register("bob", "Str0ng#Pass1");
        String bobToken = login("bob", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

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
    void updateExpense_invalidCurrency_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

        ServiceResponse resp = svc().updateExpense(aliceToken, expenseId, null, "XYZ",
                null, null, null, null);
        assertEquals(400, resp.statusCode());
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

        ServiceResponse resp = svc().adminListUsers(aliceToken, null, 1, 20);
        assertEquals(403, resp.statusCode());
    }

    // ─────────────────── ReportHandler error path ────────────────────

    @Test
    void report_missingDateParams_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().getPlReport(aliceToken, "", "", "USD");
        assertEquals(400, resp.statusCode());
    }

    // ─────────────────── Refresh token revocation ────────────────────

    @Test
    void refresh_revokedToken_returns401() throws Exception {
        register("alice", "Str0ng#Pass1");
        String refreshToken = loginAndGetRefreshToken("alice", "Str0ng#Pass1");

        // Use the refresh token once (revokes it and pre-revokes new one)
        ServiceResponse firstRefresh = svc().refresh(refreshToken);
        assertEquals(200, firstRefresh.statusCode());

        // Use the same refresh token again — should be revoked
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

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

        ServiceResponse resp = svc().listAttachments(bobToken, expenseId);
        assertEquals(403, resp.statusCode());
    }

    @Test
    void attachment_deleteNonExistentAttachment_returns404() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

        ServiceResponse resp = svc().deleteAttachment(aliceToken, expenseId, "nonexistent");
        assertEquals(404, resp.statusCode());
    }

    // ─────────────────── Expense update ─────────────────────────────

    @Test
    void expense_update_changesAmountAndDescription() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse createResp = svc().createExpense(aliceToken, "10.00", "USD",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(201, createResp.statusCode());
        JsonObject createBody = createResp.body();
        assertNotNull(createBody);
        String expenseId = createBody.getString("id");

        ServiceResponse resp = svc().updateExpense(aliceToken, expenseId, "20.00", "USD",
                "food", "dinner", "2025-01-15", "expense");
        assertEquals(200, resp.statusCode());
    }

    // ─────────────────── ExpenseValidator IDR path ──────────────────

    @Test
    void createExpense_idrWithDecimal_returns400() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        ServiceResponse resp = svc().createExpense(aliceToken, "10000.50", "IDR",
                "food", "lunch", "2025-01-15", "expense");
        assertEquals(400, resp.statusCode());
    }

    // ─────────────────── JwtService line 106 (expiresAt null) ────────

    @Test
    void jwtService_decode_noExpiry_handlesGracefully() {
        JwtService svcJwt = new JwtService("test-secret-32-chars-or-more-here!!");
        User user = new User("1", "alice", "alice@example.com", "Alice",
                "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
        JwtService.TokenPair pair = svcJwt.generateTokenPair(user);
        JwtService.Claims claims = svcJwt.decode(pair.accessToken());
        assertNotNull(claims.subject());
    }

    // ─────────────────── JWKS endpoint ──────────────────────────────

    @Test
    void jwks_returns200WithKeys() {
        ServiceResponse resp = svc().getJwks();
        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
        assertNotNull(body.getJsonArray("keys"));
    }

    // ─────────────────── Expense summary returns array ───────────────

    @Test
    void expenseSummary_returnsArrayFormat() throws Exception {
        register("alice", "Str0ng#Pass1");
        String aliceToken = login("alice", "Str0ng#Pass1");

        svc().createExpense(aliceToken, "30.00", "USD", "food", "lunch",
                "2025-01-15", "expense");

        ServiceResponse resp = svc().getExpenseSummary(aliceToken);
        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
        JsonArray summary = body.getJsonArray("summary");
        assertNotNull(summary, "Expected 'summary' array");
    }

    // ─────────────────── Health endpoint ─────────────────────────────

    @Test
    void health_returnsUp() {
        ServiceResponse resp = svc().getHealth();
        assertEquals(200, resp.statusCode());
        JsonObject body = resp.body();
        assertNotNull(body);
        assertEquals("UP", body.getString("status"));
        assertNull(body.getValue("components"));
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
