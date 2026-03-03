import decky
import os
import json
import asyncio
import urllib.request
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Используем логгер Decky Loader
logger = decky.logger

try:
    from portproton_scanner import scan_portproton_games
except ImportError:
    import sys
    import pathlib
    backend_path = pathlib.Path(__file__).parent
    sys.path.insert(0, str(backend_path))
    from portproton_scanner import scan_portproton_games

class Plugin:
    # Классовые переменные для состояния
    auto_sync_enabled = False
    game_monitor = None
    
    async def _main(self):
        """Инициализация плагина"""
        logger.info("GameSync NonSteam plugin initialized")
        Plugin.auto_sync_enabled = False
        Plugin.game_monitor = None
        pass

    async def _unload(self):
        """Выгрузка плагина"""
        try:
            if Plugin.game_monitor:
                Plugin.game_monitor.stop_monitoring()
        except Exception as e:
            logger.error(f"Error stopping game monitor: {e}")
        logger.info("GameSync NonSteam plugin unloaded")

    async def get_test(self, *args, **kwargs) -> Dict[str, Any]:
        """Тестовый метод для проверки связи с фронтендом"""
        try:
            return {"success": True, "status": "ok", "message": "Plugin is working"}
        except Exception as e:
            logger.error(f"Error in get_test: {e}")
            return {"success": False, "error": str(e)}
    
    async def scan_games(self, force_refresh: bool = False, *args, **kwargs) -> Dict[str, Any]:
        """Сканирование игр PortProton"""
        try:
            # Проверяем параметр force_refresh из kwargs
            if force_refresh is False:
                force_refresh = kwargs.get('force_refresh', False)
            
            games = scan_portproton_games(force_refresh=force_refresh)
            return {"success": True, "games": games}
        except Exception as e:
            logger.error(f"Error scanning games: {e}")
            return {"success": False, "error": str(e), "games": []}
    
    async def sync_game(self, game_name: str = None, save_paths: List[str] = None, *args, **kwargs) -> Dict[str, Any]:
        """Синхронизация игры"""
        try:
            # Получаем параметры из kwargs если не переданы напрямую
            if game_name is None:
                game_name = kwargs.get('game_name')
            if save_paths is None:
                save_paths = kwargs.get('save_paths', [])
            
            if not game_name or not save_paths:
                return {"success": False, "error": "Не указаны game_name или save_paths"}
            try:
                from sync_engine import create_backup
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from sync_engine import create_backup
            
            # Создаем бэкап
            archive_path = create_backup(game_name, save_paths)
            if not archive_path:
                return {"success": False, "error": "Не удалось создать архив"}
            
            # Загружаем провайдер хранилища
            try:
                from config_manager import load_storage_config
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import load_storage_config
            
            storage_config = load_storage_config()
            
            # Единственный поддерживаемый провайдер сейчас — WebDAV
            try:
                from webdav_provider import WebDAVProvider
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from webdav_provider import WebDAVProvider
            
            url = storage_config.get('url', '')
            username = storage_config.get('username', '')
            password = storage_config.get('password', '')
            oauth_token = storage_config.get('oauth_token', '')
            
            if not url:
                return {"success": False, "error": "Не настроен WebDAV. Укажите URL в настройках."}
            
            if not oauth_token and (not username or not password):
                return {"success": False, "error": "Не настроен WebDAV. Укажите логин/пароль или OAuth токен в настройках."}
            
            provider = WebDAVProvider(url=url, username=username, password=password, oauth_token=oauth_token)
            
            file_id = provider.upload_file(archive_path, "GameSync")
            
            if not file_id:
                return {"success": False, "error": "Не удалось загрузить файл в WebDAV хранилище"}
            
            # Получаем размер загруженного файла для статистики
            file_size = None
            try:
                file_info = provider.get_file_info(file_id)
                if file_info and file_info.get('size'):
                    file_size = file_info.get('size')
                    logger.info(f"File size for {game_name}: {file_size} bytes")
            except Exception as e:
                logger.warning(f"Failed to get file info: {e}")
            
            # Удаляем временный архив
            try:
                os.remove(archive_path)
            except:
                pass
            
            # Сохраняем информацию о синхронизации с размером файла
            try:
                from config_manager import add_synced_game
                add_synced_game(game_name, file_id, file_size)
            except Exception as e:
                logger.warning(f"Failed to save sync info: {e}")
            
            return {"success": True, "file_id": file_id, "message": "Синхронизация завершена"}
        except Exception as e:
            logger.error(f"Error syncing game: {e}")
            return {"success": False, "error": str(e)}
    
    async def load_credentials_from_file(self, file_path: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Загрузка credentials из JSON файла Google Cloud Console"""
        try:
            logger.info(f"load_credentials_from_file called with file_path={file_path}, kwargs={kwargs}")
            
            # Сначала проверяем kwargs, потом file_path
            if file_path is None:
                file_path = kwargs.get('file_path')
            
            # Если file_path все еще None, проверяем, может быть он в kwargs как вложенный dict
            if file_path is None and kwargs:
                # Проверяем, может быть весь kwargs и есть file_path
                if 'file_path' in kwargs and isinstance(kwargs['file_path'], dict):
                    file_path = kwargs['file_path'].get('file_path')
            
            # Проверяем, что file_path - это строка, а не dict
            if isinstance(file_path, dict):
                logger.warning(f"file_path is dict: {file_path}")
                # Если передан dict, пытаемся извлечь path, realpath или file_path
                # Важно: проверяем 'file_path' первым, так как это ключ, который использует Decky
                file_path = file_path.get('file_path') or file_path.get('realpath') or file_path.get('path')
            
            logger.info(f"After processing, file_path={file_path}, type={type(file_path)}")
            
            if not file_path:
                logger.error("file_path is empty or None")
                return {"success": False, "error": "Не указан путь к файлу"}
            
            if not isinstance(file_path, (str, bytes, os.PathLike)):
                logger.error(f"Invalid file_path type: {type(file_path).__name__}, value: {file_path}")
                return {"success": False, "error": f"Неверный тип пути: {type(file_path).__name__}, ожидается строка"}
            
            # Преобразуем в строку если нужно
            file_path_str = str(file_path) if not isinstance(file_path, str) else file_path
            logger.info(f"Using file_path_str: {file_path_str}")
            file_path_obj = Path(file_path_str)
            if not file_path_obj.exists():
                return {"success": False, "error": f"Файл не найден: {file_path}"}
            
            if not file_path_obj.is_file():
                return {"success": False, "error": f"Указанный путь не является файлом: {file_path}"}
            
            try:
                with open(file_path_obj, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except json.JSONDecodeError as e:
                return {"success": False, "error": f"Ошибка парсинга JSON: {str(e)}"}
            except Exception as e:
                return {"success": False, "error": f"Ошибка чтения файла: {str(e)}"}
            
            # Извлекаем credentials из структуры Google Cloud Console
            # Формат: {"web": {"client_id": "...", "client_secret": "..."}}
            client_id = None
            client_secret = None
            
            if isinstance(data, dict):
                # Проверяем структуру с вложенным объектом "web"
                if "web" in data and isinstance(data["web"], dict):
                    client_id = data["web"].get("client_id")
                    client_secret = data["web"].get("client_secret")
                # Также проверяем прямую структуру (на случай другого формата)
                elif "client_id" in data:
                    client_id = data.get("client_id")
                    client_secret = data.get("client_secret")
            
            if not client_id:
                return {"success": False, "error": "В файле не найден client_id. Проверьте формат JSON файла."}
            
            if not client_secret:
                return {"success": False, "error": "В файле не найден client_secret. Проверьте формат JSON файла."}
            
            return {
                "success": True,
                "client_id": client_id,
                "client_secret": client_secret
            }
        except Exception as e:
            logger.error(f"Error loading credentials from file: {e}")
            return {"success": False, "error": str(e)}
    
    # Google Drive больше не поддерживается – тест подключения не реализован
    
    async def validate_save_path(self, path: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Валидация пути сохранений"""
        try:
            if path is None:
                path = kwargs.get('path')
            
            if not path:
                return {"success": False, "error": "Не указан path"}
            try:
                from config_manager import validate_path
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import validate_path
            
            result = validate_path(path)
            return {"success": result["valid"], "error": result.get("error"), "path": result.get("path")}
        except Exception as e:
            logger.error(f"Error validating path: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_game_paths(self, game_name: str = None, save_paths: List[str] = None, *args, **kwargs) -> Dict[str, Any]:
        """Обновление путей сохранений для игры"""
        try:
            if game_name is None:
                game_name = kwargs.get('game_name')
            if save_paths is None:
                save_paths = kwargs.get('save_paths', [])
            
            if not game_name:
                return {"success": False, "error": "Не указан game_name"}
            try:
                from config_manager import update_game_config
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import update_game_config
            
            update_game_config(game_name, save_paths)
            return {"success": True, "message": "Пути сохранены"}
        except Exception as e:
            logger.error(f"Error updating game paths: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_game_config(self, game_name: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Получение конфигурации игры"""
        try:
            if game_name is None:
                game_name = kwargs.get('game_name')
            
            if not game_name:
                return {"success": False, "error": "Не указан game_name"}
            try:
                from config_manager import get_game_config
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import get_game_config
            
            config = get_game_config(game_name)
            return {"success": True, "config": config}
        except Exception as e:
            logger.error(f"Error getting game config: {e}")
            return {"success": False, "error": str(e)}
    
    async def check_conflicts(self, game_name: str = None, save_paths: List[str] = None, *args, **kwargs) -> Dict[str, Any]:
        """Проверка конфликтов версий файлов"""
        try:
            if game_name is None:
                game_name = kwargs.get('game_name')
            if save_paths is None:
                save_paths = kwargs.get('save_paths', [])
            
            if not game_name or not save_paths:
                return {"success": False, "error": "Не указаны game_name или save_paths", "conflicts": []}
            # Пока конфликтов не ищем, так как Google Drive убран.
            return {"success": True, "conflicts": []}
        except Exception as e:
            logger.error(f"Error checking conflicts: {e}")
            return {"success": False, "error": str(e), "conflicts": []}
    
    async def enable_auto_sync(self, enabled: bool = False, *args, **kwargs) -> Dict[str, Any]:
        """Включение/выключение автосинхронизации"""
        try:
            Plugin.auto_sync_enabled = enabled
            
            if enabled:
                try:
                    from auto_sync import GameMonitor
                except ImportError:
                    import sys
                    import pathlib
                    backend_path = pathlib.Path(__file__).parent
                    sys.path.insert(0, str(backend_path))
                    from auto_sync import GameMonitor
                
                async def sync_callback(game_name: str, save_paths: List[str]):
                    """Callback для автосинхронизации"""
                    logger.info(f"Auto-syncing game: {game_name}")
                    plugin_instance = Plugin()
                    result = await plugin_instance.sync_game(game_name, save_paths)
                    if result.get("success"):
                        logger.info(f"Auto-sync completed for {game_name}")
                    else:
                        logger.error(f"Auto-sync failed for {game_name}: {result.get('error')}")
                
                Plugin.game_monitor = GameMonitor(sync_callback)
                import asyncio
                asyncio.create_task(Plugin.game_monitor.start_monitoring())
            else:
                if Plugin.game_monitor:
                    Plugin.game_monitor.stop_monitoring()
                    Plugin.game_monitor = None
            
            return {"success": True, "auto_sync_enabled": enabled}
        except Exception as e:
            logger.error(f"Error enabling auto-sync: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_synced_games(self, *args, **kwargs) -> Dict[str, Any]:
        """Получение списка синхронизированных игр"""
        try:
            try:
                from config_manager import get_synced_games
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import get_synced_games
            
            synced_games = get_synced_games()
            return {"success": True, "games": synced_games}
        except Exception as e:
            logger.error(f"Error getting synced games: {e}")
            return {"success": False, "error": str(e), "games": []}
    
    async def get_sync_stats(self, *args, **kwargs) -> Dict[str, Any]:
        """Получение статистики синхронизаций"""
        try:
            try:
                from config_manager import get_synced_games, load_synced_games
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import get_synced_games, load_synced_games
            
            synced_games = load_synced_games()
            total_syncs = len(synced_games)
            
            # Получаем даты синхронизаций
            syncs_by_date = {}
            last_sync = None
            total_size = 0
            
            for game_name, game_data in synced_games.items():
                sync_date = game_data.get('lastSync', '')
                if sync_date:
                    date_key = sync_date[:10]  # YYYY-MM-DD
                    syncs_by_date[date_key] = syncs_by_date.get(date_key, 0) + 1
                    
                    if not last_sync or sync_date > last_sync:
                        last_sync = sync_date
                
                # Используем локально сохраненный размер файла
                file_size = game_data.get('fileSize', 0)
                if file_size and isinstance(file_size, (int, float)):
                    total_size += int(file_size)
            
            # Преобразуем в список для фронтенда
            syncs_by_date_list = [
                {"date": date, "count": count}
                for date, count in sorted(syncs_by_date.items(), reverse=True)
            ]
            
            return {
                "success": True,
                "stats": {
                    "totalSyncs": total_syncs,
                    "lastSync": last_sync,
                    "gamesCount": total_syncs,
                    "totalSize": total_size,
                    "syncsByDate": syncs_by_date_list[:30]  # Последние 30 дней
                }
            }
        except Exception as e:
            logger.error(f"Error getting sync stats: {e}")
            return {"success": False, "error": str(e), "stats": None}
    
    # Google OAuth и отдельная конфигурация для Google Drive больше не используются
    
    async def save_storage_config(self, provider: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Сохранение конфигурации хранилища"""
        try:
            from config_manager import save_storage_config
            
            # Сейчас поддерживается только WebDAV, игнорируем другие значения provider
            url = kwargs.get('url', '')
            username = kwargs.get('username', '')
            password = kwargs.get('password', '')
            oauth_token = kwargs.get('oauth_token', '')
            webdav_provider = kwargs.get('webdav_provider', 'custom')
            save_storage_config(provider='webdav', webdav_provider=webdav_provider, url=url, username=username, password=password, oauth_token=oauth_token)
            
            return {"success": True}
        except Exception as e:
            logger.error(f"Error saving storage config: {e}")
            return {"success": False, "error": str(e)}
    
    async def load_storage_config(self, *args, **kwargs) -> Dict[str, Any]:
        """Загрузка конфигурации хранилища"""
        try:
            from config_manager import load_storage_config
            config = load_storage_config()
            return {"success": True, "config": config}
        except Exception as e:
            logger.error(f"Error loading storage config: {e}")
            return {"success": False, "error": str(e)}
    
    async def clear_all_data(self, *args, **kwargs) -> Dict[str, Any]:
        """Полная очистка всех данных плагина (конфигурация, кэш, токены)"""
        try:
            import shutil
            from config_manager import CONFIG_DIR
            from cache_manager import cache_manager
            
            deleted_files = []
            deleted_dirs = []
            
            # Очистка кэша
            try:
                cache_manager.clear_all()
                logger.info("Cache cleared")
            except Exception as e:
                logger.warning(f"Error clearing cache: {e}")
            
            # Удаление всех конфигурационных файлов и директории
            if CONFIG_DIR.exists():
                try:
                    # Сначала собираем список файлов для отчета
                    for item in CONFIG_DIR.rglob('*'):
                        if item.is_file():
                            deleted_files.append(str(item.relative_to(CONFIG_DIR)))
                    
                    # Полностью удаляем директорию со всем содержимым
                    shutil.rmtree(CONFIG_DIR)
                    deleted_dirs.append(str(CONFIG_DIR))
                    logger.info(f"Deleted config directory: {CONFIG_DIR}")
                except Exception as e:
                    logger.error(f"Error clearing config directory: {e}")
                    # Если не удалось удалить директорию, пробуем удалить файлы по одному
                    try:
                        for file in CONFIG_DIR.iterdir():
                            if file.is_file():
                                file.unlink()
                                logger.info(f"Deleted config file: {file.name}")
                            elif file.is_dir():
                                shutil.rmtree(file)
                                logger.info(f"Deleted config subdirectory: {file.name}")
                    except Exception as e2:
                        logger.error(f"Error clearing config files individually: {e2}")
            
            total_deleted = len(deleted_files) + len(deleted_dirs)
            return {
                "success": True,
                "message": f"Очищено {total_deleted} элементов ({len(deleted_files)} файлов, {len(deleted_dirs)} директорий)",
                "deleted_files": deleted_files,
                "deleted_dirs": deleted_dirs
            }
        except Exception as e:
            logger.error(f"Error clearing all data: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    async def test_storage_connection(self, provider: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Тест подключения к хранилищу"""
        try:
            from config_manager import load_storage_config
            
            logger.info(f"[test_storage_connection] Called with provider={provider}, args={len(args)}, kwargs keys: {list(kwargs.keys())}")
            logger.info(f"[test_storage_connection] arg types: {[type(a).__name__ for a in args]}")

            # Decky часто передаёт параметры не как kwargs, а как один dict в args[0]
            if args and isinstance(args[0], dict):
                logger.info(f"[test_storage_connection] Detected dict in args[0] with keys: {list(args[0].keys())}")
                merged = dict(kwargs)
                merged.update(args[0])
                kwargs = merged
            
            # Загружаем значения из конфига (используем их как базовые)
            storage_config = load_storage_config()
            url = (storage_config.get('url') or '')
            username = storage_config.get('username', '')
            password = storage_config.get('password', '')
            oauth_token = storage_config.get('oauth_token', '')

            # Перекрываем значениями из kwargs ТОЛЬКО если они непустые
            incoming_url = kwargs.get('url')
            if isinstance(incoming_url, dict):
                incoming_url = incoming_url.get('url') or incoming_url.get('path')
            if incoming_url not in (None, ''):
                url = str(incoming_url)

            if kwargs.get('username'):
                username = kwargs.get('username')
            if kwargs.get('password'):
                password = kwargs.get('password')
            if kwargs.get('oauth_token'):
                oauth_token = kwargs.get('oauth_token')
            
            # Небольшая нормализация URL
            if url is None:
                url = ''
            url = str(url).strip()

            # ВАЖНО: Проверяем наличие WebDAV параметров
            has_webdav_params = bool(url or username or password or oauth_token)
            if has_webdav_params:
                logger.info(f"[test_storage_connection] WebDAV parameters detected, forcing provider to webdav")
                provider = 'webdav'
            
            # Сейчас поддерживаем только WebDAV, определяем параметры и тестируем подключение
            from webdav_provider import WebDAVProvider
            
            logger.info(f"[test_storage_connection] Using URL='{url}' username='{username}' oauth_token_len={len(oauth_token or '')}")
            
            if not url:
                return {"success": False, "error": "Не указан URL (проверьте, что поле WebDAV URL заполнено и без пробелов)"}
            
            if not oauth_token and (not username or not password):
                return {"success": False, "error": "Не указаны логин/пароль или OAuth токен"}
            
            provider_obj = WebDAVProvider(url=url, username=username, password=password, oauth_token=oauth_token)
            result = provider_obj.test_connection()
            return result
        except Exception as e:
            logger.error(f"Error testing storage connection: {e}")
            return {"success": False, "error": str(e)}

