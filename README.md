# GameSync NonSteam (PortProton Edition)

---

## 🇷🇺 Русский

Плагин для Decky Loader, синхронизирующий сохранения игр PortProton с облачным хранилищем по WebDAV (например, Яндекс Диск, Nextcloud и др.).

### Установка

#### Сборка на Windows:

1. Установите Node.js и pnpm:
```bash
npm i -g pnpm@9
```

2. Установите зависимости:
```bash
pnpm install
```

3. Соберите проект:
```bash
pnpm run build
```

4. Создайте архив (запустите `build.bat` или вручную):
- Создайте папку `dist-plugin`
- Скопируйте: `dist/`, `backend/`, `plugin.json`, `requirements.txt`
- Заархивируйте в `gamesync-nonsteam.zip`

#### Установка на Steam Deck:

1. Скопируйте `gamesync-nonsteam.zip` на Steam Deck
2. Откройте Decky Loader → Developer → Install from ZIP
3. Выберите архив и установите
4. Подключитесь по SSH и установите Python зависимости:
```bash
cd ~/.local/share/decky-loader/plugins/gamesync-nonsteam
bash install_dependencies.sh
```

### Настройка

1. Откройте настройки плагина в Decky Loader
2. В разделе WebDAV выберите провайдера (например, Яндекс Диск или Nextcloud)
3. Укажите WebDAV URL, логин/пароль или OAuth‑токен провайдера
4. Нажмите «Тест подключения», убедитесь что соединение успешно
5. Настройте пути сохранений для игр

### Использование

- Плагин автоматически сканирует игры PortProton
- Для каждой игры можно настроить пути сохранений
- Нажмите "Синхронизировать" для загрузки сохранений в облако
- Включите автосинхронизацию для автоматической загрузки при выходе из игры

### Структура проекта

- `backend/` - Python бэкенд
- `src/` - React фронтенд
- `plugin.json` - конфигурация плагина
- `requirements.txt` - Python зависимости

---

## 🇬🇧 English

Plugin for Decky Loader that synchronizes PortProton game saves with cloud storage via WebDAV (e.g. Yandex Disk, Nextcloud, etc.).

### Installation

#### Building on Windows:

1. Install Node.js and pnpm:
```bash
npm i -g pnpm@9
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm run build
```

4. Create archive (run `build.bat` or manually):
- Create `dist-plugin` folder
- Copy: `dist/`, `backend/`, `plugin.json`, `requirements.txt`
- Archive into `gamesync-nonsteam.zip`

#### Installation on Steam Deck:

1. Copy `gamesync-nonsteam.zip` to Steam Deck
2. Open Decky Loader → Developer → Install from ZIP
3. Select archive and install
4. Connect via SSH and install Python dependencies:
```bash
cd ~/.local/share/decky-loader/plugins/gamesync-nonsteam
bash install_dependencies.sh
```

### Configuration

1. Open plugin settings in Decky Loader
2. In the WebDAV section choose a provider (e.g. Yandex Disk or Nextcloud)
3. Enter WebDAV URL, username/password or provider OAuth token
4. Click “Test connection” and ensure it succeeds
5. Configure save paths for games

### Usage

- Plugin automatically scans PortProton games
- Save paths can be configured for each game
- Click "Synchronize" to upload saves to cloud
- Enable auto-sync for automatic upload when exiting game

### Project Structure

- `backend/` - Python backend
- `src/` - React frontend
- `plugin.json` - plugin configuration
- `requirements.txt` - Python dependencies
