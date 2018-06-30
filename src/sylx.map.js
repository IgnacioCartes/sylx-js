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
        getTileAt: function (x, y) {
            // return 0 if out of bounds
            if ((x < 0) || (y < 0) || (x >= this.size.x) || (y >= this.size.y)) return 0;
            return (this.data[y][x]);
        }

    });



    // Private methods

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
        prerender.canvas = Sylx.Canvas._createCanvas(prerenderCanvasWidth, prerenderCanvasHeight, 1);
        prerender.topLeft = new Sylx.Point(0, 0);

        map.prerender = prerender;
    }

    function prerenderMap(map) {
        var data = map.data;
        var tileset = map.tileset;
        var prerender = map.prerender;
        for (var x = 0; x < prerender.tilesPerRow; x++) {
            for (var y = 0; y < prerender.tilesPerCol; y++) {
                tileset.drawTile(
                    map.getTileAt(x + prerender.topLeft.x, y + prerender.topLeft.y),
                    prerender.canvas.context,
                    x * prerender.tileSize.x,
                    y * prerender.tileSize.y
                );
            }
        }
    }

    function slidePrerender(direction, magnitude) {

    }




    // Exportable object

    var $map = {
        create: function (mapObject) {
            var newMap = Object.assign(Object.create(baseMapPrototype), mapObject);
            newMap.prerender = null;
            Sylx.log("Sylx.Map: Created new map", mapObject.name);
            return newMap;
        },
        _render: function (map, ctx) {
            // get map and tileset
            // if this map has a scroll property, use it - else, use the active scene scroll property
            var scroll = map.scroll || Sylx.Scene.getCurrent().scroll;

            var tileScrollX = Math.floor(scroll.x / map.tileSize.x);
            var tileScrollY = Math.floor(scroll.y / map.tileSize.y);

            // do initial prerendering if needed
            if (!map.prerender) {
                mountPrerenderCanvas(map);
                map.prerender.topLeft.x = tileScrollX;
                map.prerender.topLeft.y = tileScrollY;
                prerenderMap(map);
            }

            // detect if camera has scrolled enough (one tile) to update the prerender
            var diff = new Sylx.Point(tileScrollX - map.prerender.topLeft.x, tileScrollY - map.prerender.topLeft.y);
            if (diff.x || diff.y) {
                map.prerender.topLeft.x = tileScrollX;
                map.prerender.topLeft.y = tileScrollY;
                prerenderMap(map);
            }

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
