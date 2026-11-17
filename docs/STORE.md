# Описание для магазина Decky

Готовые тексты для `plugins.deckbrew.xyz` и PR в `decky-plugin-database`.
Технические требования и процесс подачи — в [PUBLISHING.md](PUBLISHING.md).

## Короткое описание (EN, для карточки)

> Sync PortProton save files to WebDAV, S3, FTP or SFTP. Automatic save-path
> detection, versioned backups, one-click restore, pull-before-launch and
> auto-sync after game exit.

## Короткое описание (RU)

> Синхронизация сохранений игр PortProton с облаком: WebDAV, S3, FTP, SFTP.
> Автопоиск путей, версии бэкапов, восстановление, загрузка перед запуском
> и автосинхронизация после игры.

## Полное описание (EN)

**GameSync PortProton** keeps save files of non-Steam games launched through
PortProton backed up and in sync, without rclone or a PC.

**Features**

- Cloud providers: WebDAV (Mail.ru Cloud — free tier, Yandex Disk, Nextcloud,
  ownCloud, Fastmail, custom server), S3-compatible storage, FTP/FTPS and SFTP.
- Automatic save-path detection: exact Steam App ID (`steam_appid.txt`),
  Ludusavi and OpenCloudSaves lookups by ID and name, Steam emulator folders
  (CPY, CODEX, RUNE, Public Documents), `steam_emu.ini` paths, files next to the
  executable, Steam `userdata`, heuristics and session learning.
- Versioned backups with a configurable retention (3/5/10/20/50 versions).
  Old versions are removed from the cloud automatically.
- Restore from any version with a safety copy (`prerestore`) made first.
  “Check contents” shows what is inside a save path before syncing.
- Pull-before-launch: downloads the cloud save before a game starts when it is
  newer than local saves, with a local safety copy and race protection.
- Sync modes: two-way (recommended), upload-only, download-only, or off.
- Auto-sync: the plugin watches PortProton processes and uploads the game right
  after it exits, including games in the shared `DEFAULT` prefix.
- Compact quick-access menu with storage status, auto-sync toggle, progress bar
  and sync stages.
- Game page row with last sync date, size, versions and one-click sync.
- Statistics (syncs, games in cloud, used space, per-date chart) and cloud
  orphan cleanup.

**Privacy**

- Settings, credentials and backup history are stored **only on the device**
  (`~/.config/gamesync/`); credentials never leave the Steam Deck except to the
  storage provider you configure.
- No telemetry, no analytics, no third-party accounts.
- Two network requests: the Ludusavi manifest (GitHub) and PyPI for Python
  dependencies installed on first launch.

**Requirements**

- SteamOS / Steam Deck with Decky Loader.
- PortProton with non-Steam games.
- Internet access on first launch (dependencies).

**Support the project**

GameSync is free and ad-free. If it saves you time, you can support development
on Boosty: https://boosty.to/gamesync.nonsteam/single-payment/donation/842705/target?share=target_link

**Open source** — MIT.

## Полное описание (RU)

**GameSync PortProton** хранит резервные копии сохранений не-Steam игр,
запущенных через PortProton, и синхронизирует их с облаком — без rclone и ПК.

**Возможности**

- Хранилища: WebDAV (Облако Mail.ru — бесплатно, Яндекс Диск, Nextcloud,
  ownCloud, Fastmail, свой сервер), S3-совместимые, FTP/FTPS и SFTP.
- Автопоиск путей сохранений: настоящий Steam App ID (`steam_appid.txt`),
  Ludusavi и OpenCloudSaves по ID и имени, папки эмуляторов (CPY, CODEX, RUNE,
  Public Documents), пути из `steam_emu.ini`, файлы рядом с exe, Steam
  `userdata`, эвристика и обучение по сессии.
- Версионные бэкапы с настраиваемым лимитом (3/5/10/20/50); старые версии
  удаляются из облака автоматически.
