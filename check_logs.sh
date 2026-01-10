#!/bin/bash
# Команды для просмотра логов Decky Loader и плагина GameSync NonSteam

echo "=== Логи Decky Loader (последние 50 строк) ==="
journalctl -u plugin_loader.service -n 50 --no-pager

echo ""
echo "=== Логи плагина GameSync NonSteam ==="
PLUGIN_LOG="$HOME/.local/share/decky-loader/plugins/gamesync-nonsteam/plugin-loader.log"
if [ -f "$PLUGIN_LOG" ]; then
    tail -n 100 "$PLUGIN_LOG"
else
    echo "Файл логов не найден: $PLUGIN_LOG"
    echo "Проверьте путь к плагину:"
    ls -la "$HOME/.local/share/decky-loader/plugins/" | grep -i gamesync
fi

echo ""
echo "=== Системные логи Python (если есть ошибки) ==="
journalctl -u plugin_loader.service | grep -i "python\|error\|exception" | tail -n 30

echo ""
echo "=== Проверка установленных Python модулей ==="
python3 -c "import email.mime; print('email.mime доступен')" 2>&1 || echo "ОШИБКА: email.mime не найден"
