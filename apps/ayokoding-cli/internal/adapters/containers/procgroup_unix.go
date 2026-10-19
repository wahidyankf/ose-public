//go:build unix

package containers

import (
	"os/exec"
	"syscall"
)

// setProcessGroup makes the child a process-group leader, so termination
// reaches its grandchildren.
func setProcessGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
}

// killProcessGroup kills the child's whole process group.
func killProcessGroup(cmd *exec.Cmd) {
	if cmd.Process == nil {
		return
	}
	_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
}
