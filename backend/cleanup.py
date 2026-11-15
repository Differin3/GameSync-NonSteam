"""Уборка «сирот» в облаке: файлы версий, которых нет в истории бэкапов.

До 0.8.1 старые версии обрезались только в локальном индексе, а файлы
в облаке оставались навсегда. Удаляем только собственные архивы GameSync
(`backup-*.tar.gz`, `prerestore-*.tar.gz`), которые не упоминаются в индексе.
"""

import logging
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List

logger = logging.getLogger(__name__)

VERSION_FILE_RE = re.compile(r"^(backup|prerestore)-\d{8}-\d{6}\.tar\.gz$")


def select_orphans(names: Iterable[str], referenced: Iterable[str]) -> List[str]:
    """Имена архивов версий, на которые нет ссылок в истории."""
    keep = {Path(str(item)).name for item in referenced if item}
    result = []
    for name in names:
        if not name:
            continue
        if VERSION_FILE_RE.match(name) and name not in keep:
            result.append(name)
    return sorted(set(result))


def cleanup_game(provider: Any, folder: str, referenced: Iterable[str]) -> Dict[str, Any]:
    """Удалить из папки игры файлы версий, отсутствующие в истории."""
    folder = folder.strip("/")
    try:
        listing = provider.list_files(folder)
    except Exception as e:
        logger.warning(f"Cleanup: cannot list {folder}: {e}")
        return {"folder": folder, "scanned": 0, "deleted": [], "errors": [str(e)]}

    if listing is None:
        # Листинг не удался: не удаляем ничего в этой папке.
        return {"folder": folder, "scanned": 0, "deleted": [], "errors": ["не удалось получить список файлов"]}

    names: List[str] = []
    for item in listing:
        if isinstance(item, dict):
            name = item.get("name") or Path(str(item.get("path") or "")).name
        else:
            name = Path(str(item)).name
        if name:
            names.append(name)

    orphans = select_orphans(names, referenced)
    deleted: List[str] = []
    errors: List[str] = []
    for name in orphans:
        remote = f"{folder}/{name}"
        try:
            if provider.delete_file(remote):
                deleted.append(name)
            else:
                errors.append(f"не удалось удалить {name}")
        except Exception as e:
            errors.append(f"{name}: {e}")

    if deleted:
        logger.info(f"Cleanup {folder}: deleted {len(deleted)} orphan(s)")
    return {"folder": folder, "scanned": len(names), "deleted": deleted, "errors": errors}