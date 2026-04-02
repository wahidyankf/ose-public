package speccoverage

import (
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

func writeTestFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestMatchesStem(t *testing.T) {
	tests := []struct {
		base, stem string
		want       bool
	}{
		{"health-check.test.ts", "health-check", true},
		{"health_check_test.go", "health-check", true},
		{"HealthCheck.java", "health-check", true},
		{"HealthCheckSteps.java", "health-check", true},
		{"test_health_check.py", "health-check", true},
		{"health_check_test.py", "health-check", true},
		{"other.test.ts", "health-check", false},
		{"health-check", "health-check", true},
		{"health_check", "health-check", true},
	}
	for _, tt := range tests {
		got := matchesStem(tt.base, tt.stem)
		if got != tt.want {
			t.Errorf("matchesStem(%q, %q) = %v, want %v", tt.base, tt.stem, got, tt.want)
		}
	}
}

func TestToPascalCase(t *testing.T) {
	tests := []struct{ in, want string }{
		{"health-check", "HealthCheck"},
		{"user-login", "UserLogin"},
		{"simple", "Simple"},
	}
	for _, tt := range tests {
		got := toPascalCase(tt.in)
		if got != tt.want {
			t.Errorf("toPascalCase(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestIsTestFile(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"src/foo_test.go", true},
		{"src/foo.go", false},
		{"src/foo.test.ts", true},
		{"src/foo.ts", false},
		{"src/test/FooTest.java", true},
		{"src/main/Foo.java", false},
		{"src/test_foo.py", true},
		{"src/foo.py", false},
		{"src/foo_test.exs", true},
		{"src/foo.exs", false},
		{"src/foo_test.rs", true},
		{"src/tests/foo.rs", true},
		{"src/FooSteps.cs", true},
		{"src/Foo.cs", false},
		{"src/foo_test.clj", true},
		{"src/foo.clj", false},
		{"src/foo_test.dart", true},
		{"src/test/foo.dart", true},
	}
	for _, tt := range tests {
		got := isTestFile(tt.path)
		if got != tt.want {
			t.Errorf("isTestFile(%q) = %v, want %v", tt.path, got, tt.want)
		}
	}
}

func TestCucumberExprToRegex(t *testing.T) {
	tests := []struct {
		name    string
		text    string
		matches []string
		noMatch []string
	}{
		{
			name:    "int parameter",
			text:    "the response status code should be {int}",
			matches: []string{"the response status code should be 200", "the response status code should be -1"},
			noMatch: []string{"the response status code should be abc"},
		},
		{
			name:    "string parameter",
			text:    `the user name is {string}`,
			matches: []string{`the user name is "alice"`, `the user name is ""`},
			noMatch: []string{`the user name is alice`},
		},
		{
			name:    "word parameter",
			text:    "the {word} button is clicked",
			matches: []string{"the submit button is clicked", "the cancel button is clicked"},
			noMatch: []string{"the  button is clicked"},
		},
		{
			name:    "float parameter",
			text:    "the price is {float}",
			matches: []string{"the price is 1.99", "the price is 100", "the price is -0.5"},
			noMatch: []string{"the price is abc"},
		},
		{
			name:    "multiple parameters",
			text:    "user {string} has {int} items",
			matches: []string{`user "alice" has 3 items`, `user "bob" has 0 items`},
			noMatch: []string{`user alice has 3 items`, `user "alice" has abc items`},
		},
		{
			name:    "escaped parentheses with string parameter",
			text:    `the viewport is set to {string} \(1280x800)`,
			matches: []string{`the viewport is set to "desktop" (1280x800)`},
			noMatch: []string{`the viewport is set to desktop (1280x800)`},
		},
		{
			name:    "escaped parentheses with string parameter tablet",
			text:    `the viewport is set to {string} \(768x1024)`,
			matches: []string{`the viewport is set to "tablet" (768x1024)`},
			noMatch: []string{`the viewport is set to "tablet" [768x1024]`},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sm := &stepMatcher{exact: map[string]bool{}}
			addStepToMatcher(sm, tt.text)

			if len(sm.patterns) == 0 {
				t.Fatalf("expected pattern to be added to sm.patterns, got none")
			}

			for _, s := range tt.matches {
				if !sm.matches(s) {
					t.Errorf("expected %q to match pattern for %q", s, tt.text)
				}
			}
			for _, s := range tt.noMatch {
				if sm.matches(s) {
					t.Errorf("expected %q NOT to match pattern for %q", s, tt.text)
				}
			}
		})
	}
}

func TestAddStepToMatcherRegex(t *testing.T) {
	tests := []struct {
		name    string
		text    string
		matches []string
		noMatch []string
		isExact bool
	}{
		{
			name:    "anchored regex",
			text:    `^alice has (\d+) items$`,
			matches: []string{"alice has 3 items", "alice has 100 items"},
			noMatch: []string{"bob has 3 items"},
		},
		{
			name:    "parentheses are literal",
			text:    `the viewport is set to "desktop" (1280x800)`,
			matches: []string{`the viewport is set to "desktop" (1280x800)`},
			noMatch: []string{`the viewport is set to "desktop" 1280x800`},
			isExact: true,
		},
		{
			name:    "plain literal",
			text:    "the server is ready",
			matches: []string{"the server is ready"},
			noMatch: []string{"the server is not ready"},
			isExact: true,
		},
		{
			name:    "escaped forward slash in exact match",
			text:    `I navigate to \/login using only the keyboard`,
			matches: []string{"I navigate to /login using only the keyboard"},
			noMatch: []string{`I navigate to \/login using only the keyboard`},
			isExact: true,
		},
		{
			name:    "escaped forward slash simple",
			text:    `I navigate to \/profile`,
			matches: []string{"I navigate to /profile"},
			noMatch: []string{`I navigate to \/profile`},
			isExact: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sm := &stepMatcher{exact: map[string]bool{}}
			addStepToMatcher(sm, tt.text)

			if tt.isExact {
				if len(sm.exact) == 0 {
					t.Fatal("expected exact match to be added")
				}
			} else {
				if len(sm.patterns) == 0 {
					t.Fatal("expected pattern to be added")
				}
			}

			for _, s := range tt.matches {
				if !sm.matches(s) {
					t.Errorf("expected %q to match", s)
				}
			}
			for _, s := range tt.noMatch {
				if sm.matches(s) {
					t.Errorf("expected %q NOT to match", s)
				}
			}
		})
	}
}

func TestExtractJVMStepTexts(t *testing.T) {
	t.Run("plain text steps go to exact", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "Steps.java")
		content := `@Given("the user is logged in")
@When("they click logout")
@Then("they are redirected to login page")`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractJVMStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if !sm.exact["the user is logged in"] {
			t.Error("expected 'the user is logged in' in exact matches")
		}
		if len(sm.exact) != 3 {
			t.Errorf("expected 3 exact matches, got %d", len(sm.exact))
		}
	})

	t.Run("cucumber expression steps go to patterns", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "Steps.java")
		content := `@Then("the response status code should be {int}")`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractJVMStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.patterns) == 0 {
			t.Fatal("expected pattern to be added for Cucumber expression")
		}
		if !sm.matches("the response status code should be 200") {
			t.Error("expected pattern to match 'the response status code should be 200'")
		}
		if sm.matches("the response status code should be abc") {
			t.Error("expected pattern NOT to match 'the response status code should be abc'")
		}
	})
}

