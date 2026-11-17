"""Решение о подтягивании облачных сохранений перед запуском игры.

Задача: при старте игры скачать облачную версию, только если она новее
локальных файлов. Иначе локальный прогресс (например, играли оффлайн)
был бы затёрт старым облачным бэкапом.
"""

import logging
import os
import time
from datetime import datetime, timezone
from typing import Iterable, Optional

logger = logging.getLogger(__name__)

#: Насколько облачный бэкап должен быть новее локальных сейвов.
DEFAULT_GRACE_SECONDS = 2.0

#: Если игра запущена дольше этого — pull не начинаем (поздно, только помешаем).
MAX_PULL_START_AGE_SECONDS = 10.0

#: Сколько времени от старта процесса даётся на скачивание и распаковку.
MAX_PULL_SECONDS = 25.0


def should_attempt_pull(
    started_at: Optional[float],
    now: Optional[float] = None,
    max_age: float = MAX_PULL_START_AGE_SECONDS,
) -> bool:
    """Не поздно ли начинать pull: игра не должна уже работать."""
    if not started_at:
        return True
    return (now if now is not None else time.time()) - started_at <= max_age


def pull_deadline(started_at: Optional[float], max_seconds: float = MAX_PULL_SECONDS) -> Optional[float]:
    """Момент, после которого писать сейвы в запущенную игру уже нельзя."""
    if not started_at:
        return None
    return started_at + max_seconds


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
        # В истории бэкапов время хранится локальным (datetime.now()).
        # Раньше naive-время считалось UTC — облако «уезжало» в будущее
        # на величину часового пояса, и pull срабатывал всегда.
        parsed = parsed.astimezone()
    return parsed


def newest_local_mtime(paths: Iterable[str]) -> Optional[float]:
    """Самое свежее время изменения среди файлов сохранений.

    Служебные файлы (логи, картинки, кэш) не учитываются: игра пишет лог
    при каждом запуске, и он не должен делать локальные сейвы «новее» облака.
    """
    from sync_engine import SERVICE_EXTENSIONS

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
                    if os.path.splitext(name)[1].lower() in SERVICE_EXTENSIONS:
                        continue
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
