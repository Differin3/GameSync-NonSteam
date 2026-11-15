"""Расчёт статистики синхронизаций.

В истории бэкапов лежат записи двух видов:
  * ``sync`` — обычная синхронизация игры;
  * ``prerestore`` — страховочная копия перед восстановлением.

Считать их одинаково нельзя: восстановление — не синхронизация, иначе
график и «последняя синхронизация» врут. При этом файлы обоих видов
занимают место в облаке, поэтому объём считается по всем записям.
"""

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def _kind(entry: Dict[str, Any]) -> str:
    return str(entry.get("kind") or "sync")


def build_stats(
    backup_groups: Dict[str, List[Dict[str, Any]]],
    synced_games: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    groups = backup_groups or {}
    legacy = synced_games or {}

    entries: List[Dict[str, Any]] = [
        entry for items in groups.values() for entry in (items or []) if isinstance(entry, dict)
    ]
    sync_entries = [entry for entry in entries if _kind(entry) == "sync"]

    syncs_by_date: Dict[str, int] = {}
    for entry in sync_entries:
        created = str(entry.get("created") or "")
        if created:
            date_key = created[:10]
            syncs_by_date[date_key] = syncs_by_date.get(date_key, 0) + 1

    if entries:
        total_syncs = len(sync_entries)
        games_count = sum(
            1
            for items in groups.values()
            if any(_kind(entry) == "sync" for entry in (items or []) if isinstance(entry, dict))
        )
        # Все версии (включая страховочные) реально лежат в облаке.
        total_size = sum(int(entry.get("size") or 0) for entry in entries)
        last_sync = max((str(entry.get("created") or "") for entry in sync_entries), default="")
        last_sync = last_sync or None
    else:
        # Старый формат: только карта последних синхронизаций.
        total_syncs = len(legacy)
        games_count = len(legacy)
        total_size = 0
        last_sync = None
        for game_data in legacy.values():
            sync_date = str(game_data.get("lastSync") or "")
            if sync_date:
                syncs_by_date[sync_date[:10]] = syncs_by_date.get(sync_date[:10], 0) + 1
                if not last_sync or sync_date > last_sync:
                    last_sync = sync_date
            size = game_data.get("fileSize", 0)
            if isinstance(size, (int, float)):
                total_size += int(size)

    return {
        "totalSyncs": total_syncs,
        "lastSync": last_sync,
        "gamesCount": games_count,
        "totalSize": total_size,
        "syncsByDate": [
            {"date": date, "count": count}
            for date, count in sorted(syncs_by_date.items(), reverse=True)
        ][:30],
    }