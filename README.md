# GameSync (PortProton Edition)

---

## 🇷🇺 Русский

Плагин для Decky Loader, синхронизирующий сохранения игр PortProton с облачным хранилищем:

- через **WebDAV** (Облако Mail.ru — есть бесплатный тариф, Яндекс Диск, Nextcloud/ownCloud, Fastmail и любой свой WebDAV-сервер)
- через **S3‑совместимые object storage** (Yandex Object Storage, VK Cloud, Cloud.ru, Backblaze B2, Wasabi, AWS S3, DigitalOcean Spaces и др.)
- через **FTP/FTPS** или **SFTP** (собственный сервер/NAS)

> **Что выбрать?** Если вы не уверены — берите «Облако (WebDAV) → Облако Mail.ru»: нужны
> только адрес почты и пароль. Яндекс Диск по WebDAV с 22.06.2026 требует подписку
> Яндекс 360. S3, FTP и SFTP — для тех, у кого уже есть сервер или бакет.

### Установка

#### Сборка на Windows:

1. Установите Node.js (версия 20+):
```bash
node --version
```

2. Установите зависимости:
```bash
npm install
```

3. Соберите проект:
```bash
npm run build
```

4. Создайте архив (запустите `build.bat` или вручную):
- Создайте папку `dist-plugin`
- Скопируйте: `dist/`, `backend/`, `plugin.json`, `requirements.txt`
- Заархивируйте в `gamesync-nonsteam.zip`

#### Установка на Steam Deck:

1. Скопируйте `gamesync-nonsteam.zip` на Steam Deck
2. Откройте Decky Loader → Developer → Install from ZIP
3. Выберите архив и установите

Python‑зависимости (requests, boto3, paramiko, psutil) плагин устанавливает
сам при первом запуске — отдельно ничего ставить не нужно. Нужен только
доступ в интернет при первом запуске (один раз).

### Настройка

1. Откройте настройки плагина в Decky Loader.
2. В блоке **Тип хранилища** выберите:
   - **Облако (WebDAV)** — если используете Облако Mail.ru, Яндекс Диск, Nextcloud/ownCloud, Fastmail и т.п. (рекомендуется);
   - **Свой сервер: SFTP** — если у вас NAS/VPS с SSH (пароль или приватный ключ);
   - **Свой сервер: FTP/FTPS** — для обычного FTP (при необходимости включите TLS и пассивный режим);
   - **S3: для продвинутых** — если пользуетесь объектным хранилищем.
3. Для **WebDAV**:
   - выберите сервис — URL подставится автоматически, останется ввести логин и пароль;
   - для Яндекс Диска пароль — пароль приложения «WebDAV», для Mail.ru — пароль аккаунта или приложения;
   - нажмите «Проверить и сохранить»: плагин проверит подключение и только потом сохранит настройки.
4. Для **S3**:
   - выберите S3‑провайдера (например, Yandex Object Storage, VK Cloud, Backblaze B2);
   - укажите **Bucket**, при необходимости поправьте Endpoint и Region;
   - введите Access Key и Secret Key;
   - нажмите «Проверить и сохранить».
5. Для **FTP/FTPS**:
   - укажите хост и порт (по умолчанию 21), логин и пароль;
   - включите «Использовать TLS (FTPS)», если сервер поддерживает шифрование;
   - нажмите «Проверить и сохранить».
6. Для **SFTP**:
   - укажите хост и порт (по умолчанию 22), логин и пароль или путь к приватному ключу;
   - при необходимости укажите passphrase ключа;
   - нажмите «Проверить и сохранить».
7. Настройте пути сохранений для игр (авто‑поиск + ручные пути при необходимости).

### Использование

- В быстром меню — статус и три действия: «Синхронизировать всё», «Бэкапы и восстановление», «Настройки»
- Плагин автоматически сканирует игры PortProton
- Для каждой игры можно настроить пути сохранений
- Нажмите "Синхронизировать" для загрузки сохранений в облако
- Каждая синхронизация создаёт версию бэкапа в облаке (последние 10 хранятся в истории)
- На странице non-Steam игры в библиотеке видна строка GameSync: статус сохранений и кнопка синхронизации
- Включите автосинхронизацию для автоматической загрузки при выходе из игры (настройка сохраняется после перезапуска Decky)

