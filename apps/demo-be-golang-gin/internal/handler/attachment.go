package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	contracts "github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/generated-contracts"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

// UploadAttachment handles POST /api/v1/expenses/:id/attachments.
func (h *Handler) UploadAttachment(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	expenseID := c.Param("id")
	expense, err := h.store.GetExpenseByID(c.Request.Context(), expenseID)
	if err != nil {
		RespondError(c, err)
		return
	}
	if expense.UserID != claims.Subject {
		c.JSON(http.StatusForbidden, gin.H{"message": "access denied"})
		return
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "file is required"})
		return
	}
	contentType := fileHeader.Header.Get("Content-Type")
	if err := domain.ValidateMIMEType(contentType); err != nil {
		RespondError(c, err)
		return
	}
	if err := domain.ValidateFileSize(fileHeader.Size); err != nil {
		RespondError(c, err)
		return
	}
	attachmentID := uuid.New().String()
	attachment := &domain.Attachment{
		ID:          attachmentID,
		ExpenseID:   expenseID,
		Filename:    fileHeader.Filename,
		ContentType: contentType,
		Size:        fileHeader.Size,
		URL:         fmt.Sprintf("/files/%s/%s", expenseID, attachmentID),
		CreatedAt:   time.Now(),
	}
	if err := h.store.CreateAttachment(c.Request.Context(), attachment); err != nil {
		RespondError(c, err)
		return
	}
	// Respond with contracts.Attachment fields plus the URL (not in contract spec
	// but required by the attachments BDD feature).
	type attachmentResponse struct {
		contracts.Attachment
		URL string `json:"url"`
	}
	c.JSON(http.StatusCreated, attachmentResponse{
		Attachment: contracts.Attachment{
			Id:          attachment.ID,
			Filename:    attachment.Filename,
			ContentType: attachment.ContentType,
			Size:        int(attachment.Size),
			CreatedAt:   attachment.CreatedAt,
		},
		URL: attachment.URL,
	})
}

// ListAttachments handles GET /api/v1/expenses/:id/attachments.
func (h *Handler) ListAttachments(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	expenseID := c.Param("id")
	expense, err := h.store.GetExpenseByID(c.Request.Context(), expenseID)
	if err != nil {
		RespondError(c, err)
		return
	}
	if expense.UserID != claims.Subject {
		c.JSON(http.StatusForbidden, gin.H{"message": "access denied"})
		return
	}
	attachments, err := h.store.ListAttachments(c.Request.Context(), expenseID)
	if err != nil {
		RespondError(c, err)
		return
	}
	items := make([]contracts.Attachment, 0, len(attachments))
	for _, a := range attachments {
		items = append(items, contracts.Attachment{
			Id:          a.ID,
			Filename:    a.Filename,
			ContentType: a.ContentType,
			Size:        int(a.Size),
			CreatedAt:   a.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"attachments": items})
}

// DeleteAttachment handles DELETE /api/v1/expenses/:id/attachments/:aid.
func (h *Handler) DeleteAttachment(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	expenseID := c.Param("id")
	attachmentID := c.Param("aid")
	expense, err := h.store.GetExpenseByID(c.Request.Context(), expenseID)
	if err != nil {
		RespondError(c, err)
		return
	}
	if expense.UserID != claims.Subject {
		c.JSON(http.StatusForbidden, gin.H{"message": "access denied"})
		return
	}
	attachment, err := h.store.GetAttachmentByID(c.Request.Context(), attachmentID)
	if err != nil {
		RespondError(c, err)
		return
	}
	if attachment.ExpenseID != expenseID {
		c.JSON(http.StatusNotFound, gin.H{"message": "attachment not found"})
		return
	}
	if err := h.store.DeleteAttachment(c.Request.Context(), attachmentID); err != nil {
		RespondError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
	c.Writer.WriteHeaderNow()
}
