/*
 * HYNE.js
 *
 *      Input module
 *
 */
window.Sylx.Input = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables

    var bindings = {},
        isKeyInit = false;
    var keys = {
        down: {},
        pressed: {},
        last: {}
    };



    // Private methods
    function initKeyboard() {
        window.document.addEventListener('keydown', function (e) {
            if (bindings[e.keyCode])
                keys.down[bindings[e.keyCode]] = true;

        });

        window.document.addEventListener('keyup', function (e) {
            if (bindings[e.keyCode])
                keys.down[bindings[e.keyCode]] = false;
        });
        isKeyInit = true;
    }



    // Exportable object

    var $input = {
        bind: function (keysObject) {
            for (var key in keysObject)
                bindings[keysObject[key]] = key;

            if (!isKeyInit) initKeyboard();
        },
        pressed: function (key) {
            return keys.pressed[key];
        },
        down: function (key) {
            return keys.down[key];
        },
        _update: function () {
            // check pressed keys
            for (var key in keys.down) {
                keys.pressed[key] = (!keys.last[key] && keys.down[key]);
                keys.last[key] = keys.down[key];
            }
        }
    };



    // Export
    return $input;



})(window, window.Sylx);
