package bdd_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

var (
	errLocalImageMissing = errors.New("local image missing")
	errRegistryOperation = errors.New("registry operation forbidden in native store proof")
)

func instrumentNativeArgs(args []string) ([]string, error) {
	if len(args) == 0 {
		return nil, errRegistryOperation
	}
	switch args[0] {
	case "pull", "push", "login":
		return nil, errRegistryOperation
	case "image", "manifest":
		if len(args) > 1 && (args[1] == "pull" || args[1] == "push") {
			return nil, errRegistryOperation
		}
		return append([]string(nil), args...), nil
	case "build":
		actual := make([]string, 0, len(args)+2)
		actual = append(actual, "build", "--pull=never", "--network=none")
		return append(actual, args[1:]...), nil
	default:
		return append([]string(nil), args...), nil
	}
}

func (w *world) nativePodman() bool { return w.adapter == "e2e" }

func (w *world) useDefaultPodman() error {
	if w.nativePodman() {
		return w.setHostEnv("AYOKODING_CONTAINER_CLI", "")
	}
	fake, err := w.buildFakeContainer()
	if err != nil {
		return err
	}
	root := w.syncTemp
	body, err := os.ReadFile(fake)
	if err != nil {
		return fmt.Errorf("%w: read fake: %w", errStepFailed, err)
	}
	rootDir, err := os.OpenRoot(root)
	if err != nil {
		return fmt.Errorf("%w: open fixture root: %w", errStepFailed, err)
	}
	defer func() { _ = rootDir.Close() }()
	if err := rootDir.WriteFile("podman", body, 0o700); err != nil {
		return fmt.Errorf("%w: write podman fixture: %w", errStepFailed, err)
	}
	if err := w.setHostEnv("PATH", root+string(os.PathListSeparator)+os.Getenv("PATH")); err != nil {
		return err
	}
	if err := w.setHostEnv("AYOKODING_CONTAINER_CLI", ""); err != nil {
		return err
	}
	if err := w.setHostEnv("FAKECONTAINER_STDOUT", "static ok\n"); err != nil {
		return err
	}
	return w.useServiceLog()
}

func (w *world) requirePodmanDefault() error {
	if err := w.requireStatus(0); err != nil {
		return err
	}
	if w.nativePodman() {
		if (&containers.Runtime{}).ResolveCLI() != "podman" {
			return fmt.Errorf("%w: runtime did not resolve podman", errStepFailed)
		}
		return nil
	}
	data, err := os.ReadFile(filepath.Join(w.syncTemp, "fakecontainer.log"))
	if err != nil {
		return fmt.Errorf("%w: read runtime log: %w", errStepFailed, err)
	}
	if !strings.Contains(string(data), "argv: info --format json") || !strings.Contains(string(data), "argv: run ") {
		return fmt.Errorf("%w: default podman calls=%s", errStepFailed, data)
	}
	return nil
}

func (w *world) useComposeProvider() error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	fixtures := map[string]string{
		"podman":         "#!/bin/sh\nprintf '%s\\n' '{\"host\":{\"security\":{\"rootless\":true}}}'\n",
		"podman-compose": "#!/bin/sh\necho selected >> '" + filepath.Join(root, "provider.log") + "'\necho 'podman-compose version 1.6.0'\n",
		"docker-compose": "#!/bin/sh\necho competitor >> '" + filepath.Join(root, "competitor.log") + "'\nexit 1\n",
	}
	if w.nativePodman() {
		delete(fixtures, "podman")
		delete(fixtures, "podman-compose")
	}
	for name, body := range fixtures {
		if err := os.WriteFile(filepath.Join(root, name), []byte(body), 0o700); err != nil {
			return fmt.Errorf("%w: write provider fixture: %w", errStepFailed, err)
		}
	}
	if !w.nativePodman() {
		for _, name := range []string{"bash", "jq"} {
			binary, err := exec.LookPath(name)
			if err != nil {
				return fmt.Errorf("%w: locate fixture tool: %w", errStepFailed, err)
			}
			if err := os.Symlink(binary, filepath.Join(root, name)); err != nil {
				return fmt.Errorf("%w: link fixture tool: %w", errStepFailed, err)
			}
		}
	}
	return nil
}

func (w *world) checkComposeProvider() error {
	path := filepath.Join(moduleRoot(), "..", "..", "scripts", "container-runtime-check")
	if w.nativePodman() {
		return w.checkNativeComposeProvider(path)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, path, "--compose")
	cmd.Dir = w.syncTemp
	cmd.Env = []string{"PATH=" + w.syncTemp, "HOME=" + w.syncTemp, "PODMAN_COMPOSE_PROVIDER=" + filepath.Join(w.syncTemp, "podman-compose")}
	out, err := cmd.CombinedOutput()
	w.result = Result{Stdout: string(out)}
	if err != nil {
		if exit, ok := errors.AsType[*exec.ExitError](err); ok {
			w.result.Status = exit.ExitCode()
			return nil
		}
		return fmt.Errorf("%w: execute preflight: %w", errStepFailed, err)
	}
	return nil
}

