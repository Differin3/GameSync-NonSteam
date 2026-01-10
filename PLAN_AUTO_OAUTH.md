# План: Автоматическое получение refresh_token

## Подход

Использовать CDP (Chrome DevTools Protocol) для мониторинга браузера Steam Deck и автоматического захвата authorization code из Google OAuth.

## Изменения

### Backend (main.py)

1. Добавить класс `GoogleOAuthMonitor` для мониторинга через CDP
2. Метод `start_google_oauth()` - генерирует OAuth URL и запускает мониторинг
3. Метод `_monitor_google_oauth()` - фоновый мониторинг для захвата code
4. Метод `exchange_code_for_token()` - обмен authorization code на refresh_token

### Backend (gdrive_provider.py)

- Добавить метод для обмена code на tokens через Google OAuth API

### Frontend (Settings.tsx)

- Кнопка "Авторизоваться автоматически"
- Открытие popup с OAuth URL
- Опрос статуса авторизации
- Автоматическое обновление refresh_token

## OAuth URL

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id={CLIENT_ID}&
  redirect_uri=http://localhost:8080/callback&
  response_type=code&
  scope=https://www.googleapis.com/auth/drive.file&
  access_type=offline&
  prompt=consent
```

## Redirect URI

**ВАЖНО**: Настройка Google Cloud Console:

## 1. Redirect URI
1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект → APIs & Services → Credentials
3. Откройте ваш OAuth 2.0 Client ID
4. В разделе "Authorized redirect URIs" нажмите "ADD URI"
5. Добавьте: `http://localhost:8080/callback`
6. Сохраните изменения

## 2. Тестовые пользователи (если приложение в режиме тестирования)
1. APIs & Services → OAuth consent screen
2. В разделе "Test users" нажмите "ADD USERS"
3. Добавьте email вашего Google аккаунта
4. Сохраните изменения

**Примечание:** Если приложение в режиме тестирования, только добавленные тестовые пользователи смогут авторизоваться. Для публичного доступа нужно опубликовать приложение (требует верификации Google).

После настройки автоматическая авторизация будет работать через CDP мониторинг браузера Steam Deck.

## Создание приложения в Google Cloud Console

**Важно:** Каждый пользователь должен создать своё приложение. Это требуется для безопасности.

### Быстрая инструкция:

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект (или выберите существующий)
3. APIs & Services → Enable APIs → включите "Google Drive API"
4. APIs & Services → Credentials → Create Credentials → OAuth client ID
5. Тип приложения: "Web application"
6. Название: "GameSync NonSteam" (или любое другое)
7. Authorized redirect URIs: `http://localhost:8080/callback`
8. Сохраните и скопируйте Client ID и Client Secret
9. OAuth consent screen → Publishing status: "Testing"
10. OAuth consent screen → Test users → ADD USERS → добавьте ваш email
11. Сохраните изменения

### Альтернатива: Использование готового приложения

Если разработчик создаст публичное приложение и опубликует его, пользователи смогут использовать готовые Client ID и Client Secret без создания своего приложения. Но это требует верификации Google и публикации приложения.
