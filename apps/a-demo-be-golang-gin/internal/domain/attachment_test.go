package domain_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func TestUnitValidateMIMEType(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		wantErr     bool
	}{
		{"jpeg allowed", "image/jpeg", false},
		{"png allowed", "image/png", false},
		{"pdf allowed", "application/pdf", false},
		{"exe not allowed", "application/octet-stream", true},
		{"gif not allowed", "image/gif", true},
		{"text not allowed", "text/plain", true},
		{"empty not allowed", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateMIMEType(tt.contentType)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateMIMEType(%q) error = %v, wantErr %v", tt.contentType, err, tt.wantErr)
			}
		})
	}
}

func TestUnitValidateFileSize(t *testing.T) {
	tests := []struct {
		name    string
		size    int64
		wantErr bool
	}{
		{"zero size", 0, false},
		{"1 byte", 1, false},
		{"exactly 10MB", domain.MaxAttachmentSize, false},
		{"1 byte over limit", domain.MaxAttachmentSize + 1, true},
		{"20MB", 20 * 1024 * 1024, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateFileSize(tt.size)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateFileSize(%d) error = %v, wantErr %v", tt.size, err, tt.wantErr)
			}
		})
	}
}
