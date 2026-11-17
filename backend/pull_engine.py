"""Решение о подтягивании облачных сохранений перед запуском игры.

Задача: при старте игры скачать облачную версию, только если она новее
локальных файлов. Иначе локальный прогресс (например, играли оффлайн)
был бы затёрт старым облачным бэкапом.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Iterable, Optional

logger = logging.getLogger(__name__)

#: Насколько облачный бэкап должен быть новее локальных сейвов.
DEFAULT_GRACE_SECONDS = 2.0


def parse_timestamp(value) -> Optional[datetime]:
    """Разобрать время из индекса бэкапов (ISO 8601) в aware datetime."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def newest_local_mtime(paths: Iterable[str]) -> Optional[float]:
    """Самое свежее время изменения среди файлов в путях сохранений."""
    newest: Optional[float] = None
    for raw in paths or []:
        if not raw:
            continue
        if os.path.isfile(raw):
            candidates = [raw]
        elif os.path.isdir(raw):
            candidates = []
            for root, _dirs, files in os.walk(raw):
                for name in files:
                    candidates.append(os.path.join(root, name))
        else:
            continue
        for candidate in candidates:
            try:
                mtime = os.path.getmtime(candidate)
            except OSError:
                continue
            if newest is None or mtime > newest:
                newest = mtime
    return newest


def should_pull(
    cloud_created,
    local_mtime: Optional[float],
    grace_seconds: float = DEFAULT_GRACE_SECONDS,
) -> bool:
    """Скачивать ли облачный бэкап: он должен быть новее локальных сейвов."""
    cloud_time = parse_timestamp(cloud_created)
    if cloud_time is None:
        return False
    if local_mtime is None:
        # Локальных сейвов нет — облако точно полезнее.
        return True
    return cloud_time.timestamp() > local_mtime + grace_seconds