func TestExtractPythonStepTexts(t *testing.T) {
	t.Run("plain text steps go to exact", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.py")
		content := `@given("the user exists")
@when("they submit the form")
@then("a success message is shown")`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractPythonStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.exact) != 3 {
			t.Errorf("expected 3 exact matches, got %d", len(sm.exact))
		}
	})

	t.Run("parsers.parse steps with typed format", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.py")
		content := `@given(parsers.parse("the user has {count:d} items"))
@when(parsers.parse("they add {name:w} to cart"))
@then(parsers.parse("the total is {total:g}"))`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractPythonStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.patterns) == 0 {
			t.Fatal("expected patterns to be added for parsers.parse steps")
		}
		if !sm.matches("the user has 5 items") {
			t.Error("expected pattern to match 'the user has 5 items'")
		}
		if !sm.matches("they add widget to cart") {
			t.Error("expected pattern to match 'they add widget to cart'")
		}
		if !sm.matches("the total is 9.99") {
			t.Error("expected pattern to match 'the total is 9.99'")
		}
	})

	t.Run("parsers.cfparse steps", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.py")
		content := `@then(parsers.cfparse("the status is {code:d}"))`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractPythonStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if !sm.matches("the status is 404") {
			t.Error("expected pattern to match 'the status is 404'")
		}
	})
}

