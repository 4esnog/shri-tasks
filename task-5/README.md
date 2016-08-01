# Оптимизация Lifehacker.ru

* JS

  ```html
  <head>
  ...
  <script type='text/javascript' src='https://lifehacker.ru/wp-content/plugins/lh-send-typo/js/app.js?ver=1.5'></script>
  <script type='text/javascript' src='https://lifehacker.ru/wp-content/plugins/lh-social-slider/assets/js/common.js?ver=1.8'></script>
  <script type='text/javascript' src='https://lifehacker.ru/wp-content/themes/lifehacker/static/js/adfox.asyn.code.ver3.js?ver=3.0'></script>
  <script type='text/javascript' src='https://lifehacker.ru/wp-content/plugins/lh-widgets/js/viewed.js?ver=1.6'></script>
  <link rel='https://api.w.org/' href='https://lifehacker.ru/wp-json/' />
  ...
  </head>
  ```

    * Следует проанализировать все скрипты и определить, все ли они вообще нужны. Скорее всего, найдется **неиспользуемый код**, который следует вообще удалить.
    * Плохо, что скрипты **разбросаны** по документу. Много в шапке, много внизу. Следует собрать их все внизу, и оставить в шапке только самые критичные.
    * По всему документу много **отдельных скриптов**, как инлайновых, так и подключенных. Следует объединить все эти кусочки. *Это снизит и размер html, т.к. в нём станет меньше тегов.*
    * Многие скрипты **не минифицированы**. Объединив файлы, нужно минифицировать их.
    * Многие из скриптов -- **синхронные**. Это блокирует отрисовку страницы. Скорее всего, большинство из них можно без последствий загружать асинхронно.
* CSS
    * Много стилей, в том числе неиспользуемых (разные версии одного и того же файла). Лишнее следует удалить или загружать только по необходимости. Остальное - объединить.
    * Многие стили не сжаты. Следует сжать.
    * Загружаются лишние глифы шрифтов (в примере ниже - расширенный греческий набор). Они не нужны и могут быть удалены.
      
      ```css
      /* greek-ext */
      @font-face {
        font-family: 'Roboto Slab';
        font-style: normal;
        font-weight: 700;
        src: local('Roboto Slab Bold'), local('RobotoSlab-Bold'), url(https://fonts.gstatic.com/s/robotoslab/v6/dazS1PrQQuCxC3iOAJFEJVT7aJLK6nKpn36IMwTcMMc.woff2) format('woff2');
        unicode-range: U+1F00-1FFF;
      }
      /* greek */
      @font-face {
        font-family: 'Roboto Slab';
        font-style: normal;
        font-weight: 700;
        src: local('Roboto Slab Bold'), local('RobotoSlab-Bold'), url(https://fonts.gstatic.com/s/robotoslab/v6/dazS1PrQQuCxC3iOAJFEJQn6Wqxo-xwxilDXPU8chVU.woff2) format('woff2');
        unicode-range: U+0370-03FF;
      }
      ```
      
    * Помимо самих стилей, загружаются и sourcemaps, которые совершенно не нужны пользователю.
* Изображения
    * Обложки статей (картинки) загружаются в **полном размере** (необрезанными). Например, на [этом](screenshots/large-img.png) скриншоте видно, что для экрана размером 332 x 561 загружается картинка 1600 x 800. Следует использовать разные размеры изображений в зависимости от экрана, что поможет ощутимо снизить трафик и время загрузки.
    * Те же картинки можно дополнительно оптимизировать с потерями, почти не заметными на глаз (снизить качество).
    * Векторная графика может быть сжата. Например, `svgo` сжал иконку x_button_blue2.svg, взятую со страницы, на 10%.
