package cmd

import (
	"bytes"
	"strings"
	"testing"
)

func TestExecute_Help(t *testing.T) {
	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	t.Cleanup(func() {
		rootCmd.SetOut(nil)
		rootCmd.SetErr(nil)
	})

	// Call Run directly with empty sayMsg to trigger help output
	sayMsg = ""
	rootCmd.Run(rootCmd, []string{})

	output := buf.String()
	if !strings.Contains(output, "rhino-cli") {
		t.Errorf("Help output should contain 'rhino-cli', got: %s", output)
	}
}

func TestRootCommand_Run_Say(t *testing.T) {
	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	sayMsg = "hello world"
	verbose = false
	quiet = false
	t.Cleanup(func() {
		rootCmd.SetOut(nil)
		sayMsg = ""
		verbose = false
		quiet = false
	})

	rootCmd.Run(rootCmd, []string{})

	output := buf.String()
	if !strings.Contains(output, "hello world") {
		t.Errorf("Expected 'hello world' in output, got: %s", output)
	}
}

func TestRootCommand_Run_SayVerbose(t *testing.T) {
	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	sayMsg = "test message"
	verbose = true
	quiet = false
	t.Cleanup(func() {
		rootCmd.SetOut(nil)
		sayMsg = ""
		verbose = false
		quiet = false
	})

	rootCmd.Run(rootCmd, []string{})

	output := buf.String()
	if !strings.Contains(output, "test message") {
		t.Errorf("Expected 'test message' in output, got: %s", output)
	}
	if !strings.Contains(output, "INFO: Executing say command") {
		t.Errorf("Expected verbose INFO in output, got: %s", output)
	}
}

func TestRootCommand_Initialization(t *testing.T) {
	if rootCmd.Use != "rhino-cli" {
		t.Errorf("Expected use 'rhino-cli', got %s", rootCmd.Use)
	}

	if rootCmd.Short != "CLI tools for repository management" {
		t.Errorf("Expected short description 'CLI tools for repository management', got %s", rootCmd.Short)
	}

	if rootCmd.Version != "0.10.0" {
		t.Errorf("Expected version '0.10.0', got %s", rootCmd.Version)
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
	if rootCmd.Version != "0.10.0" {
		t.Errorf("Expected version '0.10.0', got %s", rootCmd.Version)
	}
}

func TestExecute_Error(t *testing.T) {
	var capturedCode int
	origOsExit := osExit
	osExit = func(code int) { capturedCode = code }
	defer func() { osExit = origOsExit }()

	var errBuf bytes.Buffer
	rootCmd.SetErr(&errBuf)
	rootCmd.SetArgs([]string{"--unknown-flag-xyz"})
	defer func() {
		rootCmd.SetErr(nil)
		rootCmd.SetArgs(nil)
	}()

	Execute()

	if capturedCode != 1 {
		t.Errorf("expected exit code 1, got %d", capturedCode)
	}
}
