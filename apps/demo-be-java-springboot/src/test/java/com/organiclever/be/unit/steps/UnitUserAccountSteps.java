package com.organiclever.be.unit.steps;

import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.auth.service.AuthService;
import com.organiclever.be.auth.service.InvalidCredentialsException;
import com.organiclever.be.user.controller.UserController;
import com.organiclever.be.user.dto.ChangePasswordRequest;
import com.organiclever.be.user.dto.UpdateProfileRequest;
import com.organiclever.be.user.dto.UserProfileResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Unit-level step definitions for user account management (profile, password change, deactivation).
 */
@Scope("cucumber-glue")
public class UnitUserAccountSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserController userController;

    @When("^alice sends GET /api/v1/users/me$")
    public void aliceSendsGetUsersMe() {
        String username = resolveUsername();
        ResponseEntity<UserProfileResponse> resp = userController.getProfile(
                UnitAuthSteps.userDetails(username));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    @When("^alice sends PATCH /api/v1/users/me with body \\{ \"display_name\": \"Alice Smith\" \\}$")
    public void aliceSendsPatchUsersMeWithDisplayName() {
        String username = resolveUsername();
        ResponseEntity<UserProfileResponse> resp = userController.updateProfile(
                UnitAuthSteps.userDetails(username),
                new UpdateProfileRequest("Alice Smith"));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    @When("^alice sends POST /api/v1/users/me/password with body \\{ \"old_password\": \"Str0ng#Pass1\", \"new_password\": \"NewPass#456\" \\}$")
    public void aliceSendsPostChangePasswordSuccess() {
        performChangePassword("Str0ng#Pass1", "NewPass#456");
    }

    @When("^alice sends POST /api/v1/users/me/password with body \\{ \"old_password\": \"Wr0ngOld!\", \"new_password\": \"NewPass#456\" \\}$")
    public void aliceSendsPostChangePasswordWrongOld() {
        performChangePassword("Wr0ngOld!", "NewPass#456");
    }

    @When("^alice sends POST /api/v1/users/me/deactivate$")
    public void aliceSendsPostSelfDeactivate() {
        String username = resolveUsername();
        ResponseEntity<Void> resp = userController.deactivate(
                UnitAuthSteps.userDetails(username));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(java.util.Map.of("message", "Account deactivated"));
    }

    @Given("^alice has deactivated her own account via POST /api/v1/users/me/deactivate$")
    public void aliceHasDeactivatedHerOwnAccount() {
        userRepository.findByUsername("alice").ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }

    // ============================================================
    // Helpers
    // ============================================================

    private String resolveUsername() {
        String raw = stateStore.getCurrentUsername();
        return (raw == null) ? "alice" : raw;
    }

    private void performChangePassword(
            final String oldPassword, final String newPassword) {
        String username = resolveUsername();
        try {
            ResponseEntity<Void> resp = userController.changePassword(
                    UnitAuthSteps.userDetails(username),
                    new ChangePasswordRequest(oldPassword, newPassword));
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(java.util.Map.of("message", "Password changed"));
        } catch (InvalidCredentialsException e) {
            stateStore.setStatusCode(401);
            stateStore.setLastException(e);
        }
    }
}
