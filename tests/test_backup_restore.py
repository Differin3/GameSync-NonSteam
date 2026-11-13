"""Тесты бэкапа, индекса, безопасного восстановления и автосинхронизации.

Запуск (из корня репозитория):

    python -m unittest discover -s tests -v
"""

import io
import shutil
import sys
import tarfile
import tempfile
import types
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

import backup_index  # noqa: E402
import config_manager  # noqa: E402
import restore_engine  # noqa: E402
import sync_engine  # noqa: E402

# psutil нужен auto_sync только во время работы; для тестов модуль не нужен.
if "psutil" not in sys.modules:
    try:
        import psutil  # noqa: F401
    except ImportError:
        _fake = types.ModuleType("psutil")
        _fake.NoSuchProcess = type("NoSuchProcess", (Exception,), {})
        _fake.AccessDenied = type("AccessDenied", (Exception,), {})
        _fake.process_iter = lambda attrs=None: []
        sys.modules["psutil"] = _fake

import auto_sync  # noqa: E402


class SyncEngineTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self._old_config = config_manager.CONFIG_DIR
        config_manager.CONFIG_DIR = self.root / "config"

        self.game_dir = (
            self.root / "prefixes" / "Demo" / "drive_c" / "users" / "deck"
            / "Saved Games" / "Demo Game"
        )
        (self.game_dir / "nested").mkdir(parents=True)
        (self.game_dir / "slot1.sav").write_bytes(b"SAVE-1")
        (self.game_dir / "nested" / "slot2.sav").write_bytes(b"SAVE-2")

    def tearDown(self):
        config_manager.CONFIG_DIR = self._old_config
        self._tmp.cleanup()

    def test_manifest_and_restore_roundtrip(self):
        archive = sync_engine.create_backup("Demo Game", [str(self.game_dir)])
        self.assertIsNotNone(archive)

        manifest = restore_engine.read_manifest(archive)
        self.assertIsNotNone(manifest)
        self.assertEqual(manifest["version"], sync_engine.MANIFEST_VERSION)
        self.assertEqual(manifest["game"], "Demo Game")
        self.assertEqual(manifest["paths"][0]["root"], "Demo Game")
        self.assertEqual(manifest["paths"][0]["path"], str(self.game_dir))

        shutil.rmtree(self.game_dir)
        self.assertFalse(self.game_dir.exists())

        result = restore_engine.restore_archive(archive, manifest, allowed_root=self.root)
        self.assertEqual(result["files"], 2)
        self.assertEqual((self.game_dir / "slot1.sav").read_bytes(), b"SAVE-1")
        self.assertEqual((self.game_dir / "nested" / "slot2.sav").read_bytes(), b"SAVE-2")

    def test_single_file_roundtrip(self):
        save_file = self.root / "configs" / "settings.sav"
        save_file.parent.mkdir(parents=True)
        save_file.write_bytes(b"CONFIG")

        archive = sync_engine.create_backup("Demo", [str(save_file)])
        manifest = restore_engine.read_manifest(archive)
        self.assertEqual(manifest["paths"][0]["is_dir"], False)

        save_file.unlink()
        result = restore_engine.restore_archive(archive, manifest, allowed_root=self.root)
        self.assertEqual(result["files"], 1)
        self.assertEqual(save_file.read_bytes(), b"CONFIG")

    def test_old_archive_without_manifest(self):
        archive = self.root / "old.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            data = b"old"
            info = tarfile.TarInfo("Demo Game/slot1.sav")
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
        self.assertIsNone(restore_engine.read_manifest(str(archive)))

    def test_duplicate_roots_get_unique_names(self):
        second = self.root / "other" / "Demo Game"
        second.mkdir(parents=True)
        (second / "slot3.sav").write_bytes(b"SAVE-3")

        archive = sync_engine.create_backup("Demo", [str(self.game_dir), str(second)])
        manifest = restore_engine.read_manifest(archive)
        roots = [item["root"] for item in manifest["paths"]]
        self.assertEqual(len(roots), len(set(roots)))
        self.assertEqual(len(roots), 2)

    def test_incremental_skips_unchanged(self):
        archive = sync_engine.create_backup("Demo Game", [str(self.game_dir)])
        self.assertIsNotNone(archive)
        result = sync_engine.create_backup(
            "Demo Game", [str(self.game_dir)], incremental=True, last_backup_time=2**31
        )
        self.assertIsNone(result)


class RestoreSafetyTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.dest = self.root / "dest"
        self.dest.mkdir()

    def tearDown(self):
        self._tmp.cleanup()

    def _manifest(self, path: Path) -> dict:
        return {
            "version": sync_engine.MANIFEST_VERSION,
            "game": "X",
            "created": "2026-01-01T00:00:00",
            "paths": [{"path": str(path), "root": "Game", "is_dir": True}],
        }

    def test_traversal_member_is_skipped(self):
        archive = self.root / "evil.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            data = b"pwned"
            info = tarfile.TarInfo("Game/../../evil.txt")
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))

        result = restore_engine.restore_archive(
            str(archive), self._manifest(self.dest), allowed_root=self.root
        )
        self.assertEqual(result["files"], 0)
        self.assertFalse((self.root / "evil.txt").exists())
        self.assertFalse((self.root.parent / "evil.txt").exists())

    def test_symlink_member_is_skipped(self):
        archive = self.root / "link.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            info = tarfile.TarInfo("Game/link")
            info.type = tarfile.SYMTYPE
            info.linkname = "/etc/passwd"
            tar.addfile(info)

        result = restore_engine.restore_archive(
            str(archive), self._manifest(self.dest), allowed_root=self.root
        )
        self.assertEqual(result["files"], 0)
        self.assertFalse((self.dest / "link").exists())

    def test_unknown_root_is_skipped(self):
        archive = self.root / "other.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            data = b"x"
            info = tarfile.TarInfo("Other/file.txt")
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))

        result = restore_engine.restore_archive(
            str(archive), self._manifest(self.dest), allowed_root=self.root
        )
        self.assertEqual(result["files"], 0)
        self.assertFalse((self.dest / "file.txt").exists())

    def test_target_outside_allowed_root_is_rejected(self):
        manifest = {
            "version": sync_engine.MANIFEST_VERSION,
            "paths": [{"path": str(self.root / "outside" / "saves"), "root": "Game", "is_dir": True}],
        }
        targets = restore_engine.plan_targets(manifest, allowed_root=self.dest)
        self.assertEqual(targets, {})

    def test_target_with_dotdot_is_rejected(self):
        manifest = {
            "version": sync_engine.MANIFEST_VERSION,
            "paths": [{"path": str(self.root / ".." / "escape"), "root": "Game", "is_dir": True}],
        }
        targets = restore_engine.plan_targets(manifest, allowed_root=self.root)
        self.assertEqual(targets, {})


class BackupIndexTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self._old_config = config_manager.CONFIG_DIR
        config_manager.CONFIG_DIR = self.root / "config"
        backup_index.clear()

    def tearDown(self):
        config_manager.CONFIG_DIR = self._old_config
        self._tmp.cleanup()

    def test_add_and_get(self):
        entry = backup_index.add_entry("Game", "GameSync/Game/backup-1.tar.gz", size=1024, paths=["/a"])
        self.assertIsNotNone(entry)
        self.assertEqual(backup_index.count(), 1)

        stored = backup_index.get_entry("Game", entry["id"])
        self.assertIsNotNone(stored)
        self.assertEqual(stored["remote"], "GameSync/Game/backup-1.tar.gz")
        self.assertEqual(stored["size"], 1024)

        self.assertIsNone(backup_index.get_entry("Game", "missing"))

    def test_latest_entry_when_id_omitted(self):
        backup_index.add_entry("Game", "old")
        backup_index.add_entry("Game", "new")
        latest = backup_index.get_entry("Game")
        self.assertIsNotNone(latest)
        self.assertEqual(latest["remote"], "new")

    def test_prunes_to_limit(self):
        for index in range(backup_index.MAX_PER_GAME + 5):
            backup_index.add_entry("Game", f"remote-{index}", size=index)

        entries = backup_index.list_for("Game")
        self.assertEqual(len(entries), backup_index.MAX_PER_GAME)
        self.assertEqual(entries[0]["remote"], f"remote-{backup_index.MAX_PER_GAME + 4}")

    def test_clear(self):
        backup_index.add_entry("Game", "remote")
        backup_index.clear()
        self.assertEqual(backup_index.list_for("Game"), [])

    def test_empty_remote_is_ignored(self):
        self.assertIsNone(backup_index.add_entry("Game", ""))
        self.assertEqual(backup_index.count(), 0)


class AppSettingsTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self._old_config = config_manager.CONFIG_DIR
        config_manager.CONFIG_DIR = self.root / "config"

    def tearDown(self):
        config_manager.CONFIG_DIR = self._old_config
        self._tmp.cleanup()

    def test_defaults(self):
        settings = config_manager.load_app_settings()
        self.assertFalse(settings["auto_sync"])
        self.assertEqual(settings["default_save_paths"], [])

    def test_roundtrip_filters_invalid_paths(self):
        config_manager.save_app_settings(auto_sync=True, default_save_paths=["/a", " ", 5])
        settings = config_manager.load_app_settings()
        self.assertTrue(settings["auto_sync"])
        self.assertEqual(settings["default_save_paths"], ["/a"])

    def test_partial_update_keeps_other_fields(self):
        config_manager.save_app_settings(auto_sync=True)
        config_manager.save_app_settings(default_save_paths=["/b"])
        settings = config_manager.load_app_settings()
        self.assertTrue(settings["auto_sync"])
        self.assertEqual(settings["default_save_paths"], ["/b"])


class AutoSyncTest(unittest.TestCase):
    def test_collect_groups_processes_by_game(self):
        processes = [
            {"pid": 10, "cwd": "/home/deck/PortProton/prefixes/GameA/drive_c"},
            {"pid": 11, "cmdline": ["wine", "/home/deck/PortProton/prefixes/GameA/drive_c/game.exe"]},
            {"pid": 12, "cwd": "/home/deck/PortProton/prefixes/DEFAULT/drive_c"},
            {"pid": 13, "cwd": "/tmp"},
        ]
        running = auto_sync.collect_running_games(processes)
        self.assertEqual(set(running), {"GameA"})
        self.assertEqual(running["GameA"], {10, 11})

    def test_finished_only_when_last_process_is_gone(self):
        previous = {"GameA": {10, 11}, "GameB": {20}}
        still_running = {"GameA": {11}, "GameB": {20}}
        self.assertEqual(auto_sync.finished_games(previous, still_running), [])

        finished = auto_sync.finished_games(previous, {"GameA": {11}})
        self.assertEqual(finished, ["GameB"])

        finished_all = auto_sync.finished_games(previous, {})
        self.assertCountEqual(finished_all, ["GameA", "GameB"])


import game_status  # noqa: E402


class GameStatusTest(unittest.TestCase):
    GAMES = [
        {"name": "Cyberpunk 2077", "steamAppId": 1234567890, "savePaths": ["/a", "/b"]},
        {"name": "Baldur's Gate 3", "steamAppId": 987654321, "savePaths": ["/c"]},
        {"name": "Demo_Game", "steamAppId": None, "prefixPath": "/prefixes/Demo Game", "savePaths": []},
    ]

    def test_match_by_appid(self):
        game = game_status.find_game_for_app(self.GAMES, appid=1234567890)
        self.assertIsNotNone(game)
        self.assertEqual(game["name"], "Cyberpunk 2077")

    def test_match_by_appid_as_string(self):
        game = game_status.find_game_for_app(self.GAMES, appid="987654321")
        self.assertIsNotNone(game)
        self.assertEqual(game["name"], "Baldur's Gate 3")

    def test_match_by_name_ignores_punctuation(self):
        game = game_status.find_game_for_app(self.GAMES, game_name="Baldurs Gate 3")
        self.assertIsNotNone(game)
        self.assertEqual(game["name"], "Baldur's Gate 3")

    def test_match_by_prefix_name(self):
        game = game_status.find_game_for_app(self.GAMES, game_name="Demo Game")
        self.assertIsNotNone(game)
        self.assertEqual(game["name"], "Demo_Game")

    def test_unknown_game_returns_none(self):
        self.assertIsNone(game_status.find_game_for_app(self.GAMES, appid=1, game_name="Unknown"))

    def test_status_prefers_backup_history(self):
        game = self.GAMES[0]
        synced = {"lastSync": "2026-11-01T10:00:00", "fileSize": 100}
        entries = [{"created": "2026-11-14T00:10:00", "size": 5000}]
        status = game_status.build_game_status(game, synced, entries, "webdav")
        self.assertEqual(status["game"], "Cyberpunk 2077")
        self.assertEqual(status["last_sync"], "2026-11-14T00:10:00")
        self.assertEqual(status["size"], 5000)
        self.assertEqual(status["versions"], 1)
        self.assertEqual(status["save_paths"], 2)
        self.assertEqual(status["provider"], "webdav")

    def test_status_falls_back_to_synced_games(self):
        game = self.GAMES[1]
        synced = {"lastSync": "2026-11-01T10:00:00", "fileSize": 100}
        status = game_status.build_game_status(game, synced, [], "s3")
        self.assertEqual(status["last_sync"], "2026-11-01T10:00:00")
        self.assertEqual(status["size"], 100)
        self.assertEqual(status["versions"], 0)
        self.assertEqual(status["provider"], "s3")
