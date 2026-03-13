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
    ServiceLayer svc,
    SharedState state,
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
        var data = Encoding.UTF8.GetBytes($"dummy content for {filename}");
        var response = await svc.UploadAttachmentAsync(
            state.AccessToken,
            state.LastExpenseId!.Value,
            filename,
            contentType,
            data
        );
        ((int)response.StatusCode).Should().Be(
            201,
            $"Failed to upload attachment: {response.Body}"
        );
        using var doc = JsonDocument.Parse(response.Body);
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
        var data = Encoding.UTF8.GetBytes($"dummy content for {filename}");
        state.LastResponse = await svc.UploadAttachmentAsync(
            state.AccessToken,
            state.LastExpenseId!.Value,
            filename,
            contentType,
            data
        );
        if (state.LastResponse.IsSuccess)
        {
            using var doc = JsonDocument.Parse(state.LastResponse.Body);
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
        var data = Encoding.UTF8.GetBytes($"dummy content for {filename}");
        state.LastResponse = await svc.UploadAttachmentAsync(
            state.AccessToken,
            expenseSteps._bobExpenseId!.Value,
            filename,
            contentType,
            data
        );
    }

    [When(@"^alice uploads an oversized file to POST /api/v1/expenses/\{expenseId\}/attachments$")]
    public async Task WhenAliceUploadsOversizedFile()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        // 11 MB exceeds the 10 MB limit
        var largeData = new byte[11 * 1024 * 1024];
        Array.Fill(largeData, (byte)'x');
        state.LastResponse = await svc.UploadAttachmentAsync(
            state.AccessToken,
            state.LastExpenseId!.Value,
            "large.jpg",
            "image/jpeg",
            largeData
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/\{expenseId\}/attachments$")]
    public async Task WhenAliceListsAttachments()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        state.LastResponse = await svc.ListAttachmentsAsync(
            state.AccessToken,
            state.LastExpenseId!.Value
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/\{bobExpenseId\}/attachments$")]
    public async Task WhenAliceListsBobsAttachments()
    {
        expenseSteps._bobExpenseId.Should().NotBeNull("bob's expense ID should be set");
        state.LastResponse = await svc.ListAttachmentsAsync(
            state.AccessToken,
            expenseSteps._bobExpenseId!.Value
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{expenseId\}/attachments/\{attachmentId\}$")]
    public async Task WhenAliceDeletesAttachment()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        state.LastAttachmentId.Should().NotBeNull("attachment ID should be set");
        state.LastResponse = await svc.DeleteAttachmentAsync(
            state.AccessToken,
            state.LastExpenseId!.Value,
            state.LastAttachmentId!.Value
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{bobExpenseId\}/attachments/\{attachmentId\}$")]
    public async Task WhenAliceDeletesBobsAttachment()
    {
        expenseSteps._bobExpenseId.Should().NotBeNull("bob's expense ID should be set");
        state.LastAttachmentId.Should().NotBeNull("attachment ID should be set");
        state.LastResponse = await svc.DeleteAttachmentAsync(
            state.AccessToken,
            expenseSteps._bobExpenseId!.Value,
            state.LastAttachmentId!.Value
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{expenseId\}/attachments/\{randomAttachmentId\}$")]
    public async Task WhenAliceDeletesNonExistentAttachment()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var randomId = Guid.NewGuid();
        state.LastResponse = await svc.DeleteAttachmentAsync(
            state.AccessToken,
            state.LastExpenseId!.Value,
            randomId
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain (\d+) items in the ""([^""]+)"" array$")]
    public void ThenResponseContainsItemsInArray(int count, string arrayField)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(arrayField, out var arr)
            .Should().BeTrue($"'{arrayField}' not found in: {body}");
        arr.ValueKind.Should().Be(JsonValueKind.Array);
        arr.GetArrayLength().Should().Be(count);
    }

    [Then(@"^the response body should contain an attachment with ""filename"" equal to ""([^""]+)""$")]
    public void ThenResponseContainsAttachmentWithFilename(string filename)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        body.Should().Contain(filename, $"Expected attachment with filename '{filename}' in: {body}");
    }

    [Then(@"^the response body should contain an error message about file size$")]
    public void ThenErrorAboutFileSize()
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        // 413 status is sufficient
        body.Should().ContainAny("size", "large", "limit", "413", "exceed");
    }
}
