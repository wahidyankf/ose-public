"""Install and uninstall for the current user: the manifest is the ownership commit point, and only owned files go.

An install writes everything beside its final names first, then replaces the artifact, the launcher, and last the
manifest, so a crash between any two steps leaves a state the next command can read: the old manifest still names the
old install until the new one is complete. An uninstall deletes the launcher and the artifact first and the manifest
last, so an interrupted removal is finished by running it again.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from typekit import Err, Ok

from ferret import __version__
from ferret.application.ports import InstalledFacts, Runtime, SourceArtifact, StagedInstall, StagePlan, UserInstall
from ferret.application.store import require_safe
from ferret.domain.errors import ErrorCode, FerretError, FerretResult, as_internal_failure
from ferret.domain.install import (
    ARTIFACT_MODE,
    LAUNCHER_MODE,
    MANIFEST_MODE,
    Manifest,
    PathAction,
    is_ferret_artifact_path,
    launcher_artifact,
    launcher_script,
    parse_manifest,
    path_action,
)
from ferret.domain.timestamps import format_timestamp


@dataclass(frozen=True, slots=True)
class InstallOutcome:
    """The result of ``self install``: what now stands on disk and which owned version, if any, it replaced."""

    result: Literal["installed", "already_installed"]
    version: str
    artifact_path: Path
    launcher_path: Path
    manifest_path: Path
    path_action: PathAction
    replaced_owned_version: str | None


@dataclass(frozen=True, slots=True)
class UninstallOutcome:
    """The result of ``self uninstall``: which files were removed, and whether the data was deleted too."""

    result: Literal["uninstalled", "not_installed"]
    removed_paths: tuple[Path, ...]
    path_action: Literal["none"]
    data_action: Literal["kept", "deleted"]


def _untrusted(fault: ValueError | RecursionError, failure: ErrorCode) -> FerretError:
    """The closed failure for a manifest that cannot be read: ``failure``, or unavailable storage when it is too deep.

    A manifest nested past the interpreter's limit breaks no rule, and ``main`` has always answered it that way.
    """
    if isinstance(fault, RecursionError):
        return FerretError("ferret.storage.unavailable")
    return FerretError(failure)


def _parse_recorded(installer: UserInstall, content: bytes | None, failure: ErrorCode) -> FerretResult[Manifest]:
    """The install the manifest's bytes record, or ``failure`` when there are none or they cannot be trusted."""
    if content is None:
        return Err(FerretError(failure))
    return parse_manifest(content, installer.paths).map_err(lambda fault: _untrusted(fault, failure))


def _recorded_by(installer: UserInstall, facts: InstalledFacts, failure: ErrorCode) -> FerretResult[Manifest | None]:
    """The install the manifest file recorded, once ``facts`` says it is the private file FERRET writes."""
    if facts.kind == "missing":
        return Ok(None)
    if facts.kind != "file" or not facts.owned_by_current_user or facts.mode != MANIFEST_MODE:
        return Err(FerretError(failure))
    return installer.read_manifest().flat_map(lambda content: _parse_recorded(installer, content, failure))


def _read_manifest(installer: UserInstall, failure: ErrorCode) -> FerretResult[Manifest | None]:
    """The recorded install, ``None`` when there is no manifest, or ``failure`` when what is there cannot be trusted."""
    return installer.facts(installer.paths.manifest).flat_map(lambda facts: _recorded_by(installer, facts, failure))


def _require_directory_or_nothing(facts: InstalledFacts) -> FerretResult[None]:
    """Refuse a path where an install needs a directory, unless nothing is there yet."""
    if facts.kind not in ("missing", "directory"):
        return Err(FerretError("ferret.install.collision"))
    return Ok(None)


def _is_our_launcher(facts: InstalledFacts, installer: UserInstall) -> FerretResult[bool]:
    """Whether this user made the launcher in the way: ours, or an update that was cut short.

    Two shapes count. The current one is a script naming where some version's artifact lives, recognized by its
    exact bytes. The one before it was a symbolic link to the same place, and it is still accepted so an install
    made by an earlier release can be upgraded and removed rather than reported as a collision.
    """
    if not facts.owned_by_current_user:
        return Ok(False)
    if facts.kind == "symlink":
        return Ok(facts.target is not None and is_ferret_artifact_path(facts.target, installer.paths))
    if facts.kind != "file":
        return Ok(False)
    return installer.read_launcher().map(
        lambda content: content is not None and launcher_artifact(content, installer.paths) is not None
    )


