package web

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Default ports owned by this app.
const (
	DefaultPort = 3102
	TestPort    = 3191
)

// Supported locales served under /{locale}.
var supportedLocales = map[string]bool{"en": true, "id": true}

// Fixture modes accepted by the launcher.
const (
	FixtureParity             = "parity"
	FixtureUnavailableCatalog = "unavailable-catalog"
)

// Config is the validated runtime configuration. P2 fills source-directory
// resolution against the shared corpus; P1H carries listener fields only.
type Config struct {
	Port    int
	Fixture string
}

// errInvalidPort reports a malformed listener override.
type errInvalidPort struct {
	source string
	value  string
}

func (e *errInvalidPort) Error() string {
	return fmt.Sprintf("invalid %s %q: want integer 1-65535", e.source, e.value)
}

// parsePort validates one port override naming its source in diagnostics.
func parsePort(source, value string) (int, error) {
	port, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || port < 1 || port > 65535 {
		return 0, &errInvalidPort{source: source, value: value}
	}
	return port, nil
}

// ResolveConfig resolves an explicit --port flag, then AYOKODING_WEB_PORT,
// then 3102. Bare PORT is ignored by repository convention. --fixture selects
// the canned corpus variant for test and authoring fixtures. Tests use
// t.Setenv; the BDD glue applies the scenario environment the same way.
func ResolveConfig(args []string) (Config, error) {
	cfg := Config{Port: DefaultPort, Fixture: FixtureParity}
	flagPort := ""
	flagFixture := ""
	for index := 0; index < len(args); index++ {
		argument := args[index]
		name, value, hasValue := strings.Cut(argument, "=")
		takeNext := func() (string, error) {
			if hasValue {
				return value, nil
			}
			index++
			if index >= len(args) {
				return "", fmt.Errorf("flag %s requires a value", name)
			}
			return args[index], nil
		}
		var err error
		switch name {
		case "--port":
			if flagPort, err = takeNext(); err != nil {
				return Config{}, err
			}
		case "--fixture":
			if flagFixture, err = takeNext(); err != nil {
				return Config{}, err
			}
		default:
			return Config{}, fmt.Errorf("unknown flag %q", argument)
		}
	}
	if flagPort != "" {
		port, err := parsePort("--port", flagPort)
		if err != nil {
			return Config{}, err
		}
		cfg.Port = port
	} else if value, ok := os.LookupEnv("AYOKODING_WEB_PORT"); ok {
		port, err := parsePort("AYOKODING_WEB_PORT", value)
		if err != nil {
			return Config{}, err
		}
		cfg.Port = port
	}
	fixture := flagFixture
	if fixture == "" {
		if value, ok := os.LookupEnv("AYOKODING_WEB_FIXTURE"); ok {
			fixture = value
		}
	}
	if fixture != "" {
		switch fixture {
		case FixtureParity, FixtureUnavailableCatalog:
			cfg.Fixture = fixture
		default:
			return Config{}, fmt.Errorf("unknown --fixture %q: want parity or unavailable-catalog", fixture)
		}
	}
	return cfg, nil
}

// IsSupportedLocale reports whether locale has translated routes.
func IsSupportedLocale(locale string) bool {
	return supportedLocales[locale]
}

var errNoRedirect = errors.New("no redirect")

// CanonicalRedirect maps legacy inventory paths to canonical destinations.
func CanonicalRedirect(redirects map[string]string, path string) (string, error) {
	if destination, ok := redirects[path]; ok {
		return destination, nil
	}
	return "", errNoRedirect
}
