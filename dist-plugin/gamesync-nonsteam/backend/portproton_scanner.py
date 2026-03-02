import os
import logging
import configparser
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Использование кэша
use_cache = True

# Стандартные пути для поиска сохранений
# PortProton использует steamuser по умолчанию, но может быть и deck
STANDARD_SAVE_PATHS = [
    "users/steamuser/Documents",
    "users/steamuser/Documents/My Games",
    "users/steamuser/Saved Games",
    "users/steamuser/AppData/Local",
    "users/steamuser/AppData/Roaming",
    "users/deck/Documents",
    "users/deck/Documents/My Games",
    "users/deck/Saved Games",
    "users/deck/AppData/Local",
    "users/deck/AppData/Roaming",
]

# Расширения файлов сохранений
SAVE_EXTENSIONS = [".sav", ".save", ".dat", ".cfg", ".ini", ".json"]

# Служебные .desktop файлы, которые нужно игнорировать
IGNORED_DESKTOP_FILES = ["PortProton.desktop", "readme.desktop"]

def find_portproton_root() -> Optional[Path]:
    """Найти корневую папку PortProton"""
    home = Path.home()
    portproton_path = home / "PortProton"
    
    if portproton_path.exists() and portproton_path.is_dir():
        return portproton_path
    
    logger.warning(f"PortProton root not found at {portproton_path}")
    return None

def get_portproton_prefixes_path() -> Optional[Path]:
    """Получить путь к папке префиксов PortProton"""
    root = find_portproton_root()
    if root:
        return root / "prefixes"
    return None

def parse_desktop_file(desktop_path: Path) -> Optional[Dict[str, str]]:
    """Парсинг .desktop файла для извлечения информации об игре"""
    try:
        config = configparser.ConfigParser()
        # Читаем файл с указанием кодировки
        with open(desktop_path, 'r', encoding='utf-8') as f:
            config.read_file(f)
        
        if 'Desktop Entry' not in config:
            return None
        
        entry = config['Desktop Entry']
        name = entry.get('Name', desktop_path.stem)
        exec_cmd = entry.get('Exec', '')
        
        return {
            'name': name,
            'exec': exec_cmd,
            'desktop_file': str(desktop_path)
        }
    except Exception as e:
        logger.error(f"Error parsing desktop file {desktop_path}: {e}")
        return None

def find_game_folders(base_path: Path, game_name: str) -> List[Path]:
    """Найти папки, связанные с игрой по названию"""
    game_folders = []
    if not base_path.exists() or not base_path.is_dir():
        return game_folders
    
    game_name_lower = game_name.lower()
    # Нормализуем название игры для поиска (убираем специальные символы)
    game_name_normalized = ''.join(c for c in game_name_lower if c.isalnum() or c.isspace())
    game_name_words = set(game_name_normalized.split())
    
    try:
        for item in base_path.iterdir():
            if not item.is_dir():
                continue
            
            folder_name_lower = item.name.lower()
            folder_name_normalized = ''.join(c for c in folder_name_lower if c.isalnum() or c.isspace())
            folder_name_words = set(folder_name_normalized.split())
            
            # Проверяем точное совпадение или частичное (если есть общие слова)
            if (game_name_lower in folder_name_lower or 
                folder_name_lower in game_name_lower or
                len(game_name_words & folder_name_words) > 0):
                game_folders.append(item)
    except (PermissionError, OSError) as e:
        logger.debug(f"Cannot access {base_path}: {e}")
    
    return game_folders

def detect_save_paths(game_prefix_path: Path, game_name: str = "") -> List[str]:
    """Автоопределение путей сохранений для игры.
    Сканирует Documents, Saved Games, My Games, AppData — ищет подпапки по названию игры и имени префикса.
    Найденные папки добавляются без проверки расширений файлов (мягкий вариант по плану).
    """
    save_paths = []
    drive_c = game_prefix_path / "drive_c"
    
    if not drive_c.exists():
        return save_paths
    
    prefix_name = game_prefix_path.name
    
    for standard_path in STANDARD_SAVE_PATHS:
        full_path = drive_c / standard_path
        if not full_path.exists() or not full_path.is_dir():
            continue
        
        # Для любого префикса: ищем подпапки по названию игры и по имени префикса (без проверки расширений)
        found_folders: List[Path] = []
        if game_name:
            found_folders.extend(find_game_folders(full_path, game_name))
        if prefix_name and prefix_name.upper() != "DEFAULT":
            folders_by_prefix = find_game_folders(full_path, prefix_name)
            for f in folders_by_prefix:
                if f not in found_folders:
                    found_folders.append(f)
        
        for folder in found_folders:
            save_paths.append(str(folder))
        
        # Fallback: если подпапок по имени не нашли, но в самой базовой папке есть файлы сохранений — добавляем её
        if not found_folders:
            found_save = False
            try:
                for item in full_path.iterdir():
                    if item.is_file() and item.suffix.lower() in SAVE_EXTENSIONS:
                        found_save = True
                        break
                    if item.is_dir():
                        for subitem in item.iterdir():
                            if subitem.is_file() and subitem.suffix.lower() in SAVE_EXTENSIONS:
                                found_save = True
                                break
                        if found_save:
                            break
            except (PermissionError, OSError) as e:
                logger.debug(f"Cannot access {full_path}: {e}")
            if found_save:
                save_paths.append(str(full_path))
    
    return list(set(save_paths))

