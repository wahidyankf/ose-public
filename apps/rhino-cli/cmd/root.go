// Package cmd implements the CLI commands for rhino-cli.
package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var (
	verbose bool
	quiet   bool
	output  string
	noColor bool
	sayMsg  string
)

var rootCmd = &cobra.Command{
	Use:               "rhino-cli",
	Short:             "CLI tools for repository management",
	Long:              `Command-line tools for repository management and automation.`,
	Version:           "0.8.0",
	CompletionOptions: cobra.CompletionOptions{DisableDefaultCmd: true},
	Run: func(cmd *cobra.Command, args []string) {
		if sayMsg != "" {
			if verbose && !quiet {
				timestamp := time.Now().Format("2006-01-02 15:04:05")
				_, _ = fmt.Fprintf(cmd.OutOrStdout(), "[%s] INFO: Executing say command\n", timestamp)
				_, _ = fmt.Fprintf(cmd.OutOrStdout(), "[%s] INFO: Message: %s\n", timestamp, sayMsg)
			}
			_, _ = fmt.Fprintln(cmd.OutOrStdout(), sayMsg)
			return
		}
		_ = cmd.Help()
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output with timestamps")
	rootCmd.PersistentFlags().BoolVarP(&quiet, "quiet", "q", false, "quiet mode (errors only)")
	rootCmd.PersistentFlags().StringVarP(&output, "output", "o", "text", "output format: text, json, markdown")
	rootCmd.PersistentFlags().BoolVar(&noColor, "no-color", false, "disable colored output")
	rootCmd.PersistentFlags().StringVar(&sayMsg, "say", "", "echo a message to stdout")
}
