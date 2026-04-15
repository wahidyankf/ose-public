package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/envbackup"
)

var envRestoreDir string
var envRestoreWorktreeAware bool
var envRestoreForce bool
var envRestoreIncludeConfig bool

var envRestoreCmd = &cobra.Command{
	Use:   "restore",
	Short: "Restore .env files from a backup",
	Long: `Copy previously backed-up .env* files from the backup directory back to
their original repository paths. Only files whose basename starts with
".env" are restored; other files in the backup are ignored.

If destination files already exist, the user is prompted for confirmation
before overwriting. Use --force to skip the prompt. JSON and markdown output
modes imply --force. Non-TTY stdin also implies --force.

Use --include-config to also restore known uncommitted local configuration
files (AI tool settings, Docker overrides, version managers, direnv).`,
	Example: `  # Restore from default directory ~/ose-open-env-backup
  rhino-cli env restore

  # Restore from a custom directory
  rhino-cli env restore --dir /tmp/my-env-backup

  # Restore from worktree-namespaced backup
  rhino-cli env restore --worktree-aware

  # Skip overwrite confirmation
  rhino-cli env restore --force

  # Include config files
  rhino-cli env restore --include-config

  # JSON output (implies --force)
  rhino-cli env restore -o json`,
	Args:          cobra.NoArgs,
	SilenceErrors: true,
	RunE:          runEnvRestore,
}

func init() {
	envCmd.AddCommand(envRestoreCmd)
	envRestoreCmd.Flags().StringVar(&envRestoreDir, "dir", "", "backup source directory (default: ~/ose-open-env-backup)")
	envRestoreCmd.Flags().BoolVar(&envRestoreWorktreeAware, "worktree-aware", false, "read from worktree-namespaced backup")
	envRestoreCmd.Flags().BoolVarP(&envRestoreForce, "force", "f", false, "skip overwrite confirmation")
	envRestoreCmd.Flags().BoolVar(&envRestoreIncludeConfig, "include-config", false, "also restore known uncommitted config files")
}

func runEnvRestore(cmd *cobra.Command, _ []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	backupDir := envRestoreDir
	if backupDir == "" {
		home, err := envbackup.ExpandTilde("~")
		if err != nil {
			return fmt.Errorf("cannot determine home directory: %w", err)
		}
		backupDir = filepath.Join(home, envbackup.DefaultBackupDir)
	} else {
		backupDir, err = envbackup.ExpandTilde(backupDir)
		if err != nil {
			return fmt.Errorf("invalid backup directory: %w", err)
		}
		backupDir, err = filepath.Abs(backupDir)
		if err != nil {
			return fmt.Errorf("cannot resolve backup directory: %w", err)
		}
	}

	// Determine if force mode (explicit flag, non-text output, or non-TTY stdin).
	force := envRestoreForce || output != "text"
	if !force {
		if fi, err := os.Stdin.Stat(); err == nil {
			if fi.Mode()&os.ModeCharDevice == 0 {
				force = true // stdin is not a terminal
			}
		}
	}

	opts := envbackup.Options{
		RepoRoot:      repoRoot,
		BackupDir:     backupDir,
		MaxSize:       envbackup.DefaultMaxSize,
		WorktreeAware: envRestoreWorktreeAware,
		Force:         force,
		IncludeConfig: envRestoreIncludeConfig,
	}

	if !force {
		opts.ConfirmFn = confirmFn(os.Stdin, cmd.OutOrStderr())
	}

	if envRestoreWorktreeAware {
		info, err := envbackup.DetectWorktree(repoRoot)
		if err != nil {
			return fmt.Errorf("worktree detection failed: %w", err)
		}
		opts.WorktreeName = info.WorktreeName
	}

	result, err := envRestoreFn(opts)
	if err != nil {
		return fmt.Errorf("env restore failed: %w", err)
	}

	return writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return envbackup.FormatText(result, v, q) },
		json:     func() (string, error) { return envbackup.FormatJSON(result) },
		markdown: func() string { return envbackup.FormatMarkdown(result) },
	})
}
