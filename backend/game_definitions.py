import logging
from typing import Any, Dict, List, Optional

from gamedef_loader import load_raw_gamedef_map

logger = logging.getLogger(__name__)

# Локальная мини-база (самые важные игры для тебя).
# Ключи: нормализованные имена игр (lowercase, без лишних символов).
# Значения: список путей ОТНОСИТЕЛЬНО папки drive_c.
LOCAL_GAME_SAVE_DEFINITIONS: Dict[str, List[str]] = {
    # Expeditions 33 (по твоему примеру с Sandfall)
    "expeditions 33": [
        "users/deck/AppData/Local/Sandfall/Saved/SaveGames",
    ],
    "expeditions33": [
        "users/deck/AppData/Local/Sandfall/Saved/SaveGames",
    ],
}


def _normalize_name(name: str) -> str:
    """Нормализация имени игры для поиска в базе."""
    name = name.lower()
    return "".join(c for c in name if c.isalnum() or c.isspace()).strip()


def _convert_windows_path_to_portproton_rel(path: str) -> Optional[str]:
    """
    Грубая конвертация Windows-пути из gamedef_map.json
    в относительный путь внутри drive_c префикса PortProton.

    Поддерживаем только основные варианты с переменными окружения:
    %LOCALAPPDATA%, %APPDATA%, %USERPROFILE%\Documents, Saved Games и My Games.
    """
    if not path:
        return None

    original = path

    # Нормализуем слэши
    p = path.replace("\\", "/")

    # %LOCALAPPDATA%\Foo -> users/deck/AppData/Local/Foo
    for token in ("%LOCALAPPDATA%", "%LocalAppData%", "%localappdata%"):
        if token in p:
            p = p.replace(token, "users/deck/AppData/Local")
            break

    # %APPDATA%\Foo -> users/deck/AppData/Roaming/Foo
    for token in ("%APPDATA%", "%AppData%", "%appdata%"):
        if token in p:
            p = p.replace(token, "users/deck/AppData/Roaming")
            break

    # %USERPROFILE%\Documents -> users/deck/Documents
    for token in ("%USERPROFILE%", "%HOMEPATH%", "%UserProfile%", "%HomePath%"):
        if token in p and "/Documents" in p:
            p = p.replace(token + "/Documents", "users/deck/Documents")
            break

    # %USERPROFILE%\Saved Games -> users/deck/Saved Games
    for token in ("%USERPROFILE%", "%HOMEPATH%", "%UserProfile%", "%HomePath%"):
        if token in p and "/Saved Games" in p:
            p = p.replace(token + "/Saved Games", "users/deck/Saved Games")
            break

    # Обрезаем возможный префикс вроде "C:/Users/..."
    if p.startswith("C:/Users/") or p.startswith("C:/users/"):
        # Заменяем "C:/Users/XXX" на "users/deck"
        parts = p.split("/")
        # ["C:", "Users", "<Name>", ...]
        if len(parts) >= 4:
            p = "users/deck/" + "/".join(parts[3:])

    # Убираем начальные слэши
    while p.startswith("/"):
        p = p[1:]

    if not p or p == original:
        # Ничего внятного не смогли сконвертировать
        return None

    return p


def _find_in_openclouds(game_name: str) -> List[str]:
    """Поиск путей в большой базе OpenCloudSaves."""
    raw = load_raw_gamedef_map()
    if not raw:
        return []

    normalized = _normalize_name(game_name)

    best_entry: Optional[Dict[str, Any]] = None

    for key, entry in raw.items():
        key_norm = _normalize_name(key)
        display_norm = _normalize_name(entry.get("display_name", key))

        if normalized == key_norm or normalized == display_norm:
            best_entry = entry
            break
        if key_norm in normalized or display_norm in normalized:
            best_entry = entry

    if not best_entry:
        return []

    win_paths = best_entry.get("win_path") or []
    rel_paths: List[str] = []

    for p in win_paths:
        win_path = p.get("path")
        rel = _convert_windows_path_to_portproton_rel(win_path)
        if rel:
            rel_paths.append(rel)

    return rel_paths


def get_known_save_paths_for_game(game_name: str) -> List[str]:
    """
    Вернуть список относительных путей (относительно drive_c) для известной игры.
    Приоритет:
    1) Локальная мини-база (ручные пути).
    2) Конвертированные данные из OpenCloudSaves gamedef_map.json.
    """
    if not game_name:
        return []

    normalized = _normalize_name(game_name)

    # 1. Локальная база
    if normalized in LOCAL_GAME_SAVE_DEFINITIONS:
        return LOCAL_GAME_SAVE_DEFINITIONS[normalized]

    for key, paths in LOCAL_GAME_SAVE_DEFINITIONS.items():
        if key in normalized:
            logger.debug(f"Matched game '{game_name}' to local definition '{key}'")
            return paths

    # 2. База OpenCloudSaves
    oc_paths = _find_in_openclouds(game_name)
    if oc_paths:
        logger.debug(f"Matched game '{game_name}' to OpenCloudSaves definition, paths={oc_paths}")
        return oc_paths

    return []