@dataclass(frozen=True, slots=True)
class _Standing:
    """What stands where an install is about to write, once nothing there is in its way."""

    launcher: InstalledFacts
    artifact: InstalledFacts


def _launcher_in_place(installer: UserInstall) -> FerretResult[InstalledFacts]:
    """The facts of the launcher, refusing one FERRET cannot prove it made."""

    def ours_or_missing(launcher: InstalledFacts) -> FerretResult[InstalledFacts]:
        if launcher.kind == "missing":
            return Ok(launcher)
        return _is_our_launcher(launcher, installer).flat_map(
            lambda ours: Ok(launcher) if ours else Err(FerretError("ferret.install.collision"))
        )

    return installer.facts(installer.paths.launcher).flat_map(ours_or_missing)


def _artifact_in_place(
    installer: UserInstall, source: SourceArtifact, previous: Manifest | None
) -> FerretResult[InstalledFacts]:
    """The facts of the artifact's path, refusing anything there that is not this build or the one recorded."""
    target = installer.paths.artifact(__version__)

    def ours_or_missing(artifact: InstalledFacts) -> FerretResult[InstalledFacts]:
        if artifact.kind != "missing":
            # A file at the artifact's path is ours only if it is this very build, or the build the manifest recorded.
            ours = {source.sha256}
            if previous is not None and previous.artifact_path == target:
                ours.add(previous.artifact_sha256)
            if not (artifact.kind == "file" and artifact.owned_by_current_user and artifact.sha256 in ours):
                return Err(FerretError("ferret.install.collision"))
        return Ok(artifact)

    return installer.facts(target).flat_map(ours_or_missing)


def _find_room(installer: UserInstall, source: SourceArtifact, previous: Manifest | None) -> FerretResult[_Standing]:
    """Refuse anything in the way that FERRET cannot prove it made, and say what stands at the launcher and artifact."""
    paths = installer.paths
    return (
        installer.facts(paths.share)
        .flat_map(_require_directory_or_nothing)
        .flat_map(lambda _: installer.facts(paths.version_directory(__version__)))
        .flat_map(_require_directory_or_nothing)
        .flat_map(lambda _: _launcher_in_place(installer))
        .flat_map(
            lambda launcher: _artifact_in_place(installer, source, previous).map(
                lambda artifact: _Standing(launcher, artifact)
            )
        )
    )


def _replace_all(installer: UserInstall, staged: StagedInstall) -> FerretResult[None]:
    """Replace the artifact, then the launcher, and last the manifest: the ownership commit."""
    return (
        installer.replace_artifact(staged)
        .flat_map(lambda _: installer.replace_launcher(staged))
        .flat_map(lambda _: installer.replace_manifest(staged))
    )


def _replace_install(
    installer: UserInstall, manifest: Manifest, script: bytes, previous: Manifest | None
) -> FerretResult[None]:
    """Stage the three files, replace the artifact, the launcher, and last the manifest, then drop an older version."""
    return (
        installer.stage(StagePlan(version=__version__, launcher=script, manifest=manifest.to_bytes()))
        .flat_map(lambda staged: _replace_all(installer, staged))
        .flat_map(
            lambda _: (
                _discard(installer, previous) if previous is not None and previous.version != __version__ else Ok(None)
            )
        )
    )


def _is_complete(
    installer: UserInstall, source: SourceArtifact, previous: Manifest | None, standing: _Standing, script: bytes
) -> FerretResult[bool]:
    """Whether what stands is already exactly this install: the recorded version, the artifact, and the launcher."""
    if not (
        previous is not None
        and previous.version == __version__
        and previous.artifact_sha256 == source.sha256
        and standing.artifact.kind == "file"
        and standing.artifact.mode == ARTIFACT_MODE
        and standing.artifact.sha256 == source.sha256
        and standing.launcher.kind == "file"
        and standing.launcher.mode == LAUNCHER_MODE
    ):
        return Ok(False)
    return installer.read_launcher().map(lambda content: content == script)


