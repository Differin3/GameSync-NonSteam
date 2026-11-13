"""Сопоставление игры Steam-библиотеки с игрой PortProton.

Чистые функции без зависимостей от Decky — их покрывают unit-тесты,
а `backend/main.py` использует их в RPC `get_game_sync_status`.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def normalize(text: Any) -> str:
    return "".join(c for c in str(text or "").lower() if c.isalnum() or c.isspace()).strip()


def find_game_for_app(
    games: List[Dict[str, Any]],
    appid: Optional[Any] = None,
    game_name: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Находит игру по appid Steam-ярлыка, затем по названию."""
    if not games:
        return None

    try:
        appid_int = int(appid) if appid is not None else None
    except (TypeError, ValueError):
        appid_int = None

    if appid_int is not None:
        for game in games:
            candidate = game.get("steamAppId")
            if candidate == appid_int:
                return game
            try:
                if candidate is not None and int(candidate) == appid_int:
                    return game
            except (TypeError, ValueError):
                continue

    target = normalize(game_name)
    if target:
        for game in games:
            if normalize(game.get("name")) == target:
                return game
        for game in games:
            prefix_name = normalize(str(game.get("prefixPath") or "").rstrip("/").rsplit("/", 1)[-1])
            if prefix_name and prefix_name == target:
                return game

    return None


def build_game_status(
    game: Dict[str, Any],
    synced: Optional[Dict[str, Any]],
    entries: List[Dict[str, Any]],
    provider: str,
) -> Dict[str, Any]:
    """Собирает ответ для строки статуса на странице игры."""
    synced = synced or {}
    entries = entries or []
    last = entries[0] if entries else {}

    return {
        "game": game.get("name") or "",
        "appid": game.get("steamAppId"),
        "last_sync": last.get("created") or synced.get("lastSync"),
        "size": last.get("size") or synced.get("fileSize"),
        "versions": len(entries),
        "provider": provider or "webdav",
        "save_paths": len(game.get("savePaths") or []),
        "shared_prefix": bool(game.get("sharedPrefix")),
    }
