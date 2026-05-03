package cmd

import "github.com/spf13/cobra"

var bcCmd = &cobra.Command{
	Use:   "bc",
	Short: "Bounded-context commands",
	Long:  `Commands for validating DDD bounded-context structure against the registry.`,
}

func init() {
	rootCmd.AddCommand(bcCmd)
}
