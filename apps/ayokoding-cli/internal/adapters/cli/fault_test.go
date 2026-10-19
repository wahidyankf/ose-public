package cli_test

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// errClosedPipe is the static write failure the failing writer reports.
var errClosedPipe = errors.New("standard output closed")

// failingWriter fails every write after the first line, standing in for a
// reader that closed standard output.
type failingWriter struct {
	buffer bytes.Buffer
	failed bool
}

func (w *failingWriter) Write(data []byte) (int, error) {
	if w.failed {
		return 0, errClosedPipe
	}
	w.failed = true
	written, err := w.buffer.Write(data)
	if err != nil {
		return written, fmt.Errorf("cli_test: buffer write: %w", err)
	}
	return written, nil
}

// TestRecoveredPanic requires a panic inside the command to map to 2 with
// ayokoding.internal.panic and no stack trace.
func TestRecoveredPanic(t *testing.T) {
	var stdout, stderr bytes.Buffer
	var status int
	func() {
		defer func() {
			if recovered := recover(); recovered != nil {
				t.Fatalf("panic escaped Execute: %v", recovered)
			}
		}()
		status = cli.Execute(context.Background(), []string{"examples", "check", "--course", "demo"}, cli.Options{
			Stdout: &stdout,
			Stderr: &stderr,
			Fault:  "panic",
		})
	}()
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.internal.panic") {
		t.Fatalf("stderr names no panic code (stderr=%q)", stderr.String())
	}
	if strings.Contains(stderr.String(), "goroutine") {
		t.Fatalf("stderr leaks a stack trace (stderr=%q)", stderr.String())
	}
}

// TestHangYieldsToInterrupt requires a blocked command to exit 130 once its
// context cancels.
func TestHangYieldsToInterrupt(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan int, 1)
	go func() {
		var stdout, stderr bytes.Buffer
		done <- cli.Execute(ctx, []string{"examples", "check", "--course", "demo"}, cli.Options{
			Stdout: &stdout,
			Stderr: &stderr,
			Fault:  "hang",
		})
	}()
	cancel()
	select {
	case status := <-done:
		if status != 130 {
			t.Fatalf("status=%d, want 130", status)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("blocked command did not yield to interrupt")
	}
}

// TestClosedPipeExits141 requires a writer failure mid-payload to exit 141.
func TestClosedPipeExits141(t *testing.T) {
	stdout := &failingWriter{}
	var stderr bytes.Buffer
	status := cli.Execute(context.Background(), []string{"examples", "check", "--course", "many"}, cli.Options{
		Stdout: stdout,
		Stderr: &stderr,
		Fault:  "spam",
	})
	if status != 141 {
		t.Fatalf("status=%d, want 141", status)
	}
}

// TestFailingRunRendersWithoutColour requires the canned failing runs to exit
// 1, label every failed run in words, and emit no escape sequence under
// NO_COLOR.
func TestFailingRunRendersWithoutColour(t *testing.T) {
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--course", "demo", "--color", "auto"}, cli.Options{
			Stdout:  &stdout,
			Stderr:  &stderr,
			NoColor: true,
			Fault:   "failing-run",
		})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stdout.String(), "failed") {
		t.Fatalf("stdout labels no failed run (stdout=%q)", stdout.String())
	}
	if strings.Contains(stdout.String(), "\x1b") || strings.Contains(stderr.String(), "\x1b") {
		t.Fatalf("streams carry colour despite NO_COLOR (stdout=%q stderr=%q)",
			stdout.String(), stderr.String())
	}
}