def _outcome(
    runtime: Runtime, result: Literal["installed", "already_installed"], replaced: str | None
) -> InstallOutcome:
    """What now stands on disk for this build, and the owned version it replaced."""
    installer = runtime.installer
    paths = installer.paths
    return InstallOutcome(
        result,
        __version__,
        paths.artifact(__version__),
        paths.launcher,
        paths.manifest,
        path_action(installer.path_variable, paths.bin),
        replaced,
    )


def _write_install(
    runtime: Runtime, source: SourceArtifact, previous: Manifest | None, script: bytes
) -> FerretResult[InstallOutcome]:
    """Write the install under a manifest stamped now, and report the owned version it replaced."""
    installer = runtime.installer
    paths = installer.paths
    return (
        format_timestamp(runtime.clock.now())
        .map_err(as_internal_failure)
        .map(
            lambda installed_at: Manifest(
                version=__version__,
                artifact_path=paths.artifact(__version__),
                artifact_sha256=source.sha256,
                launcher_path=paths.launcher,
                installed_at=installed_at,
            )
        )
        .flat_map(lambda manifest: _replace_install(installer, manifest, script, previous))
        .map(lambda _: _outcome(runtime, "installed", None if previous is None else previous.version))
    )


def _install(
    runtime: Runtime, source: SourceArtifact, previous: Manifest | None, standing: _Standing
) -> FerretResult[InstallOutcome]:
    """Write the install, or report that what stands is already exactly it, once nothing is in the way."""
    installer = runtime.installer
    return (
        launcher_script(installer.interpreter, installer.paths.artifact(__version__))
        # A home or interpreter path the launcher cannot quote exactly; writing an approximate one is worse.
        .map_err(lambda _: FerretError("ferret.storage.unavailable"))
        .flat_map(
            lambda script: _is_complete(installer, source, previous, standing, script).flat_map(
                lambda complete: (
                    Ok(_outcome(runtime, "already_installed", None))
                    if complete
                    else _write_install(runtime, source, previous, script)
                )
            )
        )
    )


def install_user(runtime: Runtime) -> FerretResult[InstallOutcome]:
    """Install the running artifact for the current user, replacing an older install this user's manifest records.

    Anything in the way that FERRET cannot prove it made is a collision and nothing is changed. An install that is
    already complete is reported as such without a write.
    """
    installer = runtime.installer
    return (
        installer.recover()
        .flat_map(lambda _: installer.source())
        .flat_map(
            lambda source: _read_manifest(installer, "ferret.install.collision").flat_map(
                lambda previous: _find_room(installer, source, previous).flat_map(
                    lambda standing: _install(runtime, source, previous, standing)
                )
            )
        )
    )


def _discard(installer: UserInstall, previous: Manifest) -> FerretResult[None]:
    """Delete an older version's artifact, but only while it is still exactly the file its manifest recorded."""

    def remove_if_recorded(facts: InstalledFacts) -> FerretResult[None]:
        if facts.kind == "file" and facts.owned_by_current_user and facts.sha256 == previous.artifact_sha256:
            return installer.remove(previous.artifact_path).flat_map(
                lambda _: installer.remove_empty_directory(installer.paths.version_directory(previous.version))
            )
        return Ok(None)

    return installer.facts(previous.artifact_path).flat_map(remove_if_recorded)


def _launcher_starts(installer: UserInstall, facts: InstalledFacts, artifact: Path) -> FerretResult[bool]:
    """Whether the launcher in place is one FERRET wrote for exactly ``artifact``, in either shape it has had."""
    if not facts.owned_by_current_user:
        return Ok(False)
    if facts.kind == "symlink":
        return Ok(facts.target == str(artifact))
    if facts.kind != "file":
        return Ok(False)
    return installer.read_launcher().map(
        lambda content: content is not None and launcher_artifact(content, installer.paths) == artifact
    )


@dataclass(frozen=True, slots=True)
class _Present:
    """Which of the two files an install owns still stand."""

    launcher: bool
    artifact: bool


def _launcher_matches(installer: UserInstall, manifest: Manifest, launcher: InstalledFacts) -> FerretResult[None]:
    """Refuse a launcher in place that is not exactly the one the manifest recorded."""
    if launcher.kind == "missing":
        return Ok(None)
    return _launcher_starts(installer, launcher, manifest.artifact_path).flat_map(
        lambda starts: Ok(None) if starts else Err(FerretError("ferret.install.ownership-mismatch"))
    )


