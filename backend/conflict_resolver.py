import os
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

def get_file_modification_time(file_path: str) -> Optional[float]:
    """Получение времени модификации файла"""
    try:
        return os.path.getmtime(file_path)
    except Exception as e:
        logger.error(f"Error getting modification time for {file_path}: {e}")
        return None

def compare_files(local_path: str, remote_mod_time: Optional[float]) -> Dict[str, any]:
    """Сравнение локального и удаленного файла"""
    local_mod_time = get_file_modification_time(local_path)
    
    if local_mod_time is None:
        return {"status": "error", "message": "Не удалось получить время модификации локального файла"}
    
    if remote_mod_time is None:
        return {"status": "local_newer", "message": "Удаленный файл не найден, используем локальный"}
    
    time_diff = local_mod_time - remote_mod_time
    
    if abs(time_diff) < 1:  # Файлы идентичны (разница менее 1 секунды)
        return {"status": "identical", "message": "Файлы идентичны"}
    elif time_diff > 0:
        return {"status": "local_newer", "message": f"Локальный файл новее на {time_diff:.0f} секунд"}
    else:
        return {"status": "remote_newer", "message": f"Удаленный файл новее на {abs(time_diff):.0f} секунд"}

def resolve_conflict(local_path: str, remote_path: str, strategy: str = "ask") -> Dict[str, any]:
    """Разрешение конфликта версий файлов"""
    # Получаем время модификации удаленного файла из метаданных
    # В реальной реализации это будет получено из Google Drive API
    remote_mod_time = get_file_modification_time(remote_path) if os.path.exists(remote_path) else None
    
    comparison = compare_files(local_path, remote_mod_time)
    
    if comparison["status"] == "identical":
        return {"action": "skip", "message": "Файлы идентичны, пропускаем"}
    
    if strategy == "local":
        return {"action": "keep_local", "message": "Используем локальную версию"}
    elif strategy == "remote":
        return {"action": "use_remote", "message": "Используем удаленную версию"}
    else:
        # strategy == "ask" - возвращаем информацию для UI
        return {
            "action": "ask_user",
            "comparison": comparison,
            "local_time": datetime.fromtimestamp(get_file_modification_time(local_path) or 0).isoformat(),
            "remote_time": datetime.fromtimestamp(remote_mod_time or 0).isoformat() if remote_mod_time else None
        }

def find_text_files(directory: str) -> List[str]:
    """Поиск текстовых файлов для просмотра различий"""
    text_extensions = [".txt", ".cfg", ".ini", ".json", ".xml", ".yaml", ".yml"]
    text_files = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in text_extensions):
                text_files.append(os.path.join(root, file))
    
    return text_files
