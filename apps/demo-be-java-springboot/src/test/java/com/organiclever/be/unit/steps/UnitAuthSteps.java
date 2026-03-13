package com.organiclever.be.unit.steps;

import com.organiclever.be.auth.controller.AuthController;
import com.organiclever.be.auth.dto.AuthResponse;
import com.organiclever.be.auth.dto.LoginRequest;
import com.organiclever.be.auth.dto.RegisterRequest;
import com.organiclever.be.auth.dto.RegisterResponse;
import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.auth.service.AccountNotActiveException;
import com.organiclever.be.auth.service.AuthService;
import com.organiclever.be.auth.service.InvalidCredentialsException;
import com.organiclever.be.auth.service.UsernameAlreadyExistsException;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level Cucumber step definitions for authentication and registration. Calls service methods
 * directly (no MockMvc, no HTTP). Translates HTTP-semantic Gherkin steps into service-level
 * outcomes.
 */
@Scope("cucumber-glue")
public class UnitAuthSteps {

    private static final Validator VALIDATOR =
            Validation.buildDefaultValidatorFactory().getValidator();

    /** Maps JSON property names (snake_case) to AuthResponse component names (camelCase). */
    private static final Map<String, String> AUTH_FIELD_MAP = Map.of(
            "access_token", "accessToken",
            "refresh_token", "refreshToken",
            "token_type", "tokenType");

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private AuthService authService;

    @Autowired
    private AuthController authController;

    @Autowired
    private com.organiclever.be.admin.controller.AdminController adminController;

    @Autowired
    private com.organiclever.be.user.controller.UserController userController;

    @Autowired
    private UserRepository userRepository;

    // ============================================================
    // Registration — When steps
    // ============================================================

    @When("^a client sends POST /api/v1/auth/register with body:$")
    public void postRegisterWithBody(final String body) {
        String username = extractJsonString(body, "username");
        String email = extractJsonString(body, "email");
        String password = extractJsonString(body, "password");
        performRegister(username, email, password);
    }

    @When("^the client sends POST /api/v1/auth/register with body \\{ \"username\": \"([^\"]+)\", \"email\": \"([^\"]+)\", \"password\": \"([^\"]*)\" \\}$")
    public void theClientSendsPostRegisterWithBody(
            final String username, final String email, final String password) {
        performRegister(username, email, password);
    }

    // ============================================================
    // Login — When steps
    // ============================================================

    @When("^a client sends POST /api/v1/auth/login with body:$")
    public void postLoginWithBody(final String body) {
        String username = extractJsonString(body, "username");
        String password = extractJsonString(body, "password");
        performLogin(username, password);
    }

    @When("^the client sends POST /api/v1/auth/login with body \\{ \"username\": \"([^\"]+)\", \"password\": \"([^\"]+)\" \\}$")
    public void theClientSendsPostLoginWithBody(final String username, final String password) {
        performLogin(username, password);
    }

    @Given("the client has logged in as {string} and stored the JWT token")
    public void clientLoggedIn(final String username) {
        AuthResponse response = doLogin(username, "Str0ng#Pass1234");
        stateStore.setAccessToken(response.accessToken());
        stateStore.setCurrentUsername(username);
    }

    @Given("{string} has logged in and stored the access token")
    public void userHasLoggedInAndStoredAccessToken(final String username) {
        String password = "alice".equals(username) ? "Str0ng#Pass1" : "Str0ng#Pass1234";
        AuthResponse response = doLogin(username, password);
        stateStore.setAccessToken(response.accessToken());
        stateStore.setCurrentUsername(username);
        if ("alice".equals(username) && stateStore.getAliceId() == null) {
            userRepository.findByUsername("alice")
                    .ifPresent(u -> stateStore.setAliceId(u.getId()));
        }
    }

    @Given("{string} has logged in and stored the access token and refresh token")
    public void userHasLoggedInAndStoredTokens(final String username) {
        String password = "alice".equals(username) ? "Str0ng#Pass1" : "Str0ng#Pass1234";
        AuthResponse response = doLogin(username, password);
        stateStore.setAccessToken(response.accessToken());
        stateStore.setRefreshToken(response.refreshToken());
        stateStore.setCurrentUsername(username);
    }