import game_definitions  # noqa: E402
import ludusavi  # noqa: E402


class SteamMatchingTest(unittest.TestCase):
    def test_ludusavi_index_maps_steam_id(self):
        index = ludusavi._build_index({
            "Game A": {
                "files": {"<winAppData>/A/save.dat": {"tags": ["save"]}},
                "steam": {"id": 123},
            },
            "Game B": {
                "files": {"<winDocuments>/B": {"tags": ["save"]}},
            },
        })
        self.assertEqual(index["steam"].get("123"), 0)
        self.assertIn("users/deck/AppData/Roaming/A", index["entries"][0]["paths"][0])
        self.assertEqual(len(index["entries"]), 2)

    def test_ludusavi_steam_id_of(self):
        self.assertEqual(ludusavi._steam_id_of({"steam": {"id": 42}}), "42")
        self.assertIsNone(ludusavi._steam_id_of({"steam": {"id": None}}))
        self.assertIsNone(ludusavi._steam_id_of({}))

    def test_openclouds_matches_steam_id_before_name(self):
        original = game_definitions.load_raw_gamedef_map
        game_definitions.load_raw_gamedef_map = lambda: {
            "Unknown Localized Title": {
                "display_name": "Unknown Localized Title",
                "steam_id": "999",
                "win_path": [{"path": "%APPDATA%\\SomeGame\\saves"}],
            },
            "Other": {
                "display_name": "Other",
                "steam_id": "111",
                "win_path": [{"path": "%APPDATA%\\Other\\saves"}],
            },
        }
        try:
            paths = game_definitions._find_in_openclouds("Совсем другое имя", 999)
        finally:
            game_definitions.load_raw_gamedef_map = original

        self.assertEqual(len(paths), 1)
        self.assertIn("AppData/Roaming/SomeGame/saves", paths[0])

    def test_openclouds_without_steam_id_uses_name(self):
        original = game_definitions.load_raw_gamedef_map
        game_definitions.load_raw_gamedef_map = lambda: {
            "Factorio": {
                "display_name": "Factorio",
                "steam_id": "427520",
                "win_path": [{"path": "%APPDATA%\\Factorio\\saves"}],
            },
        }
        try:
            paths = game_definitions._find_in_openclouds("Factorio", None)
        finally:
            game_definitions.load_raw_gamedef_map = original

        self.assertEqual(len(paths), 1)
        self.assertIn("Factorio", paths[0])
import portproton_scanner  # noqa: E402


