# Макеты и скриншоты интерфейса GameSync

Статичные макеты в стиле Steam Deck (1280×800), повторяющие текущий интерфейс
плагина и концепт значка на странице non-Steam игры.

## Реальные скриншоты с Deck

Сняты через CEF DevTools прямо с работающего плагина (`Page.captureScreenshot`):

| Файл | Что показано |
|---|---|
| `shots/real-01-settings-main.png` | Настройки → Основные |
| `shots/real-02-settings-paths.png` | Настройки → Пути игр |
| `shots/real-03-settings-backups.png` | Настройки → Бэкапы |
| `shots/real-04-settings-stats.png` | Настройки → Статистика |
| `shots/real-05-qam.png` | QAM с открытым GameSync (статус, тумблер, кнопки) |
| `shots/real-06-game-row.png` | Строка GameSync на странице игры (без арта) |
| `shots/real-07-game-row-wide.png` | Строка GameSync + кнопка «Играть» (снято с Deck) |
| `shots/real-08-qam-full.png` | QAM целиком, включая панель Decky |

QAM и строка на странице игры снимаются отдельно: нужен открытый QAM/игра.

## Макеты (0.10.x)

| Файл | Что показано |
|---|---|
| `shots/10-qam.png` | QAM: статус хранилища, тумблер автосинхронизации, прогресс-бар с этапами |
| `shots/11-game-page.png` | Страница игры: строка GameSync, дата/размер/версии, кликабельное облачко |
| `shots/12-paths.png` | «Пути игр»: карточка игры, CPY-пути, предпросмотр содержимого |
| `shots/13-backups.png` | «Бэкапы»: шапка, лимит версий, чистка облака, карточки и боковая панель |
| `shots/14-stats.png` | «Статистика»: карточки, график по датам, последние синхронизации |

Исходники актуальных макетов — в `mockups/current/` (`current.css` + пять HTML).

## Ранние концепты

| Файл | Что показано |
|---|---|
| `shots/01-qam.png` | Боковое меню Decky (QAM) — первая версия |
| `shots/02-settings-main.png` | Настройки → Основные (выбор хранилища) |
| `shots/03-settings-paths.png` | Настройки → Пути игр |
| `shots/04-settings-stats.png` | Настройки → Статистика |
| `shots/05-game-page.png` | Страница non-Steam игры (концепт) |
| `shots/06-settings-backups.png` | Настройки → Бэкапы (концепт) |
| `shots/07-restore-confirm.png` | Подтверждение восстановления |
| `shots/08-qam-concept.png` | Концепт QAM «статус и три действия» |

## Исходники

- `current/` — актуальные макеты (`qam`, `game-page`, `paths`, `backups`, `stats`);
- `styles.css`, `qam.html`, `settings-*.html`, `game-page.html`, `art.svg` — ранние макеты;
- `index.html` — галерея ранних макетов.

Макеты статические: это визуальная спецификация, а не работающий плагин.
Актуальные скриншоты соответствуют реализации в `src/`.
