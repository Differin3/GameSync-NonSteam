import psutil
import logging
import asyncio
import os
import time
from typing import Dict, List, Optional, Set
from pathlib import Path

logger = logging.getLogger(__name__)

# Процессы PortProton
# Важно: обычные Steam-игры тоже запускаются через Proton/Wine, поэтому
# недостаточно искать «proton»/«wine» — иначе плагин ловит Witcher 3 и
# другие Steam-игры. Считаем процесс PortProton только если в имени,
# командной строке или рабочем каталоге есть путь PortProton.
PORTPROTON_MARKER = "portproton"


def is_portproton_process(name: str, cmdline: List[str], cwd: Optional[str] = None) -> bool:
    """Относится ли процесс именно к PortProton (а не к Proton из Steam)."""
    name_l = (name or "").strip().lower()
    if name_l.startswith("gamesync"):
        # Заголовок процесса Decky: «GameSync PortProton ...» — это не игра.
        return False
    path_text = " ".join([*(cmdline or []), cwd or ""]).lower()
    if name_l in {"portproton", "portproton.exe", "portproton.bin"}:
        return True
    return PORTPROTON_MARKER in path_text

# Служебные префиксы, для которых не имеет смысла искать игру
IGNORED_PREFIXES = {"DEFAULT"}


def find_portproton_processes() -> List[Dict[str, any]]:
    """Поиск запущенных процессов PortProton"""
    processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cwd']):
        try:
            proc_info = proc.info
            if proc_info.get('pid') == os.getpid():
                # Decky выставляет заголовок процесса «GameSync PortProton ...»,
                # он содержит PortProton и иначе попадал бы в выдачу.
                continue
            name = proc_info.get('name', '')
            cmdline_list = proc_info.get('cmdline') or []
            cwd = proc_info.get('cwd')

            if is_portproton_process(name, cmdline_list, cwd):
                processes.append({
                    "pid": proc_info['pid'],
                    "name": name,
                    "cmdline": cmdline_list,
                    "cwd": cwd
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
    cmdline = process.get('cmdline') or []
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


def has_running_game(processes: Optional[List[Dict]] = None) -> bool:
    """Запущена ли именно игра, а не только GUI/лаунчер PortProton.

    Процессы wine/proton есть и у открытого интерфейса PortProton, поэтому
    дополнительно проверяем, что у процесса есть игровой exe/префикс.
    """
    procs = processes if processes is not None else find_portproton_processes()
    if not procs:
        return False
    if collect_running_games(procs):
        return True
    return any(find_game_hint_from_process(process) for process in procs)


def collect_running_games(processes: List[Dict]) -> Dict[str, Set[int]]:
    """Сгруппировать процессы по игре: имя префикса -> набор PID.

    У одной игры может быть несколько Wine-процессов, поэтому синхронизация
    должна срабатывать только когда завершился последний из них.
    """
    running: Dict[str, Set[int]] = {}
    for process in processes or []:
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
    def __init__(self, sync_callback, start_callback=None):
        self.sync_callback = sync_callback
        self.start_callback = start_callback
        self.running_games: Dict[str, Set[int]] = {}
        self.started_at: Dict[str, float] = {}
        self.running = False

    async def start_monitoring(self):
        """Запуск мониторинга процессов"""
        self.running = True
        logger.info("Started game process monitoring")

        while self.running:
            try:
                await self._poll_once()
                await asyncio.sleep(2)  # Проверяем каждые 2 секунды
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)

    async def _poll_once(self) -> None:
        """Один опрос процессов: старт-колбэк для новых игр, sync для завершённых."""
        current = collect_running_games(find_portproton_processes())

        # Запоминаем момент запуска: по нему видно, какие файлы игра
        # реально писала во время сессии.
        for key in current:
            if key not in self.running_games:
                self.started_at[key] = time.time()
                # Подтягиваем облачные сейвы, пока Proton ещё
                # запускает игру (лучшее, что доступно без хука
                # непосредственно перед запуском).
                if self.start_callback:
                    try:
                        asyncio.create_task(self.start_callback(key, self.started_at.get(key)))
                    except Exception as e:
                        logger.error(f"Start callback failed for {key}: {e}")

        for game_name in finished_games(self.running_games, current):
            logger.info(f"Game process ended: {game_name}")
            started_at = self.started_at.pop(game_name, None)
            try:
                await self.sync_callback(game_name, [], started_at)
            except Exception as e:
                logger.error(f"Auto-sync callback failed for {game_name}: {e}")

        self.running_games = current

    def stop_monitoring(self):
        """Остановка мониторинга"""
        self.running = False
        self.running_games = {}
        logger.info("Stopped game process monitoring")
