package speccoverage

import (
	"os"
	"path/filepath"
	"testing"
)

func writeFeatureFile(t *testing.T, dir, name, content string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile %s: %v", path, err)
	}
	return path
}

func TestParseFeatureFile_MultipleScenarios(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "login.feature", `
Feature: User Login

  Scenario: Successful login
    Given a registered user
    When the user submits credentials
    Then the user should be on the dashboard

  Scenario: Failed login
    Given a visitor on the login page
    When the visitor submits wrong credentials
    Then an error is displayed
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	if len(scenarios) != 2 {
		t.Fatalf("expected 2 scenarios, got %d", len(scenarios))
	}

	if scenarios[0].Title != "Successful login" {
		t.Errorf("scenarios[0].Title = %q, want %q", scenarios[0].Title, "Successful login")
	}
	if len(scenarios[0].Steps) != 3 {
		t.Errorf("scenarios[0].Steps count = %d, want 3", len(scenarios[0].Steps))
	}
	if scenarios[0].Steps[0].Keyword != "Given" {
		t.Errorf("step keyword = %q, want %q", scenarios[0].Steps[0].Keyword, "Given")
	}
	if scenarios[0].Steps[0].Text != "a registered user" {
		t.Errorf("step text = %q, want %q", scenarios[0].Steps[0].Text, "a registered user")
	}

	if scenarios[1].Title != "Failed login" {
		t.Errorf("scenarios[1].Title = %q, want %q", scenarios[1].Title, "Failed login")
	}
	if len(scenarios[1].Steps) != 3 {
		t.Errorf("scenarios[1].Steps count = %d, want 3", len(scenarios[1].Steps))
	}
}

func TestParseFeatureFile_AllStepKeywords(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "steps.feature", `
Feature: Step Keywords

  Scenario: All keywords
    Given an initial state
    When an action occurs
    Then a result is observed
    And an extra condition
    But not this other thing
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	if len(scenarios) != 1 {
		t.Fatalf("expected 1 scenario, got %d", len(scenarios))
	}

	steps := scenarios[0].Steps
	if len(steps) != 5 {
		t.Fatalf("expected 5 steps, got %d", len(steps))
	}

	expected := []struct{ kw, text string }{
		{"Given", "an initial state"},
		{"When", "an action occurs"},
		{"Then", "a result is observed"},
		{"And", "an extra condition"},
		{"But", "not this other thing"},
	}
	for i, e := range expected {
		if steps[i].Keyword != e.kw {
			t.Errorf("steps[%d].Keyword = %q, want %q", i, steps[i].Keyword, e.kw)
		}
		if steps[i].Text != e.text {
			t.Errorf("steps[%d].Text = %q, want %q", i, steps[i].Text, e.text)
		}
	}
}

func TestParseFeatureFile_TagsAndNarrativeIgnored(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "tagged.feature", `
@auth @smoke
Feature: Auth

  As a user
  I want to log in
  So that I can access the app

  @login
  Scenario: Login
    Given I am on the login page
    When I submit valid credentials
    Then I should be redirected
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	if len(scenarios) != 1 {
		t.Fatalf("expected 1 scenario, got %d", len(scenarios))
	}
	if scenarios[0].Title != "Login" {
		t.Errorf("Title = %q, want %q", scenarios[0].Title, "Login")
	}
	if len(scenarios[0].Steps) != 3 {
		t.Errorf("Steps count = %d, want 3", len(scenarios[0].Steps))
	}
}

func TestParseFeatureFile_EmptyFile(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "empty.feature", "")

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	if len(scenarios) != 0 {
		t.Errorf("expected 0 scenarios, got %d", len(scenarios))
	}
}

func TestParseFeatureFile_NoScenarios(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "nosc.feature", `
Feature: Just a feature

  As a user
  I want nothing
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	if len(scenarios) != 0 {
		t.Errorf("expected 0 scenarios, got %d", len(scenarios))
	}
}

func TestParseFeatureFile_NonExistentFile(t *testing.T) {
	_, err := ParseFeatureFile("/nonexistent/path/file.feature")
	if err == nil {
		t.Error("expected error for non-existent file, got nil")
	}
}

func TestParseFeatureFile_StepWithEmbeddedQuotes(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "quotes.feature", `
Feature: Embedded quotes

  Scenario: Login with credentials
    Given a registered user with email "user@example.com" and password "pass123"
    When the user submits the form
    Then the error "Invalid email" should be shown
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	if len(scenarios) != 1 {
		t.Fatalf("expected 1 scenario, got %d", len(scenarios))
	}
	if len(scenarios[0].Steps) != 3 {
		t.Fatalf("expected 3 steps, got %d", len(scenarios[0].Steps))
	}
	want := `a registered user with email "user@example.com" and password "pass123"`
	if scenarios[0].Steps[0].Text != want {
		t.Errorf("step text = %q, want %q", scenarios[0].Steps[0].Text, want)
	}
}

func TestParseFeatureFile_BackgroundSteps(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "bg.feature", `
Feature: Background Test

  Background:
    Given the API is running
    And a user "alice" is registered

  Scenario: First scenario
    When alice sends GET /api/v1/users/me
    Then the response status code should be 200

  Scenario: Second scenario
    When alice sends POST /api/v1/logout
    Then the response status code should be 200
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	// Background creates a synthetic "(Background)" scenario + 2 real scenarios = 3
	if len(scenarios) != 3 {
		t.Fatalf("expected 3 scenarios (1 background + 2 real), got %d", len(scenarios))
	}

	// First should be the synthetic Background scenario
	if scenarios[0].Title != "(Background)" {
		t.Errorf("scenarios[0].Title = %q, want %q", scenarios[0].Title, "(Background)")
	}
	if len(scenarios[0].Steps) != 2 {
		t.Errorf("Background steps count = %d, want 2", len(scenarios[0].Steps))
	}
	if scenarios[0].Steps[0].Text != "the API is running" {
		t.Errorf("Background step[0] = %q, want %q", scenarios[0].Steps[0].Text, "the API is running")
	}

	// Real scenarios follow
	if scenarios[1].Title != "First scenario" {
		t.Errorf("scenarios[1].Title = %q, want %q", scenarios[1].Title, "First scenario")
	}
	if len(scenarios[1].Steps) != 2 {
		t.Errorf("scenarios[1] steps count = %d, want 2", len(scenarios[1].Steps))
	}
}

func TestParseFeatureFile_NoBackground(t *testing.T) {
	dir := t.TempDir()
	path := writeFeatureFile(t, dir, "nobg.feature", `
Feature: No Background

  Scenario: Only scenario
    Given a user exists
    When the user logs in
    Then the user is on the dashboard
`)

	scenarios, err := ParseFeatureFile(path)
	if err != nil {
		t.Fatalf("ParseFeatureFile() error = %v", err)
	}

	// No Background — should NOT have a synthetic scenario
	if len(scenarios) != 1 {
		t.Fatalf("expected 1 scenario (no background), got %d", len(scenarios))
	}
	if scenarios[0].Title != "Only scenario" {
		t.Errorf("Title = %q, want %q", scenarios[0].Title, "Only scenario")
	}
}
