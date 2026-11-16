"""Общие правила преобразования путей сохранений.

Пути из OpenCloudSaves/Ludusavi заданы относительно Windows-профиля,
однако имя пользователя в Wine-префиксе PortProton заранее неизвестно
(``steamuser``, ``deck`` и т.п.), поэтому вместо конкретного имени
используется токен :data:`USER_TOKEN`. Реальный пользователь подставляется
в :mod:`portproton_scanner` при разрешении пути внутри ``drive_c``.

Пути из баз часто содержат маски файлов (``*.sav``, ``profile?.dat``,
``*/saves``). ``pathlib.exists()`` не понимает маски, поэтому такие пути
обрезаются до ближайшей существующей родительской папки.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

#: Токен вместо имени пользователя Windows: ``users/@user@/Documents``.
USER_TOKEN = "@user@"

#: Символы подстановки, которые встречаются в путях баз сохранений.
WILDCARDS = ("*", "?")


def strip_wildcards(rel: Optional[str]) -> Optional[str]:
    """Обрезать путь до папки перед первым сегментом с маской.

    ``users/deck/Saves/Game/*.sav`` -> ``users/deck/Saves/Game``

    Если маска стоит в первом сегменте, путь бессмысленный — возвращаем None.
    """
    if not rel:
        return rel
    parts = rel.replace("\\", "/").split("/")
    for index, part in enumerate(parts):
        if any(wildcard in part for wildcard in WILDCARDS):
            if index == 0:
                return None
            return "/".join(parts[:index])
    return rel


def normalize_rel_path(rel: Optional[str]) -> Optional[str]:
    """Убрать пустые сегменты, повторные и хвостовые слэши, затем маски."""
    if not rel:
        return rel
    parts = [part for part in rel.replace("\\", "/").split("/") if part]
    if not parts:
        return None
    return strip_wildcards("/".join(parts))
