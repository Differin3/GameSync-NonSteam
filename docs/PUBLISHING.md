# Публикация в магазине Decky (plugins.deckbrew.xyz)

Плагин готов к подаче: код открыт, есть лицензия и `pnpm-lock.yaml`, сборка
проходит, протестирован на SteamOS. Ниже — как это работает и что сделать.

## Как устроен магазин

- Каталог: <https://plugins.deckbrew.xyz> (тестовая площадка —
  <https://testing.deckbrew.xyz>).
- Плагины не загружаются вручную: они лежат в
  [SteamDeckHomebrew/decky-plugin-database](https://github.com/SteamDeckHomebrew/decky-plugin-database)
  как **git-submodule** в папке `plugins/<имя>`.
- Подача = Pull Request с сабмодулем, указывающим на конкретный коммит вашего
  публичного репозитория.
- После проверки PR попадает на тестовый сервер, затем (после тестирования на
  Steam Deck) — в основной магазин.

Официальные инструкции:
[Submitting Plugins](https://github.com/steamdeckhomebrew/wiki/blob/main/plugin-dev/submitting-plugins.md),
[Review Process](https://github.com/steamdeckhomebrew/wiki/blob/main/plugin-dev/review-and-testing.md).

## Требования (и наш статус)

| Требование | Статус |
|---|---|
| Публичный репозиторий, без «чёрных ящиков» и обфускации | ✅ GitHub `Differin3/GameSync-NonSteam` |
| Лицензия `LICENSE` или `LICENSE.MD` | ✅ MIT |
| `pnpm-lock.yaml` с `lockfileVersion: 9.0` | ✅ добавлен |
| `package.json`: имя в нижнем регистре, без пробелов | ✅ `gamesync-nonsteam` |
| `plugin.json` с `api_version` и блоком `publish` | ✅ `publish`: tags/description/image |
| Плагин не использует LLM/AI-код | ✅ |
| Нет ссылок на keyshops | ✅ |
| Тестирование на SteamOS | ✅ тестировали на Stable; для Python-бэкенда достаточно Stable/Beta |
| Нет лишних `backend/`, `assets/`, `defaults/` | ✅ `backend` используется, из `assets` нужен только `icon.png` |

## Имя в магазине

В магазине уже есть плагин **Game Sync** (`AkazaRenn/SDH-GameSync`, форк Decky
Cloud Save). Чтобы не путать пользователей, для подачи используется имя
**GameSync PortProton** (`plugin.json → name`). Внутренние имена (папка
`gamesync-nonsteam`, ZIP) не меняются, чтобы не ломать обновления.

## Проверки, которые пройдёт ревьюер

1. Сабмодуль в `.gitmodules` и папка `plugins/<имя>` существуют.
2. `pnpm-lock.yaml` — `lockfileVersion: 9.0` (иначе падает CI базы).
3. В `package.json` нет `remote-binary`, зависимости — обычные npm-пакеты.
4. Просмотр кода: нет вредоносного поведения и скрытой загрузки кода.
   У нас есть **два сетевых обращения**, которые нужно явно упомянуть в PR:
   - Ludusavi-манифест: `raw.githubusercontent.com/mtkennerly/ludusavi-manifest`;
   - установка Python-зависимостей с PyPI при первом запуске
     (`requests`, `boto3`, `paramiko`, `psutil`, `PyYAML`).
5. Неиспользуемые `backend/assets/defaults` удалены; `assets/icon.png` нужен.

## Пошаговая подача

1. Убедиться, что в `main` запушен финальный коммит и он собирается:
   ```bash
   npm run build
   bash -c 'python -m unittest discover -s tests'
   ```
2. Форк базы плагинов:
   ```bash
   git clone git@github.com:<ваш-логин>/decky-plugin-database.git
   cd decky-plugin-database
   git remote add upstream https://github.com/SteamDeckHomebrew/decky-plugin-database.git
   git fetch upstream
   git checkout -b add-gamesync-portproton upstream/main
   ```
3. Добавить сабмодуль на конкретный коммит:
   ```bash
   git submodule add https://github.com/Differin3/GameSync-NonSteam.git plugins/gamesync-portproton
   cd plugins/gamesync-portproton
   git checkout <commit-sha>
   cd ../..
   git add .gitmodules plugins/gamesync-portproton
   git commit -m "Add GameSync PortProton"
   ```
4. Запушить ветку и открыть PR в `SteamDeckHomebrew/decky-plugin-database`
   (в описании — что делает плагин, какие внешние URL используются).
5. Дождаться ревью: PR попадёт на `testing.deckbrew.xyz`, затем начнётся
   тестирование. Нужно, чтобы кто-то на Steam Deck проверил установку,
   синхронизацию и восстановление на Stable/Beta.
6. После одобрения плагин появится в основном магазине.

## Обновления

Новая версия = новый коммит в нашем репозитории, затем в базе:

```bash
cd plugins/gamesync-portproton
git fetch origin
git checkout <new-commit-sha>
cd ../..
git add plugins/gamesync-portproton
git commit -m "Update GameSync PortProton to 0.11.0"
```

и снова PR. Версию в `package.json`/`CHANGELOG.md` поднимать заранее.

## Риски ревью и что можно улучшить

- **Установка pip-зависимостей при запуске.** Формально разрешена (так делают
  многие плагины), но ревьюер может попросить обоснование. Альтернатива —
  поставлять зависимости в `py_modules` внутри ZIP (сильно увеличит размер:
  boto3 + paramiko ≈ 30–40 МБ).
- **Мин­ифицированный JS.** Сборка Rollup может быть минифицирована; для
  плагинов это допустимо, но лучше собирать без минификации (по умолчанию
  `@decky/rollup` не минифицирует `dist/index.js`).
- **Сетевые URL** (Ludusavi, PyPI) нужно перечислить в PR — это ускорит ревью.

## Чек-лист перед PR

- [x] `LICENSE` (MIT)
- [x] `pnpm-lock.yaml` (`9.0`)
- [x] `plugin.json → publish` (tags, description, image)
- [x] Имя не конфликтует с существующим «Game Sync»
- [x] `assets/icon.png` — единственный файл в `assets`
- [x] Нет неиспользуемых `backend/`/`defaults/`
- [x] Тесты (76) и сборка проходят
- [ ] Протестировано на Stable/Beta другим человеком (требование ревью)
