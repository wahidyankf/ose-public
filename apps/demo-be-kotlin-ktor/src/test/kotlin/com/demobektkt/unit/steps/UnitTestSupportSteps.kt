package com.demobektkt.unit.steps

import com.demobektkt.domain.Role
import com.demobektkt.infrastructure.repositories.CreateUserRequest
import io.cucumber.datatable.DataTable as CucumberDataTable
import io.cucumber.java.en.And
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

class UnitTestSupportSteps {

    @Given("the test API is enabled via ENABLE_TEST_API environment variable")
    fun theTestApiIsEnabledViaEnableTestApiEnvVar() {
        UnitTestWorld.testApiEnabled = true
    }

    @Given("the test API is disabled")
    fun theTestApiIsDisabled() {
        UnitTestWorld.testApiEnabled = false
    }

    @Given("users and expenses exist in the database")
    fun usersAndExpensesExistInTheDatabase() {
        runBlocking {
            val user =
                UnitTestWorld.userRepo.create(
                    CreateUserRequest(
                        username = "testuser",
                        email = "testuser@example.com",
                        displayName = "Test User",
                        passwordHash = UnitTestWorld.passwordService.hash("Str0ng#Pass1"),
                        role = Role.USER,
                    )
                )
            UnitTestWorld.userIds["testuser"] = user.id.toString()
        }
    }

    @Given("a user {string} exists")
    fun aUserExists(username: String) {
        runBlocking {
            val existing = UnitTestWorld.userRepo.findByUsername(username)
            if (existing == null) {
                val user =
                    UnitTestWorld.userRepo.create(
                        CreateUserRequest(
                            username = username,
                            email = "$username@example.com",
                            displayName = username,
                            passwordHash = UnitTestWorld.passwordService.hash("Str0ng#Pass1"),
                            role = Role.USER,
                        )
                    )
                UnitTestWorld.userIds[username] = user.id.toString()
            } else {
                UnitTestWorld.userIds[username] = existing.id.toString()
            }
        }
    }

    @When("a POST request is sent to {string}")
    fun aPostRequestIsSentTo(path: String) {
        val (status, body) =
            when {
                path.endsWith("/test/reset-db") -> UnitServiceDispatcher.testResetDb()
                else ->
                    Pair(404, """{"message":"Not found"}""")
            }
        UnitTestWorld.lastResponseStatus = status
        UnitTestWorld.lastResponseBody = body
    }

    @When("a POST request is sent to {string} with body:")
    fun aPostRequestIsSentToWithBody(path: String, dataTable: CucumberDataTable) {
        val params = dataTable.asMap(String::class.java, String::class.java)
        val (status, body) =
            when {
                path.endsWith("/test/promote-admin") -> {
                    val username = params["username"] ?: error("Missing username in body")
                    UnitServiceDispatcher.testPromoteAdmin(username)
                }
                else ->
                    Pair(404, """{"message":"Not found"}""")
            }
        UnitTestWorld.lastResponseStatus = status
        UnitTestWorld.lastResponseBody = body
    }

    @Then("the response status should be {int}")
    fun theResponseStatusShouldBe(expectedStatus: Int) {
        assertEquals(
            expectedStatus,
            UnitTestWorld.lastResponseStatus,
            "Expected status $expectedStatus but got ${UnitTestWorld.lastResponseStatus}. " +
                "Body: ${UnitTestWorld.lastResponseBody}",
        )
    }

    @And("all user accounts should be deleted")
    fun allUserAccountsShouldBeDeleted() {
        runBlocking {
            val result = UnitTestWorld.userRepo.findAll(1, 1000, null)
            assertEquals(
                0L,
                result.total,
                "Expected all user accounts to be deleted but found ${result.total}",
            )
        }
    }

    @And("all expenses should be deleted")
    fun allExpensesShouldBeDeleted() {
        assertTrue(
            UnitTestWorld.expenseIds.isEmpty(),
            "Expected all expenses to be deleted",
        )
    }

    @And("all attachments should be deleted")
    fun allAttachmentsShouldBeDeleted() {
        assertTrue(
            UnitTestWorld.attachmentIds.isEmpty(),
            "Expected all attachments to be deleted",
        )
    }

    @And("user {string} should have the {string} role")
    fun userShouldHaveTheRole(username: String, expectedRole: String) {
        runBlocking {
            val user =
                UnitTestWorld.userRepo.findByUsername(username)
                    ?: error("User '$username' not found")
            assertEquals(
                expectedRole,
                user.role.name,
                "Expected user '$username' to have role '$expectedRole' but got '${user.role.name}'",
            )
        }
    }
}
