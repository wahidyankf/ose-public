package cmd

import (
	"bytes"
	"strings"
	"testing"
)

func TestRootCommand_Initialization(t *testing.T) {
	if rootCmd.Use != "rhino-cli" {
		t.Errorf("Expected use 'rhino-cli', got %s", rootCmd.Use)
	}

	if rootCmd.Short != "CLI tools for repository management" {
		t.Errorf("Expected short description 'CLI tools for repository management', got %s", rootCmd.Short)
	}

	if rootCmd.Version != "0.8.0" {
		t.Errorf("Expected version '0.8.0', got %s", rootCmd.Version)
	}
}

func TestRootCommand_GlobalFlags(t *testing.T) {
	tests := []struct {
		name      string
		flag      string
		shortFlag string
		expectSet bool
	}{
		{"verbose flag", "verbose", "v", true},
		{"quiet flag", "quiet", "q", true},
		{"output flag", "output", "o", true},
		{"no-color flag", "no-color", "", true},
		{"say flag", "say", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			flag := rootCmd.PersistentFlags().Lookup(tt.flag)
			if flag == nil {
				t.Errorf("Flag %s not found", tt.flag)
				return
			}

			if !flag.Changed && tt.expectSet {
				if flag.DefValue == "" && tt.flag != "output" && tt.flag != "verbose" && tt.flag != "quiet" && tt.flag != "say" {
					t.Errorf("Flag %s should have default value", tt.flag)
				}
			}

			if tt.shortFlag != "" {
				shortFlag := rootCmd.PersistentFlags().ShorthandLookup(tt.shortFlag)
				if shortFlag == nil {
					t.Errorf("Short flag -%s not found", tt.shortFlag)
				}
			}
		})
	}
}

func TestRootCommand_Version(t *testing.T) {
	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetArgs([]string{"--version"})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "0.8.0") {
		t.Errorf("Version output should contain '0.8.0', got: %s", output)
	}

	if !strings.Contains(output, "rhino-cli") {
		t.Errorf("Version output should contain 'rhino-cli', got: %s", output)
	}
}