class SteamAppIdDetectionTest(unittest.TestCase):
    def test_extract_exe_path_quoted(self):
        cmd = 'env "/home/deck/PortProton/data/scripts/start.sh" "/home/deck/GAEM/Tomb Raider - Underworld/tru.exe"'
        self.assertEqual(
            portproton_scanner._extract_exe_path(cmd),
            "/home/deck/GAEM/Tomb Raider - Underworld/tru.exe",
        )

    def test_extract_exe_path_unquoted(self):
        self.assertEqual(
            portproton_scanner._extract_exe_path("start.sh /games/foo/bar.exe --args"),
            "/games/foo/bar.exe",
        )

    def test_detect_real_appid_from_game_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            game_dir = Path(tmp) / "TheLongDark"
            game_dir.mkdir()
            (game_dir / "steam_appid.txt").write_text("305620\n", encoding="utf-8")
            exe = game_dir / "tld.exe"
            exe.write_text("", encoding="utf-8")
            self.assertEqual(
                portproton_scanner.detect_real_steam_appid(f'start.sh "{exe}"'),
                305620,
            )

    def test_detect_real_appid_from_steam_settings(self):
        with tempfile.TemporaryDirectory() as tmp:
            game_dir = Path(tmp) / "CoD"
            (game_dir / "steam_settings").mkdir(parents=True)
            (game_dir / "steam_settings" / "steam_appid.txt").write_text("7940", encoding="utf-8")
            exe = game_dir / "sp26.exe"
            exe.write_text("", encoding="utf-8")
            self.assertEqual(
                portproton_scanner.detect_real_steam_appid(f'"{exe}"'),
                7940,
            )

    def test_shortcut_appid_is_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            game_dir = Path(tmp) / "Darksiders2"
            game_dir.mkdir()
            (game_dir / "steam_appid.txt").write_text("3291164299", encoding="utf-8")
            exe = game_dir / "game.exe"
            exe.write_text("", encoding="utf-8")
            self.assertIsNone(portproton_scanner.detect_real_steam_appid(f'"{exe}"'))

    def test_no_appid_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            exe = Path(tmp) / "game.exe"
            exe.write_text("", encoding="utf-8")
            self.assertIsNone(portproton_scanner.detect_real_steam_appid(f'"{exe}"'))
class NormalizationTest(unittest.TestCase):
    def test_edition_and_year_are_stripped(self):
        self.assertEqual(ludusavi._normalize("The Long Dark: GOTY Edition (2020)"), "the long dark")
        self.assertEqual(game_definitions._normalize_name("Hades - Ultimate Edition 2020"), "hades")

    def test_base_names_still_normalized(self):
        self.assertEqual(ludusavi._normalize("Factorio"), "factorio")
class WebDAVAuthPriorityTest(unittest.TestCase):
    def _provider(self, *args, **kwargs):
        try:
            import requests  # noqa: F401
        except ImportError:
            self.skipTest("requests не установлен")
        from webdav_provider import WebDAVProvider
        return WebDAVProvider(*args, **kwargs)

    def test_basic_wins_over_leftover_oauth(self):
        provider = self._provider(
            "https://webdav.cloud.mail.ru",
            username="user@mail.ru",
            password="app-password",
            oauth_token="stale-yandex-token",
        )
        self.assertEqual(provider.auth, ("user@mail.ru", "app-password"))
        self.assertIsNone(provider.auth_header)

    def test_oauth_used_when_no_password(self):
        provider = self._provider("https://webdav.yandex.ru", oauth_token="token")
        self.assertIsNone(provider.auth)
        self.assertEqual(provider.auth_header, "OAuth token")
class WebDAVErrorTest(unittest.TestCase):
    def _explain(self, code):
        try:
            import requests  # noqa: F401
        except ImportError:
            self.skipTest("requests не установлен")
        from webdav_provider import explain_http_error
        return explain_http_error(code)

    def test_free_tariff_hint(self):
        self.assertIn("360", self._explain(402))

    def test_auth_hint(self):
        self.assertIn("пароль", self._explain(401).lower())
class BackupPruneTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self._old_config = config_manager.CONFIG_DIR
        config_manager.CONFIG_DIR = self.root / "config"
        backup_index.clear()

    def tearDown(self):
        config_manager.CONFIG_DIR = self._old_config
        shutil.rmtree(self.root, ignore_errors=True)

    def test_prepare_trim_returns_doomed_entry(self):
        for index in range(backup_index.MAX_PER_GAME):
            backup_index.add_entry("Game", f"GameSync/Game/backup-{index}.tar.gz", size=1)
        doomed = backup_index.prepare_trim("Game")
        self.assertEqual(len(doomed), 1)
        self.assertIn("backup-0", doomed[0]["remote"])

        backup_index.add_entry("Game", "GameSync/Game/backup-new.tar.gz", size=1)
        self.assertEqual(len(backup_index.list_for("Game")), backup_index.MAX_PER_GAME)

    def test_prepare_trim_empty_for_unknown_game(self):
        self.assertEqual(backup_index.prepare_trim("Unknown"), [])
class BackupKeepSettingTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self._old_config = config_manager.CONFIG_DIR
        config_manager.CONFIG_DIR = self.root / "config"
        backup_index.clear()

    def tearDown(self):
        config_manager.CONFIG_DIR = self._old_config
        shutil.rmtree(self.root, ignore_errors=True)

    def test_custom_keep_trims_to_setting(self):
        for index in range(4):
            backup_index.add_entry("Game", f"GameSync/Game/v{index}.tar.gz", size=1, keep=3)
        self.assertEqual(len(backup_index.list_for("Game")), 3)
        doomed = backup_index.prepare_trim("Game", 3)
        self.assertEqual(len(doomed), 1)
class AppSettingsPersistenceTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self._old_config = config_manager.CONFIG_DIR
        config_manager.CONFIG_DIR = self.root / "config"

    def tearDown(self):
        config_manager.CONFIG_DIR = self._old_config
        shutil.rmtree(self.root, ignore_errors=True)

    def test_max_backup_versions_roundtrip(self):
        config_manager.save_app_settings(max_backup_versions=20)
        self.assertEqual(config_manager.load_app_settings()["max_backup_versions"], 20)

    def test_max_backup_versions_is_clamped(self):
        config_manager.save_app_settings(max_backup_versions=0)
        self.assertEqual(config_manager.load_app_settings()["max_backup_versions"], 1)
        config_manager.save_app_settings(max_backup_versions=1000)
        self.assertEqual(config_manager.load_app_settings()["max_backup_versions"], 100)
import auto_sync  # noqa: E402


class AutoSyncDetectionTest(unittest.TestCase):
    def test_exe_hint_linux_path(self):
        hint = auto_sync.find_game_hint_from_process(
            {"cmdline": ["bash", "start.sh", "/home/deck/GAEM/Tomb Raider - Underworld/tru.exe"]}
        )
        self.assertEqual(hint, "/home/deck/gaem/tomb raider - underworld")

    def test_exe_hint_windows_path(self):
        hint = auto_sync.find_game_hint_from_process(
            {"cmdline": ["wine", "Z:\\home\\deck\\GAEM\\SomeGame\\game.exe"]}
        )
        self.assertEqual(hint, "/home/deck/gaem/somegame")

    def test_system_exe_ignored(self):
        hint = auto_sync.find_game_hint_from_process(
            {"cmdline": ["wine", "C:\\windows\\system32\\wineboot.exe"]}
        )
        self.assertIsNone(hint)

    def test_default_prefix_grouped_by_game_dir(self):
        processes = [
            {
                "pid": 1,
                "cmdline": ["bash", "start.sh", "/home/deck/GAEM/Tomb Raider - Underworld/tru.exe"],
                "cwd": "/home/deck/PortProton/prefixes/DEFAULT/drive_c",
            },
            {
                "pid": 2,
                "cmdline": ["wine", "/home/deck/GAEM/Tomb Raider - Underworld/tru.exe"],
                "cwd": "/home/deck/PortProton/prefixes/DEFAULT/drive_c",
            },
        ]
        running = auto_sync.collect_running_games(processes)
        self.assertEqual(list(running.keys()), ["exe:/home/deck/gaem/tomb raider - underworld"])
        self.assertEqual(running["exe:/home/deck/gaem/tomb raider - underworld"], {1, 2})

    def test_named_prefix_uses_prefix_name(self):
        processes = [
            {
                "pid": 3,
                "cmdline": ["wine", "/home/deck/GAEM/Other/game.exe"],
                "cwd": "/home/deck/PortProton/prefixes/Hades/drive_c",
            }
        ]
        running = auto_sync.collect_running_games(processes)
        self.assertEqual(list(running.keys()), ["Hades"])

    def test_finished_games(self):
        previous = {"exe:/home/deck/gaem/game": {1, 2}}
        current = {}
        self.assertEqual(auto_sync.finished_games(previous, current), ["exe:/home/deck/gaem/game"])
if __name__ == "__main__":
    unittest.main(verbosity=2)
