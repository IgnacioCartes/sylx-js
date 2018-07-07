/*
 * HYNE.js
 *
 *      Text module
 *
 */
window.Sylx.Text = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables
    var fonts = {},
        defaultFontName = null;



    // Exportable object
    var $text = {
        registerFont: function (fontName, bitmap, props) {
            // create new font object
            var newFontObject = (props) ? Object.assign({}, props) : {};

            // detect important properties
            if (!newFontObject.firstCharCode) throw ("Missing property: firstCharCode");
            if (!newFontObject.characterWidth) throw ("Missing property: characterWidth");

            // if bitmap is a string? (path)
            if (typeof bitmap === 'string') {
                newFontObject.bitmap = new window.Image();
                newFontObject.bitmap.src = bitmap;
            } else if (typeof bitmap === 'object') {
                // look for data property
                if (bitmap.data) newFontObject.bitmap = bitmap.data;
            } else {
                throw ("Unknown bitmap format provided.");
            }

            // default?
            if (props.setAsDefault)
                defaultFontName = fontName;

            // push to fonts object
            fonts[fontName] = newFontObject;

        },
        renderText: function (text, x, y, context, props) {
            // format props
            props = props || {};

            // prepare text
            var textToRender = (typeof text === 'string') ? text : text.toString();
            if (!props.noTrim) textToRender = textToRender.trim();

            // get bitmap font
            var font = (props.font ? fonts[props.font] : fonts[defaultFontName]);
            
            // loop through characters
            for (var i = 0; i < textToRender.length; i++) {
                // ignore characters not contained in imageFont
                var char = textToRender.charCodeAt(i);
                if ((char >= font.firstCharCode) && (char <= font.lastCharCode)) {
                    // render character
                    context.drawImage(
                        font.image,
                        (char - font.firstCharCode) * font.characterWidth,
                        0,
                        font.characterWidth,
                        font.characterHeight,
                        x + (i * font.characterWidth),
                        y,
                        font.characterWidth,
                        font.characterHeight
                    );
                }
            }

        },
        createPrerenderImage: function () {}
    };



    // Export
    return $text;



})(window, window.Sylx);
