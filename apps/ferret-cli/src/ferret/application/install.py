"""Install and uninstall for the current user: the manifest is the ownership commit point, and only owned files go.

An install writes everything beside its final names first, then replaces the artifact, the launcher, and last the
manifest, so a crash between any two steps leaves a state the next command can read: the old manifest still names the
old install until the new one is complete. An uninstall deletes the launcher and the artifact first and the manifest
last, so an interrupted removal is finished by running it again.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from ferret import __version__
from ferret.application.ports import InstalledFacts, Runtime, StagePlan, UserInstall
from ferret.application.store import require_safe
from ferret.domain.errors import ErrorCode, FerretError
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


def _read_manifest(installer: UserInstall, failure: ErrorCode) -> Manifest | None:
    """The recorded install, ``None`` when there is no manifest, or ``failure`` when what is there cannot be trusted."""
    facts = installer.facts(installer.paths.manifest)
    if facts.kind == "missing":
        return None
    if facts.kind != "file" or not facts.owned_by_current_user or facts.mode != MANIFEST_MODE:
        raise FerretError(failure)
    content = installer.read_manifest()
    if content is None:
        raise FerretError(failure)
    try:
        return parse_manifest(content, installer.paths)
    except ValueError:
        raise FerretError(failure) from None


def _require_directory_or_nothing(facts: InstalledFacts) -> None:
    if facts.kind not in ("missing", "directory"):
        raise FerretError("install_collision")


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


def install_user(runtime: Runtime) -> InstallOutcome:
    """Install the running artifact for the current user, replacing an older install this user's manifest records.

    Anything in the way that FERRET cannot prove it made is a collision and nothing is changed. An install that is
    already complete is reported as such without a write.
    """
    installer = runtime.installer
    paths = installer.paths
    installer.recover()
    source = installer.source()
    previous = _read_manifest(installer, "install_collision")
    _require_directory_or_nothing(installer.facts(paths.share))
    _require_directory_or_nothing(installer.facts(paths.version_directory(__version__)))
    launcher = installer.facts(paths.launcher)
    if launcher.kind != "missing" and not _is_our_launcher(launcher, installer):
        raise FerretError("install_collision")
    target = paths.artifact(__version__)
    artifact = installer.facts(target)
    if artifact.kind != "missing":
        # A file at the artifact's path is ours only if it is this very build, or the build the manifest recorded.
        ours = {source.sha256}
        if previous is not None and previous.artifact_path == target:
            ours.add(previous.artifact_sha256)
        if not (artifact.kind == "file" and artifact.owned_by_current_user and artifact.sha256 in ours):
            raise FerretError("install_collision")
    action = path_action(installer.path_variable, paths.bin)
    try:
        script = launcher_script(installer.interpreter, target)
    except ValueError:
        # A home or interpreter path the launcher cannot quote exactly; writing an approximate one is worse.
        raise FerretError("storage_unavailable") from None
    if (
        previous is not None
        and previous.version == __version__
        and previous.artifact_sha256 == source.sha256
        and artifact.kind == "file"
        and artifact.mode == ARTIFACT_MODE
        and artifact.sha256 == source.sha256
        and launcher.kind == "file"
        and launcher.mode == LAUNCHER_MODE
        and installer.read_launcher() == script
    ):
        return InstallOutcome("already_installed", __version__, target, paths.launcher, paths.manifest, action, None)
    manifest = Manifest(
        version=__version__,
        artifact_path=target,
        artifact_sha256=source.sha256,
        launcher_path=paths.launcher,
        installed_at=format_timestamp(runtime.clock.now()),
    )
    staged = installer.stage(StagePlan(version=__version__, launcher=script, manifest=manifest.to_bytes()))
    installer.replace_artifact(staged)
    installer.replace_launcher(staged)
    installer.replace_manifest(staged)
    if previous is not None and previous.version != __version__:
        _discard(installer, previous)
    return InstallOutcome(
        "installed",
        __version__,
        target,
        paths.launcher,
        paths.manifest,
        action,
        None if previous is None else previous.version,
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


def _verify_owned(installer: UserInstall, manifest: Manifest) -> tuple[bool, bool]:
    """Whether the launcher and artifact still stand, refusing unless each present one is exactly what was recorded."""
    launcher = installer.facts(manifest.launcher_path)
    if launcher.kind != "missing" and not _launcher_starts(installer, launcher, manifest.artifact_path):
        raise FerretError("install_ownership_mismatch")
    artifact = installer.facts(manifest.artifact_path)
    if artifact.kind != "missing" and not (
        artifact.kind == "file" and artifact.owned_by_current_user and artifact.sha256 == manifest.artifact_sha256
    ):
        raise FerretError("install_ownership_mismatch")
    return launcher.kind != "missing", artifact.kind != "missing"


def uninstall_user(runtime: Runtime, *, purge_data: bool, confirmed: bool) -> UninstallOutcome:
    """Remove exactly the files the manifest owns, manifest last, and delete the data only when asked and confirmed.

    Everything is checked before the first deletion: an unconfirmed purge, an unsafe data home, and any owned file
    that no longer matches the manifest all stop the command with nothing removed.
    """
    if purge_data and not confirmed:
        raise FerretError("confirmation_required")
    if purge_data:
        require_safe(runtime.files.facts(None), "directory")
    installer = runtime.installer
    paths = installer.paths
    manifest = _read_manifest(installer, "install_ownership_mismatch")
    removed: list[Path] = []
    if manifest is not None:
        launcher_stands, artifact_stands = _verify_owned(installer, manifest)
        if launcher_stands:
            installer.remove(manifest.launcher_path)
            removed.append(manifest.launcher_path)
        if artifact_stands:
            installer.remove(manifest.artifact_path)
            removed.append(manifest.artifact_path)
        installer.remove_empty_directory(paths.version_directory(manifest.version))
        installer.remove(paths.manifest)
        removed.append(paths.manifest)
        installer.remove_empty_directory(paths.share)
    deleted = purge_data and runtime.files.facts(None).kind != "missing"
    if deleted:
        runtime.files.purge()
    return UninstallOutcome(
        result="uninstalled" if manifest is not None else "not_installed",
        removed_paths=tuple(sorted(removed, key=str)),
        path_action="none",
        data_action="deleted" if purge_data else "kept",
    )