def find_prefix_for_game(game_name: str, desktop_file_path: str, prefixes_path: Path) -> Optional[Path]:
    """Найти префикс для игры по названию и .desktop файлу"""
    # Сначала пробуем найти префикс с именем игры (точное совпадение)
    game_prefix = prefixes_path / game_name
    if game_prefix.exists() and (game_prefix / "drive_c").exists():
        return game_prefix
    
    # Пробуем найти префикс по имени .desktop файла (без расширения)
    desktop_path = Path(desktop_file_path)
    desktop_stem = desktop_path.stem
    if desktop_stem and desktop_stem != game_name:
        stem_prefix = prefixes_path / desktop_stem
        if stem_prefix.exists() and (stem_prefix / "drive_c").exists():
            return stem_prefix
    
    # Пробуем найти префикс по части имени (если имя игры содержит подстроку)
    # Это для случаев, когда имя игры длиннее или короче имени префикса
    for prefix_dir in prefixes_path.iterdir():
        if not prefix_dir.is_dir():
            continue
        if not (prefix_dir / "drive_c").exists():
            continue
        
        prefix_name = prefix_dir.name
        # Пропускаем DEFAULT - его проверим отдельно как fallback
        if prefix_name.upper() == "DEFAULT":
            continue
        
        # Проверяем, совпадает ли имя префикса с частью имени игры или наоборот
        if (prefix_name.lower() in game_name.lower() or 
            game_name.lower() in prefix_name.lower()):
            return prefix_dir
    
    # Используем DEFAULT префикс как fallback (все игры PortProton используют его)
    default_prefix = prefixes_path / "DEFAULT"
    if default_prefix.exists() and (default_prefix / "drive_c").exists():
        logger.debug(f"Using DEFAULT prefix for game '{game_name}'")
        return default_prefix
    
    logger.debug(f"Prefix not found for game '{game_name}', desktop: {desktop_file_path}")
    return None

def scan_portproton_games(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """Сканирование игр PortProton через .desktop файлы"""
    # Проверяем кэш только если не принудительное обновление
    if use_cache and not force_refresh:
        try:
            from cache_manager import cache_manager
            cached = cache_manager.get("portproton_games")
            if cached is not None:
                logger.info("Using cached game list")
                return cached
        except ImportError:
            pass
    
    games = []
    portproton_root = find_portproton_root()
    
    if not portproton_root:
        logger.warning("PortProton root not found")
        return games
    
    prefixes_path = portproton_root / "prefixes"
    if not prefixes_path.exists():
        logger.warning(f"PortProton prefixes path not found: {prefixes_path}")
        return games
    
    # Читаем все .desktop файлы из корня PortProton
    for desktop_file in portproton_root.glob("*.desktop"):
        # Пропускаем служебные файлы
        if desktop_file.name in IGNORED_DESKTOP_FILES:
            continue
        
        # Парсим .desktop файл
        game_info = parse_desktop_file(desktop_file)
        if not game_info:
            continue
        
        game_name = game_info['name']
        desktop_file = game_info['desktop_file']
        
        # Ищем соответствующий префикс (передаем также путь к .desktop файлу для более точного поиска)
        prefix_path = find_prefix_for_game(game_name, desktop_file, prefixes_path)
        if not prefix_path:
            logger.debug(f"No prefix found for game: {game_name}, desktop: {desktop_file}")
            # Игра без префикса - пропускаем, чтобы не добавлять неправильные пути
            continue
        
        # Определяем пути сохранений только для этого конкретного префикса
        # Передаем название игры для поиска индивидуальных папок в DEFAULT префиксе
        save_paths = detect_save_paths(prefix_path, game_name)
        
        logger.debug(f"Game: {game_name}, Prefix: {prefix_path.name}, Save paths: {len(save_paths)}")
        
        games.append({
            "name": game_name,
            "desktopFile": game_info['desktop_file'],
            "prefixPath": str(prefix_path),
            "savePaths": save_paths,
            "hasSaves": len(save_paths) > 0
        })
    
    # Сохраняем в кэш
    if use_cache:
        try:
            from cache_manager import cache_manager
            cache_manager.set("portproton_games", games)
        except ImportError:
            pass
    
    logger.info(f"Found {len(games)} PortProton games")
    return games
