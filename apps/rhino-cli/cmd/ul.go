package cmd

import "github.com/spf13/cobra"

var ulCmd = &cobra.Command{
	Use:   "ul",
	Short: "Ubiquitous-language commands",
}

func init() {
	rootCmd.AddCommand(ulCmd)
}
