package bdd_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

const nativePythonBase = "docker.io/library/python:3.15@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24"

// nativeStoreJourney uses the real selected store; the instrumented exec
// denies registry operations and adds build-only offline controls.
func (w *world) nativeStoreJourney(environment bool) (resultErr error) {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	binary, err := exec.LookPath((&containers.Runtime{}).ResolveCLI())
	if err != nil {
		return fmt.Errorf("%w: find native podman: %w", errStepFailed, err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	invoke := func(ctx context.Context, _ string, args []string) (string, error) {
		actual, err := instrumentNativeArgs(args)
		if err != nil {
			return "", err
		}
		w.nativeTrace = append(w.nativeTrace, "original: "+strings.Join(args, " "), "actual: "+strings.Join(actual, " "))
		cmd := exec.CommandContext(ctx, binary, actual...)
		output, err := cmd.CombinedOutput()
		if args[0] == "build" {
			w.nativeTrace = append(w.nativeTrace, "build output: "+string(output))
		}
		if err != nil {
			return string(output), fmt.Errorf("native podman: %w", err)
		}
		return string(output), nil
	}
	baseID, err := invoke(ctx, binary, []string{"image", "inspect", "--format", "{{.Id}}", nativePythonBase})
	if err != nil || strings.TrimSpace(baseID) == "" {
		return fmt.Errorf("%w: pinned Python base absent from selected store: %w", errStepFailed, err)
	}
	w.nativeTrace = append(w.nativeTrace, "cached base ID: "+strings.TrimSpace(baseID))
	runID := fmt.Sprintf("p1-%d", time.Now().UnixNano())
	recipe := []byte("FROM " + nativePythonBase + "\nLABEL ayokoding.p1=" + runID + "\nRUN python3 -c 'open(\"/native-derived-proof\",\"w\").write(\"" + runID + "\")'\n")
	settings := containerplan.Settings{ContainerCLI: binary}
	planned, err := containerplan.Derived(settings, root, runID, nativePythonBase, recipe, nil)
	if err != nil {
		return fmt.Errorf("%w: plan native derived image: %w", errStepFailed, err)
	}
	derivedTag := planned.Tag
	var tags []string
	defer func() {
		resultErr = errors.Join(resultErr, cleanupNativeTags(binary, tags, invoke))
	}()
	if err := nativeTagAbsent(ctx, binary, derivedTag, invoke); err != nil {
		return err
	}
	tags = append(tags, derivedTag)
	builder := containers.Builder{Exec: invoke}
	builtTag, err := builder.BuildDerived(ctx, settings, root, runID, nativePythonBase, recipe, nil)
	if err != nil {
		return fmt.Errorf("%w: native derived build: %w", errStepFailed, err)
	}
	if builtTag != derivedTag {
		return fmt.Errorf("%w: derived tag changed", errStepFailed)
	}
	tag := builtTag
	if environment {
		lock := []byte("native fixture\n")
		install := catalog.Install{Command: []string{"python3", "-c", "open('/native-env-proof','w').write('" + runID + "-env')"}}
		imageRef := builtTag + "@sha256:" + strings.Repeat("a", 64)
		tag = containerplan.EnvironmentTag(runID, imageRef, lock, install.Command)
		if err := nativeTagAbsent(ctx, binary, tag, invoke); err != nil {
			return err
		}
		tags = append([]string{tag}, tags...)
		builtEnv, buildErr := builder.BuildEnvironment(ctx, settings, root, runID, imageRef, "fixture.lock", lock, install)
		if buildErr != nil {
			return fmt.Errorf("%w: native environment build: %w", errStepFailed, buildErr)
		}
		if builtEnv != tag {
			return fmt.Errorf("%w: environment tag changed", errStepFailed)
		}
	}
	return w.runNativeImage(ctx, binary, root, runID, tag, environment, invoke)
}

func cleanupNativeTags(binary string, tags []string, invoke func(context.Context, string, []string) (string, error)) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	var result error
	for _, tag := range tags {
		_, err := invoke(ctx, binary, []string{"image", "exists", tag})
		if err != nil {
			if exit, ok := errors.AsType[*exec.ExitError](err); !ok || exit.ExitCode() != 1 {
				result = errors.Join(result, fmt.Errorf("%w: inspect owned image for cleanup: %w", errStepFailed, err))
			}
			continue
		}
		if _, err := invoke(ctx, binary, []string{"image", "rm", tag}); err != nil {
			result = errors.Join(result, fmt.Errorf("%w: remove owned image %s: %w", errStepFailed, tag, err))
		}
	}
	return result
}

func (w *world) runNativeImage(ctx context.Context, binary, root, runID, tag string, environment bool, invoke func(context.Context, string, []string) (string, error)) error {
	workdir, err := os.MkdirTemp(root, "work-")
	if err != nil {
		return fmt.Errorf("%w: create empty run mount: %w", errStepFailed, err)
	}
	listArgs := []string{"ps", "-a", "--filter", "label=ayokoding.run=" + runID, "--format", "{{.Names}}"}
	beforeContainers, err := invoke(ctx, binary, listArgs)
	if err != nil || strings.TrimSpace(beforeContainers) != "" {
		return fmt.Errorf("%w: owned container namespace not empty: %q: %w", errStepFailed, beforeContainers, err)
	}
	before, err := invoke(ctx, binary, []string{"image", "inspect", "--format", "{{.Id}}", tag})
	if err != nil {
		return fmt.Errorf("%w: inspect built image: %w", errStepFailed, err)
	}
	code := "print(open('/native-derived-proof').read())"
	if environment {
		code += "; print(open('/native-env-proof').read())"
	}
	run := containerplan.PlanRun(containerplan.RunConfig{CLI: binary, RunID: runID, Image: tag, Command: []string{"python3", "-c", code}, Unit: ".", HostDir: workdir, CPUs: 1, Seq: 1, MemoryBytes: 512 * 1024 * 1024, UID: os.Getuid(), GID: os.Getgid(), KeepID: true})
	runtime := &containers.Runtime{Exec: func(ctx context.Context, cli string, args []string, _ []byte) (string, error) {
		return invoke(ctx, cli, args)
	}}
	missing := tag + "-missing"
	if err := nativeTagAbsent(ctx, binary, missing, invoke); err != nil {
		return err
	}
	missingPlan := containerplan.PlanRun(containerplan.RunConfig{CLI: binary, RunID: runID, Exec: 1, Image: missing, Command: []string{"python3", "-c", "print('unexpected')"}, Unit: ".", HostDir: workdir, CPUs: 1, Seq: 1, MemoryBytes: 512 * 1024 * 1024, UID: os.Getuid(), GID: os.Getgid()})
	_, missingErr := runtime.Run(ctx, missingPlan.Invoke, nil)
	if err := requireNativeMissing(missingErr); err != nil {
		return err
	}
	w.nativeTrace = append(w.nativeTrace, "missing image native exit: 125")
	out, err := runtime.Run(ctx, run.Invoke, nil)
	want := runID + "\n"
	if environment {
		want += runID + "-env\n"
	}
	if err != nil || out.ExitCode != 0 || out.Output != want {
		return fmt.Errorf("%w: native run status %d output %q: %w", errStepFailed, out.ExitCode, out.Output, err)
	}
	afterContainers, err := invoke(ctx, binary, listArgs)
	if err != nil || strings.TrimSpace(afterContainers) != "" {
		return fmt.Errorf("%w: owned containers remain: %q: %w", errStepFailed, afterContainers, err)
	}
	after, err := invoke(ctx, binary, []string{"image", "inspect", "--format", "{{.Id}}", tag})
	if err != nil || strings.TrimSpace(before) == "" || strings.TrimSpace(before) != strings.TrimSpace(after) {
		return fmt.Errorf("%w: image identity changed from %q to %q: %w", errStepFailed, before, after, err)
	}
	w.nativeImageID = strings.TrimSpace(before)
	w.nativeTrace = append(w.nativeTrace, "observed image ID: "+w.nativeImageID)
	w.nativeTrace = append(w.nativeTrace, "baked proof output: "+strings.TrimSpace(out.Output))
	w.podmanTag = tag
	return nil
}

func requireNativeMissing(err error) error {
	if exit, ok := errors.AsType[*exec.ExitError](err); ok && exit.ExitCode() == 125 {
		return nil
	}
	return fmt.Errorf("%w: missing local image must exit 125", errStepFailed)
}

func nativeTagAbsent(ctx context.Context, binary, tag string, invoke func(context.Context, string, []string) (string, error)) error {
	_, err := invoke(ctx, binary, []string{"image", "exists", tag})
	if err == nil {
		return fmt.Errorf("%w: generated tag already exists", errStepFailed)
	}
	if exit, ok := errors.AsType[*exec.ExitError](err); !ok || exit.ExitCode() != 1 {
		return fmt.Errorf("%w: cannot establish tag absence: %w", errStepFailed, err)
	}
	return nil
}

func (w *world) requireNativeStore() error {
	if w.nativeImageID == "" || w.podmanTag == "" {
		return fmt.Errorf("%w: native image identity absent", errStepFailed)
	}
	trace := strings.Join(w.nativeTrace, "\n")
	if !strings.Contains(trace, "actual: build --pull=never --network=none ") || !strings.Contains(trace, "--pull never "+w.podmanTag) {
		return fmt.Errorf("%w: native offline trace missing build or run: %s", errStepFailed, trace)
	}
	return nil
}
