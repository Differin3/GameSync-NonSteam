# Архитектура GameSync NonSteam

Документ описывает, из чего состоит плагин, как проходят синхронизация и
восстановление, где хранится состояние и какие ограничения есть у текущей версии.

## Назначение

Плагин Decky Loader для Steam Deck: находит игры PortProton (Wine-префиксы),
определяет папки сохранений и синхронизирует их с облаком через WebDAV, S3,
FTP/FTPS или SFTP. Умеет создавать версии бэкапов и восстанавливать сохранения
из облака.

## Компоненты

### Фронтенд (`src/`)

| Файл | Роль |
|---|---|
| `index.tsx` | точка входа плагина, маршрут `/gamesync-settings` |
| `components/GameSyncMain.tsx` | содержимое быстрого меню (QAM) |
| `components/GameList.tsx` | найденные игры, кнопка синхронизации |
| `components/SyncedGamesList.tsx` | последние синхронизации |
| `components/SettingsPage.tsx` | контейнер вкладок настроек |
| `components/Settings.tsx` | вкладка «Основные»: хранилище, проверка, автосинхрон |
| `components/GamePathsTab.tsx` | вкладка «Пути игр» |
| `components/BackupsTab.tsx` | вкладка «Бэкапы»: история и восстановление |
| `components/StatsTab.tsx` | вкладка «Статистика» |
| `utils/storagePresets.ts` | пресеты провайдеров (RU → свои серверы → мир) |
| `utils/Settings.ts` | локальные настройки UI (без секретов) |

### Бэкенд (`backend/`)

| Модуль | Роль |
|---|---|
| `main.py` | класс `Plugin`, RPC-методы, нормализация аргументов Decky |
| `portproton_scanner.py` | поиск игр, префиксов и кандидатов путей сохранений |
| `steam_shortcuts.py` | разбор `shortcuts.vdf` (appid, StartDir) |
| `game_definitions.py` | база OpenCloudSaves + Ludusavi |
| `ludusavi.py` | загрузка и кэш манифеста Ludusavi |
| `learning.py` | запоминание ручных путей |
| `sync_engine.py` | сборка архива и манифеста |
| `restore_engine.py` | чтение манифеста и безопасная распаковка |
| `backup_index.py` | история загруженных бэкапов |
| `webdav_provider.py`, `s3_provider.py`, `ftp_provider.py`, `sftp_provider.py` | транспорт до хранилища |
| `base_provider.py` | интерфейс `StorageProvider` |
| `config_manager.py` | конфиги и статистика в `~/.config/gamesync` |
| `cache_manager.py` | кэш сканирования (TTL 5 минут) |
| `auto_sync.py` | монитор Wine-процессов |
| `dependencies.py` | установка Python-зависимостей в `py_modules` |

## Синхронизация (upload)

1. Фронтенд вызывает `scan_games` → `portproton_scanner.scan_portproton_games`.
2. Сканер собирает игры: `.desktop` → префикс → кандидаты путей (известные пути,
   изученные, эвристика по `drive_c`), результат кэшируется.
3. `sync_game(game_name, save_paths)`:
   1. удаляет исключённые пути;
   2. `create_backup` собирает `tar.gz` с манифестом;
   3. провайдер загружает стабильную копию в `GameSync/`;
   4. провайдер загружает версию в `GameSync/<Игра>/backup-<дата>.tar.gz`
      (`upload_file(..., remote_name=...)`);
   5. размер и путь пишутся в `synced_games.json` и `backups.json`.

## Восстановление (restore)

1. `get_backups` отдаёт игры и версии из `backups.json` (для старых установок —
   из `synced_games.json`).
2. `restore_backup(game_name, backup_id)`:
   1. находит запись в индексе (или `legacy`-запись);
   2. скачивает архив во временную папку;
   3. читает `.gamesync/manifest.json` (архивы без манифеста не поддерживаются);
   4. делает страховочную копию текущих сейвов и загружает её как
      `prerestore-<дата>.tar.gz`;
   5. распаковывает архив по путям из манифеста через `restore_engine`;
   6. удаляет временные файлы, возвращает количество файлов и пропусков.

## Формат архива

```
<Игра>.tar.gz
├── .gamesync/manifest.json
├── <root-1>/...            # файлы первой папки сохранений
└── <root-2>/...            # файлы второй папки
```

`manifest.json`:

```json
{
  "version": 1,
  "game": "Cyberpunk 2077",
  "created": "2026-11-14T00:10:00",
  "paths": [
    { "path": "/home/deck/PortProton/prefixes/.../Saved Games/CD Projekt Red", "root": "CD Projekt Red", "is_dir": true }
  ]
}
```

Корни уникальны: при совпадении имён к корню добавляется индекс пути.

## Состояние на диске

| Файл | Содержимое |
|---|---|
| `~/.config/gamesync/storage_config.json` | провайдер, URL, креды (0600) |
| `~/.config/gamesync/games.json` | пути и исключения по играм |
| `~/.config/gamesync/synced_games.json` | последняя синхронизация, fileId, размер |
| `~/.config/gamesync/backups.json` | история версий (до 10 на игру) |
| `~/.config/gamesync/learned_paths.json` | запомненные ручные пути |
| `~/.config/gamesync/ludusavi_manifest.yaml` | кэш манифеста Ludusavi (30 дней) |
| `~/.config/gamesync/cache.json` | кэш сканирования (5 минут) |

## Безопасность

- секреты не попадают в `localStorage` фронтенда (там только URL, логин, провайдер);
- конфиги создаются с правами `0600`, каталог — `0700`;
- распаковка не использует `extractall`: запрещены абсолютные пути, `..`,
  символические и жёсткие ссылки, устройства; проверяется, что путь остаётся
  внутри целевой папки;
- SFTP-провайдер использует `AutoAddPolicy` (принимает любой host key) — известное
  ограничение, для домашнего сервера приемлемо, для чужого — нет.

## Ограничения текущей версии

- автосинхронизация не восстанавливается после перезапуска Decky (флаг хранится
  только во фронтенде);
- старые облачные версии не удаляются: индекс помнит 10 штук, файлы остаются;
- синхронизация и восстановление выполняются в отдельных потоках только там, где
  это явно сделано (`asyncio.to_thread`); сканирование игр пока блокирующее;
- восстановление перезаписывает файлы, но не удаляет локальные файлы, которых нет
  в архиве;
- пути берутся из манифеста: после переименования префикса файлы вернутся в старый путь.

## Тесты и CI

- `tests/test_backup_restore.py` — манифест, безопасная распаковка, индекс
  (`python -m unittest discover -s tests -v`);
- CI: pyflakes + `compileall` + unit-тесты, сборка и линт фронтенда, упаковка
  плагина и коммит собранного архива.
