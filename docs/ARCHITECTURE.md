# Архитектура GameSync

## Назначение

Плагин Decky Loader синхронизирует сохранения игр PortProton (не-Steam игр,
запускаемых через PortProton) с облачным хранилищем и умеет восстанавливать их
из облака. Работает полностью на Steam Deck, без внешнего сервера.

## Компоненты

### Фронтенд (`src/`)

- `index.tsx` — точка входа: маршрут `/gamesync-settings`, патч страницы игры,
  слушатель события `gamesync_auto_saved` (тост после автосинхронизации).
- `components/GameSyncMain.tsx` — QAM: статус хранилища, тумблер автосинхронизации,
  «Синхронизировать всё» с прогресс-баром, переходы на страницы.
- `components/SettingsPage.tsx` — собственные вкладки на `Focusable`
  (Основные / Пути игр / Бэкапы / Статистика). Decky `Tabs` не используется:
  он позиционирует контент абсолютно и накладывает его на панель вкладок.
- `components/GamePathsTab.tsx` — карточки игр, пути, кандидаты, предпросмотр
  содержимого пути, пагинация.
- `components/BackupsTab.tsx` — статистика облака, лимит версий, карточки игр,
  боковая карточка версий, восстановление, скачивание, чистка «сирот», пагинация.
- `components/StatsTab.tsx` — карточки показателей, график по датам, последние записи.
- `components/GameSyncGameRow.tsx` — строка на странице игры: дата/размер/версии,
  кликабельное облачко, зелёная точка «синхронизировано за 24 ч», настройки.
- `patches/appDetailsPatch.tsx` — вставка строки после PlaySection.
- `utils/storagePresets.ts` — пресеты WebDAV/S3, нормализация URL.

### Бэкенд (`backend/`)

- `main.py` — RPC-методы Decky, прогрев зависимостей, автосинхронизация,
  прогресс синхронизации, статус хранилища, восстановление.
- `portproton_scanner.py` — поиск игр и путей сохранений (см. ниже).
- `game_definitions.py` — OpenCloudSaves (по имени и `steam_id`).
- `ludusavi.py` — манифест Ludusavi: индекс по именам и Steam ID, плюс
  `get_steam_id_for_game` для эмуляторных папок.
- `learning.py` — ручные пути, обучение по сессии (`learn_from_session`).
- `sync_engine.py` — сборка tar.gz, манифест, `count_meaningful_files`.
- `restore_engine.py` — чтение манифеста, безопасная распаковка без `extractall`.
- `backup_index.py` — локальная история (`backups.json`), лимит версий,
  `prepare_trim` для удаления выпавших файлов.
- `cleanup.py` — поиск и удаление «сирот» в облаке.
- `path_preview.py` — описание содержимого пути для UI.
- `stats.py` — расчёт статистики (синхронизации ≠ страховочные копии).
- `auto_sync.py` — мониторинг процессов, определение игры, время сессии.
- `config_manager.py` — настройки приложения и хранилища.
- `dependencies.py` — установка Python-зависимостей в `py_modules`.
- Провайдеры: `webdav_provider.py`, `s3_provider.py`, `ftp_provider.py`,
  `sftp_provider.py` (upload/download/delete/list/test).

## Поиск путей сохранений

Порядок источников (от точного к вероятностному):

1. `steam_appid.txt` / `steam_settings/steam_appid.txt` → настоящий App ID.
2. Точный App ID в Ludusavi (индекс с картой `steam`) и OpenCloudSaves (`steam_id`).
3. Эмуляторы:
   - `Documents/CPY_SAVES/CPY/<appid>`, `Documents/SKIDROW/<appid>`;
   - `AppData/Roaming/<EMU>/<appid>/remote` (HOODLUM, CODEX, RUNE, PLAZA…);
   - `users/Public/Documents/Steam/<EMU>/<appid>`;
   - путь из `steam_emu.ini` (`%SystemDrive%\…`, регистронезависимый поиск).
4. Steam `userdata/<uid>/<appid>/remote` (только для настоящего App ID).
5. Папка игры: `save/saves/profile/Data` рядом с exe, файлы `*save*`, `*.sav`.
6. Известные пути по названию (нормализация: годы, GOTY/Definitive/… отбрасываются).
7. Эвристика по `drive_c` (Documents, Saved Games, AppData, LocalLow), глубина до 3.
8. Обучение по сессии: после выхода сканируются файлы, изменённые за сессию,
   служебные и системные отбрасываются; топ-3 папки запоминаются.
