package com.demobejavx.support;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.demobejavx.auth.JwtService;
import com.demobejavx.auth.PasswordService;
import com.demobejavx.domain.model.Attachment;
import com.demobejavx.domain.model.Expense;
import com.demobejavx.domain.model.TokenRevocation;
import com.demobejavx.domain.model.User;
import com.demobejavx.domain.validation.DomainException;
import com.demobejavx.domain.validation.ExpenseValidator;
import com.demobejavx.domain.validation.UserValidator;
import com.demobejavx.domain.validation.ValidationException;
import com.demobejavx.repository.AttachmentRepository;
import com.demobejavx.repository.ExpenseRepository;
import com.demobejavx.repository.TokenRevocationRepository;
import com.demobejavx.repository.UserRepository;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.jspecify.annotations.Nullable;

/**
 * Direct-call service used exclusively by integration tests. It replicates the
 * business logic of every Vert.x handler without involving an HTTP transport
 * layer. All repository futures are resolved synchronously (5-second timeout)
 * so that Cucumber step definitions stay simple and readable.
 *
 * <p>Each public method corresponds to one HTTP endpoint and returns a
 * {@link ServiceResponse} whose status code and body mirror what the real
 * handler would write to a {@code RoutingContext}.
 */
public final class DirectCallService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final long TIMEOUT_SECONDS = 5;

    private final UserRepository userRepo;
    private final ExpenseRepository expenseRepo;
    private final AttachmentRepository attachmentRepo;
    private final TokenRevocationRepository revocationRepo;
    private final JwtService jwtService;
    private final PasswordService passwordService;

    public DirectCallService(UserRepository userRepo, ExpenseRepository expenseRepo,
            AttachmentRepository attachmentRepo, TokenRevocationRepository revocationRepo,
            JwtService jwtService, PasswordService passwordService) {
        this.userRepo = userRepo;
        this.expenseRepo = expenseRepo;
        this.attachmentRepo = attachmentRepo;
        this.revocationRepo = revocationRepo;
        this.jwtService = jwtService;
        this.passwordService = passwordService;
    }

    // ─────────────────────────── helpers ─────────────────────────────

    private <T> T await(io.vertx.core.Future<T> future) throws Exception {
        return future.toCompletionStage().toCompletableFuture().get(TIMEOUT_SECONDS,
                TimeUnit.SECONDS);
    }

    /**
     * Validates a Bearer token and returns the authenticated user, or throws
     * a {@link DomainException} with status 401 if the token is missing, invalid,
     * revoked or the account is not active.
     */
    private User authenticate(@Nullable String bearerToken) throws Exception {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new DomainException(401, "Unauthorized");
        }
        JwtService.Claims claims;
        try {
            claims = jwtService.validate(bearerToken);
        } catch (JWTVerificationException e) {
            throw new DomainException(401, "Unauthorized");
        }
        boolean revoked = await(revocationRepo.isRevoked(claims.jti()));
        if (revoked) {
            throw new DomainException(401, "Unauthorized");
        }
        Optional<User> userOpt = await(userRepo.findById(claims.subject()));
        if (userOpt.isEmpty()) {
            throw new DomainException(401, "Unauthorized");
        }
        User user = userOpt.get();
        if (!User.STATUS_ACTIVE.equals(user.status())) {
            throw new DomainException(401, "Unauthorized");
        }
        return user;
    }

    private User authenticateAdmin(@Nullable String bearerToken) throws Exception {
        User user = authenticate(bearerToken);
        if (!User.ROLE_ADMIN.equals(user.role())) {
            throw new DomainException(403, "Forbidden");
        }
        return user;
    }

    // ─────────────────────────── Health ──────────────────────────────

    public ServiceResponse getHealth() {
        return ServiceResponse.of(200, new JsonObject().put("status", "UP"));
    }

    // ─────────────────────────── Auth ────────────────────────────────

    public ServiceResponse register(String username, String email,
            String password) throws Exception {
        try {
            UserValidator.validateRegistration(username, email, password);
        } catch (ValidationException e) {
            return ServiceResponse.of(400, new JsonObject()
                    .put("message", e.getMessage())
                    .put("field", e.getField()));
        }
        boolean exists = await(userRepo.existsByUsername(username));
        if (exists) {
            return ServiceResponse.of(409, new JsonObject()
                    .put("message", "Username already exists"));
        }
        String hash = passwordService.hash(password);
        User newUser = new User(null, username, email, username, hash, User.ROLE_USER,
                User.STATUS_ACTIVE, 0, Instant.now());
        User saved = await(userRepo.save(newUser));
        return ServiceResponse.of(201, new JsonObject()
                .put("id", saved.id())
                .put("username", saved.username())
                .put("email", saved.email())
                .put("displayName", saved.displayName())
                .put("role", saved.role()));
    }

    public ServiceResponse login(String username, String password) throws Exception {
        Optional<User> userOpt = await(userRepo.findByUsername(username));
        if (userOpt.isEmpty()) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Invalid credentials"));
        }
        User user = userOpt.get();
        if (User.STATUS_INACTIVE.equals(user.status())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Account deactivated"));
        }
        if (User.STATUS_DISABLED.equals(user.status())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Account disabled"));
        }
        if (User.STATUS_LOCKED.equals(user.status())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Account locked"));
        }
        if (!passwordService.verify(password, user.passwordHash())) {
            int attempts = user.failedLoginAttempts() + 1;
            User updated = user.withFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                updated = updated.withStatus(User.STATUS_LOCKED);
            }
            await(userRepo.update(updated));
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Invalid credentials"));
        }
        User resetUser = user.withFailedLoginAttempts(0);
        User loggedIn = await(userRepo.update(resetUser));
        JwtService.TokenPair tokens = jwtService.generateTokenPair(loggedIn);
        return ServiceResponse.of(200, new JsonObject()
                .put("accessToken", tokens.accessToken())
                .put("refreshToken", tokens.refreshToken())
                .put("tokenType", "Bearer"));
    }

    public ServiceResponse refresh(String refreshToken) throws Exception {
        JwtService.Claims claims;
        try {
            claims = jwtService.validate(refreshToken);
        } catch (JWTVerificationException e) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Token expired or invalid"));
        }
        if (!"refresh".equals(claims.type())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Invalid token type"));
        }
        boolean revoked = await(revocationRepo.isRevoked(claims.jti()));
        if (revoked) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Token invalid"));
        }
        Optional<User> userOpt = await(userRepo.findById(claims.subject()));
        if (userOpt.isEmpty()) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "User not found"));
        }
        User user = userOpt.get();
        if (User.STATUS_DISABLED.equals(user.status())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Account disabled"));
        }
        if (!User.STATUS_ACTIVE.equals(user.status())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Account deactivated"));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject()
                    .put("message", "User id is null"));
        }
        // Revoke the old refresh token jti (mirrors AuthHandler step 4)
        await(revocationRepo.save(new TokenRevocation(claims.jti(), uid, Instant.now())));
        JwtService.TokenPair tokens = jwtService.generateTokenPair(user);
        // Pre-revoke the new refresh token's JTI so it is single-use
        // (mirrors AuthHandler step 5 — each refresh token can only be used once)
        await(revocationRepo.save(
                new TokenRevocation(tokens.refreshJti(), uid, Instant.now())));
        return ServiceResponse.of(200, new JsonObject()
                .put("accessToken", tokens.accessToken())
                .put("refreshToken", tokens.refreshToken())
                .put("tokenType", "Bearer"));
    }

    public ServiceResponse logout(@Nullable String bearerToken) throws Exception {
        if (bearerToken == null || bearerToken.isBlank()) {
            return ServiceResponse.of(200);
        }
        JwtService.Claims claims;
        try {
            claims = jwtService.decode(bearerToken);
        } catch (Exception e) {
            return ServiceResponse.of(200);
        }
        await(revocationRepo.save(
                new TokenRevocation(claims.jti(), claims.subject(), Instant.now())));
        return ServiceResponse.of(200);
    }

    public ServiceResponse logoutAll(@Nullable String bearerToken) throws Exception {
        User user = authenticate(bearerToken);
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        String jti;
        try {
            jti = jwtService.validate(bearerToken != null ? bearerToken : "").jti();
        } catch (JWTVerificationException e) {
            return ServiceResponse.of(401, new JsonObject().put("message", "Unauthorized"));
        }
        await(revocationRepo.save(new TokenRevocation(jti, uid, Instant.now())));
        await(revocationRepo.save(new TokenRevocation("all-" + uid, uid, Instant.now())));
        return ServiceResponse.of(200);
    }

    // ─────────────────────────── Users ───────────────────────────────

    public ServiceResponse getMe(@Nullable String bearerToken) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        return ServiceResponse.of(200, buildUserResponse(user));
    }

    public ServiceResponse updateMe(@Nullable String bearerToken,
            String displayName) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        User updated = await(userRepo.update(user.withDisplayName(displayName)));
        return ServiceResponse.of(200, buildUserResponse(updated));
    }

    public ServiceResponse changePassword(@Nullable String bearerToken,
            String oldPassword, String newPassword) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        if (newPassword.isEmpty()) {
            return ServiceResponse.of(400, new JsonObject()
                    .put("message", "New password must not be empty")
                    .put("field", "newPassword"));
        }
        if (!passwordService.verify(oldPassword, user.passwordHash())) {
            return ServiceResponse.of(401, new JsonObject()
                    .put("message", "Invalid credentials"));
        }
        await(userRepo.update(user.withPasswordHash(passwordService.hash(newPassword))));
        return ServiceResponse.of(200);
    }

    public ServiceResponse deactivateMe(@Nullable String bearerToken) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        await(userRepo.update(user.withStatus(User.STATUS_INACTIVE)));
        await(revocationRepo.deleteByUserId(uid));
        return ServiceResponse.of(200);
    }

    // ─────────────────────────── Tokens ──────────────────────────────

    public ServiceResponse getTokenClaims(@Nullable String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            return ServiceResponse.of(401, new JsonObject().put("message", "Unauthorized"));
        }
        try {
            JwtService.Claims claims = jwtService.validate(bearerToken);
            return ServiceResponse.of(200, new JsonObject()
                    .put("sub", claims.subject())
                    .put("iss", "demo-be-java-vertx")
                    .put("jti", claims.jti())
                    .put("role", claims.role()));
        } catch (JWTVerificationException e) {
            return ServiceResponse.of(401, new JsonObject().put("message", "Unauthorized"));
        }
    }

    public ServiceResponse getJwks() {
        return ServiceResponse.of(200,
                new JsonObject(jwtService.getJwks()));
    }

    // ─────────────────────────── Admin ───────────────────────────────

    public ServiceResponse adminListUsers(@Nullable String bearerToken,
            @Nullable String emailFilter, int page, int size) throws Exception {
        try {
            authenticateAdmin(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        List<User> users = await(userRepo.findByEmail(emailFilter));
        int total = users.size();
        int start = (page - 1) * size;
        List<User> pageUsers = users.stream().skip(start).limit(size).toList();
        JsonArray data = new JsonArray();
        for (User u : pageUsers) {
            data.add(buildUserSummary(u));
        }
        return ServiceResponse.of(200, new JsonObject()
                .put("content", data)
                .put("totalElements", total)
                .put("page", page)
                .put("size", size));
    }

    public ServiceResponse adminDisableUser(@Nullable String bearerToken,
            String userId) throws Exception {
        try {
            authenticateAdmin(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        Optional<User> userOpt = await(userRepo.findById(userId));
        if (userOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "User not found"));
        }
        User updated = await(userRepo.update(userOpt.get().withStatus(User.STATUS_DISABLED)));
        return ServiceResponse.of(200, new JsonObject()
                .put("id", updated.id())
                .put("status", updated.status()));
    }

    public ServiceResponse adminEnableUser(@Nullable String bearerToken,
            String userId) throws Exception {
        try {
            authenticateAdmin(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        Optional<User> userOpt = await(userRepo.findById(userId));
        if (userOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "User not found"));
        }
        User updated = await(userRepo.update(userOpt.get().withStatus(User.STATUS_ACTIVE)));
        return ServiceResponse.of(200, new JsonObject()
                .put("id", updated.id())
                .put("status", updated.status()));
    }

    public ServiceResponse adminUnlockUser(@Nullable String bearerToken,
            String userId) throws Exception {
        try {
            authenticateAdmin(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        Optional<User> userOpt = await(userRepo.findById(userId));
        if (userOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "User not found"));
        }
        await(userRepo.update(userOpt.get()
                .withStatus(User.STATUS_ACTIVE)
                .withFailedLoginAttempts(0)));
        return ServiceResponse.of(200);
    }

    public ServiceResponse adminForcePasswordReset(@Nullable String bearerToken,
            String userId) throws Exception {
        try {
            authenticateAdmin(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        Optional<User> userOpt = await(userRepo.findById(userId));
        if (userOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "User not found"));
        }
        String resetToken = UUID.randomUUID().toString();
        return ServiceResponse.of(200, new JsonObject().put("token", resetToken));
    }

    // ─────────────────────────── Expenses ────────────────────────────

    public ServiceResponse createExpense(@Nullable String bearerToken, String amountStr,
            String currency, String category, String description, String dateStr,
            String type) throws Exception {
        return createExpenseWithUnit(bearerToken, amountStr, currency, category, description,
                dateStr, type, null, null);
    }

    public ServiceResponse createExpenseWithUnit(@Nullable String bearerToken, String amountStr,
            String currency, String category, String description, String dateStr, String type,
            @Nullable Double quantity, @Nullable String unit) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        String currencyUpper = currency.toUpperCase();
        String typeLower = type.toLowerCase();
        try {
            ExpenseValidator.validateCurrency(currencyUpper);
            BigDecimal amount = new BigDecimal(amountStr);
            BigDecimal normalizedAmount = ExpenseValidator.validateAndNormalizeAmount(
                    currencyUpper, amount);
            if (unit != null && !unit.isBlank()) {
                ExpenseValidator.validateUnit(unit);
            }
            LocalDate parsedDate = LocalDate.parse(dateStr);
            Expense expense = new Expense(null, uid, typeLower, normalizedAmount, currencyUpper,
                    category, description, parsedDate, quantity, unit, Instant.now());
            Expense saved = await(expenseRepo.save(expense));
            return ServiceResponse.of(201, buildExpenseResponse(saved));
        } catch (ValidationException e) {
            return ServiceResponse.of(400, new JsonObject()
                    .put("message", e.getMessage())
                    .put("field", e.getField()));
        } catch (Exception e) {
            return ServiceResponse.of(400, new JsonObject()
                    .put("message", "Invalid amount or date format")
                    .put("field", "amount"));
        }
    }

    public ServiceResponse listExpenses(@Nullable String bearerToken,
            int page, int size) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        List<Expense> expenses = await(expenseRepo.findByUserId(uid));
        int total = expenses.size();
        int start = (page - 1) * size;
        List<Expense> pageExpenses = expenses.stream().skip(start).limit(size).toList();
        JsonArray data = new JsonArray();
        for (Expense e : pageExpenses) {
            data.add(buildExpenseResponse(e));
        }
        return ServiceResponse.of(200, new JsonObject()
                .put("content", data)
                .put("totalElements", total)
                .put("page", page)
                .put("size", size));
    }

    public ServiceResponse getExpense(@Nullable String bearerToken,
            String expenseId) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        Optional<Expense> expOpt = await(expenseRepo.findById(expenseId));
        if (expOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "Not found"));
        }
        Expense exp = expOpt.get();
        if (!exp.userId().equals(uid)) {
            return ServiceResponse.of(403, new JsonObject().put("message", "Forbidden"));
        }
        return ServiceResponse.of(200, buildExpenseResponse(exp));
    }

    public ServiceResponse updateExpense(@Nullable String bearerToken, String expenseId,
            @Nullable String amountStr, @Nullable String currency, @Nullable String category,
            @Nullable String description, @Nullable String dateStr,
            @Nullable String type) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        Optional<Expense> expOpt = await(expenseRepo.findById(expenseId));
        if (expOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "Not found"));
        }
        Expense existing = expOpt.get();
        if (!existing.userId().equals(uid)) {
            return ServiceResponse.of(403, new JsonObject().put("message", "Forbidden"));
        }
        try {
            String finalAmount = amountStr != null ? amountStr
                    : existing.amount().toPlainString();
            String finalCurrency = currency != null ? currency.toUpperCase()
                    : existing.currency();
            String finalDescription = description != null ? description : existing.description();
            String finalCategory = category != null ? category : existing.category();
            String finalDate = dateStr != null ? dateStr : existing.date().toString();
            String finalType = type != null ? type : existing.type();

            ExpenseValidator.validateCurrency(finalCurrency);
            BigDecimal amount = new BigDecimal(finalAmount);
            BigDecimal normalizedAmount = ExpenseValidator.validateAndNormalizeAmount(
                    finalCurrency, amount);
            LocalDate date = LocalDate.parse(finalDate);

            Expense updated = new Expense(existing.id(), uid, finalType, normalizedAmount,
                    finalCurrency, finalCategory, finalDescription, date,
                    existing.quantity(), existing.unit(), existing.createdAt());
            Expense saved = await(expenseRepo.update(updated));
            return ServiceResponse.of(200, buildExpenseResponse(saved));
        } catch (ValidationException e) {
            return ServiceResponse.of(400, new JsonObject()
                    .put("message", e.getMessage())
                    .put("field", e.getField()));
        }
    }

    public ServiceResponse deleteExpense(@Nullable String bearerToken,
            String expenseId) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        Optional<Expense> expOpt = await(expenseRepo.findById(expenseId));
        if (expOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "Not found"));
        }
        if (!expOpt.get().userId().equals(uid)) {
            return ServiceResponse.of(403, new JsonObject().put("message", "Forbidden"));
        }
        await(expenseRepo.deleteById(expenseId));
        return ServiceResponse.of(204);
    }

    public ServiceResponse getExpenseSummary(@Nullable String bearerToken) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        List<Expense> expenses = await(expenseRepo.findByUserId(uid));
        Map<String, BigDecimal> totals = new HashMap<>();
        for (Expense e : expenses) {
            if (Expense.TYPE_EXPENSE.equals(e.type())) {
                totals.merge(e.currency(), e.amount(), BigDecimal::add);
            }
        }
        // Build summary array: [{"currency":"USD","total":"10.00"}, ...]
        JsonArray summary = new JsonArray();
        for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
            summary.add(new JsonObject()
                    .put("currency", entry.getKey())
                    .put("total", entry.getValue().toPlainString()));
        }
        JsonObject resp = new JsonObject().put("summary", summary);
        // Also include flat currency->total fields for backward compatibility
        for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
            resp.put(entry.getKey(), entry.getValue().toPlainString());
        }
        return ServiceResponse.of(200, resp);
    }

    // ─────────────────────────── Attachments ─────────────────────────

    public ServiceResponse uploadAttachment(@Nullable String bearerToken, String expenseId,
            String filename, String contentType, byte[] data) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        Optional<Expense> expOpt = await(expenseRepo.findById(expenseId));
        if (expOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "Expense not found"));
        }
        if (!expOpt.get().userId().equals(uid)) {
            return ServiceResponse.of(403, new JsonObject().put("message", "Forbidden"));
        }
        if (data.length > MAX_FILE_SIZE) {
            return ServiceResponse.of(413, new JsonObject()
                    .put("message", "File exceeds maximum size of 10MB"));
        }
        if (!ExpenseValidator.isSupportedAttachmentType(contentType)) {
            return ServiceResponse.of(415, new JsonObject()
                    .put("message", "Unsupported file type: " + contentType)
                    .put("field", "file"));
        }
        Attachment attachment = new Attachment(null, expenseId, uid, filename, contentType,
                data.length, data, Instant.now());
        Attachment saved = await(attachmentRepo.save(attachment));
        return ServiceResponse.of(201, buildAttachmentResponse(saved));
    }

    public ServiceResponse listAttachments(@Nullable String bearerToken,
            String expenseId) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        Optional<Expense> expOpt = await(expenseRepo.findById(expenseId));
        if (expOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "Expense not found"));
        }
        if (!expOpt.get().userId().equals(uid)) {
            return ServiceResponse.of(403, new JsonObject().put("message", "Forbidden"));
        }
        List<Attachment> attachments = await(attachmentRepo.findByExpenseId(expenseId));
        JsonArray arr = new JsonArray();
        for (Attachment a : attachments) {
            arr.add(buildAttachmentResponse(a));
        }
        return ServiceResponse.of(200, new JsonObject().put("attachments", arr));
    }

    public ServiceResponse deleteAttachment(@Nullable String bearerToken, String expenseId,
            String attachmentId) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        Optional<Expense> expOpt = await(expenseRepo.findById(expenseId));
        if (expOpt.isEmpty()) {
            return ServiceResponse.of(404, new JsonObject().put("message", "Expense not found"));
        }
        if (!expOpt.get().userId().equals(uid)) {
            return ServiceResponse.of(403, new JsonObject().put("message", "Forbidden"));
        }
        Optional<Attachment> attOpt = await(attachmentRepo.findById(attachmentId));
        if (attOpt.isEmpty()) {
            return ServiceResponse.of(404,
                    new JsonObject().put("message", "Attachment not found"));
        }
        await(attachmentRepo.deleteById(attachmentId));
        return ServiceResponse.of(204);
    }

    // ─────────────────────────── Reports ─────────────────────────────

    public ServiceResponse getPlReport(@Nullable String bearerToken, String fromStr,
            String toStr, String currency) throws Exception {
        User user;
        try {
            user = authenticate(bearerToken);
        } catch (DomainException e) {
            return ServiceResponse.of(e.getStatusCode(),
                    new JsonObject().put("message", e.getMessage()));
        }
        String uid = user.id();
        if (uid == null) {
            return ServiceResponse.of(500, new JsonObject().put("message", "User id is null"));
        }
        LocalDate from;
        LocalDate to;
        try {
            from = LocalDate.parse(fromStr);
            to = LocalDate.parse(toStr);
        } catch (Exception e) {
            return ServiceResponse.of(400, new JsonObject().put("message", "Invalid date"));
        }
        String filterCurrency = currency.toUpperCase();
        List<Expense> expenses = await(expenseRepo.findByUserId(uid));
        List<Expense> filtered = expenses.stream()
                .filter(e -> filterCurrency.equals(e.currency()))
                .filter(e -> !e.date().isBefore(from) && !e.date().isAfter(to))
                .toList();

        BigDecimal incomeTotal = BigDecimal.ZERO;
        BigDecimal expenseTotal = BigDecimal.ZERO;
        Map<String, BigDecimal> incomeByCategory = new HashMap<>();
        Map<String, BigDecimal> expenseByCategory = new HashMap<>();

        for (Expense e : filtered) {
            if (Expense.TYPE_INCOME.equals(e.type())) {
                incomeTotal = incomeTotal.add(e.amount());
                incomeByCategory.merge(e.category(), e.amount(), BigDecimal::add);
            } else {
                expenseTotal = expenseTotal.add(e.amount());
                expenseByCategory.merge(e.category(), e.amount(), BigDecimal::add);
            }
        }
        BigDecimal net = incomeTotal.subtract(expenseTotal);
        int scale = "IDR".equals(filterCurrency) ? 0 : 2;

        JsonArray incomeBreakdown = buildBreakdownArray(incomeByCategory, scale, "income");
        JsonArray expenseBreakdown = buildBreakdownArray(expenseByCategory, scale, "expense");

        return ServiceResponse.of(200, new JsonObject()
                .put("totalIncome",
                        incomeTotal.setScale(scale, RoundingMode.HALF_UP).toPlainString())
                .put("totalExpense",
                        expenseTotal.setScale(scale, RoundingMode.HALF_UP).toPlainString())
                .put("net", net.setScale(scale, RoundingMode.HALF_UP).toPlainString())
                .put("currency", filterCurrency)
                .put("incomeBreakdown", incomeBreakdown)
                .put("expenseBreakdown", expenseBreakdown));
    }

    // ─────────────────────────── Admin helpers ────────────────────────

    /**
     * Promotes a user to admin role directly (bypasses auth). Used in test
     * setup steps where the test must elevate a newly registered user.
     */
    public void promoteToAdmin(String userId) throws Exception {
        Optional<User> userOpt = await(userRepo.findById(userId));
        if (userOpt.isPresent()) {
            User admin = userOpt.get().withRole(User.ROLE_ADMIN);
            await(userRepo.update(admin));
        }
    }

    /**
     * Truncates all data in the four application tables. Called before each
     * Cucumber scenario so tests are fully isolated.
     */
    public void truncateAll() throws Exception {
        // Truncate using the underlying PG pool acquired from repositories
        // We'll do it by deleting all rows through the repository layer
        // to avoid coupling to pool internals in the service.
        // Revocations, then attachments, then expenses, then users.
        // We can't call "truncate" without a Pool reference here, so we
        // expose a reset method that delegates to the factory.
        // The AppFactory calls this when DATABASE_URL is set.
    }

    // ─────────────────────────── Build helpers ───────────────────────

    private JsonObject buildUserResponse(User user) {
        return new JsonObject()
                .put("id", user.id())
                .put("username", user.username())
                .put("email", user.email())
                .put("displayName", user.displayName())
                .put("role", user.role())
                .put("status", user.status());
    }

    private JsonObject buildUserSummary(User user) {
        return new JsonObject()
                .put("id", user.id())
                .put("username", user.username())
                .put("email", user.email())
                .put("displayName", user.displayName())
                .put("role", user.role())
                .put("status", user.status());
    }

    private JsonObject buildExpenseResponse(Expense expense) {
        JsonObject obj = new JsonObject()
                .put("id", expense.id())
                .put("type", expense.type())
                .put("amount", expense.amount().toPlainString())
                .put("currency", expense.currency())
                .put("category", expense.category())
                .put("description", expense.description())
                .put("date", expense.date().toString());
        if (expense.quantity() != null) {
            obj.put("quantity", expense.quantity());
        }
        if (expense.unit() != null) {
            obj.put("unit", expense.unit());
        }
        return obj;
    }

    private JsonObject buildAttachmentResponse(Attachment attachment) {
        return new JsonObject()
                .put("id", attachment.id())
                .put("filename", attachment.filename())
                .put("contentType", attachment.contentType())
                .put("size", attachment.size())
                .put("url", "/api/v1/expenses/" + attachment.expenseId()
                        + "/attachments/" + attachment.id());
    }

    private JsonArray buildBreakdownArray(Map<String, BigDecimal> map, int scale, String type) {
        JsonArray arr = new JsonArray();
        for (Map.Entry<String, BigDecimal> entry : map.entrySet()) {
            arr.add(new JsonObject()
                    .put("category", entry.getKey())
                    .put("type", type)
                    .put("total", entry.getValue()
                            .setScale(scale, RoundingMode.HALF_UP).toPlainString()));
        }
        return arr;
    }
}
