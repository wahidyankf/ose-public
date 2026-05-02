package cmd

import "github.com/spf13/cobra"

var governanceCmd = &cobra.Command{
	Use:   "governance",
	Short: "Governance validation commands",
	Long:  `Commands for validating governance layer conventions.`,
}

func init() {
	rootCmd.AddCommand(governanceCmd)
}
