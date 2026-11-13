import decky
import os
import asyncio
import functools
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# Используем логгер Decky Loader
logger = decky.logger


def decky_params(func):
    """Нормализует аргументы вызова из фронтенда.

    Decky передаёт аргументы позиционно (``method(*args)``), а фронтенд
    вызывает методы одним объектом: ``call("sync_game", {game_name, save_paths})``.
    Без нормализации такой объект попадает в первый позиционный параметр
    целиком, и метод получает dict вместо значений. Здесь единственный
    dict из аргументов распаковывается в именованные параметры.
    """

    @functools.wraps(func)
    async def wrapper(self, *args, **kwargs):
        if len(args) == 1 and isinstance(args[0], dict):
            merged = dict(kwargs)
            merged.update(args[0])
            return await func(self, **merged)
        return await func(self, *args, **kwargs)

    return wrapper

try:
    from portproton_scanner import scan_portproton_games
except ImportError:
    import sys
    import pathlib
    backend_path = pathlib.Path(__file__).parent
    sys.path.insert(0, str(backend_path))
    from portproton_scanner import scan_portproton_games


def _merge_game_save_paths(game: Dict[str, Any], game_configs: Dict[str, Any]) -> Dict[str, Any]:
    """Подмешивает вручную заданные пути игры и убирает исключённые."""
    config = game_configs.get(game.get("name")) or {}
    manual_paths = config.get("savePaths") or []
    excludes = config.get("excludePaths") or []
    merged = list(dict.fromkeys((game.get("savePaths") or []) + manual_paths))
    if excludes:
        merged = [
            p for p in merged
            if not any(p == ex or p.startswith(ex.rstrip("/") + "/") for ex in excludes)
        ]
    game["savePaths"] = merged
    game["excludePaths"] = excludes
    game["hasSaves"] = len(merged) > 0
    return game


def _resolve_save_paths_for_game(game_name: str) -> List[str]:
    """Найти пути сохранений для игры по имени игры или имени префикса.

    Нужно автосинхронизации: монитор процессов знает только имя префикса,
    но не пути сохранений.
    """
    if not game_name:
        return []

    paths: List[str] = []

    try:
        games = scan_portproton_games()
    except Exception as e:
        logger.error(f"Failed to scan games while resolving paths for '{game_name}': {e}")
        games = []

    target = game_name.strip().lower()
    for game in games:
        names = {
            str(game.get("name", "")).strip().lower(),
            Path(game.get("prefixPath", "")).name.strip().lower(),
        }
        if target in names:
            paths.extend(game.get("savePaths") or [])
            break

    try:
        from config_manager import get_game_config
        config = get_game_config(game_name) or {}
        paths.extend(config.get("savePaths") or [])
    except Exception as e:
        logger.warning(f"Failed to load config while resolving paths for '{game_name}': {e}")

    # Глобальные пути из настроек плагина — их ждёт пользователь, включивший
    # «применять ко всем играм»; раньше автосинхронизация их игнорировала.
    try:
        from config_manager import load_app_settings
        paths.extend(load_app_settings().get("default_save_paths") or [])
    except Exception as e:
        logger.warning(f"Failed to load default save paths: {e}")

    return list(dict.fromkeys(p for p in paths if p))