func (w *world) requireProviderCall(selected bool) error {
	if err := w.requireStatus(0); err != nil {
		return err
	}
	if w.result.Stdout != "" {
		return fmt.Errorf("%w: preflight output %q", errStepFailed, w.result.Stdout)
	}
	if w.nativePodman() && selected {
		return nil
	}
	name := "competitor.log"
	if selected {
		name = "provider.log"
	}
	body, err := os.ReadFile(filepath.Join(w.syncTemp, name))
	if selected && (err != nil || string(body) != "selected\n") {
		return fmt.Errorf("%w: provider log %q: %w", errStepFailed, body, err)
	}
	if !selected && !os.IsNotExist(err) {
		return fmt.Errorf("%w: competitor called: %q", errStepFailed, body)
	}
	return nil
}

func (w *world) buildAndRunLocalImage() error {
	if w.nativePodman() {
		return w.nativeStoreJourney(false)
	}
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	builder := containers.Builder{Exec: func(_ context.Context, _ string, args []string) (string, error) {
		w.podmanCalls = append(w.podmanCalls, strings.Join(args, " "))
		if args[0] == "info" {
			return `{"host":{"security":{"rootless":true}}}`, nil
		}
		for index, arg := range args {
			if arg == "--tag" && index+1 < len(args) {
				w.podmanStore[args[index+1]] = "derived-image-id"
			}
		}
		return "built", nil
	}}
	base := "docker.io/library/python:tag@sha256:" + strings.Repeat("a", 64)
	tag, err := builder.BuildDerived(context.Background(), containerplan.Settings{}, root, "go", base, []byte("FROM "+base+"\n"), nil)
	if err != nil {
		return fmt.Errorf("%w: build fake image: %w", errStepFailed, err)
	}
	return w.runLocalImage(tag)
}

func (w *world) runLocalImage(tag string) error {
	if w.nativePodman() {
		return w.nativeStoreJourney(true)
	}
	w.podmanTag = tag
	runtime := &containers.Runtime{Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
		w.podmanCalls = append(w.podmanCalls, strings.Join(args, " "))
		image, found := w.podmanStore[tag]
		if !found {
			return "", errLocalImageMissing
		}
		w.podmanImage = image
		return "", nil
	}}
	plan := containerplan.PlanRun(containerplan.RunConfig{CLI: "podman", Image: tag, UID: 501, GID: 20})
	_, err := runtime.Run(context.Background(), plan.Invoke, nil)
	if err != nil {
		return fmt.Errorf("%w: run fake image: %w", errStepFailed, err)
	}
	return nil
}

func (w *world) requireLocalImageCalls(built bool) error {
	joined := strings.Join(w.podmanCalls, "\n")
	if strings.Contains(joined, "\npull ") || strings.Contains(joined, "\npush ") || !strings.Contains(joined, "--pull never "+w.podmanTag) {
		return fmt.Errorf("%w: local run calls %q", errStepFailed, joined)
	}
	if built && !strings.Contains(joined, "build --layers --format docker --tag "+w.podmanTag+" ") {
		return fmt.Errorf("%w: build/run image mismatch %q", errStepFailed, joined)
	}
	if w.podmanImage == "" || w.podmanImage != w.podmanStore[w.podmanTag] {
		return fmt.Errorf("%w: local image identity mismatch", errStepFailed)
	}
	return nil
}

func (w *world) givenPodman(text string) error {
	switch text {
	case `no container runtime override is set`:
		return w.useDefaultPodman()
	case `podman-compose version 1.6.0 is selected and Docker Compose is installed`:
		return w.useComposeProvider()
	case `a derived toolchain recipe in the selected Podman store`, `an environment image in the selected Podman store`:
		w.podmanCalls = nil
		w.podmanTag = ""
		w.podmanImage = ""
		w.podmanStore = map[string]string{"ayokoding-env/go:fixture": "environment-image-id"}
		return nil
	case `a container runtime reporting a rootful connection`, `an unreachable container runtime`:
		if text == `an unreachable container runtime` && w.nativePodman() {
			return w.useNativeUnreachable()
		}
		if err := w.useRunCourse("static-unit", ""); err != nil {
			return err
		}
		if err := w.useServiceLog(); err != nil {
			return err
		}
		vars := map[string]string{"FAKECONTAINER_ROOTFUL": "1"}
		if text == `an unreachable container runtime` {
			vars = map[string]string{"FAKECONTAINER_DAEMON_DOWN": "1"}
		}
		return w.useFakeContainerCLI(vars)
	default:
		return w.givenSync(text)
	}
}

