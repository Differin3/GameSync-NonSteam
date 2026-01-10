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
                from gdrive_provider import GoogleDriveProvider
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from sync_engine import create_backup
                from gdrive_provider import GoogleDriveProvider
            
            # Создаем бэкап
            archive_path = create_backup(game_name, save_paths)
            if not archive_path:
                return {"success": False, "error": "Не удалось создать архив"}
            
            # Загружаем на Google Drive
            try:
                from config_manager import load_gdrive_config
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import load_gdrive_config
            
            gdrive_config = load_gdrive_config()
            if not gdrive_config.get('refresh_token') or not gdrive_config.get('client_id') or not gdrive_config.get('client_secret'):
                return {"success": False, "error": "Не настроен Google Drive. Укажите Client ID, Client Secret и Refresh Token в настройках."}
            
            provider = GoogleDriveProvider(
                refresh_token=gdrive_config.get('refresh_token'),
                client_id=gdrive_config.get('client_id'),
                client_secret=gdrive_config.get('client_secret')
            )
            file_id = provider.upload_file(archive_path, "GameSync")
            
            if not file_id:
                return {"success": False, "error": "Не удалось загрузить на Google Drive"}
            
            # Удаляем временный архив
            try:
                os.remove(archive_path)
            except:
                pass
            
            # Сохраняем информацию о синхронизации
            try:
                from config_manager import add_synced_game
                add_synced_game(game_name, file_id)
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
    
    async def test_gdrive_connection(self, refresh_token: str = None, client_id: str = None, client_secret: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Тест подключения к Google Drive"""
        try:
            if refresh_token is None:
                refresh_token = kwargs.get('refresh_token')
            if client_id is None:
                client_id = kwargs.get('client_id')
            if client_secret is None:
                client_secret = kwargs.get('client_secret')
            
            if not refresh_token:
                return {"success": False, "error": "Не указан refresh_token"}
            if not client_id:
                return {"success": False, "error": "Не указан client_id"}
            if not client_secret:
                return {"success": False, "error": "Не указан client_secret"}
            try:
                from gdrive_provider import GoogleDriveProvider
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from gdrive_provider import GoogleDriveProvider
            
            provider = GoogleDriveProvider(refresh_token=refresh_token, client_id=client_id, client_secret=client_secret)
            return provider.test_connection()
        except Exception as e:
            logger.error(f"Error testing connection: {e}")
            return {"success": False, "error": str(e)}
    
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
            try:
                from gdrive_provider import GoogleDriveProvider
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from gdrive_provider import GoogleDriveProvider
            
            conflicts = []
            try:
                from config_manager import load_gdrive_config
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import load_gdrive_config
            
            gdrive_config = load_gdrive_config()
            provider = GoogleDriveProvider(
                refresh_token=gdrive_config.get('refresh_token'),
                client_id=gdrive_config.get('client_id'),
                client_secret=gdrive_config.get('client_secret')
            )
            
            # Ищем архивы на Google Drive
            for save_path in save_paths:
                path_obj = Path(save_path)
                if path_obj.is_file():
                    file_id = provider.find_file(path_obj.name, "GameSync")
                    if file_id:
                        conflicts.append({
                            "path": save_path,
                            "file_id": file_id,
                            "type": "file"
                        })
            
            return {"success": True, "conflicts": conflicts}
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
                from gdrive_provider import GoogleDriveProvider
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import get_synced_games, load_synced_games
                from gdrive_provider import GoogleDriveProvider
            
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
                
                # Пытаемся получить размер файла из Google Drive
                file_id = game_data.get('fileId')
                if file_id:
                    try:
                        from config_manager import load_gdrive_config
                        gdrive_config = load_gdrive_config()
                        if gdrive_config.get('refresh_token') and gdrive_config.get('client_id') and gdrive_config.get('client_secret'):
                            provider = GoogleDriveProvider(
                                refresh_token=gdrive_config.get('refresh_token'),
                                client_id=gdrive_config.get('client_id'),
                                client_secret=gdrive_config.get('client_secret')
                            )
                            file_info = provider.get_file_info(file_id)
                            if file_info and file_info.get('size'):
                                total_size += file_info['size']
                    except:
                        pass
            
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
    
    async def start_google_oauth(self, *args, **kwargs) -> Dict[str, Any]:
        """Запуск Google OAuth flow с автоматическим захватом refresh_token"""
        try:
            # Детальное логирование всех входящих данных
            logger.info(f"[OAuth] start_google_oauth called")
            logger.info(f"[OAuth] args count: {len(args)}, args types: {[type(a).__name__ for a in args]}")
            logger.info(f"[OAuth] kwargs count: {len(kwargs)}, kwargs keys: {list(kwargs.keys())}")
            
            # Логируем каждый ключ отдельно для отладки
            for key, value in kwargs.items():
                val_type = type(value).__name__
                val_len = len(str(value)) if value else 0
                logger.info(f"[OAuth] kwargs['{key}']: type={val_type}, is_none={value is None}, length={val_len}")
            
            # Проверяем, не переданы ли параметры как один объект в kwargs
            # Decky может обернуть все параметры в один объект
            if len(kwargs) == 1:
                first_value = list(kwargs.values())[0]
                if isinstance(first_value, dict):
                    nested_dict = first_value
                    logger.info(f"[OAuth] Found nested dict in kwargs: {list(nested_dict.keys())}")
                    kwargs = nested_dict
                elif isinstance(first_value, (list, tuple)) and len(first_value) > 0 and isinstance(first_value[0], dict):
                    # Может быть список словарей
                    logger.info(f"[OAuth] Found list/tuple of dicts in kwargs")
                    if len(first_value) > 0:
                        kwargs = first_value[0]
            
            # Также проверяем args - может быть список или кортеж словарей
            if args and len(args) > 0:
                if isinstance(args[0], dict):
                    logger.info(f"[OAuth] Found dict in args[0]: {list(args[0].keys())}")
                    kwargs.update(args[0])
                elif isinstance(args[0], (list, tuple)) and len(args[0]) > 0:
                    if isinstance(args[0][0], dict):
                        logger.info(f"[OAuth] Found dict in args[0][0]: {list(args[0][0].keys())}")
                        kwargs.update(args[0][0])
            
            # Извлекаем параметры из kwargs
            client_id = None
            client_secret = None
            
            # Пробуем все возможные варианты ключей (с учетом разных стилей именования)
            possible_id_keys = ['client_id', 'clientId', 'client-id', 'clientid', 'CLIENT_ID', 'CLIENTID']
            possible_secret_keys = ['client_secret', 'clientSecret', 'client-secret', 'clientsecret', 'CLIENT_SECRET', 'CLIENTSECRET']
            
            for key in possible_id_keys:
                if key in kwargs:
                    client_id = kwargs[key]
                    logger.info(f"[OAuth] Found client_id in kwargs['{key}']: type={type(client_id).__name__}, length={len(str(client_id)) if client_id else 0}")
                    break
            
            for key in possible_secret_keys:
                if key in kwargs:
                    client_secret = kwargs[key]
                    logger.info(f"[OAuth] Found client_secret in kwargs['{key}']: type={type(client_secret).__name__}, length={len(str(client_secret)) if client_secret else 0}")
                    break
            
            # Если не нашли, пробуем перебрать все ключи (на случай нестандартных имен)
            if not client_id:
                for key, value in kwargs.items():
                    if 'client' in key.lower() and 'id' in key.lower() and not client_id:
                        client_id = value
                        logger.info(f"[OAuth] Found client_id by pattern matching in '{key}': length={len(str(client_id)) if client_id else 0}")
                        break
            
            if not client_secret:
                for key, value in kwargs.items():
                    if 'client' in key.lower() and 'secret' in key.lower() and not client_secret:
                        client_secret = value
                        logger.info(f"[OAuth] Found client_secret by pattern matching in '{key}': length={len(str(client_secret)) if client_secret else 0}")
                        break
            
            # Проверяем, что значения не пустые строки
            if client_id:
                client_id = str(client_id).strip()
            if client_secret:
                client_secret = str(client_secret).strip()
            
            logger.info(f"[OAuth] After processing: client_id length={len(client_id) if client_id else 0}, client_secret length={len(client_secret) if client_secret else 0}")
            logger.info(f"[OAuth] client_id is None: {client_id is None}, empty: {not client_id if client_id else True}")
            logger.info(f"[OAuth] client_secret is None: {client_secret is None}, empty: {not client_secret if client_secret else True}")
            
            if not client_id or not client_secret:
                error_msg = f"Не указаны client_id или client_secret. client_id: {bool(client_id)}, client_secret: {bool(client_secret)}. kwargs keys: {list(kwargs.keys())}"
                logger.error(f"[OAuth] {error_msg}")
                return {"success": False, "error": error_msg}
            
            monitor = GoogleOAuthMonitor()
            return await monitor.start_google_oauth(client_id, client_secret)
        except Exception as e:
            logger.error(f"Error starting Google OAuth: {e}")
            return {"success": False, "error": str(e)}
    
    async def exchange_code_for_token(self, auth_code: str = None, client_id: str = None, client_secret: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Обмен authorization code на refresh_token"""
        try:
            if auth_code is None:
                auth_code = kwargs.get('auth_code')
            if client_id is None:
                client_id = kwargs.get('client_id')
            if client_secret is None:
                client_secret = kwargs.get('client_secret')
            
            if not auth_code or not client_id or not client_secret:
                return {"success": False, "error": "Не указаны все необходимые параметры"}
            
            return await GoogleOAuthMonitor.exchange_code_for_token(auth_code, client_id, client_secret)
        except Exception as e:
            logger.error(f"Error exchanging code: {e}")
            return {"success": False, "error": str(e)}
    
    async def generate_oauth_url(self, client_id: str = None, client_secret: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Генерация OAuth URL для ручного использования"""
        try:
            # Извлекаем параметры так же, как в start_google_oauth
            if client_id is None or not client_id:
                client_id = kwargs.get('client_id') or kwargs.get('clientId') or (args[0] if args and len(args) > 0 else None)
            if client_secret is None or not client_secret:
                client_secret = kwargs.get('client_secret') or kwargs.get('clientSecret') or (args[1] if args and len(args) > 1 else None)
            
            if client_id:
                client_id = str(client_id).strip()
            if client_secret:
                client_secret = str(client_secret).strip()
            
            if not client_id or not client_secret:
                return {"success": False, "error": "Не указаны client_id или client_secret"}
            
            import secrets
            from urllib.parse import urlencode
            
            state = secrets.token_urlsafe(32)
            redirect_uri = "http://localhost:8080/callback"  # Должен точно совпадать с Google Cloud Console
            
            # Формируем OAuth URL с правильным URL-кодированием
            params = {
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': 'https://www.googleapis.com/auth/drive.file',
                'access_type': 'offline',
                'prompt': 'consent',
                'state': state
            }
            auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
            
            logger.info(f"[OAuth] Generated OAuth URL, redirect_uri={redirect_uri}")
            
            return {
                'success': True,
                'url': auth_url,
                'instructions': [
                    '1. Откройте URL в браузере',
                    '2. Войдите в Google и разрешите доступ',
                    '3. После авторизации скопируйте код из URL (параметр code=...)',
                    '4. Вставьте код в поле ниже и нажмите "Обменять код"'
                ]
            }
        except Exception as e:
            logger.error(f"Error generating OAuth URL: {e}")
            return {"success": False, "error": str(e)}
    
    async def load_gdrive_config(self, *args, **kwargs) -> Dict[str, Any]:
        """Загрузка конфигурации Google Drive из backend"""
        try:
            from config_manager import load_gdrive_config
            config = load_gdrive_config()
            return {
                "success": True,
                "client_id": config.get("client_id", ""),
                "client_secret": config.get("client_secret", ""),
                "refresh_token": config.get("refresh_token", "")
            }
        except Exception as e:
            logger.error(f"Error loading gdrive config: {e}")
            return {"success": False, "error": str(e)}

class GoogleOAuthMonitor:
    """Мониторинг браузера Steam Deck через CDP для автоматического захвата OAuth кода"""
    
    def __init__(self, cef_port=8080):
        self.cef_url = f'http://127.0.0.1:{cef_port}/json'
        self.monitored_urls = set()
    
    async def monitor_for_google_code(self, timeout=300, poll_interval=0.5) -> Optional[str]:
        """Мониторинг CEF страниц для OAuth redirect URL и извлечение authorization code"""
        import time
        import re
        
        start_time = time.time()
        logger.info("[GoogleOAuth] Starting OAuth code monitoring...")
        
        while time.time() - start_time < timeout:
            try:
                # Получаем текущие CEF страницы
                with urllib.request.urlopen(self.cef_url, timeout=2) as response:
                    pages = json.loads(response.read().decode())
                
                for page in pages:
                    url = page.get('url', '')
                    
                    # Пропускаем уже проверенные URL
                    if url in self.monitored_urls:
                        continue
                    
                    self.monitored_urls.add(url)
                    
                    # Проверяем паттерны OAuth для Google (включая localhost callback)
                    oauth_patterns = ['accounts.google.com', 'oauth2', 'code=', 'authorization', 'localhost:8080/callback']
                    if any(p in url.lower() for p in oauth_patterns):
                        logger.info(f"[GoogleOAuth] OAuth-related page detected: {url[:100]}...")
                        
                        # Извлекаем code из URL (может быть в query или fragment)
                        parsed = urlparse(url)
                        params = parse_qs(parsed.query)
                        
                        # Проверяем query параметры
                        if 'code' in params:
                            code = params['code'][0]
                            logger.info(f"[GoogleOAuth] ✓ Found Google authorization code in URL query")
                            return code
                        
                        # Проверяем фрагмент URL (после #)
                        if '#' in url:
                            fragment = url.split('#')[1]
                            fragment_params = parse_qs(fragment)
                            if 'code' in fragment_params:
                                code = fragment_params['code'][0]
                                logger.info(f"[GoogleOAuth] ✓ Found Google authorization code in URL fragment")
                                return code
                        
                        # Также проверяем весь URL на наличие code= (на случай если парсинг не сработал)
                        if 'code=' in url:
                            try:
                                # Извлекаем code из URL напрямую
                                code_match = None
                                if 'code=' in url:
                                    code_part = url.split('code=')[1]
                                    if '&' in code_part:
                                        code_match = code_part.split('&')[0]
                                    else:
                                        code_match = code_part.split('#')[0] if '#' in code_part else code_part
                                
                                if code_match and len(code_match) > 10:  # Минимальная длина кода
                                    logger.info(f"[GoogleOAuth] ✓ Found Google authorization code by direct extraction")
                                    return code_match
                            except Exception as e:
                                logger.debug(f"[GoogleOAuth] Error extracting code from URL: {e}")
                
            except Exception as e:
                logger.debug(f"[GoogleOAuth] Polling error (normal): {e}")
            
            await asyncio.sleep(poll_interval)
        
        logger.warning("[GoogleOAuth] OAuth monitoring timeout - no code found")
        return None

    async def start_google_oauth(self, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Запуск Google OAuth flow с автоматическим захватом кода"""
        try:
            import secrets
            import urllib.request
            
            # Проверяем доступность CDP перед запуском
            cef_url = 'http://127.0.0.1:8080/json'
            cdp_available = False
            try:
                with urllib.request.urlopen(cef_url, timeout=2) as response:
                    pages = json.loads(response.read().decode())
                    cdp_available = True
                    logger.info(f"[GoogleOAuth] CDP доступен, найдено {len(pages)} страниц")
            except Exception as e:
                logger.warning(f"[GoogleOAuth] CDP недоступен: {e}. Будет использован fallback метод.")
            
            # Генерируем state для безопасности
            state = secrets.token_urlsafe(32)
            
            # Redirect URI - используем localhost (нужно добавить в Google Cloud Console)
            # ВАЖНО: Добавьте этот URI в Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs
            redirect_uri = "http://localhost:8080/callback"
            
            # Альтернативные варианты, если localhost не работает:
            # redirect_uri = "http://127.0.0.1:8080/callback"
            # redirect_uri = "urn:ietf:wg:oauth:2.0:oob"  # Для desktop приложений
            
            # Формируем OAuth URL с правильным URL-кодированием
            from urllib.parse import urlencode
            params = {
                'client_id': client_id,
                'redirect_uri': redirect_uri,  # Должен точно совпадать с Google Cloud Console
                'response_type': 'code',
                'scope': 'https://www.googleapis.com/auth/drive.file',
                'access_type': 'offline',
                'prompt': 'consent',
                'state': state
            }
            auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
            
            logger.info(f"[GoogleOAuth] Generated OAuth URL, redirect_uri={redirect_uri}")
            logger.info(f"[GoogleOAuth] CDP available: {cdp_available}")
            
            # Запускаем фоновый мониторинг только если CDP доступен
            if cdp_available:
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self._monitor_and_complete_oauth(client_id, client_secret, state))
                except RuntimeError:
                    asyncio.ensure_future(self._monitor_and_complete_oauth(client_id, client_secret, state))
            else:
                logger.info("[GoogleOAuth] CDP недоступен, автоматический захват кода не будет работать. Используйте ручной метод.")
            
            return {
                'success': True,
                'url': auth_url,
                'message': 'Откройте браузер для авторизации - код будет захвачен автоматически' if cdp_available else 'CDP недоступен. Используйте ручной метод получения refresh_token.',
                'cdp_available': cdp_available
            }
        except Exception as e:
            logger.error(f"[GoogleOAuth] Error starting auth: {e}", exc_info=True)
            return {'success': False, 'error': f'Ошибка запуска авторизации: {str(e)}'}
    
    async def _monitor_and_complete_oauth(self, client_id: str, client_secret: str, expected_state: str):
        """Фоновая задача для мониторинга и завершения OAuth"""
        try:
            code = await self.monitor_for_google_code(timeout=300)
            
            if code:
                logger.info(f"[GoogleOAuth] Auto-captured authorization code, exchanging for tokens...")
                result = await GoogleOAuthMonitor.exchange_code_for_token(code, client_id, client_secret)
                if result.get('success'):
                    logger.info("[GoogleOAuth] ✓ Authentication completed automatically!")
                    # Сохраняем refresh_token в настройки backend
                    if 'refresh_token' in result:
                        try:
                            from config_manager import save_gdrive_config
                            save_gdrive_config(client_id, client_secret, result['refresh_token'])
                            logger.info(f"[GoogleOAuth] Saved refresh_token to config (length: {len(result['refresh_token'])})")
                        except Exception as e:
                            logger.error(f"[GoogleOAuth] Error saving config: {e}")
                else:
                    logger.error(f"[GoogleOAuth] Auto-auth failed: {result.get('error')}")
            else:
                logger.error("[GoogleOAuth] CDP monitoring timeout - user may have closed popup or not completed login")
        except Exception as e:
            logger.error(f"[GoogleOAuth] Error in background auth monitor: {e}", exc_info=True)

    @staticmethod
    async def exchange_code_for_token(auth_code: str, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Обмен authorization code на refresh_token"""
        try:
            import urllib.request
            import urllib.parse
            
            token_url = "https://oauth2.googleapis.com/token"
            redirect_uri = "http://localhost:8080/callback"  # Должен совпадать с тем, что в Google Cloud Console
            
            data = urllib.parse.urlencode({
                'code': auth_code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,  # Важно: должен точно совпадать с redirect_uri из authorize URL
                'grant_type': 'authorization_code'
            }).encode('utf-8')
            
            logger.info(f"[GoogleOAuth] Exchanging code, redirect_uri={redirect_uri}")
            
            req = urllib.request.Request(token_url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    token_data = json.loads(response.read().decode('utf-8'))
                    refresh_token = token_data.get('refresh_token')
                    if refresh_token:
                        return {
                            'success': True,
                            'refresh_token': refresh_token,
                            'access_token': token_data.get('access_token')
                        }
                    else:
                        return {'success': False, 'error': 'refresh_token not found in response'}
                else:
                    error_text = response.read().decode('utf-8')
                    return {'success': False, 'error': f'Token exchange failed: {error_text}'}
        except Exception as e:
            logger.error(f"[GoogleOAuth] Error exchanging code: {e}")
            return {'success': False, 'error': str(e)}
