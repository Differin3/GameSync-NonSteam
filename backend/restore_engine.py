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

from sync_engine import MANIFEST_DIR, MANIFEST_NAME, MANIFEST_VERSION

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
    if data.get("version") != MANIFEST_VERSION:
        logger.warning(f"Unsupported manifest version: {data.get('version')!r}")
        return None
    return data


def plan_targets(manifest: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Сопоставление корень архива -> {path, is_dir}."""
    targets: Dict[str, Dict[str, Any]] = {}
    for item in manifest.get("paths") or []:
        if not isinstance(item, dict):
            continue
        root = item.get("root")
        path = item.get("path")
        if not root or not path:
            continue
        targets[str(root)] = {"path": Path(str(path)), "is_dir": bool(item.get("is_dir"))}
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


def restore_archive(archive_path: str, manifest: Dict[str, Any]) -> Dict[str, Any]:
    """Полный цикл: манифест -> целевые пути -> безопасная распаковка."""
    targets = plan_targets(manifest)
    if not targets:
        raise ValueError("В архиве нет путей сохранений")
    return safe_extract(archive_path, targets)
