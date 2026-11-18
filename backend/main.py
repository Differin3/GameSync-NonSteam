import decky
import os
import time
import asyncio
import functools
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# Используем логгер Decky Loader
logger = decky.logger


def _ensure_ca_bundle() -> None:
    """Python на SteamOS не видит системные CA: /etc/ssl/cert.pem отсутствует.

    Без этого urllib и requests падают с CERTIFICATE_VERIFY_FAILED, и плагин
    не может ни скачать манифест Ludusavi, ни обратиться к WebDAV.
    """
    if os.environ.get("SSL_CERT_FILE"):
        return
    for path in (
        "/etc/ssl/certs/ca-certificates.crt",
        "/etc/ssl/cert.pem",
        "/etc/pki/tls/certs/ca-bundle.crt",
    ):
        if os.path.exists(path):
            os.environ["SSL_CERT_FILE"] = path
            os.environ.setdefault("REQUESTS_CA_BUNDLE", path)
            return


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


_WEBDAV_PROVIDER_NAMES = {
    "mail": "Облако Mail.ru",
    "yandex": "Яндекс Диск",
    "nextcloud": "Nextcloud",
    "owncloud": "ownCloud",
    "fastmail": "Fastmail",
    "custom": "WebDAV",
}


def storage_display_name(config: Dict[str, Any]) -> str:
    """Человеческое название настроенного хранилища для интерфейса."""
    config = config or {}
    provider = (config.get("provider") or "webdav").lower()
    if provider == "webdav":
        return _WEBDAV_PROVIDER_NAMES.get((config.get("webdav_provider") or "").lower(), "WebDAV")
    return {"s3": "S3", "ftp": "FTP", "sftp": "SFTP"}.get(provider, provider)


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
    # Не чаще одного pull на игру за 10 минут (процесс может мигать).
    _pull_attempts: Dict[str, float] = {}
    # Активные синхронизации: имя игры -> время начала (для индикатора в UI).
    _active_syncs: Dict[str, float] = {}
    # Игры, в которые прямо сейчас пишется restore/pull.
    _active_restores: set = set()
    # Очередь уведомлений для фронтенда: события могут теряться, поэтому
    # UI забирает их опросом get_notifications.
    _notification_seq: int = 0
    _notifications: List[Dict[str, Any]] = []

    # Прогресс синхронизации для QAM: этапы, проценты, текущая игра.
    sync_progress: Dict[str, Any] = {
        "active": False,
        "stage": "",
        "percent": 0,
        "currentGame": "",
        "index": 0,
        "total": 0,
        "ok": 0,
        "failed": 0,
    }
    _storage_status_cache: Dict[str, Any] = {"ts": 0.0, "result": None}
    
    async def _main(self):
        """Инициализация плагина"""
        _ensure_ca_bundle()

        # Сбрасываем кэш игр: правила (например, предупреждения об общем
        # префиксе) могли измениться, а кэш живёт 5 минут.
        try:
            from cache_manager import cache_manager
            cache_manager.invalidate("portproton_games")
        except Exception as e:
            logger.warning(f"Failed to invalidate game cache: {e}")
        logger.info("GameSync NonSteam plugin initialized")
        try:
            from config_manager import load_app_settings
            from portproton_scanner import set_configured_root

            set_configured_root(load_app_settings().get("portproton_root"))
        except Exception as e:
            logger.warning(f"Failed to apply PortProton root setting: {e}")
        Plugin.auto_sync_enabled = False
        Plugin.game_monitor = None

        # Ставим зависимости в фоне, чтобы плагин работал «из коробки».
        try:
            import dependencies
            dependencies._ensure_py_modules_on_path()
            # Ставим зависимости только для выбранного провайдера: тянуть boto3
            # и paramiko «на всякий случай» на Deck долго и не всегда возможно.
            try:
                from config_manager import load_storage_config
                provider = (load_storage_config() or {}).get("provider") or "webdav"
            except Exception:
                provider = "webdav"
            asyncio.create_task(dependencies.ensure_dependencies_async(provider))
            # PyYAML нужен для манифеста Ludusavi — это один из главных
            # источников точных путей сохранений.
            asyncio.create_task(dependencies.ensure_dependencies_async("ludusavi"))
            logger.info("Dependency bootstrap started")
        except Exception as e:
            logger.warning(f"Dependency bootstrap failed: {e}")

        # Монитор процессов нужен и для автосинхронизации, и для pull перед запуском.
        try:
            from config_manager import load_app_settings
            settings = load_app_settings()
            if settings.get("auto_sync") or settings.get("pull_on_launch"):
                await Plugin()._start_auto_sync()
                logger.info(
                    "Process monitor restored (auto_sync=%s, pull_on_launch=%s)",
                    bool(settings.get("auto_sync")),
                    bool(settings.get("pull_on_launch")),
                )
        except Exception as e:
            logger.warning(f"Failed to restore process monitor: {e}")

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

        async def sync_callback(game_name: str, save_paths: List[str], started_at: float = None):
            """Callback для автосинхронизации после выхода из игры."""
            from config_manager import load_app_settings

            if not load_app_settings().get("auto_sync"):
                logger.info(f"Auto-sync disabled, skip exit sync for {game_name}")
                return

            logger.info(f"Auto-syncing game: {game_name}")
            resolved_name = game_name
            resolved_paths = save_paths or _resolve_save_paths_for_game(game_name)
            matched_candidate = None

            # Имя папки префикса может не совпадать с названием игры:
            # тогда ищем игру по префиксу и берём её пути.
            if not resolved_paths:
                try:
                    import pathlib as _pathlib
                    from portproton_scanner import scan_portproton_games
                    games = await asyncio.to_thread(scan_portproton_games, False)
                    want_dir = game_name[4:].replace("\\", "/").lower() if game_name.startswith("exe:") else ""
                    for candidate in games:
                        prefix_name = _pathlib.Path(candidate.get("prefixPath") or "").name
                        exec_norm = (candidate.get("exec") or "").replace("\\", "/").lower()
                        matched = bool(want_dir) and want_dir in exec_norm
                        if not matched and not want_dir:
                            matched = (
                                prefix_name.lower() == game_name.lower()
                                or game_name.lower() in (candidate.get("name") or "").lower()
                            )
                        if matched:
                            resolved_name = candidate.get("name") or game_name
                            resolved_paths = candidate.get("savePaths") or []
                            matched_candidate = candidate
                            logger.info(
                                f"Auto-sync matched {game_name} -> {resolved_name} ({len(resolved_paths)} paths)"
                            )
                            break
                except Exception as e:
                    logger.warning(f"Auto-sync prefix match failed: {e}")

            # Учимся на сессии: файлы, которые игра писала во время запуска,
            # становятся путями сохранений (самый надёжный сигнал).
            if started_at and matched_candidate:
                try:
                    from learning import learn_from_session
                    learned = await asyncio.to_thread(
                        learn_from_session,
                        resolved_name,
                        matched_candidate.get("prefixPath"),
                        started_at,
                    )
                    if learned:
                        extra = _resolve_save_paths_for_game(resolved_name)
                        resolved_paths = list(dict.fromkeys(list(resolved_paths) + list(extra)))
                        logger.info(f"Auto-sync paths after learning: {len(resolved_paths)}")
                except Exception as e:
                    logger.warning(f"Session learning failed: {e}")

            try:
                Plugin.notify_event("gamesync_sync_started", {"game": resolved_name, "source": "auto"})
            except Exception as emit_error:
                logger.warning(f"Failed to emit sync-start event: {emit_error}")

            if not resolved_paths:
                logger.warning(f"Auto-sync skipped for {game_name}: no save paths found")
                try:
                    Plugin.notify_event(
                        "gamesync_sync_finished",
                        {"game": resolved_name, "success": False, "error": "Не найдены пути сохранений"},
                    )
                except Exception as emit_error:
                    logger.warning(f"Failed to emit sync-finish event: {emit_error}")
                return
            # Не синхронизируем игру, пока в неё ещё пишется restore/pull:
            # иначе архив уйдёт в облако с недописанными файлами.
            for _ in range(240):
                if resolved_name not in Plugin._active_restores:
                    break
                await asyncio.sleep(0.5)

            plugin_instance = Plugin()
            Plugin._active_syncs[resolved_name] = time.time()
            try:
                result = await plugin_instance.sync_game(resolved_name, resolved_paths)
            finally:
                Plugin._active_syncs.pop(resolved_name, None)
            try:
                Plugin.notify_event(
                    "gamesync_sync_finished",
                    {
                        "game": resolved_name,
                        "success": bool(result.get("success")),
                        "error": result.get("error") or "",
                        "size": int(result.get("file_size") or 0),
                    },
                )
            except Exception as emit_error:
                logger.warning(f"Failed to emit sync-finish event: {emit_error}")
            if result.get("success"):
                logger.info(f"Auto-sync completed for {resolved_name}")
                # Тост в Steam UI: уведомление «сохранено»
                try:
                    Plugin.notify_event(
                        "gamesync_auto_saved",
                        {"game": resolved_name, "size": int(result.get("file_size") or 0)},
                    )
                except Exception as emit_error:
                    logger.warning(f"Failed to emit auto-save event: {emit_error}")
            else:
                logger.error(f"Auto-sync failed for {resolved_name}: {result.get('error')}")

        async def start_callback(game_name: str, started_at: float = None):
            """Перед запуском игры подтянуть облачные сейвы, если они новее."""
            try:
                await Plugin()._pull_before_launch(game_name, started_at)
            except Exception as e:
                logger.warning(f"Pull before launch failed for {game_name}: {e}")

        Plugin.game_monitor = GameMonitor(sync_callback, start_callback)
        asyncio.create_task(Plugin.game_monitor.start_monitoring())
        Plugin.auto_sync_enabled = True
        return True

    async def _pull_before_launch(self, game_name: str, started_at: float = None) -> None:
        """Скачать облачный бэкап при старте игры, если он новее локального.

        Точного хука «до запуска» в Steam нет, поэтому вызывается сразу после
        появления процесса: Proton ещё несколько секунд инициализирует игру,
        а безопасная копия текущих сейвов создаётся до перезаписи.
        """
        from config_manager import load_app_settings
        from backup_index import get_entry
        from pull_engine import newest_local_mtime, pull_deadline, should_attempt_pull, should_pull

        if not load_app_settings().get("pull_on_launch"):
            return

        if not should_attempt_pull(started_at):
            logger.info(f"Pull before launch skipped for {game_name}: game is already running")
            return

        entry = get_entry(game_name)
        if not entry and game_name.startswith("exe:"):
            # Игры в общем префиксе DEFAULT приходят как "exe:<каталог>":
            # сопоставляем с названием игры, чтобы найти её бэкап.
            try:
                from portproton_scanner import scan_portproton_games
                want_dir = game_name[4:].replace("\\", "/").lower()
                games = await asyncio.to_thread(scan_portproton_games, False)
                for candidate in games:
                    exec_norm = (candidate.get("exec") or "").replace("\\", "/").lower()
                    if want_dir and want_dir in exec_norm:
                        game_name = candidate.get("name") or game_name
                        entry = get_entry(game_name)
                        logger.info(f"Pull before launch matched {want_dir} -> {game_name}")
                        break
            except Exception as e:
                logger.warning(f"Pull before launch match failed: {e}")
        if not entry or not entry.get("remote"):
            logger.debug(f"Pull before launch skipped for {game_name}: no cloud backup")
            return

        paths = entry.get("paths") or _resolve_save_paths_for_game(game_name)
        local_mtime = await asyncio.to_thread(newest_local_mtime, paths)
        if not should_pull(entry.get("created"), local_mtime):
            logger.info(f"Pull before launch skipped for {game_name}: local saves are newer")
            return

        last_attempt = Plugin._pull_attempts.get(game_name, 0.0)
        if time.time() - last_attempt < 600:
            logger.debug(f"Pull before launch throttled for {game_name}")
            return
        Plugin._pull_attempts[game_name] = time.time()

        logger.info(f"Pulling cloud saves before launch: {game_name}")
        try:
            Plugin.notify_event("gamesync_pull_started", {"game": game_name})
        except Exception as emit_error:
            logger.warning(f"Failed to emit pull-start event: {emit_error}")
        result = await Plugin().restore_backup(
            game_name=game_name,
            allow_running=True,
            upload_safety_cloud=False,
            deadline_ts=pull_deadline(started_at),
        )
        try:
            Plugin.notify_event(
                "gamesync_pull_done",
                {
                    "game": game_name,
                    "success": bool(result.get("success")),
                    "files": int(result.get("files") or 0),
                    "error": result.get("error") or "",
                },
            )
        except Exception as emit_error:
            logger.warning(f"Failed to emit pull event: {emit_error}")
        if result.get("success"):
            logger.info(f"Pulled {result.get('files', 0)} files before launch: {game_name}")
        else:
            logger.error(f"Pull before launch failed for {game_name}: {result.get('error')}")

    def _stop_auto_sync(self) -> None:
        Plugin.auto_sync_enabled = False
        # Если включён pull перед запуском, монитор процессов должен остаться.
        try:
            from config_manager import load_app_settings

            if load_app_settings().get("pull_on_launch"):
                return
        except Exception:
            pass
        if Plugin.game_monitor:
            Plugin.game_monitor.stop_monitoring()
            Plugin.game_monitor = None

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

    def _set_sync_progress(self, **fields) -> None:
        """Обновить общий прогресс синхронизации (виден в QAM)."""
        Plugin.sync_progress.update(fields)

    @decky_params
    async def get_sync_progress(self, *args, **kwargs) -> Dict[str, Any]:
        """Текущий прогресс синхронизации для прогресс-бара в QAM."""
        return dict(Plugin.sync_progress)

    @classmethod
    def notify_event(cls, event: str, data: Dict[str, Any] = None) -> None:
        """Записать уведомление в очередь и продублировать событием Decky."""
        cls._notification_seq += 1
        payload = dict(data or {})
        cls._notifications.append(
            {"id": cls._notification_seq, "ts": time.time(), "event": event, "data": payload}
        )
        if len(cls._notifications) > 200:
            del cls._notifications[:-100]
        try:
            getattr(decky, "emit")(event, payload)
        except Exception as e:
            logger.warning(f"emit {event} failed: {e}")

    @decky_params
    async def get_notifications(self, after_id: int = 0, *args, **kwargs) -> Dict[str, Any]:
        """Уведомления после last_id (опрос из UI)."""
        try:
            after = int(after_id or kwargs.get("after_id") or 0)
        except (TypeError, ValueError):
            after = 0
        items = [item for item in Plugin._notifications if item["id"] > after][-50:]
        return {"success": True, "items": items, "last_id": Plugin._notification_seq}

    @decky_params
    async def get_running_games(self, *args, **kwargs) -> Dict[str, Any]:
        """Есть ли запущенные игры PortProton (для отложенных уведомлений)."""
        try:
            from auto_sync import collect_running_games, find_portproton_processes

            current = await asyncio.to_thread(
                lambda: collect_running_games(find_portproton_processes() or [])
            )
            return {"success": True, "games": list(current.keys())}
        except Exception as e:
            logger.warning(f"get_running_games failed: {e}")
            return {"success": True, "games": []}

    @decky_params
    async def get_sync_state(self, *args, **kwargs) -> Dict[str, Any]:
        """Какие игры синхронизируются прямо сейчас (для спиннера в UI)."""
        now = time.time()
        # Чистим зависшие записи, чтобы индикатор не горел вечно.
        for name, started in list(Plugin._active_syncs.items()):
            if now - started > 600:
                Plugin._active_syncs.pop(name, None)
        active = [
            {"game": name, "since": started}
            for name, started in Plugin._active_syncs.items()
        ]
        return {"success": True, "active": active}

    @decky_params
    async def get_storage_status(self, *args, **kwargs) -> Dict[str, Any]:
        """Доступно ли настроенное хранилище (кэш 60 секунд)."""
        import time

        now = time.time()
        cached = Plugin._storage_status_cache
        if cached.get("result") and now - cached.get("ts", 0) < 60:
            return dict(cached["result"])

        try:
            from config_manager import load_storage_config
            config = load_storage_config() or {}
        except Exception as e:
            return {"success": False, "provider": "", "error": str(e)}

        provider_name = storage_display_name(config)
        try:
            provider, error = _build_provider(config)
            if error or provider is None:
                result = {"success": False, "provider": provider_name, "error": error or "Провайдер не настроен"}
            else:
                check = await asyncio.to_thread(provider.test_connection)
                result = {
                    "success": bool(check.get("success")),
                    "provider": provider_name,
                    "error": check.get("error"),
                    "url": config.get("url") or config.get("endpoint") or "",
                }
        except Exception as e:
            result = {"success": False, "provider": provider_name, "error": str(e)}

        Plugin._storage_status_cache = {"ts": now, "result": result}
        return dict(result)

    @decky_params
    async def get_test(self, *args, **kwargs) -> Dict[str, Any]:
        """Тестовый метод для проверки связи с фронтендом"""
        try:
            return {"success": True, "status": "ok", "message": "Plugin is working"}
        except Exception as e:
            logger.error(f"Error in get_test: {e}")
            return {"success": False, "error": str(e)}
    
    @decky_params
    async def browse_path(self, path: str = None, show_hidden: bool = False, *args, **kwargs) -> Dict[str, Any]:
        """Список папок для ручного выбора пути (файловый браузер)."""
        import os

        home = os.path.expanduser("~")
        target = os.path.abspath(os.path.expanduser(path)) if path else home
        if not os.path.isdir(target):
            target = home

        try:
            entries = list(os.scandir(target))
        except OSError as e:
            return {"success": False, "error": f"Не удалось открыть папку: {e}"}

        dirs = []
        for entry in entries:
            try:
                if entry.name.startswith(".") and not show_hidden:
                    continue
                if entry.is_dir(follow_symlinks=False):
                    dirs.append({"name": entry.name, "path": entry.path})
            except OSError:
                continue
        dirs.sort(key=lambda item: item["name"].lower())

        shortcuts = [{"name": "Домашняя папка", "path": home}]
        seen = {home}
        for candidate in ("/home", "/run/media", "/mnt", "/media", "/var/mnt"):
            if candidate in seen or not os.path.isdir(candidate):
                continue
            seen.add(candidate)
            shortcuts.append({"name": candidate, "path": candidate})

        parent = os.path.dirname(target)
        return {
            "success": True,
            "path": target,
            "parent": parent if parent and parent != target else "",
            "dirs": dirs[:500],
            "truncated": len(dirs) > 500,
            "shortcuts": shortcuts,
        }

    @decky_params
    async def set_portproton_root(self, path: str = "", *args, **kwargs) -> Dict[str, Any]:
        """Опасная настройка: вручную задать корень PortProton."""
        import os
        from pathlib import Path

        from config_manager import save_app_settings
        from portproton_scanner import _looks_like_portproton_root, set_configured_root

        raw = (path or "").strip()
        if not raw:
            save_app_settings(portproton_root="")
            set_configured_root(None)
            try:
                from cache_manager import cache_manager

                cache_manager.invalidate("portproton_games")
            except Exception:
                pass
            logger.info("PortProton root reset to auto-detect")
            return {"success": True, "path": "", "auto": True}

        expanded = os.path.abspath(os.path.expanduser(raw))
        if not os.path.isdir(expanded):
            return {"success": False, "error": "Папка не найдена"}

        warning = None
        if not _looks_like_portproton_root(Path(expanded)):
            warning = (
                "Папка не похожа на PortProton (нет steam_scripts или "
                "data/scripts/start.sh). Убедитесь, что путь верный."
            )

        save_app_settings(portproton_root=expanded)
        set_configured_root(expanded)
        try:
            from cache_manager import cache_manager

            cache_manager.invalidate("portproton_games")
        except Exception:
            pass
        logger.info(f"PortProton root set manually: {expanded}")
        return {"success": True, "path": expanded, "warning": warning, "auto": False}

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

            # Не архивируем игру, пока в неё пишется restore/pull: иначе в облако
            # уйдёт недописанное состояние.
            for _ in range(240):
                if game_name not in Plugin._active_restores:
                    break
                await asyncio.sleep(0.5)

            # Архив пишется во временный каталог: без места backup оборвётся.
            try:
                free = shutil.disk_usage(tempfile.gettempdir()).free
            except OSError:
                free = None
            if free is not None and free < 200 * 1024 * 1024:
                return {
                    "success": False,
                    "error": "Мало свободного места для создания архива (нужно ≥ 200 МБ).",
                }

            # Надёжность: не делаем бэкап, если в путях только служебные файлы
            # (логи, кэш) — иначе получается «пустой» архив на 3 КБ.
            try:
                from sync_engine import count_meaningful_files
                meaningful = await asyncio.to_thread(count_meaningful_files, save_paths)
            except Exception as e:
                logger.warning(f"Meaningful file check failed: {e}")
                meaningful = None
            if meaningful == 0:
                return {
                    "success": False,
                    "error": "В путях сохранений только служебные файлы (логи/кэш). Укажите путь в «Пути игр».",
                }

            try:
                from sync_engine import create_backup
            except ImportError:
                import sys
                import pathlib
                backend_path = pathlib.Path(__file__).parent
                sys.path.insert(0, str(backend_path))
                from sync_engine import create_backup
            
            self._set_sync_progress(
                active=True,
                stage="Архивация сохранений",
                currentGame=game_name,
                percent=Plugin.sync_progress.get("percent", 0) if Plugin.sync_progress.get("total", 0) > 1 else 15,
            )
            # Создаем бэкап
            archive_path = await asyncio.to_thread(create_backup, game_name, save_paths)
            if not archive_path:
                return {"success": False, "error": "Не удалось создать архив"}

            from integrity import sha256_file
            archive_sha = await asyncio.to_thread(sha256_file, archive_path)
            if not archive_sha:
                logger.warning(f"Cannot compute checksum for {archive_path}")
            
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

            self._set_sync_progress(
                stage="Загрузка в облако",
                percent=Plugin.sync_progress.get("percent", 0) if Plugin.sync_progress.get("total", 0) > 1 else 60,
            )
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
            
            self._set_sync_progress(
                stage="История версий",
                percent=Plugin.sync_progress.get("percent", 0) if Plugin.sync_progress.get("total", 0) > 1 else 85,
            )
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
                from backup_index import add_entry, prepare_trim
                from config_manager import load_app_settings
                keep_versions = int(load_app_settings().get("max_backup_versions", 10) or 10)
                # Записи, которые выпадут из истории (лимит 10 на игру),
                # удаляем и из облака — иначе файлы копятся бесконечно.
                to_prune = prepare_trim(game_name, keep_versions)
                add_entry(
                    game_name,
                    remote=version_remote or file_id,
                    size=file_size,
                    paths=save_paths,
                    kind="sync",
                    keep=keep_versions,
                    sha256=archive_sha,
                )
                for old_entry in to_prune:
                    old_remote = old_entry.get("remote")
                    if not old_remote:
                        continue
                    try:
                        deleted = await asyncio.to_thread(provider.delete_file, old_remote)
                        if deleted:
                            logger.info(f"Pruned old backup: {old_remote}")
                        else:
                            logger.warning(f"Could not prune old backup: {old_remote}")
                    except Exception as e:
                        logger.warning(f"Prune failed for {old_remote}: {e}")
            except Exception as e:
                logger.warning(f"Failed to record backup entry: {e}")
            
            if Plugin.sync_progress.get("total", 0) <= 1:
                self._set_sync_progress(active=False, stage="Готово", percent=100, currentGame="")
            return {
                "success": True,
                "file_id": file_id,
                "version_id": version_remote,
                "file_size": file_size,
                "message": "Синхронизация завершена",
            }
        except Exception as e:
            logger.error(f"Error syncing game: {e}")
            if Plugin.sync_progress.get("total", 0) <= 1:
                self._set_sync_progress(active=False, stage="Ошибка", percent=0)
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
    async def preview_path(self, path: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Показать файлы в пути сохранений (проверка перед синхронизацией)."""
        try:
            from path_preview import describe_path
            return await asyncio.to_thread(describe_path, path or "")
        except Exception as e:
            logger.error(f"Error previewing path: {e}")
            return {"success": False, "error": str(e)}

    @decky_params
    async def cleanup_orphans(self, game_name: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Удалить из облака архивы версий, которых нет в истории бэкапов."""
        try:
            from backup_index import list_all
            from cleanup import cleanup_game
            from config_manager import load_storage_config
            from sync_engine import sanitize_name

            provider, error = _build_provider(load_storage_config())
            if error or provider is None:
                return {"success": False, "error": error or "Хранилище не настроено"}

            groups = list_all() or {}
            targets = [game_name] if game_name else sorted(groups.keys())
            results = []
            total_deleted = 0
            for name in targets:
                entries = groups.get(name) or []
                if not entries:
                    continue
                referenced = [entry.get("remote") for entry in entries]
                folder = f"GameSync/{sanitize_name(name)}"
                result = await asyncio.to_thread(cleanup_game, provider, folder, referenced)
                total_deleted += len(result.get("deleted") or [])
                results.append(result)

            logger.info(f"Cleanup finished: {total_deleted} orphan file(s) deleted")
            return {"success": True, "deleted": total_deleted, "games": results}
        except Exception as e:
            logger.error(f"Error cleaning orphans: {e}")
            return {"success": False, "error": str(e)}

    @decky_params
    async def set_max_backup_versions(self, count: int = 10, *args, **kwargs) -> Dict[str, Any]:
        """Сколько версий бэкапа хранить на игру (1–100)."""
        try:
            value = max(1, min(100, int(count)))
            from config_manager import save_app_settings
            save_app_settings(max_backup_versions=value)
            return {"success": True, "max_backup_versions": value}
        except Exception as e:
            logger.error(f"Error saving max backup versions: {e}")
            return {"success": False, "error": str(e)}

    @decky_params
    async def download_backup(self, game_name: str = None, backup_id: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Скачать архив бэкапа в ~/Downloads (для ручного хранения)."""
        try:
            from pathlib import Path as _Path
            from backup_index import get_entry
            from config_manager import load_storage_config

            entry = get_entry(game_name, backup_id)
            if not entry or not entry.get("remote"):
                return {"success": False, "error": "Бэкап не найден"}

            provider, error = _build_provider(load_storage_config())
            if error or provider is None:
                return {"success": False, "error": error or "Хранилище не настроено"}

            downloads = _Path.home() / "Downloads"
            downloads.mkdir(parents=True, exist_ok=True)
            safe_name = (game_name or "game").replace("/", "_").replace("\\", "_")
            target = downloads / f"{safe_name}-{entry.get('id')}.tar.gz"
            ok = await asyncio.to_thread(provider.download_file, entry["remote"], str(target))
            if not ok:
                return {"success": False, "error": "Не удалось скачать архив"}
            return {"success": True, "path": str(target)}
        except Exception as e:
            logger.error(f"Error downloading backup: {e}")
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
                "pull_on_launch": bool(settings.get("pull_on_launch")),
                "max_backup_versions": int(settings.get("max_backup_versions", 10) or 10),
                "download_dir": str(__import__("pathlib").Path.home() / "Downloads"),
                "default_save_paths": settings.get("default_save_paths") or [],
            }
        except Exception as e:
            logger.error(f"Error loading app settings: {e}")
            return {"success": False, "error": str(e), "auto_sync": False, "pull_on_launch": False, "max_backup_versions": 10, "download_dir": "~/Downloads", "default_save_paths": []}

    @decky_params
    async def set_pull_on_launch(self, enabled: bool = True, *args, **kwargs) -> Dict[str, Any]:
        """Включает/выключает загрузку облачных сейвов перед запуском игры."""
        try:
            from config_manager import save_app_settings
            if enabled is None:
                enabled = kwargs.get("enabled", True)
            settings = save_app_settings(pull_on_launch=bool(enabled))
            from config_manager import load_app_settings

            if settings.get("pull_on_launch"):
                await self._start_auto_sync()
            elif not load_app_settings().get("auto_sync"):
                self._stop_auto_sync()
            return {"success": True, "pull_on_launch": bool(settings.get("pull_on_launch"))}
        except Exception as e:
            logger.error(f"Error saving pull_on_launch: {e}")
            return {"success": False, "error": str(e)}

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
    async def sync_all_games(self, *args, **kwargs) -> Dict[str, Any]:
        """Синхронизирует все найденные игры, у которых есть пути сохранений."""
        try:
            self._set_sync_progress(
                active=True,
                stage="Сканирование игр",
                percent=0,
                currentGame="",
                index=0,
                total=0,
                ok=0,
                failed=0,
            )
            games = await asyncio.to_thread(scan_portproton_games, False)
            targets = [game for game in games if game.get("savePaths")]
            total = len(targets)
            self._set_sync_progress(total=total, stage="Синхронизация")

            synced: List[str] = []
            failed: List[Dict[str, str]] = []

            for index, game in enumerate(targets, start=1):
                name = game.get("name") or ""
                self._set_sync_progress(
                    index=index,
                    currentGame=name,
                    percent=int((index - 1) / total * 100) if total else 0,
                )
                result = await self.sync_game(name, game.get("savePaths") or [])
                if result.get("success"):
                    synced.append(name)
                else:
                    failed.append({"game": name, "error": str(result.get("error") or "unknown error")})
                self._set_sync_progress(
                    ok=len(synced),
                    failed=len(failed),
                    percent=int(index / total * 100) if total else 100,
                )

            self._set_sync_progress(
                active=False,
                stage="Готово",
                percent=100,
                currentGame="",
                index=total,
                ok=len(synced),
                failed=len(failed),
            )
            Plugin.notify_event(
                "gamesync_sync_all_done",
                {"success": True, "total": total, "ok": len(synced), "failed": len(failed)},
            )
            return {
                "success": True,
                "total": total,
                "synced": synced,
                "failed": failed,
            }
        except Exception as e:
            logger.error(f"Error syncing all games: {e}")
            Plugin.notify_event("gamesync_sync_all_done", {"success": False, "error": str(e)})
            self._set_sync_progress(active=False, stage="Ошибка", currentGame="")
            return {"success": False, "error": str(e), "synced": [], "failed": []}

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
    async def restore_backup(self, game_name: str = None, backup_id: str = None, allow_running: bool = False, upload_safety_cloud: bool = True, deadline_ts: float = None, *args, **kwargs) -> Dict[str, Any]:
        """Восстановление сохранений игры из облачного бэкапа."""
        try:
            if not game_name:
                return {"success": False, "error": "Не указан game_name"}

            if game_name in Plugin._active_restores:
                return {
                    "success": False,
                    "error": "Восстановление этой игры уже выполняется",
                }
            Plugin._active_restores.add(game_name)

            if deadline_ts and time.time() > deadline_ts:
                logger.info(f"Restore skipped for {game_name}: deadline passed")
                return {
                    "success": False,
                    "error": "Игра уже запущена — восстановление отменено, чтобы не писать в работающие сейвы",
                    "skipped": True,
                }

            if not allow_running:
                try:
                    from auto_sync import has_running_game

                    running = await asyncio.to_thread(has_running_game)
                except Exception:
                    running = False
                if running:
                    return {
                        "success": False,
                        "error": "Игра запущена — закройте её перед восстановлением сохранений",
                    }

            from backup_index import add_entry, get_entry
            from config_manager import load_storage_config, load_synced_games
            from restore_engine import read_manifest, restore_archive, rollback_from_safety
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
                Plugin.notify_event("gamesync_restore_failed", {"game": game_name, "error": "Бэкап не найден"})
                return {"success": False, "error": "Бэкап не найден — сначала синхронизируйте игру"}

            Plugin.notify_event(
                "gamesync_restore_started",
                {"game": game_name, "created": entry.get("created") or ""},
            )

            storage_config = load_storage_config()

            try:
                import dependencies
                dep = await dependencies.ensure_dependencies_async(storage_config.get("provider", "webdav"))
                if not dep.get("success"):
                    error = "Не удалось установить зависимости: " + ", ".join(dep.get("missing", []))
                    Plugin.notify_event("gamesync_restore_failed", {"game": game_name, "error": error})
                    return {"success": False, "error": error}
            except Exception as e:
                logger.warning(f"Dependency check failed: {e}")

            provider, error = _build_provider(storage_config)
            if error:
                Plugin.notify_event("gamesync_restore_failed", {"game": game_name, "error": error})
                return {"success": False, "error": error}

            workdir = tempfile.mkdtemp(prefix="gamesync-restore-")
            archive_path = os.path.join(workdir, "backup.tar.gz")
            safety_remote = None
            safety_local = None
            safety_temp_path = None

            try:
                downloaded = await asyncio.to_thread(provider.download_file, entry["remote"], archive_path)
                if not downloaded:
                    Plugin.notify_event(
                        "gamesync_restore_failed",
                        {"game": game_name, "error": "Не удалось скачать бэкап"},
                    )
                    return {"success": False, "error": "Не удалось скачать бэкап из хранилища"}

                expected_sha = entry.get("sha256")
                if expected_sha:
                    from integrity import verify_file

                    checksum_ok = await asyncio.to_thread(verify_file, archive_path, expected_sha)
                    if not checksum_ok:
                        error = "Архив повреждён: контрольная сумма не совпала. Скачайте другую версию."
                        Plugin.notify_event("gamesync_restore_failed", {"game": game_name, "error": error})
                        return {"success": False, "error": error}

                manifest = read_manifest(archive_path)
                if not manifest:
                    Plugin.notify_event(
                        "gamesync_restore_failed",
                        {"game": game_name, "error": "Старый архив без манифеста"},
                    )
                    return {
                        "success": False,
                        "error": "Бэкап создан старой версией плагина (без манифеста). Синхронизируйте игру заново.",
                    }

                # Страховочная копия текущих сейвов перед перезаписью
                current_paths = entry.get("paths") or _resolve_save_paths_for_game(game_name)
                if current_paths:
                    safety_path = await asyncio.to_thread(create_backup, game_name, current_paths)
                    if safety_path:
                        safety_temp_path = safety_path
                        from integrity import sha256_file as _sha256_file

                        safety_sha = await asyncio.to_thread(_sha256_file, safety_path)
                        if not upload_safety_cloud:
                            # Быстрый путь для pull: локальная страховка без сети.
                            from pathlib import Path as _Path

                            local_dir = _Path.home() / ".config" / "gamesync" / "restores"
                            local_dir.mkdir(parents=True, exist_ok=True)
                            local_name = (
                                f"{sanitize_name(game_name)}-"
                                f"{datetime.now().strftime('%Y%m%d-%H%M%S')}.tar.gz"
                            )
                            local_path = local_dir / local_name
                            shutil.move(safety_path, str(local_path))
                            safety_local = str(local_path)
                            safety_path = None
                            try:
                                copies = sorted(local_dir.glob(f"{sanitize_name(game_name)}-*.tar.gz"))
                                for old in copies[:-3]:
                                    old.unlink(missing_ok=True)
                            except OSError:
                                pass
                        else:
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
                                    sha256=safety_sha,
                                )
                            except Exception as e:
                                logger.warning(f"Failed to upload pre-restore backup: {e}")

                if deadline_ts and time.time() > deadline_ts:
                    logger.info(f"Restore skipped before extraction for {game_name}: game is running")
                    return {
                        "success": False,
                        "error": "Игра уже запущена — восстановление отменено",
                        "skipped": True,
                    }

                from quarantine import move_files as quarantine_move, prune as quarantine_prune

                def _quarantine(extras):
                    return quarantine_move(game_name, extras, reason="restore")

                result = await asyncio.to_thread(
                    restore_archive, archive_path, manifest, None, False, _quarantine
                )
                removed = int(result.get("removed") or 0)
                quarantined = int(result.get("quarantined") or 0)
                verified = int(result.get("verified") or 0)
                mismatched = result.get("mismatched") or []
                if mismatched:
                    rollback_ok = False
                    rollback_archive = safety_local or safety_temp_path
                    if rollback_archive and os.path.isfile(rollback_archive):
                        try:
                            rollback = await asyncio.to_thread(
                                rollback_from_safety,
                                rollback_archive,
                                None,
                                _quarantine,
                            )
                            rollback_ok = bool(rollback.get("success"))
                            logger.info(
                                f"Rollback {game_name}: {rollback.get('files', 0)} files, ok={rollback_ok}"
                            )
                        except Exception as rollback_error:
                            logger.error(f"Rollback failed for {game_name}: {rollback_error}")
                    error = (
                        f"Проверка целостности не пройдена: {len(mismatched)} файлов повреждены. "
                        + (
                            "Выполнен автоматический откат из страховочной копии."
                            if rollback_ok
                            else "Откат не удался — восстановите страховочную копию вручную."
                        )
                    )
                    Plugin.notify_event("gamesync_restore_failed", {"game": game_name, "error": error})
                    return {
                        "success": False,
                        "error": error,
                        "mismatched": mismatched[:20],
                        "rolled_back": rollback_ok,
                        "safety_backup": safety_remote,
                        "safety_local": safety_local,
                    }
                try:
                    await asyncio.to_thread(quarantine_prune)
                except Exception as prune_error:
                    logger.warning(f"Quarantine prune failed: {prune_error}")
                quarantine_path = result.get("quarantine_path") or ""
                logger.info(
                    f"Restore {game_name}: {result.get('files', 0)} files, "
                    f"{result.get('bytes', 0)} bytes, quarantined {quarantined}, "
                    f"skipped {len(result.get('skipped') or [])}"
                )

                try:
                    Plugin.notify_event(
                        "gamesync_restore_done",
                        {
                            "game": game_name,
                            "success": True,
                            "files": int(result["files"]),
                            "quarantined": quarantined,
                        },
                    )
                except Exception as emit_error:
                    logger.warning(f"Failed to emit restore-done event: {emit_error}")

                message = f"Восстановлено файлов: {result['files']}"
                if verified:
                    message += f", проверено: {verified}"
                if quarantined:
                    message += f", перемещено в резерв: {quarantined}"
                if removed:
                    message += f", удалено лишних: {removed}"
                return {
                    "success": True,
                    "message": message,
                    "files": result["files"],
                    "bytes": result["bytes"],
                    "removed": removed,
                    "quarantined": quarantined,
                    "verified": verified,
                    "quarantine_path": quarantine_path,
                    "skipped": result["skipped"],
                    "safety_backup": safety_remote,
                    "safety_local": safety_local,
                }
            finally:
                shutil.rmtree(workdir, ignore_errors=True)
                if safety_temp_path:
                    try:
                        os.remove(safety_temp_path)
                    except OSError:
                        pass
        except Exception as e:
            logger.error(f"Error restoring backup: {e}")
            Plugin.notify_event("gamesync_restore_failed", {"game": game_name or "игра", "error": str(e)})
            return {"success": False, "error": str(e)}
        finally:
            Plugin._active_restores.discard(game_name or "")

    @decky_params
    async def delete_backup(self, game_name: str = None, backup_id: str = None, *args, **kwargs) -> Dict[str, Any]:
        """Удалить выбранную версию бэкапа из облака и истории."""
        try:
            if not game_name:
                return {"success": False, "error": "Не указан game_name"}

            def _delete_fail(message: str) -> Dict[str, Any]:
                Plugin.notify_event(
                    "gamesync_backup_delete_failed",
                    {"game": game_name or "игра", "error": message},
                )
                return {"success": False, "error": message}

            from backup_index import get_entry, remove_entry
            from config_manager import load_storage_config

            entry = get_entry(game_name, backup_id)
            if not entry or not entry.get("remote"):
                return _delete_fail("Бэкап не найден")

            provider, error = _build_provider(load_storage_config())
            if error or provider is None:
                return _delete_fail(error or "Хранилище не настроено")

            deleted = await asyncio.to_thread(provider.delete_file, entry["remote"])
            if not deleted:
                return _delete_fail("Не удалось удалить файл из облака")

            remove_entry(game_name, entry.get("id"))
            try:
                Plugin.notify_event("gamesync_backup_deleted", {"game": game_name})
            except Exception as emit_error:
                logger.warning(f"Failed to emit backup-deleted event: {emit_error}")
            logger.info(f"Deleted backup {entry.get('id')} for {game_name}")
            return {"success": True, "message": "Версия удалена из облака"}
        except Exception as e:
            logger.error(f"Error deleting backup: {e}")
            Plugin.notify_event(
                "gamesync_backup_delete_failed",
                {"game": game_name or "игра", "error": str(e)},
            )
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
                backup_groups = list_all_backups() or {}
            except Exception as e:
                logger.warning(f"Failed to load backup index for stats: {e}")
                backup_groups = {}

            from stats import build_stats
            stats = build_stats(backup_groups, synced_games)
            return {"success": True, "stats": stats}

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

