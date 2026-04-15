package bdd_test

import (
	"fmt"

	"github.com/cucumber/godog"
	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func registerAttachmentSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice uploads file "([^"]*)" with content type "([^"]*)" to POST /api/v1/expenses/\{expenseId\}/attachments$`, ctx.aliceUploadsFileTo)
	sc.Step(`^alice uploads file "([^"]*)" with content type "([^"]*)" to POST /api/v1/expenses/\{bobExpenseId\}/attachments$`, ctx.aliceUploadsFileToBobExpense)
	sc.Step(`^alice has uploaded file "([^"]*)" with content type "([^"]*)" to the entry$`, ctx.aliceHasUploadedFileTo)
	sc.Step(`^alice sends GET /api/v1/expenses/\{expenseId\}/attachments$`, ctx.aliceSendsGetAttachments)
	sc.Step(`^alice sends GET /api/v1/expenses/\{bobExpenseId\}/attachments$`, ctx.aliceSendsGetAttachmentsForBobExpense)
	sc.Step(`^alice sends DELETE /api/v1/expenses/\{expenseId\}/attachments/\{attachmentId\}$`, ctx.aliceSendsDeleteAttachment)
	sc.Step(`^alice sends DELETE /api/v1/expenses/\{expenseId\}/attachments/\{randomAttachmentId\}$`, ctx.aliceSendsDeleteNonExistentAttachment)
	sc.Step(`^alice sends DELETE /api/v1/expenses/\{bobExpenseId\}/attachments/\{attachmentId\}$`, ctx.aliceSendsDeleteAttachmentOnBobExpense)
	sc.Step(`^alice uploads an oversized file to POST /api/v1/expenses/\{expenseId\}/attachments$`, ctx.aliceUploadsOversizedFile)
	sc.Step(`^the response body should contain 2 items in the "([^"]*)" array$`, ctx.theResponseBodyShouldContain2Items)
	sc.Step(`^the response body should contain an attachment with "([^"]*)" equal to "([^"]*)"$`, ctx.theResponseBodyShouldContainAttachmentWithField)
	sc.Step(`^bob has created an entry with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.bobHasCreatedEntry)
	sc.Step(`^alice uploads file "([^"]*)" with content type "([^"]*)" to the entry$`, ctx.aliceHasUploadedFileTo)
	sc.Step(`^the response body should contain an error message about file size$`, ctx.theResponseBodyShouldContainErrorAboutFileSize)
}

// uploadAttachment calls UploadAttachment handler directly using multipart form data.
func (ctx *scenarioCtx) uploadAttachment(expenseID, filename, contentType string, content []byte, token string) (int, map[string]interface{}) {
	path := fmt.Sprintf("/api/v1/expenses/%s/attachments", expenseID)
	params := gin.Params{{Key: "id", Value: expenseID}}
	c, w := buildMultipartGinContext(path, filename, contentType, content, token, params, ctx.JWTSvc)
	ctx.Handler.UploadAttachment(c)
	return w.Code, readResponse(w)
}

func (ctx *scenarioCtx) aliceUploadsFileTo(filename, contentType string) error {
	content := []byte("fake file content")
	status, body := ctx.uploadAttachment(ctx.ExpenseID, filename, contentType, content, ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	if status == 201 {
		if id, ok := body["id"].(string); ok {
			ctx.AttachmentID = id
		}
	}
	return nil
}

func (ctx *scenarioCtx) aliceUploadsFileToBobExpense(filename, contentType string) error {
	content := []byte("fake file content")
	status, body := ctx.uploadAttachment(ctx.BobExpenseID, filename, contentType, content, ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceHasUploadedFileTo(filename, contentType string) error {
	content := []byte("fake file content")
	status, body := ctx.uploadAttachment(ctx.ExpenseID, filename, contentType, content, ctx.AccessToken)
	if status != 201 {
		return fmt.Errorf("upload failed with %d: %v", status, body)
	}
	if id, ok := body["id"].(string); ok {
		ctx.AttachmentID = id
	}
	return nil
}

func (ctx *scenarioCtx) aliceSendsGetAttachments() error {
	params := gin.Params{{Key: "id", Value: ctx.ExpenseID}}
	c, w := buildGinContext("GET", fmt.Sprintf("/api/v1/expenses/%s/attachments", ctx.ExpenseID), nil, ctx.AccessToken, params, ctx.JWTSvc)
	ctx.Handler.ListAttachments(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceSendsGetAttachmentsForBobExpense() error {
	params := gin.Params{{Key: "id", Value: ctx.BobExpenseID}}
	c, w := buildGinContext("GET", fmt.Sprintf("/api/v1/expenses/%s/attachments", ctx.BobExpenseID), nil, ctx.AccessToken, params, ctx.JWTSvc)
	ctx.Handler.ListAttachments(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceSendsDeleteAttachment() error {
	params := gin.Params{
		{Key: "id", Value: ctx.ExpenseID},
		{Key: "aid", Value: ctx.AttachmentID},
	}
	c, w := buildGinContext("DELETE", fmt.Sprintf("/api/v1/expenses/%s/attachments/%s", ctx.ExpenseID, ctx.AttachmentID), nil, ctx.AccessToken, params, ctx.JWTSvc)
	ctx.Handler.DeleteAttachment(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceSendsDeleteNonExistentAttachment() error {
	params := gin.Params{
		{Key: "id", Value: ctx.ExpenseID},
		{Key: "aid", Value: "nonexistent-attachment-id"},
	}
	c, w := buildGinContext("DELETE", fmt.Sprintf("/api/v1/expenses/%s/attachments/nonexistent-attachment-id", ctx.ExpenseID), nil, ctx.AccessToken, params, ctx.JWTSvc)
	ctx.Handler.DeleteAttachment(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceSendsDeleteAttachmentOnBobExpense() error {
	params := gin.Params{
		{Key: "id", Value: ctx.BobExpenseID},
		{Key: "aid", Value: ctx.AttachmentID},
	}
	c, w := buildGinContext("DELETE", fmt.Sprintf("/api/v1/expenses/%s/attachments/%s", ctx.BobExpenseID, ctx.AttachmentID), nil, ctx.AccessToken, params, ctx.JWTSvc)
	ctx.Handler.DeleteAttachment(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceUploadsOversizedFile() error {
	content := make([]byte, domain.MaxAttachmentSize+1)
	status, body := ctx.uploadAttachment(ctx.ExpenseID, "large.pdf", "application/pdf", content, ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContain2Items(arrayField string) error {
	v, ok := ctx.LastBody[arrayField]
	if !ok {
		return fmt.Errorf("response does not contain %q field; body: %v", arrayField, ctx.LastBody)
	}
	arr, ok := v.([]interface{})
	if !ok {
		return fmt.Errorf("field %q is not an array", arrayField)
	}
	if len(arr) != 2 {
		return fmt.Errorf("expected 2 items in %q, got %d", arrayField, len(arr))
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainAttachmentWithField(field, value string) error {
	v, ok := ctx.LastBody["attachments"]
	if !ok {
		return fmt.Errorf("response does not contain 'attachments' field; body: %v", ctx.LastBody)
	}
	attachments, ok := v.([]interface{})
	if !ok {
		return fmt.Errorf("'attachments' is not an array")
	}
	for _, a := range attachments {
		aMap, ok := a.(map[string]interface{})
		if !ok {
			continue
		}
		if fmt.Sprintf("%v", aMap[field]) == value {
			return nil
		}
	}
	return fmt.Errorf("no attachment found with %q = %q", field, value)
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutFileSize() error {
	msg, ok := ctx.LastBody["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %v", ctx.LastBody)
	}
	if fmt.Sprintf("%v", msg) == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) bobHasCreatedEntry(amount, currency, category, description, date, expType string) error {
	// Log in as bob.
	loginStatus, loginBody := ctx.login("bob", "Str0ng#Pass2")
	if loginStatus != 200 {
		return fmt.Errorf("bob login failed: %v", loginBody)
	}
	bobToken, ok := loginBody["accessToken"].(string)
	if !ok {
		return fmt.Errorf("accessToken is not a string")
	}
	ctx.BobAccessToken = bobToken

	// Create expense as bob.
	expBody := map[string]interface{}{
		"amount": amount, "currency": currency, "category": category,
		"description": description, "date": date, "type": expType,
	}
	c, w := buildGinContext("POST", "/api/v1/expenses", expBody, bobToken, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.CreateExpense(c)
	if w.Code != 201 {
		return fmt.Errorf("bob expense creation failed with %d: %v", w.Code, readResponse(w))
	}
	body := readResponse(w)
	if id, ok := body["id"].(string); ok {
		ctx.BobExpenseID = id
	}
	return nil
}
