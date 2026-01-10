# GameSync NonSteam (PortProton Edition)

Плагин для Decky Loader, синхронизирующий сохранения игр PortProton с Google Drive.

## Установка

### Сборка на Windows:

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

### Установка на Steam Deck:

1. Скопируйте `gamesync-nonsteam.zip` на Steam Deck
2. Откройте Decky Loader → Developer → Install from ZIP
3. Выберите архив и установите
4. Подключитесь по SSH и установите Python зависимости:
```bash
cd ~/.local/share/decky-loader/plugins/gamesync-nonsteam
bash install_dependencies.sh
```

## Настройка

1. Откройте настройки плагина в Decky Loader
2. Введите Google Drive refresh_token
3. Нажмите "Тест подключения"
4. Настройте пути сохранений для игр

## Получение refresh_token

1. Перейдите на https://developers.google.com/oauthplayground
2. Выберите "Drive API v3"
3. Выберите scope: `https://www.googleapis.com/auth/drive.file`
4. Нажмите "Authorize APIs"
5. Войдите в Google аккаунт
6. Нажмите "Exchange authorization code for tokens"
7. Скопируйте "Refresh token"

## Использование

- Плагин автоматически сканирует игры PortProton
- Для каждой игры можно настроить пути сохранений
- Нажмите "Синхронизировать" для загрузки сохранений в облако
- Включите автосинхронизацию для автоматической загрузки при выходе из игры

## Структура проекта

- `backend/` - Python бэкенд
- `src/` - React фронтенд
- `plugin.json` - конфигурация плагина
- `requirements.txt` - Python зависимости