9. Ручные пути пользователя.

Фильтры: `SERVICE_EXTENSIONS` (логи, txt, dll, exe, картинки, кэш), папки только
из служебных файлов отбрасываются; кандидат без «осмысленных» файлов не попадает
в результат. Перед архивацией `count_meaningful_files` не даёт создать пустой бэкап.

Фейковый App ID ярлыка (~3.3 млрд) для эмуляторов не используется: берётся только
настоящий ID (< 3 000 000) или ID из Ludusavi.

## Синхронизация

1. QAM/страница игры/автосинхронизация вызывают `sync_game`.
2. Пути фильтруются по исключениям, проверяется наличие осмысленных файлов.
3. `create_backup` собирает tar.gz с `.gamesync/manifest.json`.
4. Загрузка: стабильный `GameSync/<Игра>.tar.gz` + версия
   `GameSync/<Игра>/backup-<дата>.tar.gz`.
5. `backup_index.add_entry` пишет запись, `prepare_trim` возвращает выпавшие
   записи — их файлы удаляются через `provider.delete_file`.
6. Обновляются прогресс (`sync_progress`) и статистика; для автосинхронизации
   отправляется `decky.emit("gamesync_auto_saved", …)` → тост.

Лимит версий (`max_backup_versions`, 1–100) хранится в `settings.json`.

## Восстановление

1. `restore_backup` находит запись в истории (или legacy `synced_games`).
2. Скачивает архив, читает манифест (без манифеста — понятная ошибка).
3. Делает страховочную копию текущих сейвов и загружает её как `prerestore-*`.
4. `safe_extract` распаковывает только внутрь `Path.home()`: проверяются `..`,
   абсолютные пути, симлинки/устройства; результат логируется
   (`Restore <игра>: N files, M bytes, skipped K`).
5. Если восстановлено 0 файлов, UI предупреждает, что в архиве были только
   служебные файлы.

## Чистка «сирот»

`cleanup_orphans` проходит по играм истории, получает листинг
`GameSync/<Игра>/` (WebDAV/S3/FTP/SFTP), сравнивает с `remote` из индекса и
удаляет только `backup-*.tar.gz` / `prerestore-*.tar.gz`, которых нет в истории.
Неудачный листинг возвращает `None` — в такой папке ничего не удаляется.

## Статистика

`stats.build_stats` разделяет записи `sync` и `prerestore`:

- `totalSyncs`, `gamesCount`, `lastSync`, `syncsByDate` — только синхронизации;
- `totalSize` — сумма всех файлов истории (все версии и страховочные копии,
  реально занимаемое место).

## Состояние на диске

- `~/.config/gamesync/settings.json` — настройки (автосинхронизация, лимит версий,
  глобальные пути).
- `~/.config/gamesync/storage_config.json` — провайдер и учётные данные.
- `~/.config/gamesync/backups.json` — история версий.
- `~/.config/gamesync/learned_paths.json` — изученные пути.
- `~/.config/gamesync/ludusavi_manifest.yaml` + `ludusavi_index.json` — кэш Ludusavi.
- `~/.config/gamesync/games.json` — кэш списка игр.

## Интерфейс и геймпад

- Вкладки и контент — `Focusable` с `flow-children` row/column, активная вкладка
  получает автофокус; кнопки — `ActionButton` (иконка и текст в одной строке).
- Контент настроек имеет нижний отступ
  `calc(var(--basicui-footer-height, 42px) + 6px)` = 48 px, чтобы панель Steam
  (42 px) не перекрывала последние элементы.
- QAM: `Field` со статусом, `ToggleField` автосинхронизации, `ActionButton`,
  прогресс-бар (опрос `get_sync_progress` каждые 500 мс).

## Тесты и CI

`tests/test_backup_restore.py` — 76 тестов: манифест, path traversal, симлинки,
`allowed_root`, индекс, лимиты версий, автосинхронизация, Steam ID/эмуляторы,
обучение по сессии, предпросмотр пути, статистика, чистка. CI: pyflakes,
compileall, unittest, eslint/build фронтенда, упаковка ZIP.
