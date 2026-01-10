@echo off
REM Команды для просмотра логов на Windows (для тестирования перед установкой на Steam Deck)

echo === Проверка структуры плагина ===
if exist dist\index.js (
    echo [OK] dist\index.js найден
) else (
    echo [ERROR] dist\index.js не найден
)

if exist backend\main.py (
    echo [OK] backend\main.py найден
) else (
    echo [ERROR] backend\main.py не найден
)

if exist main.py (
    echo [OK] main.py найден
) else (
    echo [ERROR] main.py не найден
)

echo.
echo === Команды для Steam Deck (выполните по SSH) ===
echo.
echo 1. Просмотр логов Decky Loader:
echo    journalctl -u plugin_loader.service -n 50 --no-pager
echo.
echo 2. Просмотр логов плагина:
echo    tail -n 100 ~/.local/share/decky-loader/plugins/gamesync-nonsteam/plugin-loader.log
echo.
echo 3. Проверка ошибок Python:
echo    journalctl -u plugin_loader.service ^| grep -i "python\|error\|exception" ^| tail -n 30
echo.
echo 4. Проверка модуля email.mime:
echo    python3 -c "import email.mime; print('OK')" 2^>^&1
echo.
pause
