package web_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// launcher records the launcher variables one test sets. The resolver reads
// only what it is given, so no process environment moves under test.
func launcher(values map[string]string) web.Environment {
	return func(key string) (string, bool) {
		value, ok := values[key]
		return value, ok
	}
}

// resolve runs ResolveConfig with the recorded launcher variables.
func resolve(args []string, values map[string]string) (web.Config, error) {
	return web.ResolveConfig(args, launcher(values))
}

func TestResolveConfigDefaultsTo3102(t *testing.T) {
	cfg, err := resolve(nil, nil)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != web.DefaultPort {
		t.Fatalf("default port = %d, want %d", cfg.Port, web.DefaultPort)
	}
}

func TestResolveConfigIgnoresBarePort(t *testing.T) {
	cfg, err := resolve(nil, map[string]string{"PORT": "4100"})
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != web.DefaultPort {
		t.Fatalf("bare PORT must be ignored, got port %d", cfg.Port)
	}
}

func TestResolveConfigPrefixedEnvWins(t *testing.T) {
	cfg, err := resolve(nil, map[string]string{"AYOKODING_WEB_PORT": "3200"})
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != 3200 {
		t.Fatalf("prefixed env port = %d, want 3200", cfg.Port)
	}
}

func TestResolveConfigExplicitFlagWinsOverEnv(t *testing.T) {
	cfg, err := resolve([]string{"--port", "3300"}, map[string]string{"AYOKODING_WEB_PORT": "3200"})
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != 3300 {
		t.Fatalf("flag port = %d, want 3300", cfg.Port)
	}
}

func TestResolveConfigRejectsInvalidPort(t *testing.T) {
	for _, value := range []string{"abc", "0", "70000", "-1", ""} {
		if _, err := resolve(nil, map[string]string{"AYOKODING_WEB_PORT": value}); err == nil {
			t.Fatalf("port %q must fail", value)
		}
	}
}

func TestResolveConfigRejectsInvalidFlag(t *testing.T) {
	if _, err := resolve([]string{"--port", "nope"}, nil); err == nil {
		t.Fatal("invalid --port must fail")
	}
	if _, err := resolve([]string{"--port", "0"}, nil); err == nil {
		t.Fatal("zero flag port must fail")
	} else if got := err.Error(); !contains(got, "--port") {
		t.Fatalf("diagnostic %q must name --port", got)
	}
}

func TestResolveErrorNamesSource(t *testing.T) {
	if _, err := resolve(nil, map[string]string{"AYOKODING_WEB_PORT": "abc"}); err == nil {
		t.Fatal("invalid env port must fail")
	} else if got := err.Error(); !contains(got, "AYOKODING_WEB_PORT") {
		t.Fatalf("diagnostic %q must name AYOKODING_WEB_PORT", got)
	}
}

func TestResolveRejectsUnknownAndMissingFlags(t *testing.T) {
	if _, err := resolve([]string{"--bogus"}, nil); err == nil {
		t.Fatal("unknown flag must fail")
	}
	if _, err := resolve([]string{"--port"}, nil); err == nil {
		t.Fatal("missing flag value must fail")
	}
	if _, err := resolve([]string{"positional"}, nil); err == nil {
		t.Fatal("positional args must fail")
	}
}

func TestResolveEqualsFormFlag(t *testing.T) {
	cfg, err := resolve([]string{"--port=3333"}, nil)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != 3333 {
		t.Fatalf("equals-form port = %d, want 3333", cfg.Port)
	}
}

func TestResolveFixtureMissingValue(t *testing.T) {
	if _, err := resolve([]string{"--fixture"}, nil); err == nil {
		t.Fatal("missing fixture value must fail")
	}
}

func TestResolveFixtureModes(t *testing.T) {
	cfg, err := resolve([]string{"--fixture", "unavailable-catalog"}, nil)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Fixture != web.FixtureUnavailableCatalog {
		t.Fatalf("fixture = %q, want unavailable-catalog", cfg.Fixture)
	}
	cfg, err = resolve(nil, map[string]string{"AYOKODING_WEB_FIXTURE": "parity"})
	if err != nil || cfg.Fixture != web.FixtureParity {
		t.Fatalf("env fixture = %+v, %v; want parity", cfg, err)
	}
	if _, err := resolve([]string{"--fixture", "nope"}, nil); err == nil {
		t.Fatal("unknown fixture must fail")
	}
}

func TestCanonicalRedirect(t *testing.T) {
	destination, err := web.CanonicalRedirect(map[string]string{"/old": "/new"}, "/old")
	if err != nil || destination != "/new" {
		t.Fatalf("redirect = %q, %v; want /new", destination, err)
	}
	if _, err := web.CanonicalRedirect(map[string]string{"/old": "/new"}, "/missing"); err == nil {
		t.Fatal("missing inventory entry must not redirect")
	}
}

func contains(body, fragment string) bool {
	for index := 0; index+len(fragment) <= len(body); index++ {
		if body[index:index+len(fragment)] == fragment {
			return true
		}
	}
	return false
}

func TestSupportedLocales(t *testing.T) {
	for _, locale := range []string{"en", "id"} {
		if !web.IsSupportedLocale(locale) {
			t.Fatalf("locale %q must be supported", locale)
		}
	}
	if web.IsSupportedLocale("xx") {
		t.Fatal("locale xx must not be supported")
	}
}
