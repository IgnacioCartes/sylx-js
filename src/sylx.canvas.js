/*
 * HYNE.js
 *
 *      Screen/display module
 *
 */
window.Sylx.Canvas = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables

    var width, height, scale;
    var canvasCollection = {};



    // Exportable object

    var $canvas = {
        /**
         * Creates the main canvas to run the game
         * @param   {object}   props - Object containing properties to create the canvas
         */
        create: function (props) {
            // create should only be ran once
            if (canvasCollection.main) {
                console.warn("$display.create should only be called once.");
                return null;
            }

            // get variables from props
            width = props.width || 320;
            height = props.height || 240;
            scale = props.scale || 1;

            // create canvas objects - main and buffer
            canvasCollection.main = setScaling(this._createCanvas(width, height, scale));
            canvasCollection.buffer = this._createCanvas(width, height, 1);

            // append
            appendTo(props.appendTo || document.body, canvasCollection.main.element);

            // set properties
            this.width = width;
            this.height = height;
            this.scale = scale;
        },
        /**
         * Gets the context of the specified canvas
         * @param   {string} canvasName - The canvas name
         * @returns {object} The canvas context if it exists
         */
        getContext: function (canvasName) {
            if (canvasCollection[canvasName]) {
                return canvasCollection[canvasName].context;
            } else {
                return null;
            }
        },
        /**
         * Clears the canvas
         * @param   {string} canvasName - The canvas name
         */
        clearCanvas: function (canvasName) {
            if (canvasCollection[canvasName]) {
                var canvas = canvasCollection[canvasName];
                //canvas.context.clearRect(0, 0, canvas.width, canvas.height);
                canvas.context.fillStyle = this.fillColor;
                canvas.context.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                return null;
            }
        },
        /**
         * Copies the buffer to the main canvas
         */
        copy: function () {
            canvasCollection.main.context.clearRect(0, 0, width, height);
            canvasCollection.main.context.drawImage(canvasCollection.buffer.element, 0, 0);
        },

        /**
         * Creates a canvas object
         * @param   {number} width  - Canvas width
         * @param   {number} height - Canvas height
         * @param   {number} scale  - Canvas scale
         * @returns {object} An object containing all of the canvas properties
         */
        _createCanvas: function (width, height, scale) {
            // create the new canvas object
            var newCanvasObject = {
                element: window.document.createElement('canvas'),
                width: width,
                height: height,
                scale: scale
            };

            // set properties
            newCanvasObject.context = newCanvasObject.element.getContext('2d');

            newCanvasObject.element.width = width;
            newCanvasObject.element.height = height;

            newCanvasObject.context.fillStyle = $canvas.fillColor;
            newCanvasObject.context.imageSmoothingEnabled = false;
            newCanvasObject.context.mozImageSmoothingEnabled = false;
            newCanvasObject.context.oImageSmoothingEnabled = false;
            newCanvasObject.context.webkitImageSmoothingEnabled = false;
            newCanvasObject.context.msImageSmoothingEnabled = false;

            // return object
            return newCanvasObject;
        },
        autoClear: true,
        autoCopy: true,
        fillColor: '#000000',
        width: null,
        height: null,
        scale: null,
        offset: {
            x: 0,
            y: 0
        }
    };



    // Private methods



    /**
     * Sets the scaling of the provided canvas object
     * @param   {object}   canvasObject - The canvas object
     * @returns {object} The canvas object
     */
    function setScaling(canvasObject) {

        if (canvasObject.scale > 1) {
            var realWidth = canvasObject.width * canvasObject.scale;
            var realHeight = canvasObject.height * canvasObject.scale;

            canvasObject.element.style.width = realWidth + 'px';
            canvasObject.element.style.height = realHeight + 'px';

            canvasObject.element.style.imageRendering = '-moz-crisp-edges';
            canvasObject.element.style.imageRendering = '-webkit-crisp-edges';
            canvasObject.element.style.imageRendering = 'pixelated';
            canvasObject.element.style.imageRendering = 'crisp-edges';

            canvasObject.element.style.msInterpolationMode = 'nearest-neighbor';
        }

        return canvasObject;

    }



    /**
     * Appends canvas to element
     * @param   {object} element - DOM element to append the canvas to
     * @param   {object} canvas  - The canvas object
     */
    function appendTo(element, canvas) {
        var el;

        // detect if provided argument was string or object
        if (typeof element === "string") {
            if ((el = window.document.getElementById(element)) === undefined) {
                window.console.error("Element \"" + element + "\" was not found!");
                return null;
            }
        } else if ((typeof element === "object") && (typeof element.appendChild === "function") && (element.nodeType)) {
            el = element;
        }

        el.appendChild(canvas);
    }



    // Export
    return $canvas;



})(window, window.Sylx);
