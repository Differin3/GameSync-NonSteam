# Решение проблем

Здесь собраны ошибки, которые уже встречались на реальном Steam Deck, и что с ними делать.
Логи плагина: `~/homebrew/logs/gamesync-nonsteam/` (самый свежий файл), логи Decky:
`journalctl -u plugin_loader` (нужен sudo).

## `No module named 'requests'` / зависимости не ставятся

Симптом: в логе `Error syncing game: No module named 'requests'` и
`PermissionError: ... plugins/gamesync-nonsteam/py_modules`.

Причина: Decky устанавливает плагин от root, поэтому папка плагина принадлежит root,
и запись в `<plugin>/py_modules` невозможна.

Что сделано (0.4.1): зависимости ставятся в `DECKY_PLUGIN_RUNTIME_DIR` —
`~/homebrew/data/gamesync-nonsteam/py_modules`, а если его нет, в
`~/.local/share/gamesync/py_modules`. `pip` на SteamOS ставится из wheel,
встроенного в `ensurepip` (системный PEP 668 запрещает обычную установку).

Проверить вручную:

```bash
ls ~/homebrew/data/gamesync-nonsteam/py_modules
PYTHONPATH=~/homebrew/data/gamesync-nonsteam/py_modules python3 -c "import requests; print(requests.__version__)"
```

Если каталог пуст, перезапустите плагин (Decky → GameSync → Reload) или Decky целиком:
`sudo systemctl restart plugin_loader`.

## `CERTIFICATE_VERIFY_FAILED` при скачивании Ludusavi

Симптом: `Failed to download Ludusavi manifest: [SSL: CERTIFICATE_VERIFY_FAILED]`.

Причина: Python на SteamOS не находит системный CA-бандл (`/etc/ssl/cert.pem`
отсутствует, а `capath` пуст).

Что сделано (0.4.1): при старте плагин выставляет `SSL_CERT_FILE` и
`REQUESTS_CA_BUNDLE` на `/etc/ssl/certs/ca-certificates.crt`, а загрузчик
манифеста создаёт SSL-контекст с этим файлом явно.

Проверить:

```bash
python3 -c "import ssl; print(ssl.get_default_verify_paths())"
ls -l /etc/ssl/certs/ca-certificates.crt
```

## Яндекс Диск: `HTTP 401`

Симптом: «Тест подключения» возвращает `HTTP 401`, синхронизация не идёт.

Причины по убыванию вероятности:

1. **Пароль приложения отозван или создан для другого сервиса.** Нужен пароль
   приложения именно «WebDAV»: Яндекс ID → Безопасность → Пароли приложений.
2. **Нет подписки Яндекс 360.** С 22.06.2026 WebDAV на Яндекс Диске доступен
   только с подпиской 360 — без неё сервер отвечает отказом.
3. В поле логина указан полный адрес `user@yandex.ru` вместо логина без домена.

Бесплатная альтернатива — Облако Mail.ru (`https://webdav.cloud.mail.ru`,
логин — полный адрес почты, пароль — пароль аккаунта или приложения).

## `HTTP 404` / `409` при загрузке

- `404` — неверный URL WebDAV (проверьте путь: у Nextcloud он вида
  `https://server/remote.php/dav/files/USERNAME/`).
- `409` — сервер не дал создать папку. Плагин создаёт `GameSync` и
  `GameSync/<Игра>` по сегментам; если ошибка остаётся, создайте папку `GameSync`
  вручную в веб-интерфейсе облака.

## Строка GameSync не появилась на странице игры

- Строка показывается только для игр, которые плагин нашёл как PortProton
  (есть префикс и сопоставление по appid/названию). Для обычных Steam-игр её нет.
- Если не появилась и для non-Steam игры: откройте страницу заново (патч
  применяется при рендере), проверьте `~/homebrew/logs/gamesync-nonsteam/` на
  сообщения `[GameSync]`, и пришлите лог — структура страницы в Steam меняется
  между версиями.

## Сборка ZIP на Windows

`build.bat` раньше копировал `__pycache__` в архив и раздувал его в 2–3 раза
(в 0.4.1 исправлено). Если архив неожиданно большой:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z=[System.IO.Compression.ZipFile]::OpenRead('gamesync-nonsteam.zip')
($z.Entries | Where-Object { $_.FullName -match '__pycache__' }).Count
$z.Dispose()
```
