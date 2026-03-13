package com.organiclever.be.unit.steps;

import com.organiclever.be.admin.controller.AdminController;
import com.organiclever.be.admin.dto.AdminPasswordResetResponse;
import com.organiclever.be.admin.dto.AdminUserListResponse;
import com.organiclever.be.admin.dto.AdminUserResponse;
import com.organiclever.be.admin.dto.DisableUserRequest;
import com.organiclever.be.auth.dto.RegisterRequest;
import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.auth.service.UsernameAlreadyExistsException;
import com.organiclever.be.auth.service.AuthService;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for admin feature scenarios (list users, disable, enable, unlock,
 * force password reset).
 */
@Scope("cucumber-glue")
public class UnitAdminSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminController adminController;

    @Given("users {string}, {string}, and {string} are registered")
    public void usersAreRegistered(
            final String user1, final String user2, final String user3) {
        registerUser(user1);
        registerUser(user2);
        registerUser(user3);
        userRepository.findByUsername("alice")
                .ifPresent(u -> stateStore.setAliceId(u.getId()));
    }

    @When("^the admin sends GET /api/v1/admin/users$")
    public void theAdminSendsGetAdminUsers() {
        ResponseEntity<AdminUserListResponse> resp = adminController.listUsers(null, 0, 20);
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    @When("^the admin sends GET /api/v1/admin/users\\?email=alice@example\\.com$")
    public void theAdminSendsGetAdminUsersSearchByEmail() {
        ResponseEntity<AdminUserListResponse> resp =
                adminController.listUsers("alice@example.com", 0, 20);
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    @Then("the response body should contain at least one user with {string} equal to {string}")
    public void theResponseBodyShouldContainUserWithFieldEqual(
            final String field, final String value) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isInstanceOf(AdminUserListResponse.class);
        AdminUserListResponse resp = (AdminUserListResponse) body;
        assertThat(resp.data()).isNotEmpty();
        boolean found = resp.data().stream().anyMatch(user -> {
            Object fieldValue = switch (field) {
                case "email" -> user.email();
                case "username" -> user.username();
                case "status" -> user.status();
                default -> null;
            };
            return value.equals(fieldValue);
        });
        assertThat(found).isTrue();
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/disable with body \\{ \"reason\": \"Policy violation\" \\}$")
    public void theAdminDisablesAlice() {
        UUID aliceId = stateStore.getAliceId();
        if (aliceId == null) {
            stateStore.setStatusCode(400);
            return;
        }
        try {
            ResponseEntity<AdminUserResponse> resp = adminController.disableUser(
                    aliceId, new DisableUserRequest("Policy violation"));
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (RuntimeException e) {
            stateStore.setStatusCode(404);
            stateStore.setLastException(e);
        }
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/enable$")
    public void theAdminEnablesAlice() {
        UUID aliceId = stateStore.getAliceId();
        if (aliceId == null) {
            stateStore.setStatusCode(400);
            return;
        }
        try {
            ResponseEntity<AdminUserResponse> resp = adminController.enableUser(aliceId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (RuntimeException e) {
            stateStore.setStatusCode(404);
            stateStore.setLastException(e);
        }
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/force-password-reset$")
    public void theAdminForcesPasswordReset() {
        UUID aliceId = stateStore.getAliceId();
        if (aliceId == null) {
            stateStore.setStatusCode(400);
            return;
        }
        try {
            ResponseEntity<AdminPasswordResetResponse> resp =
                    adminController.forcePasswordReset(aliceId);
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

    private void registerUser(final String username) {
        if (userRepository.findByUsername(username).isEmpty()) {
            String password = "alice".equals(username) ? "Str0ng#Pass1" : "Str0ng#Pass1234";
            String email = username + "@example.com";
            try {
                authService.register(new RegisterRequest(username, email, password));
            } catch (UsernameAlreadyExistsException ignored) {
                // Already registered
            }
        }
        if ("alice".equals(username)) {
            userRepository.findByUsername(username)
                    .ifPresent(u -> stateStore.setAliceId(u.getId()));
        }
    }
}
