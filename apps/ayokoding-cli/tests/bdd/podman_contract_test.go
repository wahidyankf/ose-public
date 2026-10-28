package bdd_test

import (
	"os"
	"slices"
	"testing"
)

func TestPodmanRootfulScenarioBinding(t *testing.T) {
	scenario := &world{driver: unitDriver{}, env: map[string]string{}}
	t.Cleanup(func() {
		scenario.restoreHostEnv()
		if scenario.syncTemp != "" {
			_ = os.RemoveAll(scenario.syncTemp)
		}
	})
	for _, step := range []struct {
		fn   func(string) error
		text string
	}{
		{scenario.given, "a container runtime reporting a rootful connection"},
		{scenario.when, "I check the runtime before creating a workload"},
		{scenario.then, "it exits with status 125"},
		{scenario.then, "no workload is created"},
	} {
		if err := step.fn(step.text); err != nil {
			t.Fatalf("%s: %v", step.text, err)
		}
	}
}

func TestPodmanDefaultAndProviderBindings(t *testing.T) {
	for _, testCase := range []struct {
		name  string
		steps []struct{ kind, text string }
	}{
		{"default", []struct{ kind, text string }{{"given", "an opted-in course with one unit"}, {"given", "no container runtime override is set"}, {"when", "I check the course by name"}, {"then", "the runner uses podman"}}},
		{"provider", []struct{ kind, text string }{{"given", "podman-compose version 1.6.0 is selected and Docker Compose is installed"}, {"when", "I check the Compose provider"}, {"then", "the selected podman-compose provider is used"}, {"then", "Docker Compose is not used"}}},
		{"derived", []struct{ kind, text string }{{"given", "a derived toolchain recipe in the selected Podman store"}, {"when", "I build and run the derived image"}, {"then", "the image built is the image run without a registry pull or push"}}},
		{"environment", []struct{ kind, text string }{{"given", "an environment image in the selected Podman store"}, {"when", "I run the environment image"}, {"then", "the local image is used without a registry pull"}}},
	} {
		t.Run(testCase.name, func(t *testing.T) {
			scenario := &world{driver: unitDriver{}, env: map[string]string{}}
			t.Cleanup(func() {
				scenario.restoreHostEnv()
				if scenario.syncTemp != "" {
					_ = os.RemoveAll(scenario.syncTemp)
				}
			})
			for _, step := range testCase.steps {
				handler := scenario.given
				if step.kind == "when" {
					handler = scenario.when
				}
				if step.kind == "then" {
					handler = scenario.then
				}
				if err := handler(step.text); err != nil {
					t.Fatalf("%s: %v", step.text, err)
				}
			}
		})
	}
}

func TestPodmanUnreachableScenarioBinding(t *testing.T) {
	scenario := &world{driver: unitDriver{}, env: map[string]string{}}
	t.Cleanup(func() {
		scenario.restoreHostEnv()
		if scenario.syncTemp != "" {
			_ = os.RemoveAll(scenario.syncTemp)
		}
	})
	for _, step := range []struct {
		fn   func(string) error
		text string
	}{
		{scenario.given, "an unreachable container runtime"},
		{scenario.when, "I check the runtime before creating a workload"},
		{scenario.then, "it exits with status 125"},
		{scenario.then, "no workload is created"},
	} {
		if err := step.fn(step.text); err != nil {
			t.Fatalf("%s: %v", step.text, err)
		}
	}
}

func TestFakeStoreRejectsMissingLocalImage(t *testing.T) {
	scenario := &world{driver: unitDriver{}, env: map[string]string{}}
	if err := scenario.given("an environment image in the selected Podman store"); err != nil {
		t.Fatal(err)
	}
	if err := scenario.runLocalImage("ayokoding-env/go:missing"); err == nil {
		t.Fatal("missing local image ran")
	}
}

func TestPodmanAdapterSelection(t *testing.T) {
	for _, testCase := range []struct {
		adapter string
		native  bool
	}{{"unit", false}, {"integration", false}, {"e2e", true}} {
		scenario := &world{adapter: testCase.adapter}
		if got := scenario.nativePodman(); got != testCase.native {
			t.Errorf("adapter %s native=%v, want %v", testCase.adapter, got, testCase.native)
		}
	}
}

func TestNativeStoreSelectsNativeAdapter(t *testing.T) {
	scenario := &world{adapter: "e2e"}
	if err := scenario.given("a derived toolchain recipe in the selected Podman store"); err != nil {
		t.Fatal(err)
	}
	if !scenario.nativePodman() {
		t.Fatal("native store selected fake execution")
	}
}

func TestNativeBuildInstrumentationPreservesOriginalArguments(t *testing.T) {
	original := []string{"build", "--layers", "--format", "docker", "--tag", "localhost/test:tag", "."}
	actual, err := instrumentNativeArgs(original)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"build", "--pull=never", "--network=none", "--layers", "--format", "docker", "--tag", "localhost/test:tag", "."}
	if !slices.Equal(actual, want) {
		t.Fatalf("actual=%v want=%v", actual, want)
	}
	for _, action := range []string{"pull", "push", "login"} {
		if _, err := instrumentNativeArgs([]string{action, "example"}); err == nil {
			t.Fatalf("%s allowed", action)
		}
	}
}
