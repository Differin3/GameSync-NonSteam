"""Контроль целостности архивов и восстановленных файлов."""

import hashlib
import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1 << 20


def sha256_file(path: str) -> Optional[str]:
    """SHA256 файла; None при ошибке чтения."""
    digest = hashlib.sha256()
    try:
        with open(path, "rb") as handle:
            while True:
                chunk = handle.read(CHUNK_SIZE)
                if not chunk:
                    break
                digest.update(chunk)
    except OSError as e:
        logger.warning(f"Cannot hash {path}: {e}")
        return None
    return digest.hexdigest()


def verify_file(path: str, expected: str) -> bool:
    """Совпадает ли SHA256 файла с ожидаемым."""
    if not expected:
        return True
    actual = sha256_file(path)
    if actual != expected:
        logger.warning(f"Checksum mismatch for {path}: {actual} != {expected}")
        return False
    return True


def file_meta(path: Path) -> Optional[Dict[str, int]]:
    """Размер файла и его SHA256 — для манифеста."""
    try:
        size = path.stat().st_size
    except OSError:
        return None
    digest = sha256_file(str(path))
    if digest is None:
        return None
    return {"sha256": digest, "size": size}
