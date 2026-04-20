package testcoverage

import (
	"fmt"
	"os"
	"sort"
	"strings"
)

// LineCoverage holds normalized per-line coverage data.
type LineCoverage struct {
	HitCount int
	Branches []BranchCoverage
}

// BranchCoverage holds per-branch coverage data.
type BranchCoverage struct {
	BlockID  int
	BranchID int
	HitCount int
}

// CoverageMap maps filepath → line_number → LineCoverage.
type CoverageMap map[string]map[int]LineCoverage

// MergeCoverageMaps merges multiple CoverageMaps into one.
// For overlapping file+line entries, takes max hit count.
// For branch data, unions by (blockID, branchID), takes max hit count per branch.
func MergeCoverageMaps(maps ...CoverageMap) CoverageMap {
	result := make(CoverageMap)
	for _, m := range maps {
		for filePath, lines := range m {
			if result[filePath] == nil {
				result[filePath] = make(map[int]LineCoverage)
			}
			for lineNo, lc := range lines {
				existing, ok := result[filePath][lineNo]
				if !ok {
					result[filePath][lineNo] = lc
					continue
				}
				// Max hit count
				if lc.HitCount > existing.HitCount {
					existing.HitCount = lc.HitCount
				}
				// Merge branches
				existing.Branches = mergeBranches(existing.Branches, lc.Branches)
				result[filePath][lineNo] = existing
			}
		}
	}
	return result
}

// mergeBranches unions branch coverage by (blockID, branchID), taking max hit count.
func mergeBranches(a, b []BranchCoverage) []BranchCoverage {
	type key struct{ block, branch int }
	m := make(map[key]int)
	for _, br := range a {
		k := key{br.BlockID, br.BranchID}
		m[k] = br.HitCount
	}
	for _, br := range b {
		k := key{br.BlockID, br.BranchID}
		if br.HitCount > m[k] {
			m[k] = br.HitCount
		}
	}
	var result []BranchCoverage
	for k, hits := range m {
		result = append(result, BranchCoverage{BlockID: k.block, BranchID: k.branch, HitCount: hits})
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].BlockID != result[j].BlockID {
			return result[i].BlockID < result[j].BlockID
		}
		return result[i].BranchID < result[j].BranchID
	})
	return result
}

// WriteLCOV writes a CoverageMap as LCOV format to the given file path.
func WriteLCOV(cm CoverageMap, outPath string) error {
	content := FormatLCOVString(cm)
	return os.WriteFile(outPath, []byte(content), 0644)
}

// FormatLCOVString converts a CoverageMap to LCOV format string.
func FormatLCOVString(cm CoverageMap) string {
	// Sort files for deterministic output
	files := make([]string, 0, len(cm))
	for f := range cm {
		files = append(files, f)
	}
	sort.Strings(files)

	var sb strings.Builder
	for _, filePath := range files {
		lines := cm[filePath]
		sb.WriteString("TN:\n")
		_, _ = fmt.Fprintf(&sb, "SF:%s\n", filePath)

		// Sort line numbers
		lineNos := make([]int, 0, len(lines))
		for ln := range lines {
			lineNos = append(lineNos, ln)
		}
		sort.Ints(lineNos)

		// Write BRDA records
		for _, ln := range lineNos {
			lc := lines[ln]
			for _, br := range lc.Branches {
				_, _ = fmt.Fprintf(&sb, "BRDA:%d,%d,%d,%d\n", ln, br.BlockID, br.BranchID, br.HitCount)
			}
		}

		// Write DA records
		for _, ln := range lineNos {
			lc := lines[ln]
			_, _ = fmt.Fprintf(&sb, "DA:%d,%d\n", ln, lc.HitCount)
		}

		sb.WriteString("end_of_record\n")
	}
	return sb.String()
}

// ResultFromCoverageMap computes a Result from a CoverageMap using a standard line-based algorithm.
func ResultFromCoverageMap(cm CoverageMap, threshold float64) Result {
	covered, partial, missed := 0, 0, 0
	var perFile []FileResult

	files := make([]string, 0, len(cm))
	for f := range cm {
		files = append(files, f)
	}
	sort.Strings(files)

	for _, filePath := range files {
		lines := cm[filePath]
		fc, fp, fm := 0, 0, 0
		for _, lc := range lines {
			if lc.HitCount > 0 {
				if hasMissedBranch(lc.Branches) {
					fp++
				} else {
					fc++
				}
			} else {
				fm++
			}
		}
		covered += fc
		partial += fp
		missed += fm

		ft := fc + fp + fm
		fpct := 100.0
		if ft > 0 {
			fpct = 100.0 * float64(fc) / float64(ft)
		}
		perFile = append(perFile, FileResult{
			Path: filePath, Covered: fc, Partial: fp, Missed: fm, Total: ft, Pct: fpct,
		})
	}

	total := covered + partial + missed
	pct := 100.0
	if total > 0 {
		pct = 100.0 * float64(covered) / float64(total)
	}

	return Result{
		Format:    FormatLCOV,
		Covered:   covered,
		Partial:   partial,
		Missed:    missed,
		Total:     total,
		Pct:       pct,
		Threshold: threshold,
		Passed:    pct >= threshold,
		Files:     perFile,
	}
}

