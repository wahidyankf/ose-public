package testutil_test

import (
	"fmt"
	"testing"

	"github.com/wahidyankf/ose-public/libs/golang-commons/testutil"
)

func TestCaptureStdout(t *testing.T) {
	read := testutil.CaptureStdout(t)
	fmt.Print("hello")
	out := read()
	if out != "hello" {
		t.Errorf("expected %q, got %q", "hello", out)
	}
}

func TestCaptureStdout_Empty(t *testing.T) {
	read := testutil.CaptureStdout(t)
	out := read()
	if out != "" {
		t.Errorf("expected empty string, got %q", out)
	}
}
