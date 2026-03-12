using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class AttachmentSteps(
    SharedState state,
    AuthSteps auth,
    ExpenseSteps expenseSteps
)
{
    // ─────────────────────────────────────────────────────────────
    // Given helpers
    // ─────────────────────────────────────────────────────────────

    [Given(@"^alice has uploaded file ""([^""]+)"" with content type ""([^""]+)"" to the entry$")]
    public async Task GivenAliceUploadedFile(string filename, string contentType)
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(
            Encoding.UTF8.GetBytes($"dummy content for {filename}")
        );
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        content.Add(fileContent, "file", filename);
        var response = await client.PostAsync(
            $"/api/v1/expenses/{state.LastExpenseId}/attachments",
            content
        );
        ((int)response.StatusCode).Should().Be(
            201,
            $"Failed to upload attachment: {await response.Content.ReadAsStringAsync()}"
        );
        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        if (doc.RootElement.TryGetProperty("id", out var idEl))
        {
            state.LastAttachmentId = Guid.Parse(idEl.GetString()!);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice uploads file ""([^""]+)"" with content type ""([^""]+)"" to POST /api/v1/expenses/\{expenseId\}/attachments$")]
    public async Task WhenAliceUploadsFileToExpense(string filename, string contentType)
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(
            Encoding.UTF8.GetBytes($"dummy content for {filename}")
        );
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        content.Add(fileContent, "file", filename);
        state.LastResponse = await client.PostAsync(
            $"/api/v1/expenses/{state.LastExpenseId}/attachments",
            content
        );
        if (state.LastResponse.IsSuccessStatusCode)
        {
            var responseBody = await state.LastResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("id", out var idEl))
            {
                state.LastAttachmentId = Guid.Parse(idEl.GetString()!);
            }
        }
    }

    [When(@"^alice uploads file ""([^""]+)"" with content type ""([^""]+)"" to POST /api/v1/expenses/\{bobExpenseId\}/attachments$")]
    public async Task WhenAliceUploadsFileToBobsExpense(string filename, string contentType)
    {
        expenseSteps._bobExpenseId.Should().NotBeNull("bob's expense ID should be set");
        var client = auth.AuthorizedClient();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(
            Encoding.UTF8.GetBytes($"dummy content for {filename}")
        );
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        content.Add(fileContent, "file", filename);
        state.LastResponse = await client.PostAsync(
            $"/api/v1/expenses/{expenseSteps._bobExpenseId}/attachments",
            content
        );
    }

    [When(@"^alice uploads an oversized file to POST /api/v1/expenses/\{expenseId\}/attachments$")]
    public async Task WhenAliceUploadsOversizedFile()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        var content = new MultipartFormDataContent();
        // 11 MB exceeds the 10 MB limit
        var largeData = new byte[11 * 1024 * 1024];
        Array.Fill(largeData, (byte)'x');
        var fileContent = new ByteArrayContent(largeData);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
        content.Add(fileContent, "file", "large.jpg");
        state.LastResponse = await client.PostAsync(
            $"/api/v1/expenses/{state.LastExpenseId}/attachments",
            content
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/\{expenseId\}/attachments$")]
    public async Task WhenAliceListsAttachments()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync(
            $"/api/v1/expenses/{state.LastExpenseId}/attachments"
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/\{bobExpenseId\}/attachments$")]
    public async Task WhenAliceListsBobsAttachments()
    {
        expenseSteps._bobExpenseId.Should().NotBeNull("bob's expense ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync(
            $"/api/v1/expenses/{expenseSteps._bobExpenseId}/attachments"
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{expenseId\}/attachments/\{attachmentId\}$")]
    public async Task WhenAliceDeletesAttachment()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        state.LastAttachmentId.Should().NotBeNull("attachment ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.DeleteAsync(
            $"/api/v1/expenses/{state.LastExpenseId}/attachments/{state.LastAttachmentId}"
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{bobExpenseId\}/attachments/\{attachmentId\}$")]
    public async Task WhenAliceDeletesBobsAttachment()
    {
        expenseSteps._bobExpenseId.Should().NotBeNull("bob's expense ID should be set");
        state.LastAttachmentId.Should().NotBeNull("attachment ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.DeleteAsync(
            $"/api/v1/expenses/{expenseSteps._bobExpenseId}/attachments/{state.LastAttachmentId}"
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{expenseId\}/attachments/\{randomAttachmentId\}$")]
    public async Task WhenAliceDeletesNonExistentAttachment()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        var randomId = Guid.NewGuid();
        state.LastResponse = await client.DeleteAsync(
            $"/api/v1/expenses/{state.LastExpenseId}/attachments/{randomId}"
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain (\d+) items in the ""([^""]+)"" array$")]
    public async Task ThenResponseContainsItemsInArray(int count, string arrayField)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(arrayField, out var arr)
            .Should().BeTrue($"'{arrayField}' not found in: {body}");
        arr.ValueKind.Should().Be(JsonValueKind.Array);
        arr.GetArrayLength().Should().Be(count);
    }

    [Then(@"^the response body should contain an attachment with ""filename"" equal to ""([^""]+)""$")]
    public async Task ThenResponseContainsAttachmentWithFilename(string filename)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        body.Should().Contain(filename, $"Expected attachment with filename '{filename}' in: {body}");
    }

    [Then(@"^the response body should contain an error message about file size$")]
    public async Task ThenErrorAboutFileSize()
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        // 413 status is sufficient
        body.Should().ContainAny("size", "large", "limit", "413", "exceed");
    }
}
