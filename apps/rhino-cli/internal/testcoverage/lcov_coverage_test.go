package testcoverage

import (
	"os"
	"path/filepath"
	"testing"
)

const sampleLCOV = `TN:
SF:src/foo.ts
DA:1,1
DA:2,0
DA:3,1
BRDA:3,0,0,1
BRDA:3,0,1,0
end_of_record
TN:
SF:src/bar.ts
DA:5,2
DA:6,1
end_of_record
`

const lcovWithBRDAOnly = `TN:
SF:src/baz.ts
BRDA:10,0,0,1
BRDA:10,0,1,1
BRDA:20,0,0,0
BRDA:20,0,1,0
BRDA:30,0,0,1
BRDA:30,0,1,0
end_of_record
`

func writeTempLCOV(t *testing.T, dir, content string) string {
	t.Helper()
	path := filepath.Join(dir, "lcov.info")
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestParseLCOV_FileNotFound(t *testing.T) {
	_, err := parseLCOV("/nonexistent/lcov.info")
	if err == nil {
		t.Error("expected error for missing file")
	}
}

func TestParseLCOV_Valid(t *testing.T) {
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, sampleLCOV)

	files, err := parseLCOV(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files) != 2 {
		t.Fatalf("expected 2 files, got %d", len(files))
	}

	// First file: foo.ts
	foo := files[0]
	if foo.daLines[1] != 1 || foo.daLines[2] != 0 || foo.daLines[3] != 1 {
		t.Errorf("unexpected DA lines for foo.ts: %v", foo.daLines)
	}
	if len(foo.brdaData[3]) != 2 {
		t.Errorf("expected 2 BRDA entries for line 3, got %d", len(foo.brdaData[3]))
	}

	// Second file: bar.ts
	bar := files[1]
	if bar.daLines[5] != 2 || bar.daLines[6] != 1 {
		t.Errorf("unexpected DA lines for bar.ts: %v", bar.daLines)
	}
}

func TestParseLCOV_DuplicateDATakesMax(t *testing.T) {
	content := "TN:\nSF:src/dup.ts\nDA:5,3\nDA:5,7\nDA:5,1\nend_of_record\n"
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, content)

	files, err := parseLCOV(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files) != 1 {
		t.Fatalf("expected 1 file, got %d", len(files))
	}
	if files[0].daLines[5] != 7 {
		t.Errorf("expected max count 7 for duplicate DA line 5, got %d", files[0].daLines[5])
	}
}

func TestParseLCOV_BRDADashCount(t *testing.T) {
	content := "TN:\nSF:src/x.ts\nBRDA:1,0,0,-\nBRDA:1,0,1,5\nend_of_record\n"
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, content)

	files, err := parseLCOV(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files[0].brdaData[1]) != 2 {
		t.Fatalf("expected 2 branches for line 1, got %d", len(files[0].brdaData[1]))
	}
	// "-" → 0
	if files[0].brdaData[1][0] != 0 {
		t.Errorf("expected 0 for dash branch, got %d", files[0].brdaData[1][0])
	}
	if files[0].brdaData[1][1] != 5 {
		t.Errorf("expected 5 for second branch, got %d", files[0].brdaData[1][1])
	}
}

func TestComputeLCOVResult_FileNotFound(t *testing.T) {
	_, err := ComputeLCOVResult("/nonexistent/lcov.info", 85)
	if err == nil {
		t.Error("expected error for missing file")
	}
}

func TestComputeLCOVResult_EmptyFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, "")

	result, err := ComputeLCOVResult(path, 85)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Total != 0 {
		t.Errorf("expected total=0, got %d", result.Total)
	}
	if result.Pct != 100.0 {
		t.Errorf("expected pct=100, got %f", result.Pct)
	}
	if !result.Passed {
		t.Error("expected passed=true for empty coverage")
	}
}

func TestComputeLCOVResult_SampleLCOV(t *testing.T) {
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, sampleLCOV)

	result, err := ComputeLCOVResult(path, 85)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// foo.ts:
	//   line 1: count=1, no branches → covered
	//   line 2: count=0 → missed
	//   line 3: count=1, branches=[1,0] (not all positive) → partial
	// bar.ts:
	//   line 5: count=2, no branches → covered
	//   line 6: count=1, no branches → covered
	// Totals: covered=3, partial=1, missed=1
	if result.Covered != 3 {
		t.Errorf("expected covered=3, got %d", result.Covered)
	}
	if result.Partial != 1 {
		t.Errorf("expected partial=1, got %d", result.Partial)
	}
	if result.Missed != 1 {
		t.Errorf("expected missed=1, got %d", result.Missed)
	}
	if result.Total != 5 {
		t.Errorf("expected total=5, got %d", result.Total)
	}
	// pct = 100 * 3 / 5 = 60.0
	if result.Pct != 60.0 {
		t.Errorf("expected pct=60.0, got %f", result.Pct)
	}
	if result.Format != FormatLCOV {
		t.Errorf("expected FormatLCOV, got %s", result.Format)
	}
}

func TestComputeLCOVResult_BRDAOnlyLines(t *testing.T) {
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, lcovWithBRDAOnly)

	result, err := ComputeLCOVResult(path, 85)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// BRDA-only lines (no DA):
	//   line 10: branches=[1,1] → all positive → covered
	//   line 20: branches=[0,0] → none positive → missed
	//   line 30: branches=[1,0] → some positive → partial
	if result.Covered != 1 {
		t.Errorf("expected covered=1, got %d", result.Covered)
	}
	if result.Partial != 1 {
		t.Errorf("expected partial=1, got %d", result.Partial)
	}
	if result.Missed != 1 {
		t.Errorf("expected missed=1, got %d", result.Missed)
	}
}

func TestComputeLCOVResult_PassFail(t *testing.T) {
	// Only 1 covered, 1 missed → 50% pct
	content := "TN:\nSF:src/x.ts\nDA:1,1\nDA:2,0\nend_of_record\n"
	tmpDir := t.TempDir()
	path := writeTempLCOV(t, tmpDir, content)

	result, err := ComputeLCOVResult(path, 85)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Passed {
		t.Error("expected Passed=false for 50% with 85% threshold")
	}

	result2, err := ComputeLCOVResult(path, 40)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result2.Passed {
		t.Error("expected Passed=true for 50% with 40% threshold")
	}
}

func TestAllPositive(t *testing.T) {
	if !allPositive([]int{1, 2, 3}) {
		t.Error("expected true for [1,2,3]")
	}
	if allPositive([]int{1, 0, 3}) {
		t.Error("expected false for [1,0,3]")
	}
	if !allPositive([]int{}) {
		t.Error("expected true for empty slice")
	}
}

func TestAnyPositive(t *testing.T) {
	if !anyPositive([]int{0, 1, 0}) {
		t.Error("expected true for [0,1,0]")
	}
	if anyPositive([]int{0, 0, 0}) {
		t.Error("expected false for [0,0,0]")
	}
	if anyPositive([]int{}) {
		t.Error("expected false for empty slice")
	}
}
