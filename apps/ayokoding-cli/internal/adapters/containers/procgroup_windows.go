//go:build windows

package containers

import (
	"os/exec"
)

// setProcessGroup is a no-op on Windows, where process groups do not
// exist; termination kills the direct child only.
func setProcessGroup(_ *exec.Cmd) {
}

// killProcessGroup kills the direct child on Windows.
func killProcessGroup(cmd *exec.Cmd) {
	if cmd.Process == nil {
		return
	}
	_ = cmd.Process.Kill()
}
