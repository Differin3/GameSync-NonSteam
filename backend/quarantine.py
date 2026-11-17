"""Локальный карантин для вытесненных файлов сохранений.

При восстановлении бэкапа новые сейвы, созданные после него, не удаляются,
а переносятся в ``~/.config/gamesync/quarantined/<игра>/<операция>/``.
Так прогресс откатывается (игра не видит лишние файлы), но данные остаются
на диске и доступны для ручного возврата.
"""

import json
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

DEFAULT_DAYS = 30
DEFAULT_MAX_BYTES = 1024 ** 3


def _config_dir() -> Path:
    from config_manager import CONFIG_DIR

    return Path(CONFIG_DIR)


def _safe_name(value: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in " ._-()" else "_" for ch in (value or "game"))
    return cleaned.strip() or "game"


def _safe_rel(rel: str, fallback: str) -> str:
    parts = [part for part in (rel or "").replace("\\", "/").split("/") if part]
    if not parts or any(part in (".", "..") for part in parts):
        return fallback
    return "/".join(parts)


def root_dir() -> Path:
    return _config_dir() / "quarantined"


def _operation_dir(game: str, stamp: str) -> Path:
    base = root_dir() / _safe_name(game)
    candidate = base / stamp
    suffix = 1
    while candidate.exists():
        candidate = base / f"{stamp}-{suffix}"
        suffix += 1
    return candidate


def move_files(game: str, items: List[Dict[str, Any]], reason: str = "restore") -> Dict[str, Any]:
    """Перенести файлы в карантин. ``items``: source/root/rel."""
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    operation = _operation_dir(game, stamp)
    moved: List[Dict[str, Any]] = []
    failed: List[Dict[str, str]] = []
    total_bytes = 0

    for item in items or []:
        source = Path(str(item.get("source") or ""))
        try:
            if not source.is_file():
                continue
            size = source.stat().st_size
        except OSError as e:
            failed.append({"path": str(source), "error": str(e)})
            continue

        rel = _safe_rel(str(item.get("rel") or source.name), source.name)
        root_name = _safe_name(str(item.get("root") or "root"))
        destination = operation / root_name / rel
        destination.parent.mkdir(parents=True, exist_ok=True)

        try:
            shutil.move(str(source), str(destination))
        except OSError as e:
            # Другая ФС/занятый файл: копируем и только потом убираем исходник.
            try:
                shutil.copy2(str(source), str(destination))
                os.remove(source)
            except OSError as copy_error:
                failed.append({"path": str(source), "error": f"{e}; {copy_error}"})
                continue

        moved.append({"original": str(source), "stored": f"{root_name}/{rel}", "size": size})
        total_bytes += size

    if not moved:
        try:
            operation.rmdir()
        except OSError:
            pass
        return {"operation": "", "path": "", "moved": 0, "failed": failed, "bytes": 0}

    meta = {
        "game": game,
        "created": datetime.now().isoformat(timespec="seconds"),
        "reason": reason,
        "files": moved,
    }
    try:
        (operation / "meta.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    except OSError as e:
        logger.warning(f"Cannot write quarantine meta: {e}")

    logger.info(f"Quarantined {len(moved)} files for {game} -> {operation}")
    return {
        "operation": operation.name,
        "path": str(operation),
        "moved": len(moved),
        "failed": failed,
        "bytes": total_bytes,
    }


def _iter_operations() -> List[Path]:
    root = root_dir()
    if not root.exists():
        return []
    operations: List[Path] = []
    for game_dir in root.iterdir():
        if not game_dir.is_dir():
            continue
        for operation in game_dir.iterdir():
            if operation.is_dir():
                operations.append(operation)
    return operations


def prune(days: int = DEFAULT_DAYS, max_bytes: int = DEFAULT_MAX_BYTES) -> Dict[str, int]:
    """Удалить старые операции карантина по возрасту и общему размеру."""
    now = datetime.now().timestamp()
    removed_operations = 0
    removed_bytes = 0
    operations = _iter_operations()

    def size_of(path: Path) -> int:
        total = 0
        for entry in path.rglob("*"):
            try:
                if entry.is_file():
                    total += entry.stat().st_size
            except OSError:
                pass
        return total

    sizes = {op: size_of(op) for op in operations}
    total = sum(sizes.values())

    # Сначала по возрасту.
    for operation in sorted(operations, key=lambda p: p.stat().st_mtime):
        try:
            age_days = (now - operation.stat().st_mtime) / 86400
            if days > 0 and age_days > days:
                shutil.rmtree(operation, ignore_errors=True)
                total -= sizes.get(operation, 0)
                removed_operations += 1
                removed_bytes += sizes.get(operation, 0)
        except OSError:
            continue

    # Затем по общему лимиту: самые старые первыми.
    if max_bytes > 0 and total > max_bytes:
        for operation in sorted(operations, key=lambda p: p.stat().st_mtime):
            if not operation.exists():
                continue
            if total <= max_bytes:
                break
            size = sizes.get(operation, 0)
            shutil.rmtree(operation, ignore_errors=True)
            total -= size
            removed_operations += 1
            removed_bytes += size

    return {"operations": removed_operations, "bytes": removed_bytes}


def status() -> Dict[str, Any]:
    operations = _iter_operations()
    total = 0
    for operation in operations:
        for entry in operation.rglob("*"):
            try:
                if entry.is_file():
                    total += entry.stat().st_size
            except OSError:
                pass
    return {
        "path": str(root_dir()),
        "operations": len(operations),
        "bytes": total,
        "days": DEFAULT_DAYS,
        "max_bytes": DEFAULT_MAX_BYTES,
    }
