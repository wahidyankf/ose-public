package coverage

import (
	"bufio"
	"os"
	"strings"
)

// DetectFormat determines the coverage file format from the filename and content.
// Returns FormatLCOV if filename ends in ".info" or contains "lcov" (case-insensitive).
// Otherwise reads the first line: "mode:" → FormatGo, "SF:" or "TN:" → FormatLCOV.
// Falls back to FormatGo.
func DetectFormat(filename string) Format {
	lower := strings.ToLower(filename)
	if strings.HasSuffix(lower, ".info") || strings.Contains(lower, "lcov") {
		return FormatLCOV
	}

	f, err := os.Open(filename)
	if err != nil {
		return FormatGo
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	if scanner.Scan() {
		first := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(first, "mode:") {
			return FormatGo
		}
		if strings.HasPrefix(first, "SF:") || strings.HasPrefix(first, "TN:") {
			return FormatLCOV
		}
	}

	return FormatGo
}
