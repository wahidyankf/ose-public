package domain_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func TestUnitValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{"valid email", "alice@example.com", false},
		{"valid email with plus", "alice+tag@example.com", false},
		{"missing at", "notanemail", true},
		{"missing domain", "alice@", true},
		{"missing local", "@example.com", true},
		{"empty", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateEmail(tt.email)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateEmail(%q) error = %v, wantErr %v", tt.email, err, tt.wantErr)
			}
		})
	}
}

func TestUnitValidateUsername(t *testing.T) {
	tests := []struct {
		name     string
		username string
		wantErr  bool
	}{
		{"valid", "alice", false},
		{"with underscore", "alice_123", false},
		{"with hyphen", "alice-bob", false},
		{"too short", "ab", true},
		{"with space", "alice bob", true},
		{"with special chars", "alice@bob", true},
		{"empty", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateUsername(tt.username)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateUsername(%q) error = %v, wantErr %v", tt.username, err, tt.wantErr)
			}
		})
	}
}

func TestUnitValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"valid strong password", "Str0ng#Pass1", false},
		{"valid with special char", "ValidPass#123", false},
		{"empty password", "", true},
		{"too short", "Short1!Ab", true},
		{"no uppercase", "str0ng#pass1", true},
		{"no special char", "AllUpperCase1234", true},
		{"exactly 12 chars with all requirements", "Password123!A", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidatePasswordStrength(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePasswordStrength(%q) error = %v, wantErr %v", tt.password, err, tt.wantErr)
			}
		})
	}
}

func TestUnitDomainErrorCodes(t *testing.T) {
	tests := []struct {
		name    string
		err     *domain.DomainError
		wantMsg string
	}{
		{"validation", domain.NewValidationError("bad input", "field1"), "bad input"},
		{"not found", domain.NewNotFoundError("not found"), "not found"},
		{"forbidden", domain.NewForbiddenError("forbidden"), "forbidden"},
		{"conflict", domain.NewConflictError("conflict"), "conflict"},
		{"unauthorized", domain.NewUnauthorizedError("unauthorized"), "unauthorized"},
		{"file too large", domain.NewFileTooLargeError("too big"), "too big"},
		{"unsupported media", domain.NewUnsupportedMediaTypeError("bad type"), "bad type"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err.Error() != tt.wantMsg {
				t.Errorf("Error() = %q, want %q", tt.err.Error(), tt.wantMsg)
			}
		})
	}
}
