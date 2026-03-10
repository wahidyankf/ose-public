package cmd

import (
	"bytes"
	"os"
	"strings"
	"testing"
)

func TestGitPreCommitCommand_MissingGitRoot_ReturnsError(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("failed to change directory: %v", err)
	}
	// No .git directory — findGitRoot() will fail before git.Run is reached.

	buf := new(bytes.Buffer)
	gitPreCommitCmd.SetOut(buf)
	gitPreCommitCmd.SetErr(buf)

	err = gitPreCommitCmd.RunE(gitPreCommitCmd, []string{})
	if err == nil {
		t.Fatal("expected error when not in a git repository")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error to mention 'git', got: %v", err)
	}
}

func TestGitPreCommitCommand_HasCorrectUse(t *testing.T) {
	if gitPreCommitCmd.Use != "pre-commit" {
		t.Errorf("expected Use='pre-commit', got %q", gitPreCommitCmd.Use)
	}
}

func TestGitPreCommitCommand_IsRegisteredWithGitCmd(t *testing.T) {
	found := false
	for _, sub := range gitCmd.Commands() {
		if sub.Use == "pre-commit" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected pre-commit to be registered with gitCmd")
	}
}
