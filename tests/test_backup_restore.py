"""Тесты бэкапа, индекса и безопасного восстановления.

Запуск (из корня репозитория):

    python -m unittest discover -s tests -v
"""

import io
import shutil
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

import backup_index  # noqa: E402
import config_manager  # noqa: E402
import restore_engine  # noqa: E402
import sync_engine  # noqa: E402


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

        result = restore_engine.restore_archive(archive, manifest)
        self.assertEqual(result["files"], 2)
        self.assertEqual((self.game_dir / "slot1.sav").read_bytes(), b"SAVE-1")
        self.assertEqual((self.game_dir / "nested" / "slot2.sav").read_bytes(), b"SAVE-2")

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

        result = restore_engine.restore_archive(str(archive), self._manifest(self.dest))
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

        result = restore_engine.restore_archive(str(archive), self._manifest(self.dest))
        self.assertEqual(result["files"], 0)
        self.assertFalse((self.dest / "link").exists())

    def test_unknown_root_is_skipped(self):
        archive = self.root / "other.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            data = b"x"
            info = tarfile.TarInfo("Other/file.txt")
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))

        result = restore_engine.restore_archive(str(archive), self._manifest(self.dest))
        self.assertEqual(result["files"], 0)
        self.assertFalse((self.dest / "file.txt").exists())


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


if __name__ == "__main__":
    unittest.main(verbosity=2)
