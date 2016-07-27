cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "pluginId": "cordova-plugin-splashscreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-indexeddb-async": "0.0.1",
    "cordova-plugin-splashscreen": "3.2.2",
    "cordova-plugin-whitelist": "1.2.3-dev"
}
// BOTTOM OF METADATA
});