### Восстановление сохранений

Настройки → вкладка **Бэкапы**:

1. Выберите игру — под ней появится список версий (дата, размер, тип).
2. Нажмите «Восстановить» у нужной версии и подтвердите.
3. Плагин скачает архив, распакует его по путям из манифеста и вернёт файлы в `drive_c`.
4. Перед восстановлением текущие сейвы автоматически сохраняются в облако как
   `prerestore-<дата>.tar.gz` — откатиться можно из этого же списка.

Ограничения:

- восстановить можно бэкапы, созданные версией плагина 0.3.0 и новее (в архиве есть манифест);
  старые архивы нужно пересоздать повторной синхронизацией;
- в истории хранятся последние 10 версий на игру, более старые записи удаляются из индекса
  (сами файлы в облаке остаются);
- файлы возвращаются по путям из манифеста: если префикс PortProton переименован или игра
  переустановлена в другой префикс, архив восстановится в старый путь.

### Как устроены бэкапы

- `GameSync/<Игра>/backup-<YYYYMMDD-HHMMSS>.tar.gz` — версии;
- `GameSync/<Игра>.tar.gz` — стабильная копия последней синхронизации (для ручного доступа);
- внутри архива — файлы сохранений и манифест `.gamesync/manifest.json` с исходными путями;
- история версий хранится локально в `~/.config/gamesync/backups.json`.

### Как плагин находит игры и сохранения

- **Игры**: `.desktop`‑файлы PortProton (с локализованными именами), префиксы без ярлыков и сопоставление со **Steam‑ярлыками** (appid/StartDir).
- **Сохранения**: база OpenCloudSaves + **Ludusavi** (манифест скачивается и кэшируется автоматически) + эвристический поиск по `drive_c` (Documents, Saved Games, AppData, ProgramData).
- Для каждой игры показываются найденные **кандидаты с оценкой**; ненужные можно исключить из синхронизации.
- **Ручные пути запоминаются** и предлагаются похожим играм.
- Игры с общим префиксом помечаются предупреждением.

### Структура проекта

- `backend/` - Python бэкенд (синхронизация, провайдеры, восстановление)
- `src/` - React фронтенд
- `tests/` - unit-тесты бэкенда (`python -m unittest discover -s tests`)
- `docs/` - архитектура и описание API
- `mockups/` - HTML-макеты интерфейса и скриншоты
- `plugin.json` - конфигурация плагина
- `requirements.txt` - Python зависимости