def _build_provider(config: Dict[str, Any]):
    """Создаёт провайдер хранилища по конфигу.

    Возвращает кортеж (provider, error). При ошибке provider=None.
    """
    provider_type = (config.get("provider") or "webdav").lower()

    if provider_type == "s3":
        from s3_provider import S3Provider

        bucket = config.get("bucket", "")
        access_key = config.get("access_key", "")
        secret_key = config.get("secret_key", "")
        if not bucket:
            return None, "Не настроен S3. Укажите bucket в настройках."
        if not access_key or not secret_key:
            return None, "Не настроен S3. Укажите Access Key и Secret Key в настройках."

        return S3Provider(
            endpoint=config.get("endpoint", ""),
            region=config.get("region", "us-east-1"),
            bucket=bucket,
            access_key=access_key,
            secret_key=secret_key,
            path_style=bool(config.get("path_style", False)),
            signature_version=config.get("signature_version", "s3v4"),
        ), None

    if provider_type == "ftp":
        from ftp_provider import FTPProvider

        host = config.get("host", "")
        if not host:
            return None, "Не настроен FTP. Укажите host в настройках."

        return FTPProvider(
            host=host,
            port=int(config.get("port") or 21),
            username=config.get("username", ""),
            password=config.get("password", ""),
            use_tls=bool(config.get("use_tls", False)),
            passive=bool(config.get("passive", True)),
        ), None

    if provider_type == "sftp":
        from sftp_provider import SFTPProvider

        host = config.get("host", "")
        if not host:
            return None, "Не настроен SFTP. Укажите host в настройках."

        return SFTPProvider(
            host=host,
            port=int(config.get("port") or 22),
            username=config.get("username", ""),
            password=config.get("password", ""),
            key_path=config.get("key_path", ""),
            key_passphrase=config.get("key_passphrase", ""),
        ), None

    # WebDAV по умолчанию
    from webdav_provider import WebDAVProvider

    url = config.get("url", "")
    username = config.get("username", "")
    password = config.get("password", "")
    oauth_token = config.get("oauth_token", "")

    if not url:
        return None, "Не настроен WebDAV. Укажите URL в настройках."
    if not oauth_token and (not username or not password):
        return None, "Не настроен WebDAV. Укажите логин/пароль или OAuth токен в настройках."

    return WebDAVProvider(url=url, username=username, password=password, oauth_token=oauth_token), None


