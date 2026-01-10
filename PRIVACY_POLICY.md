# Политика конфиденциальности GameSync NonSteam / Privacy Policy

**Дата вступления в силу / Effective Date:** 10 января 2026 г. / January 10, 2026

---

## 🇷🇺 Русский

### 1. Общая информация

GameSync NonSteam (далее "Приложение") - это плагин для Steam Deck, предназначенный для синхронизации сохранений игр с облачным хранилищем Google Drive.

### 2. Сбор и использование данных

#### 2.1. Данные, которые мы НЕ собираем
- Приложение не собирает личную информацию пользователей
- Приложение не передает данные третьим лицам
- Приложение не использует аналитику или трекинг

#### 2.2. Данные, хранящиеся локально
Приложение хранит следующие данные только на устройстве пользователя (Steam Deck):
- OAuth токены для доступа к Google Drive (Client ID, Client Secret, Refresh Token)
- Пути к файлам сохранений игр
- Настройки синхронизации

Все данные хранятся локально в директории `~/.config/gamesync/` и не передаются никуда, кроме Google Drive API для синхронизации файлов.

#### 2.3. Доступ к Google Drive
Приложение использует Google Drive API для:
- Загрузки файлов сохранений в Google Drive пользователя
- Скачивания файлов сохранений из Google Drive пользователя
- Получения метаданных файлов (размер, дата изменения)

Все операции выполняются от имени пользователя и только с файлами, к которым пользователь предоставил доступ через OAuth авторизацию.

### 3. Безопасность данных

- Все OAuth токены хранятся локально на устройстве пользователя
- Приложение использует только официальный Google Drive API
- Данные передаются только между устройством пользователя и Google Drive через защищенные HTTPS соединения
- Пользователь может в любой момент отозвать доступ к приложению через настройки Google Account

### 4. Права пользователя

Пользователь имеет право:
- В любой момент отозвать доступ приложения к Google Drive
- Удалить все данные приложения с устройства
- Не использовать приложение без предоставления доступа к Google Drive

### 5. Изменения в политике

Мы оставляем за собой право обновлять данную политику конфиденциальности. Пользователи будут уведомлены о существенных изменениях.

### 6. Контакты

Если у вас есть вопросы о политике конфиденциальности, свяжитесь с разработчиком через репозиторий проекта.

### 7. Согласие

Используя приложение, вы соглашаетесь с данной политикой конфиденциальности.

---

## 🇬🇧 English

### 1. General Information

GameSync NonSteam (hereinafter "Application") is a plugin for Steam Deck designed to synchronize game saves with Google Drive cloud storage.

### 2. Data Collection and Usage

#### 2.1. Data We Do NOT Collect
- The application does not collect users' personal information
- The application does not share data with third parties
- The application does not use analytics or tracking

#### 2.2. Locally Stored Data
The application stores the following data only on the user's device (Steam Deck):
- OAuth tokens for Google Drive access (Client ID, Client Secret, Refresh Token)
- Paths to game save files
- Synchronization settings

All data is stored locally in the `~/.config/gamesync/` directory and is not transmitted anywhere except to the Google Drive API for file synchronization.

#### 2.3. Google Drive Access
The application uses Google Drive API for:
- Uploading save files to the user's Google Drive
- Downloading save files from the user's Google Drive
- Retrieving file metadata (size, modification date)

All operations are performed on behalf of the user and only with files to which the user has granted access through OAuth authorization.

### 3. Data Security

- All OAuth tokens are stored locally on the user's device
- The application uses only the official Google Drive API
- Data is transmitted only between the user's device and Google Drive through secure HTTPS connections
- The user can revoke application access at any time through Google Account settings

### 4. User Rights

The user has the right to:
- Revoke application access to Google Drive at any time
- Delete all application data from the device
- Not use the application without granting access to Google Drive

### 5. Policy Changes

We reserve the right to update this privacy policy. Users will be notified of significant changes.

### 6. Contacts

If you have questions about the privacy policy, contact the developer through the project repository.

### 7. Consent

By using the application, you agree to this privacy policy.