func hasMissedBranch(branches []BranchCoverage) bool {
	for _, br := range branches {
		if br.HitCount <= 0 {
			return true
		}
	}
	return false
}

// ToCoverageMapLCOV converts an LCOV file to CoverageMap.
func ToCoverageMapLCOV(filename string) (CoverageMap, error) {
	files, err := parseLCOV(filename)
	if err != nil {
		return nil, err
	}

	cm := make(CoverageMap)
	for _, f := range files {
		if cm[f.path] == nil {
			cm[f.path] = make(map[int]LineCoverage)
		}
		for lineNo, count := range f.daLines {
			lc := LineCoverage{HitCount: count}
			if branches, ok := f.brdaData[lineNo]; ok {
				for i, hits := range branches {
					lc.Branches = append(lc.Branches, BranchCoverage{BlockID: 0, BranchID: i, HitCount: hits})
				}
			}
			cm[f.path][lineNo] = lc
		}
		// BRDA-only lines
		for lineNo, branches := range f.brdaData {
			if _, inDA := f.daLines[lineNo]; !inDA {
				lc := LineCoverage{HitCount: 0}
				for i, hits := range branches {
					lc.Branches = append(lc.Branches, BranchCoverage{BlockID: 0, BranchID: i, HitCount: hits})
					if hits > 0 && lc.HitCount == 0 {
						lc.HitCount = hits
					}
				}
				cm[f.path][lineNo] = lc
			}
		}
	}
	return cm, nil
}

// ToCoverageMapGo converts a Go cover.out file to CoverageMap.
func ToCoverageMapGo(filename string) (CoverageMap, error) {
	blocks, err := parseCoverOut(filename)
	if err != nil {
		return nil, err
	}

	cm := make(CoverageMap)
	for _, b := range blocks {
		if cm[b.filepath] == nil {
			cm[b.filepath] = make(map[int]LineCoverage)
		}
		for lineNo := b.startLine; lineNo <= b.endLine; lineNo++ {
			existing, ok := cm[b.filepath][lineNo]
			if !ok {
				cm[b.filepath][lineNo] = LineCoverage{HitCount: b.count}
			} else {
				if b.count > existing.HitCount {
					existing.HitCount = b.count
				}
				cm[b.filepath][lineNo] = existing
			}
		}
	}
	return cm, nil
}

// ToCoverageMapJaCoCo converts a JaCoCo XML file to CoverageMap.
func ToCoverageMapJaCoCo(filename string) (CoverageMap, error) {
	report, err := parseJaCoCo(filename)
	if err != nil {
		return nil, err
	}

	cm := make(CoverageMap)
	for _, pkg := range report.Packages {
		for _, sf := range pkg.SourceFiles {
			filePath := pkg.Name + "/" + sf.Name
			if cm[filePath] == nil {
				cm[filePath] = make(map[int]LineCoverage)
			}
			for _, line := range sf.Lines {
				lc := LineCoverage{HitCount: line.Ci}
				if line.Mb > 0 || line.Cb > 0 {
					for i := 0; i < line.Cb; i++ {
						lc.Branches = append(lc.Branches, BranchCoverage{BlockID: 0, BranchID: i, HitCount: 1})
					}
					for i := 0; i < line.Mb; i++ {
						lc.Branches = append(lc.Branches, BranchCoverage{BlockID: 0, BranchID: line.Cb + i, HitCount: 0})
					}
				}
				cm[filePath][line.Nr] = lc
			}
		}
	}
	return cm, nil
}

// ToCoverageMapCobertura converts a Cobertura XML file to CoverageMap.
func ToCoverageMapCobertura(filename string) (CoverageMap, error) {
	report, err := parseCobertura(filename)
	if err != nil {
		return nil, err
	}

	cm := make(CoverageMap)
	for _, pkg := range report.Packages {
		for _, cls := range pkg.Classes {
			if cm[cls.Filename] == nil {
				cm[cls.Filename] = make(map[int]LineCoverage)
			}
			for _, line := range cls.Lines {
				lc := LineCoverage{HitCount: line.Hits}
				if line.Branch {
					brCov, brTotal := parseBranchCoverage(line.ConditionCoverage)
					for i := 0; i < brCov; i++ {
						lc.Branches = append(lc.Branches, BranchCoverage{BlockID: 0, BranchID: i, HitCount: 1})
					}
					for i := brCov; i < brTotal; i++ {
						lc.Branches = append(lc.Branches, BranchCoverage{BlockID: 0, BranchID: i, HitCount: 0})
					}
				}
				cm[cls.Filename][line.Number] = lc
			}
		}
	}
	return cm, nil
}

// ToCoverageMap converts any supported coverage file to CoverageMap based on detected format.
func ToCoverageMap(filename string) (CoverageMap, error) {
	switch DetectFormat(filename) {
	case FormatLCOV:
		return ToCoverageMapLCOV(filename)
	case FormatJaCoCo:
		return ToCoverageMapJaCoCo(filename)
	case FormatCobertura:
		return ToCoverageMapCobertura(filename)
	case FormatGo, FormatDiff:
		return ToCoverageMapGo(filename)
	}
	return ToCoverageMapGo(filename)
}