func (w *world) whenPodman(text string) error {
	switch text {
	case `I check the runtime before creating a workload`:
		return w.runRunCourse()
	case `I check the Compose provider`:
		return w.checkComposeProvider()
	case `I build and run the derived image`:
		return w.buildAndRunLocalImage()
	case `I run the environment image`:
		return w.runLocalImage("ayokoding-env/go:fixture")
	default:
		return w.whenSync(text)
	}
}

func (w *world) thenPodman(text string) error {
	switch text {
	case `no workload is created`:
		data, err := os.ReadFile(filepath.Join(w.syncTemp, "fakecontainer.log"))
		if err != nil {
			return fmt.Errorf("%w: read runtime log: %w", errStepFailed, err)
		}
		for line := range strings.SplitSeq(strings.TrimSpace(string(data)), "\n") {
			if !strings.HasPrefix(line, "argv: info ") {
				return fmt.Errorf("%w: unexpected runtime call %q", errStepFailed, line)
			}
		}
		return nil
	case `the runner uses podman`:
		return w.requirePodmanDefault()
	case `the selected podman-compose provider is used`:
		return w.requireProviderCall(true)
	case `Docker Compose is not used`:
		return w.requireProviderCall(false)
	case `the image built is the image run without a registry pull or push`:
		if w.nativePodman() {
			return w.requireNativeStore()
		}
		return w.requireLocalImageCalls(true)
	case `the local image is used without a registry pull`:
		if w.nativePodman() {
			return w.requireNativeStore()
		}
		return w.requireLocalImageCalls(false)
	default:
		return w.thenContract(text)
	}
}

func (w *world) checkNativeComposeProvider(script string) error {
	provider, err := exec.LookPath("podman-compose")
	if err != nil {
		return fmt.Errorf("%w: locate native provider: %w", errStepFailed, err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	env := append(os.Environ(), "PATH="+w.syncTemp+string(os.PathListSeparator)+os.Getenv("PATH"), "PODMAN_COMPOSE_PROVIDER="+provider)
	check := exec.CommandContext(ctx, script, "--compose")
	check.Dir = w.syncTemp
	check.Env = env
	output, err := check.CombinedOutput()
	if err != nil || len(output) != 0 {
		return fmt.Errorf("%w: native preflight output %q: %w", errStepFailed, output, err)
	}
	version := exec.CommandContext(ctx, "podman", "compose", "version")
	version.Dir = w.syncTemp
	version.Env = env
	output, err = version.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%w: native provider dispatch: %w", errStepFailed, err)
	}
	if !strings.Contains(string(output), "podman-compose version 1.6.0") {
		return fmt.Errorf("%w: native provider version %q", errStepFailed, output)
	}
	w.result = Result{Status: 0, Stdout: "", Stderr: ""}
	return nil
}

func (w *world) useNativeUnreachable() error {
	if err := w.useRunCourse("static-unit", ""); err != nil {
		return err
	}
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	socket := filepath.Join(root, "absent.sock")
	if _, err := os.Stat(socket); !os.IsNotExist(err) {
		return fmt.Errorf("%w: socket path is not absent", errStepFailed)
	}
	binary, err := exec.LookPath("podman")
	if err != nil {
		return fmt.Errorf("%w: locate podman: %w", errStepFailed, err)
	}
	dir, err := os.OpenRoot(root)
	if err != nil {
		return fmt.Errorf("%w: open scenario root: %w", errStepFailed, err)
	}
	defer func() { _ = dir.Close() }()
	wrapper := "#!/bin/sh\nprintf 'argv: %s\\n' \"$*\" >> \"$AYOKODING_TEST_CALL_LOG\"\nexec \"$AYOKODING_TEST_PODMAN\" \"$@\"\n"
	if err := dir.WriteFile("native-engine", []byte(wrapper), 0o700); err != nil {
		return fmt.Errorf("%w: write runtime recorder: %w", errStepFailed, err)
	}
	for key, value := range map[string]string{
		"AYOKODING_CONTAINER_CLI": filepath.Join(root, "native-engine"),
		"AYOKODING_TEST_CALL_LOG": filepath.Join(root, "fakecontainer.log"),
		"AYOKODING_TEST_PODMAN":   binary,
		"CONTAINER_HOST":          "unix://" + socket,
		"CONTAINER_CONNECTION":    "",
	} {
		if err := w.setHostEnv(key, value); err != nil {
			return err
		}
	}
	return nil
}
