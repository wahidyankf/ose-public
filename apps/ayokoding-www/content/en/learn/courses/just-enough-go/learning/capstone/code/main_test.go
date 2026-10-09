package main

import (
	"context"
	"testing"
)

func TestRun(t *testing.T) {
	got, err := run(context.Background(), LocalChecker{}, "ship")
	if err != nil || got != "ok:ship" {
		t.Fatalf("got %q, err %v", got, err)
	}
}

func TestRunRejectsEmptyName(t *testing.T) {
	got, err := run(context.Background(), LocalChecker{}, "")
	if got != "" || err == nil || err.Error() != "name is required" {
		t.Fatalf("got %q, err %v", got, err)
	}
}

func TestRunReturnsCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	got, err := run(ctx, LocalChecker{}, "ship")
	if got != "" || err != context.Canceled {
		t.Fatalf("got %q, err %v", got, err)
	}
}
