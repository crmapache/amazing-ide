# Выпуск версии

Релиз делает скилл `/release` (`.claude/skills/release/SKILL.md`): поднимает версию,
собирает и подписывает, проверяет подпись, пишет манифест и публикует. Здесь - что
должно быть готово заранее и как это устроено.

## Один раз перед первым релизом

1. **Сертификат подписи** - [code-signing.md](code-signing.md). Создан 2026-10-16,
   копия - `amazing-ide-code-signing.p12` в корне репозитория.
2. **Публичный репозиторий релизов** `crmapache/amazing-ide-releases`, создан
   2026-10-16 (имя задано в
   `apps/desktop/package.json`, поле `amazingIde.releasesRepo`). Отдельный от кода,
   потому что качать обновления приложение должно без токена:

   ```
   gh repo create crmapache/amazing-ide-releases --public \
     --description "Amazing IDE builds"
   ```

## Что лежит в релизе

Тег `v<версия>`, три файла с фиксированными именами:

| Файл                        | Для кого                                               |
| --------------------------- | ------------------------------------------------------ |
| `amazing-ide-mac-arm64.dmg` | человек, первая установка                              |
| `amazing-ide-mac-arm64.zip` | установленная IDE, самообновление                      |
| `latest.json`               | установленная IDE: какая версия последняя и где её zip |

Приложение читает `https://github.com/<repo>/releases/latest/download/latest.json` -
GitHub сам ведёт `latest` на новейший релиз. Адрес zip внутри манифеста - на
конкретный тег, чтобы выход следующего релиза во время загрузки ничего не сломал.

Ссылка для первой установки не меняется между версиями:

```
https://github.com/crmapache/amazing-ide-releases/releases/latest/download/amazing-ide-mac-arm64.dmg
```

## Первая установка у человека

1. Скачать dmg, перетащить Amazing IDE в «Программы».
2. Один раз снять карантин: `xattr -cr "/Applications/Amazing IDE.app"`.

Дальше обновления приходят уведомлением в самой IDE.

## Проверить обновление без релиза

```
pnpm --filter @amazing-ide/desktop update:e2e
```

Собирает две версии, подписывает их одноразовым сертификатом во временной связке
ключей, поднимает манифест на `127.0.0.1:5317` и прогоняет два сценария: подделка
отвергнута, честное обновление встало и перезапустилось. Около двух минут, за собой
убирает всё. Обязателен после правок в `src/main/updates`, `electron-builder.yml` и
`scripts/write-update-manifest.mjs`.

Вручную то же самое: запустить собранную IDE с
`AMAZING_IDE_UPDATE_FEED=http://127.0.0.1:5317/latest.json` и
`AMAZING_IDE_PROFILE_DIR=<папка>` (отдельный профиль, чтобы не задеть установленную
IDE). Журнал подмены - `<профиль>/logs/update.log`, без профиля -
`~/Library/Logs/Amazing IDE/update.log`.
