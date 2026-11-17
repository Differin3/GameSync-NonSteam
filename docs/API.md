# API плагина (backend RPC)

Все методы вызываются с фронтенда через `@decky/api`: `call("method", payload)`.
Decky передаёт аргументы позиционно, поэтому `backend/main.py` оборачивает публичные
методы декоратором `decky_params`: единственный `dict` из аргументов распаковывается
в именованные параметры. Это позволяет писать `call("sync_game", {game_name, save_paths})`.

Каждый метод возвращает словарь. При ошибке: `{"success": false, "error": "текст"}`.

## Игры и сохранения

### `scan_games`

```json
{ "force_refresh": false }
```
→ `{ "success": true, "games": [Game] }`

`Game`: `name`, `prefixPath`, `desktopFile`, `exec`, `savePaths`, `saveCandidates`,
`hasSaves`, `steamAppId`, `sharedPrefix`, `sharedWith`, `excludePaths`.

Кандидат: `{ path, score, source, reason, fileCount, saveFileCount, meaningfulCount, size }`.
`source`: `known | learned | heuristic | steam | install | emulator | emulator_docs | emulator_public | emu_ini`.

### `validate_save_path`

```json
{ "path": "/home/deck/..." }
```
→ `{ "success": true, "path": "абсолютный путь" }` или ошибка.

### `update_game_paths`

```json
{ "game_name": "...", "save_paths": ["..."], "exclude_paths": ["..."] }
```
→ `{ "success": true }`. Ручные пути запоминаются в `learned_paths.json`.

### `get_game_config`

```json
{ "game_name": "..." }
```
→ `{ "success": true, "config": { "savePaths": [...], "enabled": true, "excludePaths": [...] } }`

## Синхронизация

### `sync_game`

```json
{ "game_name": "...", "save_paths": ["..."] }
```
→ `{ "success": true, "file_id": "GameSync/<Игра>.tar.gz", "version_id": "GameSync/<Игра>/backup-....tar.gz", "file_size": 44302336, "message": "Синхронизация завершена" }`

Если `save_paths` не переданы, пути определяются автоматически. Создаёт архив с манифестом, загружает стабильную и версионированную копии,
пишет записи в `synced_games.json` и `backups.json`.

### `get_synced_games`

→ `{ "success": true, "games": [{ "gameName", "lastSync", "fileId", "fileSize" }] }`

### `get_sync_stats`

→ `{ "success": true, "stats": { "totalSyncs", "gamesCount", "lastSync", "totalSize", "syncsByDate": [{ "date", "count" }] } }`

Семантика: `totalSyncs`, `gamesCount`, `lastSync`, `syncsByDate` учитывают только записи `kind="sync"` (страховочные `prerestore` не считаются синхронизациями). `totalSize` — сумма размеров всех файлов истории (все версии, включая страховочные), то есть занятое место в облаке.

## Бэкапы и восстановление

### `get_backups`

→
```json
{
  "success": true,
  "games": [
    {
      "game": "Cyberpunk 2077",
      "entries": [
        { "id": "20261114-001000-a1b2c3", "created": "2026-11-14T00:10:00", "remote": "GameSync/.../backup-...tar.gz", "size": 44302336, "kind": "sync", "paths": ["..."], "legacy": false }
      ]
    }
  ]
}
```
`kind`: `sync` (обычная синхронизация) или `prerestore` (страховочная копия перед восстановлением).

### `restore_backup`

