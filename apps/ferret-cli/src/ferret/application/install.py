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
from ferret.application.ports import InstalledFacts, Runtime, SourceArtifact, StagePlan, UserInstall
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


def _read_manifest(installer: UserInstall, failure: ErrorCode) -> FerretResult[Manifest | None]:
    """The recorded install, ``None`` when there is no manifest, or ``failure`` when what is there cannot be trusted."""
    facts = installer.facts(installer.paths.manifest)
    if facts.kind == "missing":
        return Ok(None)
    if facts.kind != "file" or not facts.owned_by_current_user or facts.mode != MANIFEST_MODE:
        return Err(FerretError(failure))
    content = installer.read_manifest()
    if content is None:
        return Err(FerretError(failure))
    return parse_manifest(content, installer.paths).map_err(lambda fault: _untrusted(fault, failure))


def _require_directory_or_nothing(facts: InstalledFacts) -> FerretResult[None]:
    """Refuse a path where an install needs a directory, unless nothing is there yet."""
    if facts.kind not in ("missing", "directory"):
        return Err(FerretError("ferret.install.collision"))
    return Ok(None)


def _is_our_launcher(facts: InstalledFacts, installer: UserInstall) -> bool:
    """Whether this user made the launcher in the way: ours, or an update that was cut short.

    Two shapes count. The current one is a script naming where some version's artifact lives, recognized by its
    exact bytes. The one before it was a symbolic link to the same place, and it is still accepted so an install
    made by an earlier release can be upgraded and removed rather than reported as a collision.
    """
    if not facts.owned_by_current_user:
        return False
    if facts.kind == "symlink":
        return facts.target is not None and is_ferret_artifact_path(facts.target, installer.paths)
    if facts.kind != "file":
        return False
    content = installer.read_launcher()
    return content is not None and launcher_artifact(content, installer.paths) is not None


@dataclass(frozen=True, slots=True)
class _Standing:
    """What stands where an install is about to write, once nothing there is in its way."""

    launcher: InstalledFacts
    artifact: InstalledFacts


def _find_room(installer: UserInstall, source: SourceArtifact, previous: Manifest | None) -> FerretResult[_Standing]:
    """Refuse anything in the way that FERRET cannot prove it made, and say what stands at the launcher and artifact."""
    paths = installer.paths
    for directory in (paths.share, paths.version_directory(__version__)):
        free = _require_directory_or_nothing(installer.facts(directory))
        if isinstance(free, Err):
            return free
    launcher = installer.facts(paths.launcher)
    if launcher.kind != "missing" and not _is_our_launcher(launcher, installer):
        return Err(FerretError("ferret.install.collision"))
    target = paths.artifact(__version__)
    artifact = installer.facts(target)
    if artifact.kind != "missing":
        # A file at the artifact's path is ours only if it is this very build, or the build the manifest recorded.
        ours = {source.sha256}
        if previous is not None and previous.artifact_path == target:
            ours.add(previous.artifact_sha256)
        if not (artifact.kind == "file" and artifact.owned_by_current_user and artifact.sha256 in ours):
            return Err(FerretError("ferret.install.collision"))
    return Ok(_Standing(launcher, artifact))


def _replace_install(installer: UserInstall, manifest: Manifest, script: bytes, previous: Manifest | None) -> None:
    """Stage the three files, replace the artifact, the launcher, and last the manifest, then drop an older version."""
    staged = installer.stage(StagePlan(version=__version__, launcher=script, manifest=manifest.to_bytes()))
    installer.replace_artifact(staged)
    installer.replace_launcher(staged)
    installer.replace_manifest(staged)
    if previous is not None and previous.version != __version__:
        _discard(installer, previous)


def _is_complete(
    installer: UserInstall, source: SourceArtifact, previous: Manifest | None, standing: _Standing, script: bytes
) -> bool:
    """Whether what stands is already exactly this install: the recorded version, the artifact, and the launcher."""
    return (
        previous is not None
        and previous.version == __version__
        and previous.artifact_sha256 == source.sha256
        and standing.artifact.kind == "file"
        and standing.artifact.mode == ARTIFACT_MODE
        and standing.artifact.sha256 == source.sha256
        and standing.launcher.kind == "file"
        and standing.launcher.mode == LAUNCHER_MODE
        and installer.read_launcher() == script
    )


def _install(
    runtime: Runtime, source: SourceArtifact, previous: Manifest | None, standing: _Standing
) -> FerretResult[InstallOutcome]:
    """Write the install, or report that what stands is already exactly it, once nothing is in the way."""
    installer = runtime.installer
    paths = installer.paths
    target = paths.artifact(__version__)
    action = path_action(installer.path_variable, paths.bin)
    built = launcher_script(installer.interpreter, target)
    if isinstance(built, Err):
        # A home or interpreter path the launcher cannot quote exactly; writing an approximate one is worse.
        return Err(FerretError("ferret.storage.unavailable"))
    script = built.value
    if _is_complete(installer, source, previous, standing, script):
        return Ok(
            InstallOutcome("already_installed", __version__, target, paths.launcher, paths.manifest, action, None)
        )
    return (
        format_timestamp(runtime.clock.now())
        .map_err(as_internal_failure)
        .map(
            lambda installed_at: Manifest(
                version=__version__,
                artifact_path=target,
                artifact_sha256=source.sha256,
                launcher_path=paths.launcher,
                installed_at=installed_at,
            )
        )
        .tap(lambda manifest: _replace_install(installer, manifest, script, previous))
        .map(
            lambda _: InstallOutcome(
                "installed",
                __version__,
                target,
                paths.launcher,
                paths.manifest,
                action,
                None if previous is None else previous.version,
            )
        )
    )


