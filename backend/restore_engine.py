"""Восстановление сохранений из архива GameSync.

Архив, созданный ``sync_engine.create_backup``, содержит манифест
``.gamesync/manifest.json`` с исходными путями сохранений. По этому манифесту
восстановление раскладывает файлы обратно по их папкам.

Распаковка не использует ``tarfile.extractall``: он позволяет членам архива
выходить за пределы целевой папки (``..``), создавать символические ссылки и
абсолютные пути. Здесь каждый член архива проверяется вручную.
"""

import json
import logging
import os
import tarfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from sync_engine import MANIFEST_DIR, MANIFEST_NAME

logger = logging.getLogger(__name__)

MAX_FILES = 20000
MAX_SKIPPED_REPORT = 20


def read_manifest(archive_path: str) -> Optional[Dict[str, Any]]:
    """Читает манифест архива. None — если архив старый (без манифеста)."""
    try:
        with tarfile.open(archive_path, "r:gz") as tar:
            try:
                member = tar.getmember(MANIFEST_NAME)
            except KeyError:
                logger.warning(f"Archive has no manifest: {archive_path}")
                return None
            handle = tar.extractfile(member)
            if handle is None:
                return None
            data = json.loads(handle.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to read manifest from {archive_path}: {e}")
        return None

    if not isinstance(data, dict):
        return None
    if data.get("version") not in (1, 2):
        logger.warning(f"Unsupported manifest version: {data.get('version')!r}")
        return None
    return data


def _is_safe_target(path: Path, allowed_root: Path) -> bool:
    """Разрешаем восстановление только внутрь домашней папки пользователя.

    Архив приходит из облака: если облако скомпрометировано, подменённый
    манифест не должен дать записать файлы в /etc или /usr.
    """
    try:
        normalized = Path(os.path.normpath(str(path)))
    except (TypeError, ValueError):
        return False
    if ".." in normalized.parts:
        return False
    if normalized == allowed_root:
        return False
    try:
        normalized.relative_to(allowed_root)
    except ValueError:
        return False
    return True


def plan_targets(
    manifest: Dict[str, Any], allowed_root: Optional[Path] = None
) -> Dict[str, Dict[str, Any]]:
    """Сопоставление корень архива -> {path, is_dir}."""
    root_dir = Path(allowed_root) if allowed_root is not None else Path.home()
    targets: Dict[str, Dict[str, Any]] = {}
    for item in manifest.get("paths") or []:
        if not isinstance(item, dict):
            continue
        root = item.get("root")
        path = item.get("path")
        if not root or not path:
            continue
        target_path = Path(str(path))
        if not _is_safe_target(target_path, root_dir):
            logger.warning(f"Restore target outside {root_dir}: {path}")
            continue
        targets[str(root)] = {"path": target_path, "is_dir": bool(item.get("is_dir"))}
    return targets


def _is_within(base: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(base)
        return True
    except ValueError:
        return False


def _note(skipped: List[str], name: str) -> None:
    if len(skipped) < MAX_SKIPPED_REPORT:
        skipped.append(name)


def safe_extract(archive_path: str, targets: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Распаковывает архив по целевым путям.

    Возвращает {"files": int, "bytes": int, "skipped": [имена]}.
    Символические ссылки, устройства и пути с ``..`` пропускаются.
    """
    files = 0
    total_bytes = 0
    skipped: List[str] = []

    with tarfile.open(archive_path, "r:gz") as tar:
        for member in tar:
            name = member.name.replace("\\", "/")
            if name == MANIFEST_DIR or name.startswith(MANIFEST_DIR + "/"):
                continue

            parts = name.split("/", 1)
            root = parts[0]
            rel = parts[1] if len(parts) > 1 else ""
            target = targets.get(root)
            if target is None:
                _note(skipped, name)
                continue

            base: Path = target["path"]
            if member.isdir():
                directory = base / rel if rel else base
                try:
                    directory.mkdir(parents=True, exist_ok=True)
                except OSError as e:
                    logger.warning(f"Cannot create {directory}: {e}")
                    _note(skipped, name)
                continue

            if not member.isfile():
                # Симлинки, хардлинки, устройства: не восстанавливаем.
                _note(skipped, name)
                continue

            if rel:
                # normpath обязателен: relative_to в _is_within сравнивает
                # компоненты лексически и пропустил бы "Game/../../evil".
                destination = Path(os.path.normpath(str(base / rel)))
                if not _is_within(Path(os.path.normpath(str(base))), destination):
                    _note(skipped, name)
                    continue
            else:
                destination = base
                if target["is_dir"]:
                    # Файл с именем корня-папки — повреждённый архив.
                    _note(skipped, name)
                    continue

            source = tar.extractfile(member)
            if source is None:
                _note(skipped, name)
                continue

            try:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with source, open(destination, "wb") as out:
                    while True:
                        chunk = source.read(1 << 20)
                        if not chunk:
                            break
                        out.write(chunk)
                        total_bytes += len(chunk)
            except OSError as e:
                logger.warning(f"Cannot restore {destination}: {e}")
                _note(skipped, name)
                continue

            files += 1
            if files > MAX_FILES:
                raise RuntimeError(f"Archive contains more than {MAX_FILES} files")

    if skipped:
        logger.warning(f"Restore skipped {len(skipped)} members: {skipped[:5]}")

    return {"files": files, "bytes": total_bytes, "skipped": skipped}


def _collect_archive_files(archive_path: str) -> Dict[str, set]:
    """Файлы архива по корням: root -> {относительные пути}."""
    result: Dict[str, set] = {}
    try:
        with tarfile.open(archive_path, "r:gz") as tar:
            for member in tar:
                name = member.name.replace("\\", "/")
                if name == MANIFEST_DIR or name.startswith(MANIFEST_DIR + "/"):
                    continue
                if not member.isfile():
                    continue
                parts = name.split("/", 1)
                root = parts[0]
                rel = parts[1] if len(parts) > 1 else ""
                result.setdefault(root, set()).add(rel)
    except Exception as e:
        logger.error(f"Failed to list archive files: {e}")
    return result


def _cleanup_extra_files(
    targets: Dict[str, Dict[str, Any]],
    archive_files: Dict[str, set],
    extensions: set,
) -> List[str]:
    """Удалить файлы сохранений, которых нет в восстанавливаемом бэкапе.

    Без этого «восстановить версию» не откатывает прогресс: новый сейв,
    созданный после бэкапа, остаётся лежать рядом и игра продолжает с него.
    Удаляются только файлы с расширениями сохранений — посторонние файлы
    в папке (readme.txt и т.п.) не трогаем.
    """
    removed: List[str] = []
    lowered = {str(ext).lower() for ext in extensions}
    for root, target in targets.items():
        base: Path = target["path"]
        if not base.exists() or not base.is_dir():
            continue
        expected = archive_files.get(root) or set()
        for dirpath, _dirnames, filenames in os.walk(base):
            for filename in filenames:
                full = Path(dirpath) / filename
                try:
                    rel = full.relative_to(base).as_posix()
                except ValueError:
                    continue
                if rel in expected:
                    continue
                if full.suffix.lower() not in lowered:
                    continue
                try:
                    full.unlink()
                    removed.append(str(full))
                except OSError as e:
                    logger.warning(f"Cannot remove extra save {full}: {e}")
    return removed


def collect_extra_files(
    archive_path: str, manifest: Dict[str, Any], allowed_root: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """Файлы в папках игры, которых нет в бэкапе.

    Возвращает список ``{source, root, rel, size}`` для переноса в карантин.
    Служебные и медиафайлы (логи, картинки, скрипты, архивы) не трогаем.
    """
    from sync_engine import SERVICE_EXTENSIONS

    excluded = set(SERVICE_EXTENSIONS) | {
        ".bmp", ".gif", ".svg", ".webp", ".lua", ".py", ".js", ".ts", ".gd",
        ".cs", ".swf", ".zip", ".gz", ".7z", ".rar", ".yaml", ".yml", ".toml",
        ".html", ".css", ".bat", ".sh", ".so", ".dylib", ".vdf", ".ttf", ".otf",
    }
    targets = plan_targets(manifest, allowed_root)
    archive_files = _collect_archive_files(archive_path)
    extras: List[Dict[str, Any]] = []

    for root, target in targets.items():
        base: Path = target["path"]
        if not base.is_dir():
            continue
        expected = archive_files.get(root) or set()
        expected_dirs = {"" if "/" not in rel else rel.rsplit("/", 1)[0] for rel in expected if rel}
        if not expected_dirs:
            continue

        for dirpath, _dirnames, filenames in os.walk(base):
            directory = Path(dirpath)
            rel_dir = "" if directory == base else directory.relative_to(base).as_posix()
            if rel_dir not in expected_dirs:
                continue
            for filename in filenames:
                full = directory / filename
                rel = "" if directory == base else f"{rel_dir}/"
                rel += filename
                if rel in expected:
                    continue
                suffix = full.suffix.lower()
                if suffix in excluded:
                    continue
                try:
                    size = full.stat().st_size
                except OSError:
                    size = 0
                extras.append(
                    {"source": str(full), "root": root, "rel": rel, "size": size}
                )
    return extras



def verify_restored(manifest: Dict[str, Any], targets: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Сверить SHA256 восстановленных файлов с манифестом v2."""
    files = manifest.get("files") or {}
    if not files:
        return {"verified": 0, "mismatched": [], "checksum_supported": False}

    from integrity import sha256_file

    verified = 0
    mismatched: List[str] = []
    for arcname, meta in files.items():
        name = str(arcname).replace("\\", "/")
        parts = name.split("/", 1)
        root = parts[0]
        rel = parts[1] if len(parts) > 1 else ""
        target = targets.get(root)
        if not target:
            continue
        base: Path = target["path"]
        destination = base if not rel else Path(os.path.normpath(str(base / rel)))
        if not destination.is_file():
            mismatched.append(name)
            continue
        expected = (meta or {}).get("sha256") if isinstance(meta, dict) else None
        if expected and sha256_file(str(destination)) != expected:
            mismatched.append(name)
        else:
            verified += 1
    return {"verified": verified, "mismatched": mismatched, "checksum_supported": True}

def rollback_from_safety(
    archive_path: str,
    allowed_root: Optional[Path] = None,
    quarantine_callback=None,
) -> Dict[str, Any]:
    """Вернуть сейвы из страховочной копии (например, при битых хешах)."""
    manifest = read_manifest(archive_path)
    if not manifest:
        return {"success": False, "error": "В страховочной копии нет манифеста"}
    result = restore_archive(
        archive_path, manifest, allowed_root, False, quarantine_callback
    )
    mismatched = result.get("mismatched") or []
    return {
        "success": not mismatched,
        "files": int(result.get("files") or 0),
        "mismatched": mismatched,
    }


def restore_archive(
    archive_path: str,
    manifest: Dict[str, Any],
    allowed_root: Optional[Path] = None,
    remove_extra: bool = True,
    quarantine_callback=None,
) -> Dict[str, Any]:
    """Полный цикл: манифест -> целевые пути -> безопасная распаковка.

    ``quarantine_callback`` получает список лишних файлов и переносит их
    (например, в локальный карантин) до распаковки. Если callback не задан,
    работает старое поведение с удалением при ``remove_extra``.
    """
    targets = plan_targets(manifest, allowed_root)
    if not targets:
        raise ValueError("В архиве нет путей сохранений внутри домашней папки")

    quarantined = 0
    quarantine_path = ""
    if quarantine_callback is not None:
        try:
            extras = collect_extra_files(archive_path, manifest, allowed_root)
            if extras:
                outcome = quarantine_callback(extras) or {}
                quarantined = int(outcome.get("moved") or 0)
                quarantine_path = str(outcome.get("path") or "")
        except Exception as e:
            logger.warning(f"Quarantine failed, extras left in place: {e}")

    result = safe_extract(archive_path, targets)
    verification = verify_restored(manifest, targets)
    result.update(verification)
    removed: List[str] = []
    if remove_extra and quarantine_callback is None:
        try:
            from portproton_scanner import SAVE_EXTENSIONS
            archive_files = _collect_archive_files(archive_path)
            removed = _cleanup_extra_files(targets, archive_files, SAVE_EXTENSIONS)
            if removed:
                logger.info(f"Restore removed {len(removed)} extra save files")
        except Exception as e:
            logger.warning(f"Extra save cleanup failed: {e}")

    result["removed"] = len(removed)
    result["removed_files"] = removed[:MAX_SKIPPED_REPORT]
    result["quarantined"] = quarantined
    result["quarantine_path"] = quarantine_path
    return result
