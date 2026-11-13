"""Локальная история бэкапов GameSync.

Каждый успешный аплоад записывается в ``~/.config/gamesync/backups.json``:
имя игры, время, удалённый путь (file_id провайдера), размер и исходные пути.
По этому индексу работает вкладка «Бэкапы» и восстановление — без листинга
облака, который поддерживается провайдерами по-разному.

Индекс не является источником истины: если файл в облаке удалили вручную,
запись останется, а скачивание вернёт ошибку.
"""

import json
import logging
import os
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import config_manager

logger = logging.getLogger(__name__)

INDEX_NAME = "backups.json"
MAX_PER_GAME = 10

# Синхронизация и восстановление работают в отдельных потоках: без блокировки
# два одновременных add_entry могли перезаписать друг друга.
_lock = threading.Lock()


def _index_path():
    return config_manager.CONFIG_DIR / INDEX_NAME


def _load() -> Dict[str, List[Dict[str, Any]]]:
    path = _index_path()
    if not path.exists():
        return {}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.warning(f"Failed to load backup index: {e}")
        return {}


def _save(data: Dict[str, List[Dict[str, Any]]]) -> None:
    try:
        config_manager.CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        path = _index_path()
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
    except Exception as e:
        logger.warning(f"Failed to save backup index: {e}")


def _make_id() -> str:
    return f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"


def add_entry(
    game_name: str,
    remote: str,
    size: Optional[int] = None,
    paths: Optional[List[str]] = None,
    kind: str = "sync",
    created: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Записывает бэкап в историю. ``kind``: sync | prerestore."""
    if not game_name or not remote:
        return None

    entry = {
        "id": _make_id(),
        "created": created or datetime.now().isoformat(timespec="seconds"),
        "remote": remote,
        "size": int(size) if size else None,
        "paths": list(paths or []),
        "kind": kind,
    }

    with _lock:
        data = _load()
        entries = data.setdefault(game_name, [])
        entries.insert(0, entry)
        del entries[MAX_PER_GAME:]
        _save(data)
    return entry


def prepare_trim(game_name: str, keep: int = MAX_PER_GAME) -> List[Dict[str, Any]]:
    """Записи, которые выпадут из истории после добавления новой.

    Нужны, чтобы удалить их файлы из облака — иначе версии копятся вечно.
    """
    if not game_name:
        return []
    entries = _load().get(game_name) or []
    keep = max(1, int(keep))
    return list(entries[keep - 1:])


def list_all() -> Dict[str, List[Dict[str, Any]]]:
    return _load()


def list_for(game_name: str) -> List[Dict[str, Any]]:
    return list(_load().get(game_name) or [])


def get_entry(game_name: str, entry_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    entries = _load().get(game_name) or []
    if not entries:
        return None
    if not entry_id:
        return entries[0]
    for entry in entries:
        if entry.get("id") == entry_id:
            return entry
    return None


def count() -> int:
    return sum(len(entries or []) for entries in _load().values())


def clear() -> None:
    with _lock:
        try:
            path = _index_path()
            if path.exists():
                path.unlink()
        except OSError:
            pass
