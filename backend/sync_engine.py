import io
import json
import logging
import os
import re
import tarfile
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

MANIFEST_DIR = ".gamesync"
MANIFEST_NAME = f"{MANIFEST_DIR}/manifest.json"
MANIFEST_VERSION = 1


def sanitize_name(name: str) -> str:
    """Приводит имя игры к безопасному для файловой системы виду."""
    safe = re.sub(r"[^\w.\- ]", "_", name, flags=re.UNICODE).strip()
    safe = re.sub(r"\s+", "_", safe)
    return safe or "game"


def build_backup_plan(save_paths: List[str]) -> List[Tuple[Path, str]]:
    """Список (путь, корень в архиве). Корни уникальны, чтобы восстановление
    однозначно сопоставило папку в архиве с папкой на диске."""
    plan: List[Tuple[Path, str]] = []
    used_roots: set = set()
    for index, save_path in enumerate(save_paths):
        path = Path(save_path)
        if not path.exists():
            logger.warning(f"Save path does not exist: {save_path}")
            continue
        root = path.name or f"path-{index}"
        if root in used_roots:
            root = f"{root}-{index}"
        used_roots.add(root)
        plan.append((path, root))
    return plan


def build_manifest(game_name: str, plan: List[Tuple[Path, str]]) -> Dict[str, Any]:
    return {
        "version": MANIFEST_VERSION,
        "game": game_name,
        "created": datetime.now().isoformat(timespec="seconds"),
        "paths": [
            {"path": str(path), "root": root, "is_dir": path.is_dir()}
            for path, root in plan
        ],
    }


def create_backup(
    game_name: str,
    save_paths: List[str],
    output_dir: Optional[str] = None,
    incremental: bool = False,
    last_backup_time: Optional[float] = None,
) -> Optional[str]:
    """Создаёт tar.gz с сохранениями игры и манифестом для восстановления."""
    if not save_paths:
        logger.warning(f"No save paths provided for {game_name}")
        return None

    output_path = Path(output_dir) if output_dir else Path(tempfile.gettempdir())
    output_path.mkdir(parents=True, exist_ok=True)

    # Стабильное имя архива: повторная синхронизация перезаписывает облачную
    # копию, а версии хранятся отдельно (см. backup_index).
    archive_name = f"{sanitize_name(game_name)}.tar.gz"
    archive_path = output_path / archive_name

    plan = build_backup_plan(save_paths)
    if not plan:
        logger.warning(f"No existing save paths for {game_name}")
        return None

    try:
        files_added = 0
        with tarfile.open(archive_path, "w:gz", compresslevel=6) as tar:
            manifest = build_manifest(game_name, plan)
            payload = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")
            info = tarfile.TarInfo(MANIFEST_NAME)
            info.size = len(payload)
            info.mtime = time.time()
            tar.addfile(info, io.BytesIO(payload))

            for path, root in plan:
                if path.is_file():
                    if incremental and last_backup_time and os.path.getmtime(path) <= last_backup_time:
                        continue
                    tar.add(path, arcname=root)
                    files_added += 1
                elif path.is_dir():
                    for current_dir, _dirs, files in os.walk(path):
                        for file_name in files:
                            file_path = Path(current_dir) / file_name
                            if incremental and last_backup_time and os.path.getmtime(file_path) <= last_backup_time:
                                continue
                            arcname = Path(root) / file_path.relative_to(path)
                            tar.add(file_path, arcname=str(arcname))
                            files_added += 1

        if files_added == 0 and incremental:
            logger.info("No new files to backup (incremental)")
            os.remove(archive_path)
            return None

        logger.info(
            f"Created backup: {archive_path} "
            f"({archive_path.stat().st_size / 1024 / 1024:.2f} MB, {files_added} files)"
        )
        return str(archive_path)
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        # Не оставляем недописанный архив: иначе следующий аплоад может
        # отправить в облако битый файл.
        try:
            if archive_path.exists():
                archive_path.unlink()
        except OSError:
            pass
        return None


def extract_backup(archive_path: str, extract_to: str) -> bool:
    """Простое извлечение архива в одну папку (для отладки и старых бэкапов)."""
    try:
        archive = Path(archive_path)
        if not archive.exists():
            logger.error(f"Archive not found: {archive_path}")
            return False

        extract_path = Path(extract_to)
        extract_path.mkdir(parents=True, exist_ok=True)

        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(extract_to)

        logger.info(f"Extracted backup to: {extract_to}")
        return True
    except Exception as e:
        logger.error(f"Error extracting backup: {e}")
        return False

# Служебные файлы не считаем сохранениями (логи, кэш, бинарники).
SERVICE_EXTENSIONS = {
    ".log", ".txt", ".dll", ".exe", ".png", ".jpg", ".jpeg", ".dds", ".pdb",
    ".mdmp", ".wer", ".chunk", ".pak",
}


def count_meaningful_files(paths: List[str], limit: int = 5000) -> int:
    """Сколько файлов в путях действительно похожи на сохранения."""
    count = 0
    for raw in paths or []:
        path = Path(raw)
        try:
            if path.is_file():
                if path.suffix.lower() not in SERVICE_EXTENSIONS:
                    count += 1
            elif path.is_dir():
                for item in path.rglob("*"):
                    if item.is_file() and item.suffix.lower() not in SERVICE_EXTENSIONS:
                        count += 1
                        if count >= limit:
                            return count
        except OSError:
            continue
    return count