func TestExtractElixirStepTexts(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.exs")
	content := `defgiven ~r/^the system is running$/
defwhen ~r/^the user sends a request$/
defthen ~r/^a response is returned$/`
	writeTestFile(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractElixirStepTexts(path, sm)
	if err != nil {
		t.Fatal(err)
	}
	if len(sm.patterns) != 3 {
		t.Errorf("expected 3 patterns, got %d", len(sm.patterns))
	}
	if !sm.matches("the system is running") {
		t.Error("expected pattern to match 'the system is running'")
	}
}

func TestExtractRustStepTexts(t *testing.T) {
	t.Run("literal and regex forms", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.rs")
		content := `#[given("the user is logged in")]
fn given_logged_in(world: &mut World) {}

#[then(regex = r#"the response contains "([^"]+)""#)]
fn then_response(world: &mut World) {}
`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractRustStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.exact) != 1 {
			t.Errorf("expected 1 exact match, got %d: %v", len(sm.exact), sm.exact)
		}
		if len(sm.patterns) != 1 {
			t.Errorf("expected 1 pattern, got %d", len(sm.patterns))
		}
		if !sm.exact["the user is logged in"] {
			t.Error("expected 'the user is logged in' in exact matches")
		}
		if len(sm.patterns) > 0 && !sm.patterns[0].MatchString(`the response contains "hello"`) {
			t.Error("expected regex pattern to match")
		}
	})

	t.Run("expr form with cucumber expression", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.rs")
		content := `#[when(expr = "they click {string}")]
fn when_click(world: &mut World, button: String) {}
`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractRustStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.patterns) == 0 {
			t.Fatal("expected pattern to be added for Cucumber expression in expr form")
		}
		if !sm.matches(`they click "submit"`) {
			t.Error(`expected pattern to match 'they click "submit"'`)
		}
	})
}

func TestExtractCSharpStepTexts(t *testing.T) {
	t.Run("plain text and regex patterns", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "Steps.cs")
		content := `[Given("the app is started")]
[When(@"^the user clicks (.*)$")]
[Then("the result is shown")]`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractCSharpStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		// "the app is started" and "the result is shown" are plain literals -> exact
		// @"^the user clicks (.*)$" starts with ^ -> pattern
		if len(sm.exact) != 2 {
			t.Errorf("expected 2 exact matches, got %d: %v", len(sm.exact), sm.exact)
		}
		if len(sm.patterns) != 1 {
			t.Errorf("expected 1 pattern, got %d", len(sm.patterns))
		}
		if !sm.matches("the user clicks submit") {
			t.Error("expected pattern to match 'the user clicks submit'")
		}
	})

	t.Run("cucumber expression step", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "Steps.cs")
		content := `[Then("the response status code should be {int}")]`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractCSharpStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.patterns) == 0 {
			t.Fatal("expected pattern for Cucumber expression")
		}
		if !sm.matches("the response status code should be 200") {
			t.Error("expected pattern to match 'the response status code should be 200'")
		}
	})
}

func TestExtractFSharpStepTexts(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "Steps.fs")
	content := "let [<Given>] ``the user has (\\d+) items`` () =\n    ()\nlet [<When>] ``they add an item`` () =\n    ()"
	writeTestFile(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractFSharpStepTexts(path, sm)
	if err != nil {
		t.Fatal(err)
	}
	if len(sm.patterns) != 2 {
		t.Errorf("expected 2 patterns, got %d", len(sm.patterns))
	}
	if !sm.matches("the user has 5 items") {
		t.Error("expected F# regex pattern to match 'the user has 5 items'")
	}
	if !sm.matches("they add an item") {
		t.Error("expected F# pattern to match 'they add an item'")
	}
}