```json
{ "game_name": "Cyberpunk 2077", "backup_id": "20261114-001000-a1b2c3" }
```
→
{ "success": true, "message": "Восстановлено файлов: 1240, перемещено в резерв: 2", "files": 1240, "bytes": 44302336, "quarantined": 2, "verified": 1240, "quarantine_path": "/home/deck/.config/gamesync/quarantined/Cyberpunk 2077/20261117-224500", "skipped": [], "safety_backup": "GameSync/.../prerestore-....tar.gz" }
```

Без `backup_id` берётся последняя версия. Архивы без манифеста (до 0.3.0) не
восстанавливаются — вернётся ошибка с предложением пересинхронизировать игру.
При ручном восстановлении, если запущена игра PortProton, вернётся ошибка.
В режиме pull используются `allow_running`, `upload_safety_cloud=False`
и `deadline_ts`: запись отменяется, если игра уже работает.

Файлы, которых нет в выбранной версии, переносятся в локальный карантин,
а не удаляются. Архив проверяется по SHA256 из истории (если он есть),
а файлы — по хешам манифеста v2 (`verified` / `mismatched`).

### `delete_backup`

```json
{ "game_name": "Cyberpunk 2077", "backup_id": "20261114-001000-a1b2c3" }
```

→ `{ "success": true, "message": "Версия удалена из облака" }`

Удаляет выбранную версию из облака и из истории бэкапов. Необратимо.

### `get_sync_state`

→ `{ "success": true, "active": [{ "game": "Cyberpunk 2077", "since": 1763400000.0 }] }`

Какие игры синхронизируются прямо сейчас. Используется строкой на странице игры,
чтобы показывать спиннер, даже если событие `gamesync_sync_started` потерялось.

### `get_game_sync_status`

```json
{ "appid": 1234567890, "game_name": "Cyberpunk 2077" }
```

→ `{ "success": true, "found": true, "game": "Cyberpunk 2077", "appid": 1234567890, "last_sync": "2026-11-14T00:10:00", "size": 44302336, "versions": 3, "provider": "webdav", "save_paths": 3, "shared_prefix": false }`

Используется строкой GameSync на странице игры. `found: false` — игра не
относится к PortProton (или плагин её не нашёл), и строка не показывается.
Сопоставление: сначала по `steamAppId` ярлыка, затем по названию («Baldurs Gate 3»
находит «Baldur's Gate 3»).
## Автосинхронизация

### `enable_auto_sync`

```json
{ "enabled": true }
```
Запускает/останавливает монитор процессов (`auto_sync.py`) и сохраняет флаг в `settings.json` — после перезапуска Decky монитор поднимается сам.

### `get_app_settings`

→ `{ "success": true, "auto_sync": false, "pull_on_launch": false, "max_backup_versions": 10, "download_dir": "/home/deck/Downloads", "default_save_paths": ["..."] }`

Состояние, которое живёт на бэкенде и переживает перезапуск.

### `set_pull_on_launch`

```json
{ "enabled": true }
```

→ `{ "success": true, "pull_on_launch": true }`

Включает загрузку облачного бэкапа при старте игры. Скачивание выполняется
только если бэкап новее локальных сейвов (допуск 2 секунды), не чаще раза
в 10 минут на игру; перед перезаписью создаётся `prerestore`-копия.
По завершении бэкенд отправляет событие `gamesync_pull_done`
(`{ game, success, files, error }`).

### `set_default_save_paths`

```json
{ "default_save_paths": ["/home/deck/..."] }
```

→ `{ "success": true, "default_save_paths": [...] }`

Глобальные пути применяются и к ручной, и к автосинхронизации.
### `sync_all_games`

→ `{ "success": true, "total": 17, "synced": ["..."], "failed": [{ "game": "...", "error": "..." }] }`

Последовательно синхронизирует все игры с путями. Ход выполнения — через
`get_sync_progress` (QAM опрашивает его каждые 500 мс).

### `get_sync_progress`

→ `{ "active": true, "stage": "Загрузка в облако", "percent": 60, "currentGame": "Hades", "index": 3, "total": 17, "ok": 2, "failed": 0 }`

Этапы: «Сканирование игр» → «Архивация сохранений» → «Загрузка в облако» →
«История версий» → «Готово».

### `get_storage_status`

→ `{ "success": true, "provider": "Облако Mail.ru", "url": "https://webdav.cloud.mail.ru" }`
или `{ "success": false, "provider": "...", "error": "HTTP 402: ..." }`.

Проверяет и чтение, и запись (создание папки), результат кэшируется на 60 секунд.

### `preview_path`

```json
{ "path": "/home/deck/PortProton/prefixes/DEFAULT/drive_c/users/steamuser/Documents/Game" }
```
→ `{ "success": true, "total": 12, "saveLike": 8, "totalSize": 1234567, "newest": "2026-11-15T22:10:00", "files": [{ "name": "slot1.sav", "path": "...", "size": 40000, "modified": "...", "saveLike": true }] }`

Используется кнопкой «Проверить содержимое» на вкладке «Пути игр».

### `set_max_backup_versions`

```json
{ "count": 10 }
```
→ `{ "success": true, "max_backup_versions": 10 }`. Допустимо 1–100; значение
применяется при следующей синхронизации (история и файлы в облаке).

### `download_backup`

```json
{ "game_name": "...", "backup_id": "20261114-001000-a1b2c3" }
```
→ `{ "success": true, "path": "/home/deck/Downloads/<Игра>-<id>.tar.gz" }`

Без `backup_id` скачивается последняя версия.

### `cleanup_orphans`

```json
{ "game_name": "..." }
```
(без `game_name` — по всем играм истории)

→ `{ "success": true, "deleted": 2, "games": [{ "folder": "GameSync/Game", "scanned": 4, "deleted": ["backup-...tar.gz"], "errors": [] }] }`

Удаляет только `backup-*.tar.gz` / `prerestore-*.tar.gz`, на которые нет ссылок
в истории. Если листинг папки не удался, для неё ничего не удаляется.

## Настройки хранилища

### `save_storage_config`

Поля зависят от провайдера; `provider` обязателен.

| provider | Поля |
|---|---|
| `webdav` | `url`, `username`, `password`, `oauth_token`, `webdav_provider` |
| `s3` | `s3_provider`, `endpoint`, `region`, `bucket`, `access_key`, `secret_key`, `path_style`, `signature_version` |
| `ftp` | `host`, `port`, `username`, `password`, `use_tls`, `passive` |
| `sftp` | `host`, `port`, `username`, `password`, `key_path`, `key_passphrase` |

→ `{ "success": true }`

### `load_storage_config`

→ `{ "success": true, "config": { "provider": "...", ... } }`

### `test_storage_connection`

Принимает те же поля, что `save_storage_config`, и проверяет подключение **без**
сохранения. Пустые значения заменяются сохранёнными.

→ `{ "success": true, "message": "Подключение успешно" }`

### `clear_all_data`

Удаляет `~/.config/gamesync` целиком: настройки, кэш, историю бэкапов, изученные пути.

## Служебные

| Метод | Назначение |
|---|---|
| `get_test` | проверка связи с бэкендом |
| `install_dependencies` | повторная установка Python-зависимостей |
| `check_conflicts` | заглушка (конфликты не реализованы) |

## Интерфейс провайдера

`StorageProvider` (`backend/base_provider.py`):

```python
upload_file(file_path, remote_dir=None, remote_name=None) -> str | None
download_file(file_id, save_path) -> bool
find_file(file_name, folder_name="GameSync") -> str | None
get_file_info(file_id) -> dict | None
delete_file(file_id) -> bool
list_files(folder_name="GameSync") -> list | None
test_connection() -> dict
```

`remote_name` позволяет сохранить файл под именем, отличным от локального
(используется для версий и `prerestore`-копий).
