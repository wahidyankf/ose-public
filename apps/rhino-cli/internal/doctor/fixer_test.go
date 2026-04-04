package doctor

import (
	"fmt"
	"strings"
	"testing"
)

func TestFix_AllOK(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "git", Status: StatusOK},
			{Name: "golang", Status: StatusOK},
		},
		OKCount: 2,
	}
	defs := []toolDef{
		{name: "git", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Command: "brew", Args: []string{"install", "git"}}}
		}},
		{name: "golang", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Command: "brew", Args: []string{"install", "go"}}}
		}},
	}
	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.AlreadyOK != 2 {
		t.Errorf("expected AlreadyOK == 2, got %d", fr.AlreadyOK)
	}
	if fr.Fixed != 0 {
		t.Errorf("expected Fixed == 0, got %d", fr.Fixed)
	}
}

func TestFix_WarningCountsAsAlreadyOK(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "node", Status: StatusWarning, InstalledVersion: "22.0.0", RequiredVersion: "24.13.1"},
		},
		WarnCount: 1,
	}
	defs := []toolDef{
		{name: "node", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Command: "volta", Args: []string{"install", "node@" + req}}}
		}},
	}
	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.AlreadyOK != 1 {
		t.Errorf("expected AlreadyOK == 1, got %d", fr.AlreadyOK)
	}
	if fr.Fixed != 0 {
		t.Errorf("expected Fixed == 0, got %d", fr.Fixed)
	}
}

func TestFix_MissingTool(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "golang", Status: StatusMissing, RequiredVersion: "1.24.2"},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "golang", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Description: "Install Go", Command: "echo", Args: []string{"installing go"}}}
		}},
	}

	origRunner := fixRunner
	fixRunner = func(cmd string, args ...string) error { return nil }
	defer func() { fixRunner = origRunner }()

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Fixed != 1 {
		t.Errorf("expected Fixed == 1, got %d", fr.Fixed)
	}
	if !strings.Contains(output.String(), "Installing golang") {
		t.Errorf("expected install message, got: %s", output.String())
	}
}

func TestFix_DryRun(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "golang", Status: StatusMissing, RequiredVersion: "1.24.2"},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "golang", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Description: "Install Go", Command: "brew", Args: []string{"install", "go"}}}
		}},
	}

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{DryRun: true}, printf)
	if fr.Fixed != 0 {
		t.Errorf("dry-run should not fix, got Fixed == %d", fr.Fixed)
	}
	if !strings.Contains(output.String(), "Would install") {
		t.Errorf("expected dry-run message, got: %s", output.String())
	}
}

func TestFix_InstallFails(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "golang", Status: StatusMissing},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "golang", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Description: "Install Go", Command: "false", Args: nil}}
		}},
	}

	origRunner := fixRunner
	fixRunner = func(cmd string, args ...string) error { return fmt.Errorf("command failed") }
	defer func() { fixRunner = origRunner }()

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Failed != 1 {
		t.Errorf("expected Failed == 1, got %d", fr.Failed)
	}
	if !strings.Contains(output.String(), "Failed") {
		t.Errorf("expected failure message, got: %s", output.String())
	}
}

func TestFix_NoInstallCmd(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "dart", Status: StatusMissing},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "dart", installCmd: nil},
	}

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Skipped != 1 {
		t.Errorf("expected Skipped == 1, got %d", fr.Skipped)
	}
	if !strings.Contains(output.String(), "Skip") {
		t.Errorf("expected skip message, got: %s", output.String())
	}
}

func TestFix_EmptyStepsForPlatform(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "docker", Status: StatusMissing},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "docker", installCmd: func(req, platform string) []InstallStep {
			return nil // simulate macOS Docker Desktop case
		}},
	}

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Skipped != 1 {
		t.Errorf("expected Skipped == 1, got %d", fr.Skipped)
	}
}

