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
    /**
     * Initializes the keyboard listeners
     */
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
        /**
         * Sets key bindings
         * @param {object} keysObject Object containing all the keys to bind
         */
        bind: function (keysObject) {
            for (var key in keysObject)
                bindings[keysObject[key]] = key;

            if (!isKeyInit) initKeyboard();
        },
        /**
         * Checks if a key was pressed on this frame
         * @param   {string}  key The key to check
         * @returns {boolean} If the key was pressed on this frame
         */
        pressed: function (key) {
            return keys.pressed[key];
        },
        /**
         * Checks if a key is being held down
         * @param   {string}  key The key to chec
         * @returns {boolean} If the key is being held down
         */
        down: function (key) {
            return keys.down[key];
        },
        /**
         * Runs logic to update key state
         * Called by the main game loop automatically on every frame
         */
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
