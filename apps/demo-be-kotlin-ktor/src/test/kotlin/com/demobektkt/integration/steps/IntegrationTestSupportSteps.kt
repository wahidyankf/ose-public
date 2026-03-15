package com.demobektkt.integration.steps

import com.demobektkt.domain.Role
import com.demobektkt.infrastructure.repositories.CreateUserRequest
import com.demobektkt.infrastructure.tables.AttachmentsTable
import com.demobektkt.infrastructure.tables.ExpensesTable
import com.demobektkt.infrastructure.tables.UsersTable
import io.cucumber.datatable.DataTable as CucumberDataTable
import io.cucumber.java.en.And
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

class IntegrationTestSupportSteps {

    @Given("the test API is enabled via ENABLE_TEST_API environment variable")
    fun theTestApiIsEnabledViaEnableTestApiEnvVar() {
        // In integration tests the DB is accessed directly — no HTTP test API needed
    }

    @Given("users and expenses exist in the database")
    fun usersAndExpensesExistInTheDatabase() {
        runBlocking {
            val user =
                TestWorld.userRepo.create(
                    CreateUserRequest(
                        username = "testuser",
                        email = "testuser@example.com",
                        displayName = "Test User",
                        passwordHash = TestWorld.passwordService.hash("Str0ng#Pass1"),
                        role = Role.USER,
                    )
                )
            TestWorld.userIds["testuser"] = user.id.toString()
        }
    }

    @Given("a user {string} exists")
    fun aUserExists(username: String) {
        runBlocking {
            val existing = TestWorld.userRepo.findByUsername(username)
            if (existing == null) {
                val user =
                    TestWorld.userRepo.create(
                        CreateUserRequest(
                            username = username,
                            email = "$username@example.com",
                            displayName = username,
                            passwordHash = TestWorld.passwordService.hash("Str0ng#Pass1"),
                            role = Role.USER,
                        )
                    )
                TestWorld.userIds[username] = user.id.toString()
            } else {
                TestWorld.userIds[username] = existing.id.toString()
            }
        }
    }

    @When("a POST request is sent to {string}")
    fun aPostRequestIsSentTo(path: String) {
        when {
            path.endsWith("/test/reset-db") -> {
                TestWorld.reset()
                TestWorld.lastResponseStatus = 200
                TestWorld.lastResponseBody = "{}"
            }
            else -> {
                TestWorld.lastResponseStatus = 404
                TestWorld.lastResponseBody = """{"message":"Not found"}"""
            }
        }
    }

    @When("a POST request is sent to {string} with body:")
    fun aPostRequestIsSentToWithBody(path: String, dataTable: CucumberDataTable) {
        val params = dataTable.asMap(String::class.java, String::class.java)
        when {
            path.endsWith("/test/promote-admin") -> {
                val username = params["username"] ?: error("Missing username in body")
                runBlocking {
                    val user = TestWorld.userRepo.findByUsername(username)
                    if (user == null) {
                        TestWorld.lastResponseStatus = 404
                        TestWorld.lastResponseBody = """{"message":"Not found: user"}"""
                    } else {
                        transaction {
                            UsersTable.update({ UsersTable.username eq username }) {
                                it[role] = Role.ADMIN
                            }
                        }
                        TestWorld.lastResponseStatus = 200
                        TestWorld.lastResponseBody =
                            """{"id":"${user.id}","username":"$username","role":"ADMIN"}"""
                    }
                }
            }
            else -> {
                TestWorld.lastResponseStatus = 404
                TestWorld.lastResponseBody = """{"message":"Not found"}"""
            }
        }
    }

    @Then("the response status should be {int}")
    fun theResponseStatusShouldBe(expectedStatus: Int) {
        assertEquals(
            expectedStatus,
            TestWorld.lastResponseStatus,
            "Expected status $expectedStatus but got ${TestWorld.lastResponseStatus}. " +
                "Body: ${TestWorld.lastResponseBody}",
        )
    }

    @And("all user accounts should be deleted")
    fun allUserAccountsShouldBeDeleted() {
        runBlocking {
            val result = TestWorld.userRepo.findAll(1, 1000, null)
            assertEquals(
                0L,
                result.total,
                "Expected all user accounts to be deleted but found ${result.total}",
            )
        }
    }

    @And("all expenses should be deleted")
    fun allExpensesShouldBeDeleted() {
        val count = transaction { ExpensesTable.selectAll().count() }
        assertEquals(0L, count, "Expected all expenses to be deleted but found $count")
    }

    @And("all attachments should be deleted")
    fun allAttachmentsShouldBeDeleted() {
        val count = transaction { AttachmentsTable.selectAll().count() }
        assertEquals(0L, count, "Expected all attachments to be deleted but found $count")
    }

    @And("user {string} should have the {string} role")
    fun userShouldHaveTheRole(username: String, expectedRole: String) {
        runBlocking {
            val user =
                TestWorld.userRepo.findByUsername(username) ?: error("User '$username' not found")
            assertEquals(
                expectedRole.uppercase(),
                user.role.name,
                "Expected user '$username' to have role '$expectedRole' but got '${user.role.name}'",
            )
        }
    }
}
