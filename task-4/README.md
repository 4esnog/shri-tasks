# PhoneGap отчёт

## С чего я начинал

Ни о cordova, ни о phonegap до этого задания почти ничего не знал. Было только понятие о том, что это инструменты для создания нативных приложений на web технологиях, и больше ничего.

Заворачивать я решил один из своих недавних проектов - простой *лендинг университетского хакатона*. Из особенностей (и потенциальных проблемных мест) - форма регистрации на **ajax**, почти весь js на **jQuery**.

## Что планировал

**Минимум:** завернуть в phonegap страничку с полным сохранением всего функционала лендинга (ссылки, форма, стили).

**Дополнительно:** Добавить иконку, splashscreen, использовать indexedDB (и придумать, зачем она нужна).

## Результат

Приложение завернул. Без плагинов и дополнительных настроек сразу корректно отображалась вёрстка и работали некоторые скрипты. Ссылки не работали, форма тоже, встроенное видео с youtube видно не было. Так же не было ни иконки, ни splashscreen.
Покопавшись в настройках и плагинах, сделал всё, что задумывал.

Сделал иконку и сплэш под разные разрешения (с помощью *splashicon-generator*), настроил их в `config.xml`. Для работы сплешскринов поставил плагин `cordova-plugin-splashscreen`, добавил различные настройки `<preferences />` в config, и использовал `navigator.splashscreen.hide()` чтобы скрыть сплэш только по событию *deviceready*.

Ссылки, форму и видео починил, поставив плагин `com.indigoway.cordova.whitelist.whitelistplugin` и прописав нужные настройки `<access />` в config.xml.

Подключил и заставил работать `IndexedDB`. Правда, так и не нашёл ей применения в рамках завернутого сайта, поэтому просто открыл БД и убедился, что она создается успешно.

### Собранное приложение
[Android (.apk)](https://github.com/4esnog/shri-tasks/tree/gh-pages/task-4/hackathon/platforms/android/build/outputs/apk/)

### Скриншоты:
[SplashScreen](https://github.com/4esnog/shri-tasks/blob/gh-pages/task-4/screenshots/splash.png?raw=true)
[Иконка на Android (название - Fantastic Hackathon)](https://github.com/4esnog/shri-tasks/blob/gh-pages/task-4/screenshots/icon-on-android.png)
[Вид наверху страницу](https://github.com/4esnog/shri-tasks/blob/gh-pages/task-4/screenshots/view-top.png)
[Вид формы](https://github.com/4esnog/shri-tasks/blob/gh-pages/task-4/screenshots/view-form.png)
[Popup, всплывающий при успешной работе формы регистрации](https://github.com/4esnog/shri-tasks/blob/gh-pages/task-4/screenshots/popup.png)
[Отладка WebView через Chrome DevTools](https://github.com/4esnog/shri-tasks/blob/gh-pages/task-4/screenshots/devtools.png)

## С какими трудностями столкнулся

Всё задание стало для меня одной большой трудностью :)

Начал разбираться в phonegap с чтения доков. Поставил hello world, попробовал открыть на телефоне через phonegap developer, и не смог. *В сети Guests в переговорках такими вещами не воспользоваться.*

Стал копаться дальше в документации и туториалах phonegap'а, и быстро запутался. Поначалу не понял, как собирать приложения локально, и стал пользоваться онлайн сборкой `phonegap build`. Пользовался ей до тех пор, пока не столкнулся с проблемой подключения сторонних плагинов (IndexedDB) и отсутствием сплэшскрина в собранном приложении.

Примерно день потратил на то, чтобы найти, как собирать приложение на андроид локально, где взять SDK, скачать и обновить Java и SDK, и наконец, настроить сплэшскрин.
