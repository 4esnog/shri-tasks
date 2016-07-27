cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-indexeddb-async/www/indexeddbshim.min.js",
        "id": "cordova-plugin-indexeddb-async.IndexedDBShim",
        "pluginId": "cordova-plugin-indexeddb-async",
        "runs": true
    },
    {
        "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "pluginId": "cordova-plugin-splashscreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "file": "plugins/cordova-plugin-splashscreen/src/browser/SplashScreenProxy.js",
        "id": "cordova-plugin-splashscreen.SplashScreenProxy",
        "pluginId": "cordova-plugin-splashscreen",
        "runs": true
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-indexeddb-async": "0.0.1",
    "cordova-plugin-whitelist": "1.2.3-dev",
    "cordova-plugin-splashscreen": "3.2.2"
}
// BOTTOM OF METADATA
});