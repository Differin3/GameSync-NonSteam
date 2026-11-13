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

Кандидат: `{ path, score, source: known|learned|heuristic, reason, fileCount, saveFileCount, size }`.

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
→ `{ "success": true, "file_id": "GameSync/<Игра>.tar.gz", "version_id": "GameSync/<Игра>/backup-....tar.gz", "message": "Синхронизация завершена" }`

Если `save_paths` не переданы, пути определяются автоматически. Создаёт архив с манифестом, загружает стабильную и версионированную копии,
пишет записи в `synced_games.json` и `backups.json`.

### `get_synced_games`

→ `{ "success": true, "games": [{ "gameName", "lastSync", "fileId", "fileSize" }] }`

### `get_sync_stats`

→ `{ "success": true, "stats": { "totalSyncs", "gamesCount", "lastSync", "totalSize", "syncsByDate": [{ "date", "count" }] } }`

`totalSyncs` и `syncsByDate` считаются по истории бэкапов (`backups.json`), а не по числу игр.

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
```json
{ "success": true, "message": "Восстановлено файлов: 1240", "files": 1240, "bytes": 44302336, "skipped": [], "safety_backup": "GameSync/.../prerestore-....tar.gz" }
```

Без `backup_id` берётся последняя версия. Архивы без манифеста (до 0.3.0) не
восстанавливаются — вернётся ошибка с предложением пересинхронизировать игру.

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

→ `{ "success": true, "auto_sync": false, "default_save_paths": ["..."] }`

Состояние, которое живёт на бэкенде и переживает перезапуск.

### `set_default_save_paths`

```json
{ "default_save_paths": ["/home/deck/..."] }
```

→ `{ "success": true, "default_save_paths": [...] }`

Глобальные пути применяются и к ручной, и к автосинхронизации.
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
test_connection() -> dict
```

`remote_name` позволяет сохранить файл под именем, отличным от локального
(используется для версий и `prerestore`-копий).
