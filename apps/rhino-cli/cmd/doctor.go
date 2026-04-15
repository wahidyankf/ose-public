package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/doctor"
)

var (
	scope  string
	fix    bool
	dryRun bool
)

var doctorCmd = &cobra.Command{
	Use:   "doctor",
	Short: "Check required tool versions are installed and correct",
	Long: `Verify that all required development tools are installed with the correct versions.

Reads version requirements from existing repository config files and checks each
tool against those requirements.

Tools checked:
  git            — any version (no config file)
  volta          — any version (no config file)
  node           — from package.json → volta.node
  npm            — from package.json → volta.npm
  java           — from apps/organiclever-be-jasb/pom.xml → <java.version>
  maven          — any version (no config file)
  golang         — from apps/rhino-cli/go.mod → go directive
  python         — from apps/a-demo-be-python-fastapi/.python-version
  rust           — from apps/a-demo-be-rust-axum/Cargo.toml → rust-version
  cargo-llvm-cov — any version (cargo subcommand)
  elixir         — from .tool-versions → elixir
  erlang         — from .tool-versions → erlang
  dotnet         — from apps/a-demo-be-fsharp-giraffe/global.json → sdk.version
  clojure        — any version (no config file)
  dart           — from apps/a-demo-fe-dart-flutterweb/pubspec.yaml → environment.sdk
  flutter        — from apps/a-demo-fe-dart-flutterweb/pubspec.yaml → environment.flutter
  docker         — any version (no config file)
  jq             — any version (no config file)
  playwright     — browsers in Playwright cache directory

Status codes:
  ✓ ok      — tool is installed with the correct version
  ⚠ warning — tool is installed but version does not match requirement
  ✗ missing — tool is not found in PATH`,
	Example: `  # Check all required tools
  rhino-cli doctor

  # Check only core tools (git, volta, node, npm, golang, docker, jq)
  rhino-cli doctor --scope minimal

  # Output as JSON
  rhino-cli doctor -o json

  # Output as markdown report
  rhino-cli doctor -o markdown

  # Verbose output with duration
  rhino-cli doctor --verbose

  # Auto-install missing tools
  rhino-cli doctor --fix

  # Preview what would be installed
  rhino-cli doctor --fix --dry-run

  # Fix only core tools
  rhino-cli doctor --fix --scope minimal`,
	SilenceErrors: true,
	RunE:          runDoctor,
}

func init() {
	rootCmd.AddCommand(doctorCmd)
	doctorCmd.Flags().StringVar(&scope, "scope", "full", "tool scope: full or minimal")
	doctorCmd.Flags().BoolVar(&fix, "fix", false, "attempt to install missing tools")
	doctorCmd.Flags().BoolVar(&dryRun, "dry-run", false, "preview what --fix would install (only effective with --fix)")
}

func runDoctor(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	checkOpts := doctor.CheckOptions{RepoRoot: repoRoot, Scope: doctor.Scope(scope)}
	result, err := doctorCheckAllFn(checkOpts)
	if err != nil {
		return fmt.Errorf("doctor check failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return doctor.FormatText(result, v, q) },
		json:     func() (string, error) { return doctor.FormatJSON(result) },
		markdown: func() string { return doctor.FormatMarkdown(result) },
	}); err != nil {
		return err
	}

	if fix && result.MissingCount > 0 {
		printf := func(format string, a ...any) {
			_, _ = fmt.Fprintf(cmd.OutOrStdout(), format, a...)
		}
		fixResult := doctorFixAllFn(result, checkOpts, doctor.FixOptions{DryRun: dryRun}, printf)
		_, _ = fmt.Fprint(cmd.OutOrStdout(), doctor.FormatFixSummary(fixResult))
		if fixResult.Failed > 0 {
			return fmt.Errorf("%d tool(s) failed to install", fixResult.Failed)
		}
		if !dryRun && fixResult.Fixed > 0 {
			return nil // Tools were fixed, don't report missing
		}
	}

	if fix && result.MissingCount == 0 {
		_, _ = fmt.Fprintf(cmd.OutOrStdout(), "\nNothing to fix — all tools are installed.\n")
	}

	// Only missing tools cause non-zero exit; version warnings are advisory
	if result.MissingCount > 0 {
		return fmt.Errorf("%d tool(s) not found in PATH", result.MissingCount)
	}
	return nil
}
