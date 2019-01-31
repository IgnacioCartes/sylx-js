/*
 * HYNE.js
 *
 *      Screen/display module
 *
 */
window.Sylx.Canvas = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables

    var canvasCollection = {};



    // Canvas prototype
    var canvasPrototype = {
        /**
         * Clears the canvas
         * @param   {string} fillColor  An optional fill color
         */
        clear: function (fillColor) {
            this.context.fillStyle = fillColor || this.fillColor || $canvas.fillColor;
            this.context.fillRect(0, 0, this.width, this.height);
        },
        /**
         * Copies this canvas to a specified target
         * @param {object}  targetCanvasObj The target canvas object
         * @param {boolean} noClearFirst    Whether or not to leave the target canvas uncleared before copying
         */
        copyTo: function (targetCanvasObj, noClearFirst) {
            if (!noClearFirst)
                targetCanvasObj.context.clearRect(0, 0, targetCanvasObj.width, targetCanvasObj.height);
            targetCanvasObj.context.drawImage(this.element, 0, 0);
        }
    };



    // Private methods

    /**
     * Creates a canvas object
     * @param   {number} width  - Canvas width
     * @param   {number} height - Canvas height
     * @param   {number} scale  - Canvas scale
     * @returns {object} An object containing all of the canvas properties
     */
    function createCanvasObject(width, height, scale) {
        // create the new canvas object
        var newCanvasObject = Object.assign(Object.create(canvasPrototype), {
            element: window.document.createElement('canvas'),
            width: width,
            height: height,
            scale: scale
        });

        // set other properties
        newCanvasObject.context = newCanvasObject.element.getContext('2d');

        newCanvasObject.element.width = width;
        newCanvasObject.element.height = height;

        newCanvasObject.context.fillStyle = $canvas.fillColor;
        newCanvasObject.context.imageSmoothingEnabled = false;
        newCanvasObject.context.mozImageSmoothingEnabled = false;
        newCanvasObject.context.oImageSmoothingEnabled = false;
        newCanvasObject.context.webkitImageSmoothingEnabled = false;
        newCanvasObject.context.msImageSmoothingEnabled = false;

        newCanvasObject.offset = new Sylx.Point();

        // return object
        return newCanvasObject;
    }



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



    // Exportable object

    var $canvas = {
        create: function (width, height, props) {
            // Width and Height must be provided
            if (!width && !height) throw ("Must provide dimensions for canvas!");
            props = props || {};
            props.scale = props.scale || 1;

            // create canvas
            var newCanvas = setScaling(createCanvasObject(width, height, props.scale));

            // check if this is meant to be main canvas
            if (props.isMain && !canvasCollection.main) {
                // set as main, create a buffer
                canvasCollection.main = newCanvas;
                canvasCollection.buffer = createCanvasObject(width, height, 1);

                // append
                appendTo(props.appendTo || document.body, newCanvas.element);

                // set properties
                $canvas.width = width;
                $canvas.height = height;
                $canvas.scale = props.scale;
            }
            return newCanvas;
        },
        /**
         * Gets a stored canvas by name
         * @param   {string} canvasName Name of the canvas
         * @returns {object} A canvas object
         */
        get: function (canvasName) {
            if (canvasCollection[canvasName]) return canvasCollection[canvasName];
        },
        /**
         * Copies the buffer to the main canvas
         */
        copyMain: function () {
            canvasCollection.buffer.copyTo(canvasCollection.main);
        },
        autoClear: true,
        autoCopy: true,
        fillColor: '#000000',
        width: null,
        height: null,
        scale: null
    };



    // Export
    return $canvas;



})(window, window.Sylx);