func TestExtractClojureStepTexts(t *testing.T) {
	t.Run("plain text steps", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.clj")
		content := `(Given "the server is ready"
  (fn [state] state))
(When "a request is sent"
  (fn [state] state))`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractClojureStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.exact) != 2 {
			t.Errorf("expected 2 exact matches, got %d", len(sm.exact))
		}
	})

	t.Run("cucumber expression steps go to patterns", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps.clj")
		content := `(Then "the response code is {int}"
  (fn [state code] state))`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractClojureStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.patterns) == 0 {
			t.Fatal("expected pattern for Cucumber expression")
		}
		if !sm.matches("the response code is 200") {
			t.Error("expected pattern to match 'the response code is 200'")
		}
	})
}

func TestExtractDartStepTexts(t *testing.T) {
	t.Run("plain text steps", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps_test.dart")
		content := `s.given('the app is running', () async {});
s.when("alice opens the session info panel", () async {});
s.then("the panel displays info", () async {});`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractDartStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.exact) != 3 {
			t.Errorf("expected 3 exact matches, got %d: %v", len(sm.exact), sm.exact)
		}
		if !sm.matches("the app is running") {
			t.Error("expected 'the app is running' to match")
		}
		if !sm.matches("alice opens the session info panel") {
			t.Error("expected 'alice opens the session info panel' to match")
		}
	})

	t.Run("cucumber expression steps go to patterns", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "steps_test.dart")
		content := `s.then("the status code is {int}", () async {});`
		writeTestFile(t, path, content)

		sm := &stepMatcher{exact: map[string]bool{}}
		err := extractDartStepTexts(path, sm)
		if err != nil {
			t.Fatal(err)
		}
		if len(sm.patterns) == 0 {
			t.Fatal("expected pattern for Cucumber expression")
		}
		if !sm.matches("the status code is 200") {
			t.Error("expected pattern to match 'the status code is 200'")
		}
	})
}