- Восстановление любой версии с предварительной страховочной копией
  (`prerestore`). Кнопка «Проверить содержимое» показывает файлы до синхронизации.
- Загрузка перед запуском: облачные сейвы подтягиваются, если они новее
  локальных, с локальной страховкой и защитой от гонок.
- Режимы: двусторонняя (рекомендуется), только выгрузка, только загрузка или
  выключено.
- Автосинхронизация: плагин следит за процессами PortProton и сохраняет игру
  сразу после выхода, включая игры в общем префиксе `DEFAULT`.
- Компактное быстрое меню: статус хранилища, тумблер автосинхронизации,
  прогресс-бар с этапами.
- Строка на странице игры: дата синхронизации, размер, версии и синхронизация
  по клику на облачко.
- Статистика (синхронизации, игры в облаке, занятое место, график) и чистка
  «сирот» в облаке.

**Приватность**

- Настройки, учётные данные и история бэкапов хранятся **только на устройстве**
  (`~/.config/gamesync/`); логины/пароли уходят лишь в настроенное вами хранилище.
- Нет телеметрии и аналитики.
- Два сетевых обращения: манифест Ludusavi (GitHub) и PyPI для установки
  Python-зависимостей при первом запуске.

**Требования**

- SteamOS / Steam Deck с Decky Loader.
- PortProton с не-Steam играми.
- Интернет при первом запуске (зависимости).

**Поддержать проект**

GameSync бесплатный и без рекламы. Если он экономит вам время, можно
поддержать разработку на Boosty:
https://boosty.to/gamesync.nonsteam/single-payment/donation/842705/target?share=target_link

**Открытый исходный код** — MIT.

## Теги

`backup`, `cloud`, `save`, `portproton`, `webdav`, `s3`, `ftp`, `sftp`.

## Категория и позиционирование

- Категория: утилиты / резервное копирование.
- Отличие от **Game Sync (SDH-GameSync)**: фокус на PortProton, автоматическое
  определение путей (без ручных фильтров), нативные провайдеры WebDAV/S3/FTP/SFTP
  вместо rclone, версионные бэкапы и восстановление.
- В PR стоит явно указать два внешних URL: Ludusavi manifest и PyPI.

## Текст Pull Request (шаблон, EN)

```markdown
Adds **GameSync PortProton** — save synchronization for non-Steam games
launched through PortProton.

- Backend: Python (Decky Python backend); frontend: React + @decky/ui.
- License: MIT (`LICENSE`), public repository.
- `pnpm-lock.yaml` is at `lockfileVersion: 9.0`.
- No obfuscation, no binaries: `dist/index.js` is an unminified Rollup bundle;
  the only binary is `assets/icon.png`.
- External network requests (declared):
  1. PyPI (pypi.org) on first launch — installs the Python dependencies
     pinned in `requirements.txt` / `PACKAGE_SPECS`:
     psutil==7.2.2, requests==2.34.2, boto3==1.44.3, paramiko==5.1.0, PyYAML==6.0.3
     into Decky's runtime directory via `pip --target` (system Python untouched).
  2. Ludusavi manifest (mtkennerly/ludusavi-manifest on GitHub) — cached locally,
     used only as a save-path database.
- No telemetry, no analytics; credentials are stored locally
  (`~/.config/gamesync/`) and sent only to the configured storage.
- Plugin name "GameSync PortProton" avoids confusion with the existing
  "Game Sync" plugin.
- Tested on Steam Deck (SteamOS Stable), plugin 0.10.15: install, WebDAV sync
  to Mail.ru Cloud, restore, auto-sync after game exit.
```

## Что приложить к PR

- Ссылку на этот репозиторий и коммит.
- Скриншоты: [QAM](../mockups/shots/real-05-qam.png),
  [страница игры](../mockups/shots/real-06-game-row.png),
  [Основные](../mockups/shots/real-01-settings-main.png),
  [Бэкапы](../mockups/shots/real-03-settings-backups.png).
- Подтверждение теста на Steam Deck (Stable/Beta).
