import psutil
import logging
import asyncio
import time
from typing import Dict, List, Optional, Set
from pathlib import Path

logger = logging.getLogger(__name__)

# Процессы PortProton
PORTPROTON_PROCESSES = ["portproton", "wine", "proton"]

# Служебные префиксы, для которых не имеет смысла искать игру
IGNORED_PREFIXES = {"DEFAULT"}


def find_portproton_processes() -> List[Dict[str, any]]:
    """Поиск запущенных процессов PortProton"""
    processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cwd']):
        try:
            proc_info = proc.info
            name = proc_info.get('name', '').lower()
            cmdline = ' '.join(proc_info.get('cmdline') or []).lower()

            # Проверяем, является ли процесс связанным с PortProton
            if any(pp_proc in name or pp_proc in cmdline for pp_proc in PORTPROTON_PROCESSES):
                processes.append({
                    "pid": proc_info['pid'],
                    "name": proc_info['name'],
                    "cmdline": proc_info.get('cmdline', []),
                    "cwd": proc_info.get('cwd')
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return processes


def get_game_name_from_process(process: Dict) -> Optional[str]:
    """Определение имени игры из процесса"""
    # Пытаемся определить игру по рабочей директории процесса
    cwd = process.get('cwd')
    if cwd:
        cwd_path = Path(cwd)
        # Ищем путь к префиксу PortProton
        parts = cwd_path.parts
        if 'prefixes' in parts:
            idx = parts.index('prefixes')
            if idx + 1 < len(parts):
                return parts[idx + 1]

    # Альтернативно, пытаемся определить по cmdline
    cmdline = process.get('cmdline', [])
    for arg in cmdline:
        if 'prefixes' in arg:
            parts = Path(arg).parts
            if 'prefixes' in parts:
                idx = parts.index('prefixes')
                if idx + 1 < len(parts):
                    return parts[idx + 1]

    return None


def _normalize_path(value: str) -> str:
    """Привести путь из cmdline Wine к linux-виду в нижнем регистре."""
    text = (value or "").replace("\\", "/").lower()
    if len(text) > 2 and text[1] == ":":
        text = text[2:]
    return text


def _game_dir_from_exe(path: str) -> str:
    """Каталог игры по пути exe (для общего префикса DEFAULT)."""
    text = _normalize_path(path)
    marker = "/gaem/"
    if marker in text:
        tail = text.split(marker, 1)[1]
        first = tail.split("/", 1)[0]
        return text.split(marker, 1)[0] + marker + first
    return text.rsplit("/", 1)[0] if "/" in text else ""


def find_game_hint_from_process(process: Dict) -> Optional[str]:
    """Путь к каталогу игры из cmdline процесса (префикс DEFAULT общий).

    PortProton запускает игру с путём к exe в аргументах; wine-процессы
    тоже содержат этот путь. Системные exe (windows/system32) игнорируем.
    """
    hints: List[str] = []
    for arg in process.get("cmdline") or []:
        low = _normalize_path(arg)
        if not low.endswith(".exe"):
            continue
        if "/windows/" in low or "/drive_c/" in low:
            continue
        hints.append(arg)

    if not hints:
        return None
    # Предпочитаем путь вне префикса — это каталог самой игры
    for hint in hints:
        directory = _game_dir_from_exe(hint)
        if directory and "/portproton/prefixes/" not in directory:
            return directory
    return _game_dir_from_exe(hints[-1]) or None


def collect_running_games(processes: List[Dict]) -> Dict[str, Set[int]]:
    """Сгруппировать процессы по игре: имя префикса -> набор PID.

    У одной игры может быть несколько Wine-процессов, поэтому синхронизация
    должна срабатывать только когда завершился последний из них.
    """
    running: Dict[str, Set[int]] = {}
    for process in processes:
        game_name = get_game_name_from_process(process)
        if game_name and game_name.upper() not in IGNORED_PREFIXES:
            key = game_name
        else:
            # Общий префикс DEFAULT: игру определяем по каталогу exe.
            hint = find_game_hint_from_process(process)
            if not hint:
                continue
            key = "exe:" + hint
        running.setdefault(key, set()).add(process.get("pid"))
    return running


def finished_games(previous: Dict[str, Set[int]], current: Dict[str, Set[int]]) -> List[str]:
    """Игры, которые работали в прошлом опросе и больше не запущены."""
    finished: List[str] = []
    for game_name, pids in previous.items():
        current_pids = current.get(game_name) or set()
        if not (pids & current_pids):
            finished.append(game_name)
    return finished


class GameMonitor:
    def __init__(self, sync_callback):
        self.sync_callback = sync_callback
        self.running_games: Dict[str, Set[int]] = {}
        self.started_at: Dict[str, float] = {}
        self.running = False

    async def start_monitoring(self):
        """Запуск мониторинга процессов"""
        self.running = True
        logger.info("Started game process monitoring")

        while self.running:
            try:
                current = collect_running_games(find_portproton_processes())

                # Запоминаем момент запуска: по нему видно, какие файлы игра
                # реально писала во время сессии.
                for key in current:
                    if key not in self.running_games:
                        self.started_at[key] = time.time()

                for game_name in finished_games(self.running_games, current):
                    logger.info(f"Game process ended: {game_name}")
                    started_at = self.started_at.pop(game_name, None)
                    try:
                        await self.sync_callback(game_name, [], started_at)
                    except Exception as e:
                        logger.error(f"Auto-sync callback failed for {game_name}: {e}")

                self.running_games = current
                await asyncio.sleep(5)  # Проверяем каждые 5 секунд
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)

    def stop_monitoring(self):
        """Остановка мониторинга"""
        self.running = False
        self.running_games = {}
        logger.info("Stopped game process monitoring")