func TestCheckSharedSteps(t *testing.T) {
	root := t.TempDir()

	// Create feature file
	specDir := filepath.Join(root, "specs")
	if err := os.MkdirAll(specDir, 0755); err != nil {
		t.Fatal(err)
	}
	featureContent := `Feature: Test
  Scenario: Login
    Given the user is logged in
    When they click logout
    Then the response status code should be 200`
	writeTestFile(t, filepath.Join(specDir, "test.feature"), featureContent)

	// Create step file matching 2 of 3 steps — one uses a Cucumber expression
	appDir := filepath.Join(root, "app")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		t.Fatal(err)
	}
	stepContent := `Given("the user is logged in", async () => {});
When("they click logout", async () => {});
Then("the response status code should be {int}", async () => {});`
	writeTestFile(t, filepath.Join(appDir, "common.steps.ts"), stepContent)

	result, err := checkSharedSteps(ScanOptions{
		RepoRoot:    root,
		SpecsDir:    specDir,
		AppDir:      appDir,
		SharedSteps: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.TotalSteps != 3 {
		t.Errorf("expected 3 total steps, got %d", result.TotalSteps)
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("expected 0 step gaps (Cucumber expression should match), got %d: %v", len(result.StepGaps), result.StepGaps)
	}
	if len(result.Gaps) != 0 {
		t.Errorf("expected 0 file gaps in shared-steps mode, got %d", len(result.Gaps))
	}
}

func TestAddPythonStepToMatcher_AnchoredRegex(t *testing.T) {
	sm := &stepMatcher{exact: map[string]bool{}}
	addPythonStepToMatcher(sm, `^the user has (\d+) items$`)

	if len(sm.patterns) == 0 {
		t.Fatal("expected anchored regex to be added to sm.patterns")
	}
	if !sm.matches("the user has 5 items") {
		t.Error("expected pattern to match 'the user has 5 items'")
	}
	if sm.matches("the user has items") {
		t.Error("expected pattern NOT to match 'the user has items'")
	}
}

func TestAddPythonStepToMatcher_CucumberExpression(t *testing.T) {
	sm := &stepMatcher{exact: map[string]bool{}}
	addPythonStepToMatcher(sm, "the user name is {string}")

	if len(sm.patterns) == 0 {
		t.Fatal("expected Cucumber expression to be added to sm.patterns")
	}
	if !sm.matches(`the user name is "alice"`) {
		t.Error(`expected pattern to match 'the user name is "alice"'`)
	}
}

func TestAddPythonStepToMatcher_EmptyText(t *testing.T) {
	sm := &stepMatcher{exact: map[string]bool{}}
	addPythonStepToMatcher(sm, "")
	addPythonStepToMatcher(sm, "   ")

	if len(sm.exact) != 0 || len(sm.patterns) != 0 {
		t.Error("expected empty/whitespace-only text to be ignored")
	}
}

func TestAddStepToMatcher_EmptyText(t *testing.T) {
	sm := &stepMatcher{exact: map[string]bool{}}
	addStepToMatcher(sm, "")
	addStepToMatcher(sm, "   ")

	if len(sm.exact) != 0 || len(sm.patterns) != 0 {
		t.Error("expected empty/whitespace-only text to be ignored")
	}
}

func TestConvertPythonParsersExpr(t *testing.T) {
	tests := []struct {
		name    string
		text    string
		matches []string
		noMatch []string
	}{
		{
			name:    "digit format",
			text:    "the user has {count:d} items",
			matches: []string{"the user has 5 items", "the user has -3 items"},
			noMatch: []string{"the user has abc items"},
		},
		{
			name:    "float format",
			text:    "the price is {total:g}",
			matches: []string{"the price is 9.99", "the price is 100"},
			noMatch: []string{"the price is abc"},
		},
		{
			name:    "word format",
			text:    "the {name:w} is ready",
			matches: []string{"the widget is ready"},
			noMatch: []string{"the  is ready"},
		},
		{
			name:    "untyped format",
			text:    "the value is {val}",
			matches: []string{"the value is anything", "the value is 42"},
			noMatch: []string{"the value is"},
		},
		{
			name:    "literal text only",
			text:    "no placeholders here",
			matches: []string{"no placeholders here"},
			noMatch: []string{"other text"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pattern := "^" + convertPythonParsersExpr(tt.text) + "$"
			re, err := regexp.MustCompile(pattern), error(nil)
			_ = err
			for _, s := range tt.matches {
				if !re.MatchString(s) {
					t.Errorf("expected %q to match pattern for %q", s, tt.text)
				}
			}
			for _, s := range tt.noMatch {
				if re.MatchString(s) {
					t.Errorf("expected %q NOT to match pattern for %q", s, tt.text)
				}
			}
		})
	}
}

func TestIsPythonParsersExpr(t *testing.T) {
	tests := []struct {
		text string
		want bool
	}{
		{"the user has {count:d} items", true},
		{"the user is {name}", true},
		{"plain text step", false},
		{"^anchored regex$", false},
	}
	for _, tt := range tests {
		got := isPythonParsersExpr(tt.text)
		if got != tt.want {
			t.Errorf("isPythonParsersExpr(%q) = %v, want %v", tt.text, got, tt.want)
		}
	}
}

func TestCucumberParamToRegex_AllTypes(t *testing.T) {
	tests := []struct {
		paramName string
		matches   []string
		noMatch   []string
	}{
		{"string", []string{`"hello"`, `""`}, []string{`hello`}},
		{"int", []string{"42", "-1"}, []string{"abc"}},
		{"byte", []string{"127", "-128"}, []string{"abc"}},
		{"short", []string{"32767"}, []string{"abc"}},
		{"long", []string{"9999999"}, []string{"abc"}},
		{"float", []string{"1.5", "100", "-0.5"}, []string{"abc"}},
		{"double", []string{"3.14", "-2.0"}, []string{"abc"}},
		{"bigdecimal", []string{"999.99"}, []string{"abc"}},
		{"word", []string{"hello", "world"}, []string{""}},
		{"unknown", []string{"anything here"}, nil},
	}

	for _, tt := range tests {
		t.Run(tt.paramName, func(t *testing.T) {
			pattern := "^" + cucumberParamToRegex(tt.paramName) + "$"
			re := regexp.MustCompile(pattern)
			for _, s := range tt.matches {
				if !re.MatchString(s) {
					t.Errorf("cucumberParamToRegex(%q) pattern %q did not match %q", tt.paramName, pattern, s)
				}
			}
			for _, s := range tt.noMatch {
				if re.MatchString(s) {
					t.Errorf("cucumberParamToRegex(%q) pattern %q should NOT match %q", tt.paramName, pattern, s)
				}
			}
		})
	}
}

func TestExtractPythonStepTexts_MultilineDecorator(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.py")
	content := `@given(
    parsers.parse("the user has {count:d} items"),
    target_fixture="response"
)
def given_user_items(count):
    pass`
	writeTestFile(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractPythonStepTexts(path, sm)
	if err != nil {
		t.Fatal(err)
	}
	if len(sm.patterns) == 0 {
		t.Fatal("expected pattern to be added for multi-line parsers.parse decorator")
	}
	if !sm.matches("the user has 5 items") {
		t.Error("expected pattern to match 'the user has 5 items'")
	}
}

func TestExtractPythonStepTexts_DoubleBraceEscape(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.py")
	// {{escaped}} → {escaped} after ReplaceAll, then treated as literal (no parser format)
	content := `@given("the value is {{escaped}}")`
	writeTestFile(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractPythonStepTexts(path, sm)
	if err != nil {
		t.Fatal(err)
	}
	// After {{...}} → {...} conversion, {escaped} is treated as a Cucumber expression
	// because cucumberParamRe matches it, so it goes to patterns
	if len(sm.exact) == 0 && len(sm.patterns) == 0 {
		t.Error("expected step to be added to either exact or patterns")
	}
}

func TestExtractCSharpStepTexts_VerbatimStringWithEscapedQuotes(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "Steps.cs")
	// Verbatim string with "" escaped quote: [Given(@"^text ""([^""]+)""$")]
	content := `[Given(@"^text ""([^""]+)""$")]
public void GivenText(string value) {}`
	writeTestFile(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractCSharpStepTexts(path, sm)
	if err != nil {
		t.Fatal(err)
	}
	// Should be in patterns because it starts with ^
	if len(sm.patterns) == 0 {
		t.Fatal("expected pattern to be added for verbatim string with ^ anchor")
	}
	if !sm.matches(`text "hello"`) {
		t.Errorf("expected pattern to match 'text \"hello\"'")
	}
}

func TestExtractCSharpStepTexts_MultiLineAttribute(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "Steps.cs")
	content := "[When(\n    @\"^the user clicks (.*)$\"\n)]\npublic void WhenClicks(string btn) {}"
	writeTestFile(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractCSharpStepTexts(path, sm)
	if err != nil {
		t.Fatal(err)
	}
	if len(sm.patterns) == 0 {
		t.Fatal("expected pattern to be added for multi-line attribute")
	}
	if !sm.matches("the user clicks submit") {
		t.Error("expected pattern to match 'the user clicks submit'")
	}
}

func TestExtractDartStepTexts_UnreadableFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps_test.dart")
	if err := os.WriteFile(path, []byte(`s.given("a step", () {});`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(path, 0644) }()

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractDartStepTexts(path, sm)
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error")
		}
	}
}

func TestExtractRustStepTexts_UnreadableFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.rs")
	if err := os.WriteFile(path, []byte(`#[given("a step")]`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(path, 0644) }()

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractRustStepTexts(path, sm)
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error")
		}
	}
}

func TestPythonScenarioExtraction(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "test_login.py")
	content := `@scenario("login.feature", "User logs in")
def test_user_logs_in():
    pass

@scenario("login.feature", "User fails login")
def test_user_fails_login():
    pass`
	writeTestFile(t, path, content)

	titles, err := extractPythonScenarioTitles(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(titles) != 2 {
		t.Errorf("expected 2 scenarios, got %d", len(titles))
	}
	if !titles["User logs in"] {
		t.Error("expected 'User logs in' in titles")
	}
}
