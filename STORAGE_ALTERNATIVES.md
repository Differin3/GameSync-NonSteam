# Альтернативы хранилищам для упрощения настройки

## Текущая ситуация: Google Drive
- **Сложность:** Высокая (OAuth 2.0, создание приложения в Google Cloud Console)
- **Плюсы:** Бесплатно, 15GB, популярное
- **Минусы:** Сложная настройка OAuth

---

## Варианты упрощения

### 1. **WebDAV** ⭐ Рекомендуется
**Сложность:** Низкая (логин/пароль)

**Плюсы:**
- Простая авторизация (логин/пароль)
- Поддерживается многими хостингами:
  - Nextcloud (бесплатно, можно свой сервер)
  - ownCloud
  - Synology NAS
  - Yandex Disk (есть WebDAV)
  - Box.com
  - 4shared
- Стандартный протокол HTTP
- Не нужен OAuth

**Минусы:**
- Нужен хостинг с WebDAV (или свой сервер)
- Меньше бесплатных вариантов

**Реализация:**
```python
# Простой HTTP PUT/DELETE/GET
import requests
requests.put(url, data=file_content, auth=(username, password))
```

---

### 2. **Backblaze B2** ⭐ Простое
**Сложность:** Низкая (Application Key ID + Application Key)

**Плюсы:**
- Очень простая авторизация (2 ключа)
- 10GB бесплатно, потом $0.005/GB/месяц
- S3-совместимый API
- Быстрое и надежное

**Минусы:**
- Меньше известен чем Google Drive
- Нужна регистрация на Backblaze

**Реализация:**
```python
# Просто ключи доступа
import boto3
s3 = boto3.client('s3', 
    endpoint_url='https://s3.us-west-000.backblazeb2.com',
    aws_access_key_id=key_id,
    aws_secret_access_key=key)
```

---

### 3. **SFTP/SSH**
**Сложность:** Низкая (логин/пароль или SSH ключ)

**Плюсы:**
- Очень простой
- Много бесплатных хостингов
- Безопасный (SSH)

**Минусы:**
- Нужен SSH сервер
- Меньше удобства для обычных пользователей

**Реализация:**
```python
import paramiko
sftp = paramiko.SFTPClient.from_transport(transport)
sftp.put(local_path, remote_path)
```

---

### 4. **Mega.nz**
**Сложность:** Средняя (логин/пароль, но есть API)

**Плюсы:**
- 20GB бесплатно
- Есть Python библиотека
- Шифрование

**Минусы:**
- API требует регистрации приложения (но проще чем Google)
- Ограничения на бесплатный аккаунт

---

### 5. **OneDrive / Dropbox**
**Сложность:** Высокая (тоже OAuth 2.0)

**Минусы:**
- Такая же сложность как Google Drive
- Не упрощает процесс

---

## Рекомендация

### Вариант A: WebDAV (самый простой для пользователя)
1. Пользователь регистрируется на Nextcloud.com (бесплатно)
2. Создает логин/пароль
3. Вводит URL WebDAV, логин, пароль в плагин
4. Готово!

**Пример настройки:**
- URL: `https://nextcloud.com/remote.php/dav/files/USERNAME/`
- Логин: `username@email.com`
- Пароль: `password`

### Вариант B: Backblaze B2 (простое и дешевое)
1. Регистрация на Backblaze.com
2. Создание Bucket
3. Получение Application Key ID и Application Key
4. Ввод в плагин
5. Готово!

---

## План реализации

### Шаг 1: Абстракция провайдера
Создать базовый класс `StorageProvider` с методами:
- `upload_file(local_path, remote_path)`
- `download_file(remote_path, local_path)`
- `list_files(folder)`
- `get_file_info(remote_path)`

### Шаг 2: Реализация WebDAV провайдера
```python
class WebDAVProvider(StorageProvider):
    def __init__(self, url, username, password):
        self.url = url
        self.auth = (username, password)
```

### Шаг 3: Добавить выбор провайдера в UI
- Выпадающий список: "Google Drive" / "WebDAV" / "Backblaze B2"
- Поля настроек меняются в зависимости от выбора

### Шаг 4: Обновить синхронизацию
Использовать выбранный провайдер вместо жестко заданного Google Drive

---

## Сравнение сложности настройки

| Хранилище | Шагов настройки | Нужен OAuth | Нужно создавать приложение |
|-----------|----------------|-------------|---------------------------|
| **WebDAV** | 3 | ❌ | ❌ |
| **Backblaze B2** | 4 | ❌ | ❌ |
| **SFTP** | 3 | ❌ | ❌ |
| **Mega.nz** | 5 | ⚠️ (проще) | ⚠️ (проще) |
| **Google Drive** | 10+ | ✅ | ✅ |

---

## Вывод

**WebDAV** - лучший вариант для упрощения:
- Минимум настроек
- Много бесплатных хостингов
- Стандартный протокол
- Без OAuth

Можно добавить поддержку нескольких провайдеров и дать пользователю выбор.