def _artifact_matches(manifest: Manifest, artifact: InstalledFacts) -> FerretResult[None]:
    """Refuse an artifact in place that is not exactly the file the manifest recorded."""
    if artifact.kind != "missing" and not (
        artifact.kind == "file" and artifact.owned_by_current_user and artifact.sha256 == manifest.artifact_sha256
    ):
        return Err(FerretError("ferret.install.ownership-mismatch"))
    return Ok(None)


def _verify_owned(installer: UserInstall, manifest: Manifest) -> FerretResult[_Present]:
    """Which owned files still stand, refusing unless each present one is exactly what was recorded."""
    return installer.facts(manifest.launcher_path).flat_map(
        lambda launcher: (
            _launcher_matches(installer, manifest, launcher)
            .flat_map(lambda _: installer.facts(manifest.artifact_path))
            .flat_map(
                lambda artifact: _artifact_matches(manifest, artifact).map(
                    lambda _: _Present(launcher=launcher.kind != "missing", artifact=artifact.kind != "missing")
                )
            )
        )
    )


def _remove_owned(installer: UserInstall, manifest: Manifest, present: _Present) -> FerretResult[list[Path]]:
    """Delete the launcher and the artifact where they stand, and the manifest last; the paths that were removed."""
    paths = installer.paths
    removed: list[Path] = []

    def forget(path: Path) -> FerretResult[None]:
        return installer.remove(path).tap(lambda _: removed.append(path))

    return (
        (forget(manifest.launcher_path) if present.launcher else Ok(None))
        .flat_map(lambda _: forget(manifest.artifact_path) if present.artifact else Ok(None))
        .flat_map(lambda _: installer.remove_empty_directory(paths.version_directory(manifest.version)))
        .flat_map(lambda _: forget(paths.manifest))
        .flat_map(lambda _: installer.remove_empty_directory(paths.share))
        .map(lambda _: removed)
    )


def _remove_recorded(installer: UserInstall, manifest: Manifest | None) -> FerretResult[list[Path]]:
    """Remove what ``manifest`` owns once each present file is proved to be it; with none there is nothing to remove."""
    if manifest is None:
        return Ok([])
    return _verify_owned(installer, manifest).flat_map(lambda present: _remove_owned(installer, manifest, present))


def _purge_if_present(runtime: Runtime) -> FerretResult[None]:
    """Delete the data home, if there is one."""
    return runtime.files.facts(None).flat_map(
        lambda facts: runtime.files.purge() if facts.kind != "missing" else Ok(None)
    )


def _uninstalled(
    runtime: Runtime, manifest: Manifest | None, removed: list[Path], *, purge_data: bool
) -> FerretResult[UninstallOutcome]:
    """Delete the data home when asked, if there is one, and report what the uninstall did."""
    purged = _purge_if_present(runtime) if purge_data else Ok(None)
    return purged.map(
        lambda _: UninstallOutcome(
            result="uninstalled" if manifest is not None else "not_installed",
            removed_paths=tuple(sorted(removed, key=str)),
            path_action="none",
            data_action="deleted" if purge_data else "kept",
        )
    )


def uninstall_user(runtime: Runtime, *, purge_data: bool, confirmed: bool) -> FerretResult[UninstallOutcome]:
    """Remove exactly the files the manifest owns, manifest last, and delete the data only when asked and confirmed.

    Everything is checked before the first deletion: an unconfirmed purge, an unsafe data home, and any owned file
    that no longer matches the manifest all stop the command with nothing removed.
    """
    if purge_data and not confirmed:
        return Err(FerretError("ferret.args.confirmation-required"))
    installer = runtime.installer
    safe = (
        runtime.files.facts(None).flat_map(lambda facts: require_safe(facts, "directory")) if purge_data else Ok(None)
    )
    return safe.flat_map(lambda _: _read_manifest(installer, "ferret.install.ownership-mismatch")).flat_map(
        lambda manifest: _remove_recorded(installer, manifest).flat_map(
            lambda removed: _uninstalled(runtime, manifest, removed, purge_data=purge_data)
        )
    )