def install_user(runtime: Runtime) -> FerretResult[InstallOutcome]:
    """Install the running artifact for the current user, replacing an older install this user's manifest records.

    Anything in the way that FERRET cannot prove it made is a collision and nothing is changed. An install that is
    already complete is reported as such without a write.
    """
    installer = runtime.installer
    installer.recover()
    source = installer.source()
    return _read_manifest(installer, "ferret.install.collision").flat_map(
        lambda previous: _find_room(installer, source, previous).flat_map(
            lambda standing: _install(runtime, source, previous, standing)
        )
    )


def _discard(installer: UserInstall, previous: Manifest) -> None:
    """Delete an older version's artifact, but only while it is still exactly the file its manifest recorded."""
    facts = installer.facts(previous.artifact_path)
    if facts.kind == "file" and facts.owned_by_current_user and facts.sha256 == previous.artifact_sha256:
        installer.remove(previous.artifact_path)
        installer.remove_empty_directory(installer.paths.version_directory(previous.version))


def _launcher_starts(installer: UserInstall, facts: InstalledFacts, artifact: Path) -> bool:
    """Whether the launcher in place is one FERRET wrote for exactly ``artifact``, in either shape it has had."""
    if not facts.owned_by_current_user:
        return False
    if facts.kind == "symlink":
        return facts.target == str(artifact)
    if facts.kind != "file":
        return False
    content = installer.read_launcher()
    return content is not None and launcher_artifact(content, installer.paths) == artifact


@dataclass(frozen=True, slots=True)
class _Present:
    """Which of the two files an install owns still stand."""

    launcher: bool
    artifact: bool


def _verify_owned(installer: UserInstall, manifest: Manifest) -> FerretResult[_Present]:
    """Which owned files still stand, refusing unless each present one is exactly what was recorded."""
    launcher = installer.facts(manifest.launcher_path)
    if launcher.kind != "missing" and not _launcher_starts(installer, launcher, manifest.artifact_path):
        return Err(FerretError("ferret.install.ownership-mismatch"))
    artifact = installer.facts(manifest.artifact_path)
    if artifact.kind != "missing" and not (
        artifact.kind == "file" and artifact.owned_by_current_user and artifact.sha256 == manifest.artifact_sha256
    ):
        return Err(FerretError("ferret.install.ownership-mismatch"))
    return Ok(_Present(launcher=launcher.kind != "missing", artifact=artifact.kind != "missing"))


def _remove_owned(installer: UserInstall, manifest: Manifest, present: _Present) -> list[Path]:
    """Delete the launcher and the artifact where they stand, and the manifest last; the paths that were removed."""
    paths = installer.paths
    removed: list[Path] = []
    if present.launcher:
        installer.remove(manifest.launcher_path)
        removed.append(manifest.launcher_path)
    if present.artifact:
        installer.remove(manifest.artifact_path)
        removed.append(manifest.artifact_path)
    installer.remove_empty_directory(paths.version_directory(manifest.version))
    installer.remove(paths.manifest)
    removed.append(paths.manifest)
    installer.remove_empty_directory(paths.share)
    return removed


def _remove_recorded(installer: UserInstall, manifest: Manifest | None) -> FerretResult[list[Path]]:
    """Remove what ``manifest`` owns once each present file is proved to be it; with none there is nothing to remove."""
    if manifest is None:
        return Ok([])
    return _verify_owned(installer, manifest).map(lambda present: _remove_owned(installer, manifest, present))


def _uninstalled(
    runtime: Runtime, manifest: Manifest | None, removed: list[Path], *, purge_data: bool
) -> UninstallOutcome:
    """Delete the data home when asked, if there is one, and report what the uninstall did."""
    if purge_data and runtime.files.facts(None).kind != "missing":
        runtime.files.purge()
    return UninstallOutcome(
        result="uninstalled" if manifest is not None else "not_installed",
        removed_paths=tuple(sorted(removed, key=str)),
        path_action="none",
        data_action="deleted" if purge_data else "kept",
    )


def uninstall_user(runtime: Runtime, *, purge_data: bool, confirmed: bool) -> FerretResult[UninstallOutcome]:
    """Remove exactly the files the manifest owns, manifest last, and delete the data only when asked and confirmed.

    Everything is checked before the first deletion: an unconfirmed purge, an unsafe data home, and any owned file
    that no longer matches the manifest all stop the command with nothing removed.
    """
    if purge_data and not confirmed:
        return Err(FerretError("ferret.args.confirmation-required"))
    installer = runtime.installer
    safe = require_safe(runtime.files.facts(None), "directory") if purge_data else Ok(None)
    return safe.flat_map(lambda _: _read_manifest(installer, "ferret.install.ownership-mismatch")).flat_map(
        lambda manifest: _remove_recorded(installer, manifest).map(
            lambda removed: _uninstalled(runtime, manifest, removed, purge_data=purge_data)
        )
    )
