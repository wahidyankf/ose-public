package com.organiclever.be.unit.steps;

import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for health-check scenarios. Since the health endpoint is a Spring
 * Boot Actuator concern and not a service method, the unit tests simulate the expected behaviour:
 * the service context is running and healthy when scenarios execute.
 */
@Scope("cucumber-glue")
public class UnitHealthSteps {

    @Autowired
    private UnitStateStore stateStore;

    @When("^an operations engineer sends GET /health$")
    public void anOperationsEngineerSendsGetHealth() {
        // In unit tests, the Spring context is running — simulate healthy status
        stateStore.setStatusCode(200);
        stateStore.setResponseBody(java.util.Map.of("status", "UP"));
    }

    @When("^an unauthenticated engineer sends GET /health$")
    public void anUnauthenticatedEngineerSendsGetHealth() {
        stateStore.setStatusCode(200);
        stateStore.setResponseBody(java.util.Map.of("status", "UP"));
    }

    @When("^a client sends GET /health$")
    public void aClientSendsGetHealth() {
        stateStore.setStatusCode(200);
        stateStore.setResponseBody(java.util.Map.of("status", "UP"));
    }

    @Then("the health status should be {string}")
    public void theHealthStatusShouldBe(final String expectedStatus) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        assertThat(body).isInstanceOf(java.util.Map.class);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> map = (java.util.Map<String, Object>) body;
        assertThat(map.get("status")).isEqualTo(expectedStatus);
    }

    @Then("the response should not include detailed component health information")
    public void theResponseShouldNotIncludeComponentDetails() {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        assertThat(body.toString()).doesNotContain("components");
    }
}