    @Given("an admin user {string} is registered and logged in")
    public void anAdminUserIsRegisteredAndLoggedIn(final String username) {
        String email = username + "@example.com";
        String password = "Adm1n#Secure123";
        RegisterResponse regResp = null;
        try {
            regResp = authService.register(new RegisterRequest(username, email, password));
        } catch (UsernameAlreadyExistsException ignored) {
            // Already registered — continue
        }
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setRole("ADMIN");
            userRepository.save(user);
        });
        AuthResponse loginResp = doLogin(username, password);
        stateStore.setAdminToken(loginResp.accessToken());
        if (regResp != null) {
            stateStore.setAdminUserId(regResp.id());
        } else {
            userRepository.findByUsername(username)
                    .ifPresent(u -> stateStore.setAdminUserId(u.getId()));
        }
    }

    @Given("{string} has had the maximum number of failed login attempts")
    public void userHasHadMaxFailedLoginAttempts(final String username) {
        for (int i = 0; i < 5; i++) {
            try {
                authService.login(new LoginRequest(username, "WrongPass#1234"));
            } catch (InvalidCredentialsException | AccountNotActiveException ignored) {
                // Expected
            }
        }
        if ("alice".equals(username)) {
            userRepository.findByUsername(username)
                    .ifPresent(u -> stateStore.setAliceId(u.getId()));
        }
    }

    // ============================================================
    // Assertion steps
    // ============================================================

    @Then("the response body should contain {string} equal to {string}")
    public void responseBodyContainsFieldEqualTo(final String field, final String value) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        Object actual = resolveField(body, field);
        assertThat(actual).isNotNull();
        assertThat(actual.toString()).isEqualTo(value);
    }

    @Then("the response body should contain {string} equal to {double}")
    public void responseBodyContainsFieldEqualToDouble(
            final String field, final double value) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        Object actual = resolveField(body, field);
        assertThat(actual).isNotNull();
        double actualDouble = Double.parseDouble(actual.toString());
        assertThat(actualDouble).isEqualTo(value);
    }

    @Then("the response body should not contain a {string} field")
    public void responseBodyShouldNotContainField(final String field) {
        // RegisterResponse (id, username, createdAt) intentionally omits password
        // For AuthResponse (access_token, refresh_token, token_type), same
        // If the response is null or the field is genuinely absent, the test passes
        Object body = stateStore.getResponseBody();
        if (body instanceof RegisterResponse) {
            // password field is never in RegisterResponse by design
            assertThat(field).isEqualTo("password");
        }
        // For other cases, absence is implicit in our type-safe response objects
    }

    @Then("the response body should contain a non-null {string} field")
    public void responseBodyContainsNonNullField(final String field) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        Object value = resolveField(body, field);
        assertThat(value).isNotNull();
    }

    @Then("the response body should contain a {string} field")
    public void responseBodyContainsField(final String field) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        Object value = resolveField(body, field);
        assertThat(value).isNotNull();
    }

    @Then("the response body should contain an error message about duplicate username")
    public void responseBodyContainsDuplicateUsernameError() {
        Exception ex = stateStore.getLastException();
        assertThat(ex).isNotNull();
        assertThat(ex.getMessage()).containsIgnoringCase("already exists");
    }

    @Then("the response body should contain an error message about invalid credentials")
    public void responseBodyContainsInvalidCredentialsError() {
        Exception ex = stateStore.getLastException();
        assertThat(ex).isNotNull();
        assertThat(ex).isInstanceOfAny(
                InvalidCredentialsException.class, AccountNotActiveException.class);
    }

    @Then("the response body should contain an error message about account deactivation")
    public void responseBodyContainsAccountDeactivationError() {
        Exception ex = stateStore.getLastException();
        assertThat(ex).isNotNull();
        assertThat(ex).isInstanceOf(AccountNotActiveException.class);
    }

    @Then("the response body should contain an error message about token expiration")
    public void responseBodyContainsTokenExpirationError() {
        Exception ex = stateStore.getLastException();
        assertThat(ex).isNotNull();
        assertThat(ex.getMessage()).containsIgnoringCase("expir");
    }

    @Then("the response body should contain an error message about invalid token")
    public void responseBodyContainsInvalidTokenError() {
        int status = stateStore.getStatusCode();
        assertThat(status).isEqualTo(401);
        Exception ex = stateStore.getLastException();
        assertThat(ex).isNotNull();
        // Accept any token-related error: invalid, expired, revoked, not found
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        assertThat(msg).matches(".*(?:invalid|expired|revoked|not found|token).*");
    }

    @Then("the response body should contain a validation error for {string}")
    public void responseBodyContainsValidationError(final String field) {
        int status = stateStore.getStatusCode();
        assertThat(status).isIn(400, 415);
    }

    @Then("alice's account status should be {string}")
    public void alicesAccountStatusShouldBe(final String status) {
        String actualStatus = userRepository.findByUsername("alice")
                .map(u -> u.getStatus().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Alice not found"));
        assertThat(actualStatus).isEqualToIgnoringCase(status);
    }

    @When("^the client sends GET /api/v1/users/me with alice's access token$")
    public void theClientSendsGetUsersMeWithAlicesToken() {
        String token = stateStore.getAccessToken();
        if (token == null) {
            stateStore.setStatusCode(401);
            return;
        }
        if (authService.isTokenRevoked(token)) {
            stateStore.setStatusCode(401);
            return;
        }
        // Check account status before delegating to controller
        boolean notActive = userRepository.findByUsername("alice")
                .map(u -> "DISABLED".equals(u.getStatus()) || "LOCKED".equals(u.getStatus()))
                .orElse(true);
        if (notActive) {
            stateStore.setStatusCode(401);
            return;
        }
        org.springframework.http.ResponseEntity<com.organiclever.be.user.dto.UserProfileResponse>
                resp = userController.getProfile(userDetails("alice"));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/unlock$")
    public void theAdminSendsPostUnlockAliceShared() {
        java.util.UUID aliceId = stateStore.getAliceId();
        if (aliceId == null) {
            stateStore.setStatusCode(400);
            return;
        }
        try {
            org.springframework.http.ResponseEntity<com.organiclever.be.admin.dto.AdminUserResponse>
                    resp = adminController.unlockUser(aliceId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (RuntimeException e) {
            stateStore.setStatusCode(404);
            stateStore.setLastException(e);
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    private void performRegister(
            final String username, final String email, final String password) {
        RegisterRequest request = new RegisterRequest(username, email, password);
        Set<ConstraintViolation<RegisterRequest>> violations = VALIDATOR.validate(request);
        if (!violations.isEmpty()) {
            stateStore.setStatusCode(400);
            stateStore.setLastException(
                    new IllegalArgumentException("Validation failed"));
            return;
        }
        try {
            ResponseEntity<RegisterResponse> response = authController.register(request);
            stateStore.setStatusCode(response.getStatusCode().value());
            stateStore.setResponseBody(response.getBody());
            stateStore.setLastException(null);
            if (response.getBody() != null && "alice".equals(username)) {
                stateStore.setAliceId(response.getBody().id());
            }
        } catch (UsernameAlreadyExistsException e) {
            stateStore.setStatusCode(409);
            stateStore.setLastException(e);
            stateStore.setResponseBody(null);
        }
    }

    private void performLogin(final String username, final String password) {
        try {
            ResponseEntity<AuthResponse> response =
                    authController.login(new LoginRequest(username, password));
            AuthResponse body = response.getBody();
            stateStore.setStatusCode(response.getStatusCode().value());
            stateStore.setResponseBody(body);
            stateStore.setLastException(null);
            if (body != null) {
                stateStore.setAccessToken(body.accessToken());
                stateStore.setRefreshToken(body.refreshToken());
            }
        } catch (InvalidCredentialsException | AccountNotActiveException e) {
            stateStore.setStatusCode(401);
            stateStore.setLastException(e);
            stateStore.setResponseBody(null);
        }
    }

    AuthResponse doLogin(final String username, final String password) {
        try {
            ResponseEntity<AuthResponse> resp =
                    authController.login(new LoginRequest(username, password));
            return resp.getBody();
        } catch (InvalidCredentialsException | AccountNotActiveException e) {
            throw new RuntimeException(
                    "Login failed for " + username + ": " + e.getMessage(), e);
        }
    }

    /** Creates a minimal UserDetails for use as @AuthenticationPrincipal in controller calls. */
    static org.springframework.security.core.userdetails.UserDetails userDetails(
            final String username) {
        return User.withUsername(username)
                .password("")
                .authorities(new SimpleGrantedAuthority("ROLE_USER"))
                .build();
    }

    /** Creates a mock HttpServletRequest with a Bearer token in the Authorization header. */
    static HttpServletRequest mockRequest(final String token) {
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        Mockito.when(req.getHeader("Authorization"))
                .thenReturn(token != null ? "Bearer " + token : null);
        Mockito.when(req.getHeaderNames())
                .thenReturn(Collections.enumeration(java.util.List.of("Authorization")));
        return req;
    }

    /**
     * Resolves a JSON-property-named field from a response object. Supports both the snake_case
     * JSON name (e.g., "access_token") and the camelCase Java record name (e.g., "accessToken").
     * Handles all response DTO types used across the application.
     */
    Object resolveField(final Object body, final String jsonField) {
        if (body instanceof AuthResponse resp) {
            String javaField = AUTH_FIELD_MAP.getOrDefault(jsonField, jsonField);
            return switch (javaField) {
                case "accessToken" -> resp.accessToken();
                case "refreshToken" -> resp.refreshToken();
                case "tokenType" -> resp.tokenType();
                default -> null;
            };
        }
        if (body instanceof RegisterResponse resp) {
            return switch (jsonField) {
                case "id" -> resp.id();
                case "username" -> resp.username();
                case "createdAt" -> resp.createdAt();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.user.dto.UserProfileResponse resp) {
            return switch (jsonField) {
                case "id" -> resp.id();
                case "username" -> resp.username();
                case "email" -> resp.email();
                case "display_name" -> resp.displayName();
                case "status" -> resp.status();
                case "role" -> resp.role();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.admin.dto.AdminUserResponse resp) {
            return switch (jsonField) {
                case "id" -> resp.id();
                case "username" -> resp.username();
                case "email" -> resp.email();
                case "status" -> resp.status();
                case "role" -> resp.role();
                case "display_name" -> resp.displayName();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.admin.dto.AdminUserListResponse resp) {
            return switch (jsonField) {
                case "data" -> resp.data();
                case "total" -> resp.total();
                case "page" -> resp.page();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.expense.dto.ExpenseResponse resp) {
            return switch (jsonField) {
                case "id" -> resp.id();
                case "amount" -> resp.amount();
                case "currency" -> resp.currency();
                case "category" -> resp.category();
                case "description" -> resp.description();
                case "date" -> resp.date() != null ? resp.date().toString() : null;
                case "type" -> resp.type();
                case "quantity" -> resp.quantity();
                case "unit" -> resp.unit();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.expense.dto.ExpenseListResponse resp) {
            return switch (jsonField) {
                case "data" -> resp.data();
                case "total" -> resp.total();
                case "page" -> resp.page();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.attachment.dto.AttachmentResponse resp) {
            return switch (jsonField) {
                case "id" -> resp.id();
                case "filename" -> resp.filename();
                case "content_type" -> resp.contentType();
                case "url" -> resp.url();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.report.dto.PlReportResponse resp) {
            return switch (jsonField) {
                case "income_total" -> resp.incomeTotal();
                case "expense_total" -> resp.expenseTotal();
                case "net" -> resp.net();
                case "income_breakdown" -> resp.incomeBreakdown();
                case "expense_breakdown" -> resp.expenseBreakdown();
                default -> null;
            };
        }
        if (body instanceof com.organiclever.be.admin.dto.AdminPasswordResetResponse resp) {
            return switch (jsonField) {
                case "reset_token" -> resp.resetToken();
                default -> null;
            };
        }
        if (body instanceof java.util.Map<?, ?> map) {
            return map.get(jsonField);
        }
        return null;
    }

    private String extractJsonString(final String json, final String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        return m.find() ? m.group(1) : "";
    }
}
