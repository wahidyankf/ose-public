package web_test

import (
	"os"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

var launcherEnvKeys = []string{"PORT", "AYOKODING_WEB_PORT", "AYOKODING_WEB_FIXTURE"}

// clearLauncherEnv unsets every launcher variable, restoring previous values
// after the test. Call it before t.Setenv so no ambient shell value leaks in.
func clearLauncherEnv(t *testing.T) {
	t.Helper()
	for _, key := range launcherEnvKeys {
		if previous, ok := os.LookupEnv(key); ok {
			if err := os.Unsetenv(key); err != nil {
				t.Fatalf("unset %s: %v", key, err)
			}
			t.Cleanup(func() {
				_ = os.Setenv(key, previous)
			})
		}
	}
}

func TestResolveConfigDefaultsTo3102(t *testing.T) {
	clearLauncherEnv(t)
	cfg, err := web.ResolveConfig(nil)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != web.DefaultPort {
		t.Fatalf("default port = %d, want %d", cfg.Port, web.DefaultPort)
	}
}

func TestResolveConfigIgnoresBarePort(t *testing.T) {
	clearLauncherEnv(t)
	t.Setenv("PORT", "4100")
	cfg, err := web.ResolveConfig(nil)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != web.DefaultPort {
		t.Fatalf("bare PORT must be ignored, got port %d", cfg.Port)
	}
}

func TestResolveConfigPrefixedEnvWins(t *testing.T) {
	clearLauncherEnv(t)
	t.Setenv("AYOKODING_WEB_PORT", "3200")
	cfg, err := web.ResolveConfig(nil)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != 3200 {
		t.Fatalf("prefixed env port = %d, want 3200", cfg.Port)
	}
}

func TestResolveConfigExplicitFlagWinsOverEnv(t *testing.T) {
	clearLauncherEnv(t)
	t.Setenv("AYOKODING_WEB_PORT", "3200")
	cfg, err := web.ResolveConfig(
		[]string{"--port", "3300"},
	)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != 3300 {
		t.Fatalf("flag port = %d, want 3300", cfg.Port)
	}
}

func TestResolveConfigRejectsInvalidPort(t *testing.T) {
	clearLauncherEnv(t)
	for _, value := range []string{"abc", "0", "70000", "-1", ""} {
		t.Setenv("AYOKODING_WEB_PORT", value)
		if _, err := web.ResolveConfig(nil); err == nil {
			t.Fatalf("port %q must fail", value)
		}
	}
}

func TestResolveConfigRejectsInvalidFlag(t *testing.T) {
	clearLauncherEnv(t)
	if _, err := web.ResolveConfig([]string{"--port", "nope"}); err == nil {
		t.Fatal("invalid --port must fail")
	}
}

func TestResolveErrorNamesSource(t *testing.T) {
	clearLauncherEnv(t)
	t.Setenv("AYOKODING_WEB_PORT", "abc")
	if _, err := web.ResolveConfig(nil); err == nil {
		t.Fatal("invalid env port must fail")
	} else if got := err.Error(); !contains(got, "AYOKODING_WEB_PORT") {
		t.Fatalf("diagnostic %q must name AYOKODING_WEB_PORT", got)
	}
	if _, err := web.ResolveConfig([]string{"--port", "0"}); err == nil {
		t.Fatal("zero flag port must fail")
	} else if got := err.Error(); !contains(got, "--port") {
		t.Fatalf("diagnostic %q must name --port", got)
	}
}

func TestResolveRejectsUnknownAndMissingFlags(t *testing.T) {
	clearLauncherEnv(t)
	if _, err := web.ResolveConfig([]string{"--bogus"}); err == nil {
		t.Fatal("unknown flag must fail")
	}
	if _, err := web.ResolveConfig([]string{"--port"}); err == nil {
		t.Fatal("missing flag value must fail")
	}
	if _, err := web.ResolveConfig([]string{"positional"}); err == nil {
		t.Fatal("positional args must fail")
	}
}

func TestResolveEqualsFormFlag(t *testing.T) {
	clearLauncherEnv(t)
	cfg, err := web.ResolveConfig([]string{"--port=3333"})
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Port != 3333 {
		t.Fatalf("equals-form port = %d, want 3333", cfg.Port)
	}
}

func TestResolveFixtureMissingValue(t *testing.T) {
	clearLauncherEnv(t)
	if _, err := web.ResolveConfig([]string{"--fixture"}); err == nil {
		t.Fatal("missing fixture value must fail")
	}
}

func TestResolveFixtureModes(t *testing.T) {
	clearLauncherEnv(t)
	cfg, err := web.ResolveConfig([]string{"--fixture", "unavailable-catalog"})
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if cfg.Fixture != web.FixtureUnavailableCatalog {
		t.Fatalf("fixture = %q, want unavailable-catalog", cfg.Fixture)
	}
	t.Setenv("AYOKODING_WEB_FIXTURE", "parity")
	cfg, err = web.ResolveConfig(nil)
	if err != nil || cfg.Fixture != web.FixtureParity {
		t.Fatalf("env fixture = %+v, %v; want parity", cfg, err)
	}
	if _, err := web.ResolveConfig([]string{"--fixture", "nope"}); err == nil {
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