func TestFix_DependencyOrder(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "volta", Status: StatusMissing},
			{Name: "node", Status: StatusMissing, RequiredVersion: "24.13.1"},
		},
		MissingCount: 2,
	}
	defs := []toolDef{
		{name: "volta", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Description: "Install Volta", Command: "echo", Args: []string{"volta"}}}
		}},
		{name: "node", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{{Description: "Install Node", Command: "echo", Args: []string{"node"}}}
		}},
	}

	origRunner := fixRunner
	var order []string
	fixRunner = func(cmd string, args ...string) error {
		order = append(order, strings.Join(args, " "))
		return nil
	}
	defer func() { fixRunner = origRunner }()

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Fixed != 2 {
		t.Errorf("expected Fixed == 2, got %d", fr.Fixed)
	}
	if len(order) != 2 || order[0] != "volta" || order[1] != "node" {
		t.Errorf("expected volta then node, got %v", order)
	}
}

func TestFix_MultiStepInstall(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "python", Status: StatusMissing, RequiredVersion: "3.13.1"},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "python", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{
				{Description: "Install pyenv", Command: "brew", Args: []string{"install", "pyenv"}},
				{Description: "Install Python " + req, Command: "bash", Args: []string{"-c", "pyenv install " + req}},
			}
		}},
	}

	origRunner := fixRunner
	var callCount int
	fixRunner = func(cmd string, args ...string) error {
		callCount++
		return nil
	}
	defer func() { fixRunner = origRunner }()

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Fixed != 1 {
		t.Errorf("expected Fixed == 1, got %d", fr.Fixed)
	}
	if callCount != 2 {
		t.Errorf("expected 2 install calls, got %d", callCount)
	}
}

func TestFix_MultiStepFailsOnSecondStep(t *testing.T) {
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "python", Status: StatusMissing, RequiredVersion: "3.13.1"},
		},
		MissingCount: 1,
	}
	defs := []toolDef{
		{name: "python", installCmd: func(req, p string) []InstallStep {
			return []InstallStep{
				{Description: "Install pyenv", Command: "brew", Args: []string{"install", "pyenv"}},
				{Description: "Install Python", Command: "bash", Args: []string{"-c", "pyenv install"}},
			}
		}},
	}

	origRunner := fixRunner
	var callCount int
	fixRunner = func(cmd string, args ...string) error {
		callCount++
		if callCount == 2 {
			return fmt.Errorf("second step failed")
		}
		return nil
	}
	defer func() { fixRunner = origRunner }()

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := Fix(result, defs, FixOptions{}, printf)
	if fr.Failed != 1 {
		t.Errorf("expected Failed == 1, got %d", fr.Failed)
	}
	if fr.Fixed != 0 {
		t.Errorf("expected Fixed == 0, got %d", fr.Fixed)
	}
}

func TestFixAll_WithMissingTools(t *testing.T) {
	// FixAll rebuilds tool defs internally. We test it with a minimal result
	// that has a missing tool at the correct index position (golang = index 6).
	names := []string{"git", "volta", "node", "npm", "java", "maven", "golang"}
	checks := make([]ToolCheck, len(names))
	for i, name := range names {
		if name == "golang" {
			checks[i] = ToolCheck{Name: name, Binary: "go", Status: StatusMissing, RequiredVersion: "1.24.2"}
		} else {
			checks[i] = ToolCheck{Name: name, Binary: name, Status: StatusOK}
		}
	}
	result := &DoctorResult{Checks: checks, OKCount: 6, MissingCount: 1}
	opts := CheckOptions{RepoRoot: "/nonexistent", Scope: ScopeMinimal}

	origRunner := fixRunner
	fixRunner = func(cmd string, args ...string) error { return nil }
	defer func() { fixRunner = origRunner }()

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := FixAll(result, opts, FixOptions{}, printf)
	if fr.AlreadyOK != 6 {
		t.Errorf("expected AlreadyOK == 6, got %d", fr.AlreadyOK)
	}
	if fr.Fixed != 1 {
		t.Errorf("expected Fixed == 1, got %d", fr.Fixed)
	}
	if !strings.Contains(output.String(), "Installing golang") {
		t.Errorf("expected install message for golang, got: %s", output.String())
	}
}

