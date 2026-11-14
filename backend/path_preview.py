"""Предпросмотр содержимого пути сохранений для интерфейса."""

import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

MAX_FILES = 500


def _is_service(suffix: str) -> bool:
    try:
        from portproton_scanner import SERVICE_EXTENSIONS
    except Exception:
        SERVICE_EXTENSIONS = {".log", ".txt", ".dll", ".exe", ".png", ".jpg", ".dds"}
    return suffix.lower() in SERVICE_EXTENSIONS


def describe_path(raw_path: str, limit: int = 20) -> Dict[str, Any]:
    """Что лежит в пути: файлы, размер, даты, сколько похоже на сейвы."""
    if not raw_path:
        return {"success": False, "error": "Путь не указан"}

    target = Path(raw_path)
    if not target.exists():
        return {"success": False, "error": "Путь не существует"}

    items: List[Path] = []
    if target.is_file():
        items = [target]
    else:
        try:
            for item in target.rglob("*"):
                if item.is_file():
                    items.append(item)
                    if len(items) >= MAX_FILES:
                        break
        except OSError as e:
            return {"success": False, "error": f"Не удалось прочитать папку: {e}"}

    files: List[Dict[str, Any]] = []
    total_size = 0
    save_like = 0
    newest = 0.0
    for item in items:
        try:
            stat = item.stat()
        except OSError:
            continue
        total_size += stat.st_size
        newest = max(newest, stat.st_mtime)
        if not _is_service(item.suffix):
            save_like += 1
        files.append({
            "name": item.name,
            "path": str(item),
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
            "saveLike": not _is_service(item.suffix),
        })

    files.sort(key=lambda entry: entry["modified"], reverse=True)
    return {
        "success": True,
        "path": str(target),
        "isDir": target.is_dir(),
        "total": len(items),
        "saveLike": save_like,
        "totalSize": total_size,
        "newest": datetime.fromtimestamp(newest).isoformat(timespec="seconds") if newest else None,
        "files": files[:limit],
    }