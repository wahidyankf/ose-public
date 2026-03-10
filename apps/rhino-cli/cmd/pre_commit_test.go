package cmd

import (
	"bytes"
	"os"
	"strings"
	"testing"
)

func TestPreCommitCommand_MissingGitRoot_ReturnsError(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("failed to change directory: %v", err)
	}
	// No .git directory — findGitRoot() will fail before precommit.Run is reached.

	buf := new(bytes.Buffer)
	preCommitCmd.SetOut(buf)
	preCommitCmd.SetErr(buf)

	err = preCommitCmd.RunE(preCommitCmd, []string{})
	if err == nil {
		t.Fatal("expected error when not in a git repository")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error to mention 'git', got: %v", err)
	}
}

func TestPreCommitCommand_HasCorrectUse(t *testing.T) {
	if preCommitCmd.Use != "pre-commit" {
		t.Errorf("expected Use='pre-commit', got %q", preCommitCmd.Use)
	}
}

func TestPreCommitCommand_IsRegisteredWithRootCmd(t *testing.T) {
	found := false
	for _, sub := range rootCmd.Commands() {
		if sub.Use == "pre-commit" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected pre-commit to be registered with rootCmd")
	}
}