Документация: [CHANGELOG.md](CHANGELOG.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/API.md](docs/API.md) · [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🇬🇧 English

Plugin for Decky Loader that synchronizes PortProton game saves with cloud storage:

- via **WebDAV** (Mail.ru Cloud — has a free tier, Yandex Disk, Nextcloud/ownCloud, Fastmail and any custom WebDAV server)
- via **S3‑compatible object storage** (Yandex Object Storage, VK Cloud, Cloud.ru, Backblaze B2, Wasabi, AWS S3, DigitalOcean Spaces, etc.)
- via **FTP/FTPS** or **SFTP** (your own server/NAS)

> **Not sure what to pick?** Choose “Cloud (WebDAV) → Mail.ru Cloud”: it only needs your
> email and password. Yandex Disk WebDAV requires a Yandex 360 subscription since
> 22.06.2026. S3, FTP and SFTP are for users who already have a server or a bucket.

### Installation

#### Building on Windows:

1. Install Node.js:
```bash
npm --version
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Create archive (run `build.bat` or manually):
- Create `dist-plugin` folder
- Copy: `dist/`, `backend/`, `plugin.json`, `requirements.txt`
- Archive into `gamesync-nonsteam.zip`

#### Installation on Steam Deck:

1. Copy `gamesync-nonsteam.zip` to Steam Deck
2. Open Decky Loader → Developer → Install from ZIP
3. Select archive and install

The plugin installs its Python dependencies (requests, boto3, paramiko, psutil)
automatically on first launch — no manual steps required. Only internet access
is needed the first time.

### Configuration

1. Open plugin settings in Decky Loader.
2. In the **Storage type** block choose:
   - **Cloud (WebDAV)** if you use Mail.ru Cloud, Yandex Disk, Nextcloud/ownCloud, Fastmail, etc. (recommended);
   - **Own server: SFTP** for an SSH-accessible NAS/VPS (password or private key);
   - **Own server: FTP/FTPS** for a regular FTP server (enable TLS and passive mode if needed);
   - **S3: advanced** if you already use object storage.
3. For **WebDAV**:
   - pick a service — the URL is filled in automatically, you only enter login and password;
   - Yandex Disk uses a “WebDAV” app password, Mail.ru uses your account or app password;
   - click “Test and save”: the plugin checks the connection first and only then stores the settings.
4. For **S3**:
   - choose an S3 provider (e.g. Yandex Object Storage, VK Cloud, Backblaze B2);
   - enter **Bucket**, adjust Endpoint and Region if needed;
   - enter Access Key and Secret Key;
   - click “Test and save”.
5. For **FTP/FTPS**:
   - enter host and port (default 21), username and password;
   - enable “Use TLS (FTPS)” if the server supports encryption;
   - click “Test and save”.
6. For **SFTP**:
   - enter host and port (default 22), username and password or a private key path;
   - provide the key passphrase if needed;
   - click “Test SFTP connection” and ensure it succeeds.
7. Configure save paths for games (auto‑detected or custom paths).

### Usage

- The quick access menu shows status and three actions: "Sync all", "Backups & restore", "Settings"
- Plugin automatically scans PortProton games
- Save paths can be configured for each game
- Click "Synchronize" to upload saves to cloud
- Every sync creates a versioned backup (the last 10 are kept in history)
- Non-Steam game pages in the library show a GameSync row with save status and a sync button
- Enable auto-sync for automatic upload when exiting game (the setting survives a Decky restart)

### Restoring saves

Settings → **Backups** tab:

1. Pick a game — the list of versions appears below (date, size, kind).
2. Click "Restore" on the version you need and confirm.
3. The plugin downloads the archive, unpacks it using the manifest paths and puts files back into `drive_c`.
4. Before restoring, the current saves are uploaded as `prerestore-<date>.tar.gz`, so you can roll back from the same list.

Limitations:

- only archives created by plugin 0.3.0+ can be restored (they contain a manifest);
  old backups must be recreated by syncing again;
- history keeps the last 10 versions per game; older entries are dropped from the index
  (the files in cloud storage stay).

### How backups are stored

- `GameSync/<Game>/backup-<YYYYMMDD-HHMMSS>.tar.gz` — versions;
- `GameSync/<Game>.tar.gz` — stable copy of the latest sync (for manual access);
- each archive contains save files and `.gamesync/manifest.json` with the original paths;
- version history is stored locally in `~/.config/gamesync/backups.json`.

### How the plugin finds games and saves

- **Games**: PortProton `.desktop` files (with localized names), prefixes without shortcuts, and matching against **Steam shortcuts** (appid/StartDir).
- **Saves**: OpenCloudSaves database + **Ludusavi** (manifest downloaded and cached automatically) + heuristic search inside `drive_c` (Documents, Saved Games, AppData, ProgramData).
- Each game shows detected **candidates with a score**; unwanted ones can be excluded from sync.
- **Manual paths are remembered** and suggested for similar games.
- Games sharing a prefix are flagged with a warning.

### Project Structure

- `backend/` - Python backend (sync, providers, restore)
- `src/` - React frontend
- `tests/` - backend unit tests (`python -m unittest discover -s tests`)
- `docs/` - architecture and API reference
- `mockups/` - HTML UI mockups and screenshots
- `plugin.json` - plugin configuration
- `requirements.txt` - Python dependencies

Documentation: [CHANGELOG.md](CHANGELOG.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/API.md](docs/API.md) · [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
