# GameSync NonSteam (PortProton Edition)

---

## 🇷🇺 Русский

Плагин для Decky Loader, синхронизирующий сохранения игр PortProton с Google Drive.

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
2. Введите Google Drive Client ID и Client Secret
3. Нажмите "Авторизоваться автоматически" для получения refresh_token
4. Настройте пути сохранений для игр

### Получение OAuth учетных данных

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект (или выберите существующий)
3. APIs & Services → Enable APIs → включите "Google Drive API"
4. APIs & Services → Credentials → Create Credentials → OAuth client ID
5. Тип приложения: "Web application"
6. Authorized redirect URIs: `http://localhost:8080/callback`
7. Сохраните и скопируйте Client ID и Client Secret
8. OAuth consent screen → Publishing status: "Testing"
9. OAuth consent screen → Test users → ADD USERS → добавьте ваш email

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

Plugin for Decky Loader that synchronizes PortProton game saves with Google Drive.

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
2. Enter Google Drive Client ID and Client Secret
3. Click "Authorize automatically" to get refresh_token
4. Configure save paths for games

### Getting OAuth Credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. APIs & Services → Enable APIs → enable "Google Drive API"
4. APIs & Services → Credentials → Create Credentials → OAuth client ID
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:8080/callback`
7. Save and copy Client ID and Client Secret
8. OAuth consent screen → Publishing status: "Testing"
9. OAuth consent screen → Test users → ADD USERS → add your email

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
