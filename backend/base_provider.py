from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from pathlib import Path

class StorageProvider(ABC):
    """Базовый класс для провайдеров хранилища"""
    
    @abstractmethod
    def upload_file(self, file_path: str, remote_path: str = None) -> Optional[str]:
        """Загрузка файла. Возвращает ID файла или путь"""
        pass
    
    @abstractmethod
    def download_file(self, file_id: str, save_path: str) -> bool:
        """Скачивание файла по ID или пути"""
        pass
    
    @abstractmethod
    def find_file(self, file_name: str, folder_name: str = "GameSync") -> Optional[str]:
        """Поиск файла. Возвращает ID или путь"""
        pass
    
    @abstractmethod
    def get_file_info(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Получение информации о файле"""
        pass
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Тест подключения"""
        pass
