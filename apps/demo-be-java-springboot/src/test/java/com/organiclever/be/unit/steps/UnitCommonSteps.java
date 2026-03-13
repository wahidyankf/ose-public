package com.organiclever.be.unit.steps;

import com.organiclever.be.auth.dto.RegisterRequest;
import com.organiclever.be.auth.dto.RegisterResponse;
import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.auth.service.AuthService;
import com.organiclever.be.auth.service.UsernameAlreadyExistsException;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Shared unit-test step definitions. Provides lifecycle hooks and common Given/Then steps that
 * apply across all feature files, mirroring the role of CommonSteps in the integration tests.
 */
@Scope("cucumber-glue")
public class UnitCommonSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private UnitInMemoryDataStore dataStore;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Before
    public void beginScenario() {
        stateStore.clear();
        dataStore.reset();
    }

    @After
    public void cleanupScenario() {
        dataStore.reset();
    }

    @Given("the OrganicLever API is running")
    public void theOrganicLeverApiIsRunning() {
        // No-op: services are always ready when scenarios execute.
    }

    @Given("the API is running")
    public void theApiIsRunning() {
        // No-op: services are always ready when scenarios execute.
    }

    @Then("the response status code should be {int}")
    public void theResponseStatusCodeShouldBe(final int expectedStatusCode) {
        assertThat(stateStore.getStatusCode()).isEqualTo(expectedStatusCode);
    }

    @Given("a user {string} is registered with email {string} and password {string}")
    public void aUserIsRegisteredWithEmailAndPassword(
            final String username, final String email, final String password) {
        try {
            RegisterResponse resp = authService.register(
                    new RegisterRequest(username, email, password));
            if ("alice".equals(username)) {
                stateStore.setAliceId(resp.id());
            }
        } catch (UsernameAlreadyExistsException e) {
            // Already registered — look up alice's ID
            if ("alice".equals(username)) {
                userRepository.findByUsername(username)
                        .ifPresent(u -> stateStore.setAliceId(u.getId()));
            }
        }
    }

    @Given("a user {string} is registered with password {string}")
    public void aUserIsRegisteredWithPassword(final String username, final String password) {
        String email = username + "@example.com";
        aUserIsRegisteredWithEmailAndPassword(username, email, password);
    }

    @Given("a user {string} is already registered")
    public void userIsAlreadyRegistered(final String username) {
        aUserIsRegisteredWithPassword(username, "Str0ng#Pass1234");
    }

    @Given("a user {string} is already registered with password {string}")
    public void userIsAlreadyRegisteredWithPassword(
            final String username, final String password) {
        aUserIsRegisteredWithPassword(username, password);
    }

    @Given("a user {string} is registered and deactivated")
    public void aUserIsRegisteredAndDeactivated(final String username) {
        if (userRepository.findByUsername(username).isEmpty()) {
            aUserIsRegisteredWithPassword(username, "Str0ng#Pass1");
        }
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }

    @Given("a user {string} is registered and locked after too many failed logins")
    public void aUserIsRegisteredAndLockedAfterTooManyFailedLogins(final String username) {
        if (userRepository.findByUsername(username).isEmpty()) {
            aUserIsRegisteredWithPassword(username, "Str0ng#Pass1");
        }
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus("LOCKED");
            user.setFailedLoginAttempts(5);
            userRepository.save(user);
        });
        if ("alice".equals(username)) {
            userRepository.findByUsername(username)
                    .ifPresent(u -> stateStore.setAliceId(u.getId()));
        }
    }

    @Given("the user {string} has been deactivated")
    public void theUserHasBeenDeactivated(final String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }

    @Given("alice's account has been disabled by the admin")
    public void alicesAccountHasBeenDisabledByAdmin() {
        userRepository.findByUsername("alice").ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }

    @Given("alice's account has been disabled")
    public void alicesAccountHasBeenDisabled() {
        userRepository.findByUsername("alice").ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }

    @Given("an admin has unlocked alice's account")
    public void anAdminHasUnlockedAlicesAccount() {
        userRepository.findByUsername("alice").ifPresent(user -> {
            user.setStatus("ACTIVE");
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        });
    }
}
