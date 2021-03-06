/*
 * HYNE.js
 *
 *      Level module
 *
 */
window.Sylx.Map = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables 



    // Base level pseudoclass

    var baseMapPrototype = Object.assign(Object.create(Sylx.game()), {
        /**
         * Gets the tile data at a specific position on this map
         * @param   {number} x The x tile position to check for
         * @param   {number} y The y tile position to check for
         * @returns {number} Tile index corresponding to the tile at the indicated position
         */
        getTileAt: function (x, y) {
            // return 0 if out of bounds
            if ((x < 0) || (y < 0) || (x >= this.size.x) || (y >= this.size.y)) return 0;
            return (this.data[y][x]);
        },
        /**
         * Sets the tile data at a specified position on this map
         * @param {number}  index    The tile index to set
         * @param {number}  x        The x tile position to set
         * @param {number}  y        The y tile position to set
         * @param {boolean} noRender Whether or not to render this tile inmediately
         */
        setTile: function (index, x, y, noRender) {
            // ignore if out of bounds
            if ((x < 0) || (y < 0) || (x >= this.size.x) || (y >= this.size.y)) return null;
            this.data[y][x] = index;
            // check noRender
            if (!noRender) {
                // if prerender is not ready, cancel and warn
                if (!this.prerender) {
                    console.warn("Tried to draw to map while prerender is not ready!");
                    return;
                }
                // check if this tile position is inside the prerender canvas area
                var px = (x - this.prerender.topLeft.x) * this.prerender.tileSize.x,
                    py = (y - this.prerender.topLeft.y) * this.prerender.tileSize.y;
                if ((px >= 0) && (py >= 0) && (px < this.prerender.canvas.width) && (py < this.prerender.canvas.height))
                    drawTileToPrerender(this, index, px, py);
            }

        }

    });



    // Private methods

    /**
     * Creates a new canvas used to prerender maps
     * @param {object} map The map object
     */
    function mountPrerenderCanvas(map) {
        // calculate how big the prerender map must be
        var prerender = {};
        prerender.tilesPerRow = Math.ceil(Sylx.Canvas.width / map.tileSize.x) + 1;
        prerender.tilesPerCol = Math.ceil(Sylx.Canvas.height / map.tileSize.y) + 1;
        prerender.tileSize = map.tileSize;
        // get smallest canvas size that can contain enough tiles to fit the screen, and then add one row and one column on each edge
        // create prerender canvas
        var prerenderCanvasWidth = prerender.tilesPerRow * map.tileSize.x;
        var prerenderCanvasHeight = prerender.tilesPerCol * map.tileSize.y;
        prerender.canvas = Sylx.Canvas.create(prerenderCanvasWidth, prerenderCanvasHeight);
        prerender.topLeft = new Sylx.Point(0, 0);
        map.prerender = prerender;
    }

    /**
     * Prerenders a map to a prerender canvas
     * @param {object} map The map object
     */
    function prerenderMap(map) {
        var data = map.data;
        var tileset = map.tileset;
        var prerender = map.prerender;
        for (var x = 0; x < prerender.tilesPerRow; x++) {
            for (var y = 0; y < prerender.tilesPerCol; y++) {
                drawTileToPrerender(
                    map,
                    map.getTileAt(x + prerender.topLeft.x, y + prerender.topLeft.y),
                    x * prerender.tileSize.x,
                    y * prerender.tileSize.y
                );
            }
        }
    }

    /**
     * Draws specified tile in map to its prerender canvas
     * @param {object} map   The map object
     * @param {number} index Time index to draw
     * @param {number} x     X position to draw the tile to
     * @param {number} y     Y position to draw the tile to
     */
    function drawTileToPrerender(map, index, x, y) {
        // render
        if (map.tileset.data)
            if (map.tileset.data.complete)
                map.prerender.canvas.context.drawImage(
                    map.tileset.data,
                    index * map.tileSize.x,
                    0,
                    map.tileSize.x,
                    map.tileSize.y,
                    x,
                    y,
                    map.tileSize.x,
                    map.tileSize.y
                );
    }

    /*
    // keep this function around - maybe later down the road, with bigger maps this method of rendering maps 
    function slidePrerender(map, sX, sY) {
        if ((sX === 0) && (sY === 0)) return null;

        var leftBound = 0,
            rightBound = map.prerender.canvas.width,
            upBound = 0,
            downBound = map.prerender.canvas.height;

        // slide is negative (left/west or up/north)
        if (sX < 0) rightBound += sX;
        if (sY < 0) downBound += sY;

        // slide is positive (right/east or down/south)
        if (sX > 0) leftBound += sX;
        if (sY > 0) upBound += sY;

        // |1234| ->
        //  |2345|
        console.log(leftBound, upBound, rightBound - leftBound, downBound - upBound);

        map.prerender.canvas.context.drawImage(
            map.prerender.canvas.element,
            leftBound,
            upBound,
            rightBound - leftBound,
            downBound - upBound,
            0,
            0,
            rightBound - leftBound,
            downBound - upBound
        );
    }
    */



    // Exportable object

    var $map = {
        /**
         * Creates a new map
         * @param   {object} mapObject Map object to create the map from
         * @returns {object} The new map
         */
        create: function (mapObject) {
            var newMap = Object.assign(Object.create(baseMapPrototype), mapObject);
            newMap.prerender = null;
            // if there is a map size but not actual map data property, create an empty map
            if (newMap.size && !newMap.data) {
                newMap.data = new Array(newMap.size.y);
                for (var y = 0; y < newMap.size.y; y++)
                    newMap.data[y] = new Array(newMap.size.x).fill(0);
            }
            Sylx.log("Sylx.Map: Created new map", mapObject.name);
            return newMap;
        },
        /**
         * Render the map
         * @param {object} map The map object to render
         * @param {object} ctx Canvas context to render to
         */
        render: function (map, ctx) {
            // validate tileset data
            if (!map.tileset || !map.tileSize) return null;

            // if this map has a scroll property, use it - else, use the active scene scroll property
            var scroll = map.scroll || Sylx.Scene.getCurrent().scroll;

            var tileScrollX = Math.floor(scroll.x / map.tileSize.x);
            var tileScrollY = Math.floor(scroll.y / map.tileSize.y);

            // do initial canvas creation and prerendering if needed
            if (!map.prerender) {
                mountPrerenderCanvas(map);
                map.prerender.topLeft.x = tileScrollX;
                map.prerender.topLeft.y = tileScrollY;
                prerenderMap(map);
            }

            // detect if camera has scrolled enough (one tile) to update the prerender
            var diff = new Sylx.Point(tileScrollX - map.prerender.topLeft.x, tileScrollY - map.prerender.topLeft.y);
            if (diff.x || diff.y) {
                //slidePrerender(map, diff.x * map.tileSize.x, diff.y * map.tileSize.y);
                map.prerender.topLeft.x = tileScrollX;
                map.prerender.topLeft.y = tileScrollY;
                prerenderMap(map);
            }

            // set opacity
            if (typeof map.opacity === 'number')
                ctx.globalAlpha = map.opacity;
            else
                ctx.globalAlpha = 1.0;

            // copy map
            ctx.drawImage(
                map.prerender.canvas.element,
                scroll.x % map.tileSize.x, scroll.y % map.tileSize.y,
                Sylx.Canvas.width, Sylx.Canvas.height,
                0, 0,
                Sylx.Canvas.width, Sylx.Canvas.height
            );
        }
    };



    // Export
    return $map;



})(window, window.Sylx);
