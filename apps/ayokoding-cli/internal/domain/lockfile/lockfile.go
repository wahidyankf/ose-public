// Package lockfile parses hash-locked jar lockfiles: the agreement between
// the course-side lock producer and the toolchain-side JarFetch installer.
// A lock line is `<group>:<artifact>:<version> <sha256>`; blank lines and
// `#` comments are skipped. Any other shape is a finding naming the line, so
// a malformed committed lock fails the harness before any image builds.
package lockfile

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

// Malformed-line sentinels. Each wraps the offending line as context, so the
// finding names the line without creating a dynamic error.
var (
	ErrBadLine       = errors.New("lockfile: bad lock line (want '<group>:<artifact>:<version> <sha256> [<repository>]')")
	ErrBadCoordinate = errors.New("lockfile: bad coordinate (want '<group>:<artifact>:<version>')")
	ErrBadSHA        = errors.New("lockfile: bad sha256 (want 64 hex digits)")
	ErrBadRepository = errors.New("lockfile: bad repository (want 'central' or 'clojars')")
)

// Repositories JarFetch serves. A missing field defaults to central.
const (
	RepositoryCentral = "central"
	RepositoryClojars = "clojars"
)

// coordinate names one locked jar.
type coordinate struct {
	Group    string
	Artifact string
	Version  string
}

// Line is one parsed lock line.
type Line struct {
	Coordinate coordinate
	SHA256     string
	Repository string
}

var (
	segmentPattern = regexp.MustCompile(`^[A-Za-z0-9_.-]+$`)
	shaPattern     = regexp.MustCompile(`^[0-9a-fA-F]{64}$`)
)

// ParseLine parses one lock line. A blank line or comment returns ok=false
// with no error: callers skip it.
func ParseLine(raw string) (Line, bool, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" || strings.HasPrefix(trimmed, "#") {
		return Line{}, false, nil
	}
	fields := strings.Fields(trimmed)
	if len(fields) < 2 || len(fields) > 3 {
		return Line{}, true, fmt.Errorf("%w: %s", ErrBadLine, trimmed)
	}
	parts := strings.Split(fields[0], ":")
	if len(parts) != 3 {
		return Line{}, true, fmt.Errorf("%w: %s", ErrBadCoordinate, trimmed)
	}
	for _, part := range parts {
		if part == "" || !segmentPattern.MatchString(part) {
			return Line{}, true, fmt.Errorf("%w: %s", ErrBadCoordinate, trimmed)
		}
	}
	if !shaPattern.MatchString(fields[1]) {
		return Line{}, true, fmt.Errorf("%w: %s", ErrBadSHA, trimmed)
	}
	repository := RepositoryCentral
	if len(fields) == 3 {
		repository = fields[2]
	}
	if repository != RepositoryCentral && repository != RepositoryClojars {
		return Line{}, true, fmt.Errorf("%w: %s", ErrBadRepository, trimmed)
	}
	return Line{
		Coordinate: coordinate{Group: parts[0], Artifact: parts[1], Version: parts[2]},
		SHA256:     strings.ToLower(fields[1]),
		Repository: repository,
	}, true, nil
}
