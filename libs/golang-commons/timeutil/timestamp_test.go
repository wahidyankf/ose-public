package timeutil_test

import (
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

func TestTimestamp(t *testing.T) {
	ts := timeutil.Timestamp()
	if ts == "" {
		t.Fatal("expected non-empty timestamp")
	}
	if _, err := time.Parse(time.RFC3339, ts); err != nil {
		t.Errorf("Timestamp() %q is not valid RFC3339: %v", ts, err)
	}
}

func TestJakartaTimestamp(t *testing.T) {
	ts := timeutil.JakartaTimestamp()
	if ts == "" {
		t.Fatal("expected non-empty timestamp")
	}
	// Asia/Jakarta is UTC+7, so the offset should be +07:00
	if !strings.Contains(ts, "+07:00") {
		t.Errorf("expected +07:00 offset in timestamp, got %q", ts)
	}
}
