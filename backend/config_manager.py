import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

CONFIG_DIR = Path.home() / ".config" / "gamesync"
CONFIG_FILE = CONFIG_DIR / "games.json"
SYNCED_GAMES_FILE = CONFIG_DIR / "synced_games.json"
GDRIVE_CONFIG_FILE = CONFIG_DIR / "gdrive_config.json"
STORAGE_CONFIG_FILE = CONFIG_DIR / "storage_config.json"

def load_game_configs() -> Dict[str, Dict]:
    """Загрузка конфигурации игр"""
    if not CONFIG_FILE.exists():
        return {}
    
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading game configs: {e}")
        return {}

def save_game_configs(configs: Dict[str, Dict]):
    """Сохранение конфигурации игр"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(configs, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved game configs to {CONFIG_FILE}")
    except Exception as e:
        logger.error(f"Error saving game configs: {e}")
        raise

def get_game_config(game_name: str) -> Optional[Dict]:
    """Получение конфигурации игры"""
    configs = load_game_configs()
    return configs.get(game_name)

def update_game_config(game_name: str, save_paths: List[str], enabled: bool = True):
    """Обновление конфигурации игры"""
    configs = load_game_configs()
    configs[game_name] = {
        "savePaths": save_paths,
        "enabled": enabled
    }
    save_game_configs(configs)

def remove_game_config(game_name: str):
    """Удаление конфигурации игры"""
    configs = load_game_configs()
    if game_name in configs:
        del configs[game_name]
        save_game_configs(configs)

def validate_path(path: str) -> Dict[str, Any]:
    """Валидация пути сохранений"""
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"valid": False, "error": "Путь не существует"}
    
    if not path_obj.is_absolute():
        return {"valid": False, "error": "Путь должен быть абсолютным"}
    
    return {"valid": True, "path": str(path_obj.absolute())}

def load_synced_games() -> Dict[str, Dict]:
    """Загрузка списка синхронизированных игр"""
    if not SYNCED_GAMES_FILE.exists():
        return {}
    
    try:
        with open(SYNCED_GAMES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading synced games: {e}")
        return {}

def save_synced_games(synced_games: Dict[str, Dict]):
    """Сохранение списка синхронизированных игр"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(SYNCED_GAMES_FILE, 'w', encoding='utf-8') as f:
            json.dump(synced_games, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved synced games to {SYNCED_GAMES_FILE}")
    except Exception as e:
        logger.error(f"Error saving synced games: {e}")
        raise

def get_synced_games() -> List[Dict]:
    """Получение списка синхронизированных игр"""
    synced_games = load_synced_games()
    return [{"gameName": name, **data} for name, data in synced_games.items()]

def add_synced_game(game_name: str, file_id: Optional[str] = None):
    """Добавление игры в список синхронизированных"""
    synced_games = load_synced_games()
    synced_games[game_name] = {
        "lastSync": datetime.now().isoformat(),
        "fileId": file_id
    }
    save_synced_games(synced_games)

def save_gdrive_config(client_id: str, client_secret: str, refresh_token: str):
    """Сохранение конфигурации Google Drive"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    config = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token
    }
    try:
        with open(GDRIVE_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved Google Drive config to {GDRIVE_CONFIG_FILE}")
    except Exception as e:
        logger.error(f"Error saving Google Drive config: {e}")
        raise

def load_gdrive_config() -> Dict[str, str]:
    """Загрузка конфигурации Google Drive (для обратной совместимости)"""
    storage_config = load_storage_config()
    if storage_config.get('provider') == 'gdrive':
        return {
            'client_id': storage_config.get('client_id', ''),
            'client_secret': storage_config.get('client_secret', ''),
            'refresh_token': storage_config.get('refresh_token', '')
        }
    # Старый формат
    if not GDRIVE_CONFIG_FILE.exists():
        return {}
    try:
        with open(GDRIVE_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading Google Drive config: {e}")
        return {}

def save_storage_config(provider: str, **kwargs):
    """Сохранение конфигурации хранилища"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    config = {
        "provider": provider,
        **kwargs
    }
    try:
        with open(STORAGE_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved storage config to {STORAGE_CONFIG_FILE}")
    except Exception as e:
        logger.error(f"Error saving storage config: {e}")
        raise

def load_storage_config() -> Dict[str, Any]:
    """Загрузка конфигурации хранилища"""
    if not STORAGE_CONFIG_FILE.exists():
        # Обратная совместимость: загружаем старый gdrive_config
        gdrive_config = {}
        if GDRIVE_CONFIG_FILE.exists():
            try:
                with open(GDRIVE_CONFIG_FILE, 'r', encoding='utf-8') as f:
                    gdrive_config = json.load(f)
            except:
                pass
        if gdrive_config:
            return {
                "provider": "gdrive",
                "client_id": gdrive_config.get("client_id", ""),
                "client_secret": gdrive_config.get("client_secret", ""),
                "refresh_token": gdrive_config.get("refresh_token", "")
            }
        return {"provider": "gdrive"}
    try:
        with open(STORAGE_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading storage config: {e}")
        return {"provider": "gdrive"}