func TestFixAll_FullScope(t *testing.T) {
	// Test FixAll with full scope and no missing tools
	result := &DoctorResult{
		Checks: []ToolCheck{
			{Name: "git", Status: StatusOK},
		},
		OKCount: 1,
	}
	opts := CheckOptions{RepoRoot: "/nonexistent", Scope: ScopeFull}

	var output strings.Builder
	printf := func(format string, args ...any) { fmt.Fprintf(&output, format, args...) }

	fr := FixAll(result, opts, FixOptions{}, printf)
	if fr.AlreadyOK != 1 {
		t.Errorf("expected AlreadyOK == 1, got %d", fr.AlreadyOK)
	}
}

func TestFormatFixSummary(t *testing.T) {
	fr := FixResult{Fixed: 2, Failed: 1, AlreadyOK: 5}
	got := FormatFixSummary(fr)
	if !strings.Contains(got, "2 fixed") {
		t.Errorf("expected '2 fixed' in summary, got: %s", got)
	}
	if !strings.Contains(got, "1 failed") {
		t.Errorf("expected '1 failed' in summary, got: %s", got)
	}
	if !strings.Contains(got, "5 already OK") {
		t.Errorf("expected '5 already OK' in summary, got: %s", got)
	}
}

// TestInstallCmds_AllToolDefs exercises every installCmd closure to ensure
// they return valid steps for both darwin and linux platforms.
func TestInstallCmds_AllToolDefs(t *testing.T) {
	defs := buildToolDefs("/nonexistent")
	platforms := []string{"darwin", "linux"}

	for _, def := range defs {
		for _, platform := range platforms {
			t.Run(def.name+"/"+platform, func(t *testing.T) {
				if def.installCmd == nil {
					// dart has nil installCmd — that's expected
					return
				}
				steps := def.installCmd("1.0.0", platform)
				// steps can be nil (e.g., docker on darwin) — that's valid
				for _, step := range steps {
					if step.Command == "" {
						t.Errorf("%s/%s: step has empty command", def.name, platform)
					}
					if step.Description == "" {
						t.Errorf("%s/%s: step has empty description", def.name, platform)
					}
				}
			})
		}
	}
}

// TestInstallCmds_SpecificVersions ensures version strings are interpolated correctly.
func TestInstallCmds_SpecificVersions(t *testing.T) {
	defs := buildToolDefs("/nonexistent")

	tests := []struct {
		toolName string
		version  string
		platform string
		wantArg  string // substring expected in some arg
	}{
		{"node", "24.13.1", "darwin", "node@24.13.1"},
		{"npm", "11.10.1", "darwin", "npm@11.10.1"},
		{"golang", "1.24.2", "linux", "go1.24.2"},
		{"python", "3.13.1", "darwin", "3.13.1"},
		{"python", "3.13.1", "linux", "3.13.1"},
		{"java", "21", "darwin", "21-tem"},
		{"elixir", "1.19.5", "darwin", "1.19.5"},
		{"erlang", "27.0", "darwin", "27.0"},
	}

	for _, tt := range tests {
		t.Run(tt.toolName+"/"+tt.platform+"/"+tt.version, func(t *testing.T) {
			var def *toolDef
			for i := range defs {
				if defs[i].name == tt.toolName {
					def = &defs[i]
					break
				}
			}
			if def == nil {
				t.Fatalf("tool %q not found in defs", tt.toolName)
			}
			if def.installCmd == nil {
				t.Skipf("tool %q has nil installCmd", tt.toolName)
			}
			steps := def.installCmd(tt.version, tt.platform)
			found := false
			for _, step := range steps {
				combined := step.Command + " " + strings.Join(step.Args, " ")
				if strings.Contains(combined, tt.wantArg) {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("expected %q in install args for %s/%s, got steps: %+v",
					tt.wantArg, tt.toolName, tt.platform, steps)
			}
		})
	}
}