class Plugin:
    # Классовые переменные для состояния
    auto_sync_enabled = False
    game_monitor = None
    
    async def _main(self):
        """Инициализация плагина"""
        logger.info("GameSync NonSteam plugin initialized")
        Plugin.auto_sync_enabled = False
        Plugin.game_monitor = None

        # Ставим зависимости в фоне, чтобы плагин работал «из коробки».
        try:
            import dependencies
            dependencies._ensure_py_modules_on_path()
            asyncio.create_task(dependencies.ensure_dependencies_async("all"))
            logger.info("Dependency bootstrap started")
        except Exception as e:
            logger.warning(f"Dependency bootstrap failed: {e}")

        # Восстанавливаем автосинхронизацию, если она была включена до перезапуска.
        try:
            from config_manager import load_app_settings
            if load_app_settings().get("auto_sync"):
                await Plugin()._start_auto_sync()
                logger.info("Auto-sync restored from settings")
        except Exception as e:
            logger.warning(f"Failed to restore auto-sync: {e}")

    async def _start_auto_sync(self) -> bool:
        """Создаёт и запускает монитор процессов (идемпотентно)."""
        if Plugin.game_monitor is not None:
            return True

        try:
            import dependencies
            await dependencies.ensure_dependencies_async("auto_sync")
        except Exception as e:
            logger.warning(f"Dependency check failed for auto-sync: {e}")

        from auto_sync import GameMonitor

        async def sync_callback(game_name: str, save_paths: List[str]):
            """Callback для автосинхронизации"""
            logger.info(f"Auto-syncing game: {game_name}")
            resolved_paths = save_paths or _resolve_save_paths_for_game(game_name)
            if not resolved_paths:
                logger.warning(f"Auto-sync skipped for {game_name}: no save paths found")
                return
            plugin_instance = Plugin()
            result = await plugin_instance.sync_game(game_name, resolved_paths)
            if result.get("success"):
                logger.info(f"Auto-sync completed for {game_name}")
            else:
                logger.error(f"Auto-sync failed for {game_name}: {result.get('error')}")

        Plugin.game_monitor = GameMonitor(sync_callback)
        asyncio.create_task(Plugin.game_monitor.start_monitoring())
        Plugin.auto_sync_enabled = True
        return True

    def _stop_auto_sync(self) -> None:
        if Plugin.game_monitor:
            Plugin.game_monitor.stop_monitoring()
            Plugin.game_monitor = None
        Plugin.auto_sync_enabled = False

    @decky_params
    async def install_dependencies(self, *args, **kwargs) -> Dict[str, Any]:
        """Ручной повторный запуск установки зависимостей (на случай сбоя сети)."""
        try:
            import dependencies
            return await dependencies.ensure_dependencies_async("all")
        except Exception as e:
            logger.error(f"Error installing dependencies: {e}")
            return {"success": False, "error": str(e)}

    async def _unload(self):
        """Выгрузка плагина"""
        try:
            if Plugin.game_monitor:
                Plugin.game_monitor.stop_monitoring()
                Plugin.game_monitor = None
            Plugin.auto_sync_enabled = False
        except Exception as e:
            logger.error(f"Error stopping game monitor: {e}")
        logger.info("GameSync NonSteam plugin unloaded")

    @decky_params
    async def get_test(self, *args, **kwargs) -> Dict[str, Any]:
        """Тестовый метод для проверки связи с фронтендом"""
        try:
            return {"success": True, "status": "ok", "message": "Plugin is working"}
        except Exception as e:
            logger.error(f"Error in get_test: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
    async def scan_games(self, force_refresh: bool = False, *args, **kwargs) -> Dict[str, Any]:
        """Сканирование игр PortProton"""
        try:
            # Проверяем параметр force_refresh из kwargs
            if force_refresh is False:
                force_refresh = kwargs.get('force_refresh', False)

            # Обход drive_c и разбор .desktop — блокирующая работа, уводим из
            # event loop, иначе плагин перестаёт отвечать на другие вызовы.
            games = await asyncio.to_thread(scan_portproton_games, force_refresh)

            # Подмешиваем пути, сохранённые пользователем вручную, чтобы они
            # не терялись при повторном сканировании.
            try:
                from config_manager import load_game_configs
                game_configs = load_game_configs()
            except Exception as e:
                logger.warning(f"Failed to load game configs: {e}")
                game_configs = {}

            for game in games:
                _merge_game_save_paths(game, game_configs)

            return {"success": True, "games": games}
        except Exception as e:
            logger.error(f"Error scanning games: {e}")
            return {"success": False, "error": str(e), "games": []}
    
    @decky_params
    async def sync_game(self, game_name: str = None, save_paths: List[str] = None, *args, **kwargs) -> Dict[str, Any]:
        """Синхронизация игры"""
        try:
            # Получаем параметры из kwargs если не переданы напрямую
            if game_name is None:
                game_name = kwargs.get('game_name')
            if save_paths is None:
                save_paths = kwargs.get('save_paths', [])
            
            if not game_name:
                return {"success": False, "error": "Не указан game_name"}

            # Если пути не переданы (автосинхронизация, внешний вызов) —
            # определяем их сами, иначе метод бесполезно падал с ошибкой.
            if not save_paths:
                save_paths = _resolve_save_paths_for_game(game_name)
            if not save_paths:
                return {"success": False, "error": "Не найдены пути сохранений — настройте их в «Пути игр»"}

            # Убираем исключённые пользователем пути
            try:
                from config_manager import get_excluded_paths
                excludes = get_excluded_paths(game_name)
                if excludes:
                    save_paths = [
                        p for p in save_paths
                        if not any(p == ex or p.startswith(ex.rstrip("/") + "/") for ex in excludes)
                    ]
            except Exception as e:
                logger.debug(f"Exclude filter skipped: {e}")

            if not save_paths:
                return {"success": False, "error": "Все пути сохранений исключены"}

            try:
                from sync_engine import create_backup
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from sync_engine import create_backup
            
            # Создаем бэкап
            archive_path = await asyncio.to_thread(create_backup, game_name, save_paths)
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

            # Гарантируем наличие зависимостей выбранного провайдера
            try:
                import dependencies
                dep = await dependencies.ensure_dependencies_async(storage_config.get("provider", "webdav"))
                if not dep.get("success"):
                    return {"success": False, "error": "Не удалось установить зависимости: " + ", ".join(dep.get("missing", []))}
            except Exception as e:
                logger.warning(f"Dependency check failed: {e}")

            provider, error = _build_provider(storage_config)
            if error:
                return {"success": False, "error": error}

            file_id = await asyncio.to_thread(provider.upload_file, archive_path, "GameSync")

            if not file_id:
                return {"success": False, "error": "Не удалось загрузить архив в хранилище"}
            
            # Получаем размер загруженного файла для статистики
            file_size = None
            try:
                file_info = await asyncio.to_thread(provider.get_file_info, file_id)
                if file_info and file_info.get('size'):
                    file_size = file_info.get('size')
                    logger.info(f"File size for {game_name}: {file_size} bytes")
            except Exception as e:
                logger.warning(f"Failed to get file info: {e}")

            # Версионированная копия: GameSync/<Игра>/backup-<дата>.tar.gz
            # Стабильный файл в GameSync/ остаётся для ручного доступа и старых клиентов.
            version_remote = None
            try:
                from sync_engine import sanitize_name
                version_name = f"backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.tar.gz"
                version_folder = f"GameSync/{sanitize_name(game_name)}"
                version_remote = await asyncio.to_thread(
                    provider.upload_file, archive_path, version_folder, version_name
                )
            except Exception as e:
                logger.warning(f"Versioned upload failed for {game_name}: {e}")
            
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

            # История бэкапов — по ней работает вкладка «Бэкапы» и восстановление
            try:
                from backup_index import add_entry
                add_entry(
                    game_name,
                    remote=version_remote or file_id,
                    size=file_size,
                    paths=save_paths,
                    kind="sync",
                )
            except Exception as e:
                logger.warning(f"Failed to record backup entry: {e}")
            
            return {
                "success": True,
                "file_id": file_id,
                "version_id": version_remote,
                "message": "Синхронизация завершена",
            }
        except Exception as e:
            logger.error(f"Error syncing game: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
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
    
    @decky_params
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
            
            exclude_paths = kwargs.get('exclude_paths')
            update_game_config(game_name, save_paths, exclude_paths=exclude_paths)

            # Запоминаем ручные пути, чтобы подсказывать их похожим играм
            try:
                from learning import record_path
                for path in (save_paths or []):
                    record_path(game_name, path)
            except Exception as e:
                logger.debug(f"Learning skipped: {e}")

            return {"success": True, "message": "Пути сохранены"}
        except Exception as e:
            logger.error(f"Error updating game paths: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
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
    
    @decky_params
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
    
    @decky_params
    async def enable_auto_sync(self, enabled: bool = False, *args, **kwargs) -> Dict[str, Any]:
        """Включение/выключение автосинхронизации. Настройка переживает перезапуск."""
        try:
            if enabled:
                await self._start_auto_sync()
            else:
                self._stop_auto_sync()

            try:
                from config_manager import save_app_settings
                save_app_settings(auto_sync=bool(enabled))
            except Exception as e:
                logger.warning(f"Failed to persist auto-sync setting: {e}")

            return {"success": True, "auto_sync_enabled": bool(enabled)}
        except Exception as e:
            logger.error(f"Error enabling auto-sync: {e}")
            return {"success": False, "error": str(e)}

    @decky_params
    async def get_app_settings(self, *args, **kwargs) -> Dict[str, Any]:
        """Настройки плагина, которые хранятся на бэкенде."""
        try:
            from config_manager import load_app_settings
            settings = load_app_settings()
            return {
                "success": True,
                "auto_sync": bool(settings.get("auto_sync")),
                "default_save_paths": settings.get("default_save_paths") or [],
            }
        except Exception as e:
            logger.error(f"Error loading app settings: {e}")
            return {"success": False, "error": str(e), "auto_sync": False, "default_save_paths": []}

    @decky_params
    async def set_default_save_paths(self, default_save_paths: List[str] = None, *args, **kwargs) -> Dict[str, Any]:
        """Сохраняет глобальные пути сохранений (применяются ко всем играм)."""
        try:
            from config_manager import save_app_settings
            if default_save_paths is None:
                default_save_paths = kwargs.get("default_save_paths") or []
            settings = save_app_settings(default_save_paths=list(default_save_paths))
            return {"success": True, "default_save_paths": settings.get("default_save_paths") or []}
        except Exception as e:
            logger.error(f"Error saving default save paths: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
    async def get_game_sync_status(self, appid: int = None, game_name: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Статус синхронизации игры — строка на странице Steam-библиотеки.

        Вызывается патчем страницы игры: по appid ярлыка (или названию) находит
        игру PortProton и отдаёт последнюю синхронизацию. Для игр, которые
        плагин не знает, возвращает found=False — патч тогда ничего не рисует.
        """
        try:
            from backup_index import list_for
            from config_manager import load_storage_config, load_synced_games
            from game_status import build_game_status, find_game_for_app

            games = await asyncio.to_thread(scan_portproton_games, False)
            game = find_game_for_app(games, appid, game_name)
            if not game:
                return {"success": True, "found": False}

            name = game.get("name") or ""
            synced = (load_synced_games() or {}).get(name) or {}
            entries = list_for(name)
            provider = (load_storage_config() or {}).get("provider") or "webdav"

            status = build_game_status(game, synced, entries, provider)
            status["success"] = True
            status["found"] = True
            return status
        except Exception as e:
            logger.error(f"Error getting game sync status: {e}")
            return {"success": False, "found": False, "error": str(e)}

    @decky_params
    async def get_backups(self, *args, **kwargs) -> Dict[str, Any]:
        """Список бэкапов для вкладки «Бэкапы».

        Основной источник — локальный индекс загруженных архивов. Если индекс
        пуст (обновление со старой версии), показываем запись из synced_games.
        """
        try:
            from backup_index import list_all
            from config_manager import load_synced_games

            index = list_all()
            legacy = load_synced_games()

            games: List[Dict[str, Any]] = []
            for name in sorted(set(index) | set(legacy)):
                entries = list(index.get(name) or [])
                if not entries and name in legacy:
                    data = legacy.get(name) or {}
                    entries = [{
                        "id": "legacy",
                        "created": data.get("lastSync"),
                        "remote": data.get("fileId"),
                        "size": data.get("fileSize"),
                        "kind": "sync",
                        "paths": [],
                        "legacy": True,
                    }]
                games.append({"game": name, "entries": entries})

            return {"success": True, "games": games}
        except Exception as e:
            logger.error(f"Error listing backups: {e}")
            return {"success": False, "error": str(e), "games": []}

    @decky_params
    async def restore_backup(self, game_name: str = None, backup_id: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Восстановление сохранений игры из облачного бэкапа."""
        try:
            if not game_name:
                return {"success": False, "error": "Не указан game_name"}

            from backup_index import add_entry, get_entry
            from config_manager import load_storage_config, load_synced_games
            from restore_engine import read_manifest, restore_archive
            from sync_engine import create_backup, sanitize_name

            entry = get_entry(game_name, backup_id)
            if not entry:
                legacy = (load_synced_games() or {}).get(game_name) or {}
                if legacy:
                    entry = {
                        "id": "legacy",
                        "remote": legacy.get("fileId"),
                        "created": legacy.get("lastSync"),
                        "size": legacy.get("fileSize"),
                        "kind": "sync",
                        "paths": [],
                    }
            if not entry or not entry.get("remote"):
                return {"success": False, "error": "Бэкап не найден — сначала синхронизируйте игру"}

            storage_config = load_storage_config()

            try:
                import dependencies
                dep = await dependencies.ensure_dependencies_async(storage_config.get("provider", "webdav"))
                if not dep.get("success"):
                    return {"success": False, "error": "Не удалось установить зависимости: " + ", ".join(dep.get("missing", []))}
            except Exception as e:
                logger.warning(f"Dependency check failed: {e}")

            provider, error = _build_provider(storage_config)
            if error:
                return {"success": False, "error": error}

            workdir = tempfile.mkdtemp(prefix="gamesync-restore-")
            archive_path = os.path.join(workdir, "backup.tar.gz")
            safety_remote = None

            try:
                downloaded = await asyncio.to_thread(provider.download_file, entry["remote"], archive_path)
                if not downloaded:
                    return {"success": False, "error": "Не удалось скачать бэкап из хранилища"}

                manifest = read_manifest(archive_path)
                if not manifest:
                    return {
                        "success": False,
                        "error": "Бэкап создан старой версией плагина (без манифеста). Синхронизируйте игру заново.",
                    }

                # Страховочная копия текущих сейвов перед перезаписью
                current_paths = entry.get("paths") or _resolve_save_paths_for_game(game_name)
                if current_paths:
                    safety_path = await asyncio.to_thread(create_backup, game_name, current_paths)
                    if safety_path:
                        try:
                            safety_name = f"prerestore-{datetime.now().strftime('%Y%m%d-%H%M%S')}.tar.gz"
                            folder = f"GameSync/{sanitize_name(game_name)}"
                            safety_remote = await asyncio.to_thread(
                                provider.upload_file, safety_path, folder, safety_name
                            )
                            add_entry(
                                game_name,
                                remote=safety_remote or "",
                                size=os.path.getsize(safety_path),
                                paths=current_paths,
                                kind="prerestore",
                            )
                        except Exception as e:
                            logger.warning(f"Failed to upload pre-restore backup: {e}")
                        finally:
                            try:
                                os.remove(safety_path)
                            except OSError:
                                pass

                result = await asyncio.to_thread(restore_archive, archive_path, manifest)

                return {
                    "success": True,
                    "message": f"Восстановлено файлов: {result['files']}",
                    "files": result["files"],
                    "bytes": result["bytes"],
                    "skipped": result["skipped"],
                    "safety_backup": safety_remote,
                }
            finally:
                shutil.rmtree(workdir, ignore_errors=True)
        except Exception as e:
            logger.error(f"Error restoring backup: {e}")
            return {"success": False, "error": str(e)}

    @decky_params
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
    
    @decky_params
    async def get_sync_stats(self, *args, **kwargs) -> Dict[str, Any]:
        """Получение статистики синхронизаций"""
        try:
            try:
                from config_manager import load_synced_games
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from config_manager import load_synced_games
            
            synced_games = load_synced_games()

            # synced_games хранит только последнюю синхронизацию каждой игры,
            # поэтому реальное число записей берём из истории бэкапов.
            try:
                from backup_index import list_all as list_all_backups
                backup_entries = [
                    entry
                    for entries in (list_all_backups() or {}).values()
                    for entry in (entries or [])
                ]
            except Exception as e:
                logger.warning(f"Failed to load backup index for stats: {e}")
                backup_entries = []

            total_syncs = len(backup_entries) or len(synced_games)

            # Получаем даты синхронизаций
            syncs_by_date = {}
            last_sync = None
            total_size = 0

            for entry in backup_entries:
                created = str(entry.get("created") or "")
                if created:
                    date_key = created[:10]
                    syncs_by_date[date_key] = syncs_by_date.get(date_key, 0) + 1
                    if not last_sync or created > last_sync:
                        last_sync = created

            if not backup_entries:
                for game_name, game_data in synced_games.items():
                    sync_date = game_data.get("lastSync", "")
                    if sync_date:
                        date_key = sync_date[:10]  # YYYY-MM-DD
                        syncs_by_date[date_key] = syncs_by_date.get(date_key, 0) + 1
                        if not last_sync or sync_date > last_sync:
                            last_sync = sync_date

            for game_name, game_data in synced_games.items():
                file_size = game_data.get("fileSize", 0)
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
    
    @decky_params
    async def save_storage_config(self, provider: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Сохранение конфигурации хранилища"""
        try:
            from config_manager import save_storage_config

            logger.info(f"[save_storage_config] Called with provider={provider}, args={len(args)}, kwargs keys: {list(kwargs.keys())}")

            if provider is None:
                provider = kwargs.get("provider", "webdav")

            if provider == "s3":
                s3_provider = kwargs.get("s3_provider", "custom")
                endpoint = kwargs.get("endpoint", "")
                region = kwargs.get("region", "us-east-1")
                bucket = kwargs.get("bucket", "")
                access_key = kwargs.get("access_key", "")
                secret_key = kwargs.get("secret_key", "")
                path_style = bool(kwargs.get("path_style", False))
                signature_version = kwargs.get("signature_version", "s3v4")

                save_storage_config(
                    provider="s3",
                    s3_provider=s3_provider,
                    endpoint=endpoint,
                    region=region,
                    bucket=bucket,
                    access_key=access_key,
                    secret_key=secret_key,
                    path_style=path_style,
                    signature_version=signature_version,
                )
            elif provider == "ftp":
                save_storage_config(
                    provider="ftp",
                    host=kwargs.get("host", ""),
                    port=int(kwargs.get("port") or 21),
                    username=kwargs.get("username", ""),
                    password=kwargs.get("password", ""),
                    use_tls=bool(kwargs.get("use_tls", False)),
                    passive=bool(kwargs.get("passive", True)),
                )
            elif provider == "sftp":
                save_storage_config(
                    provider="sftp",
                    host=kwargs.get("host", ""),
                    port=int(kwargs.get("port") or 22),
                    username=kwargs.get("username", ""),
                    password=kwargs.get("password", ""),
                    key_path=kwargs.get("key_path", ""),
                    key_passphrase=kwargs.get("key_passphrase", ""),
                )
            else:
                url = kwargs.get('url', '')
                username = kwargs.get('username', '')
                password = kwargs.get('password', '')
                oauth_token = kwargs.get('oauth_token', '')
                webdav_provider = kwargs.get('webdav_provider', 'custom')
                save_storage_config(
                    provider='webdav',
                    webdav_provider=webdav_provider,
                    url=url,
                    username=username,
                    password=password,
                    oauth_token=oauth_token,
                )
            
            return {"success": True}
        except Exception as e:
            logger.error(f"Error saving storage config: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
    async def load_storage_config(self, *args, **kwargs) -> Dict[str, Any]:
        """Загрузка конфигурации хранилища"""
        try:
            from config_manager import load_storage_config
            config = load_storage_config()
            return {"success": True, "config": config}
        except Exception as e:
            logger.error(f"Error loading storage config: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
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
                cache_manager.clear()
                logger.info("Cache cleared")
            except Exception as e:
                logger.warning(f"Error clearing cache: {e}")

            # История бэкапов
            try:
                from backup_index import clear as clear_backups
                clear_backups()
            except Exception as e:
                logger.warning(f"Error clearing backup index: {e}")
            # Сброс изученных путей и кэша Ludusavi
            try:
                from learning import clear as clear_learned
                clear_learned()
            except Exception as e:
                logger.warning(f"Error clearing learned paths: {e}")
            try:
                from ludusavi import clear_cache as clear_ludusavi
                clear_ludusavi()
            except Exception as e:
                logger.warning(f"Error clearing Ludusavi cache: {e}")
            
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
    
    @decky_params
    async def test_storage_connection(self, provider: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Тест подключения к хранилищу"""
        try:
            from config_manager import load_storage_config
            
            logger.info(f"[test_storage_connection] provider={provider}, kwargs keys={sorted(kwargs.keys())}")

            # Загружаем сохранённый конфиг как базовый
            storage_config = load_storage_config()

            # Явно переданный провайдер приоритетнее сохранённого
            storage_provider = (provider or storage_config.get("provider") or "webdav").lower()

            # Если тестируем не тот провайдер, что сохранён, не смешиваем чужие поля
            if storage_provider == (storage_config.get("provider") or "webdav").lower():
                config = dict(storage_config)
            else:
                config = {}
            config["provider"] = storage_provider

            # Перекрываем значениями из kwargs ТОЛЬКО если они непустые
            for key, value in kwargs.items():
                if key == "url" and isinstance(value, dict):
                    value = value.get("url") or value.get("path")
                if value not in (None, ""):
                    config[key] = value

            if config.get("url") is not None:
                config["url"] = str(config["url"]).strip()

            logger.info(
                f"[test_storage_connection] provider={storage_provider}, "
                f"config keys={sorted(config.keys())}"
            )

            # Гарантируем наличие зависимостей выбранного провайдера
            try:
                import dependencies
                dep = await dependencies.ensure_dependencies_async(storage_provider)
                if not dep.get("success"):
                    return {
                        "success": False,
                        "error": "Не удалось установить зависимости: " + ", ".join(dep.get("missing", [])),
                    }
            except Exception as e:
                logger.warning(f"Dependency check failed: {e}")

            provider_obj, error = _build_provider(config)
            if error:
                return {"success": False, "error": error}

            return provider_obj.test_connection()
        except Exception as e:
            logger.error(f"Error testing storage connection: {e}")
            return {"success": False, "error": str(e)}

