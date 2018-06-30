/*
 * HYNE.js
 *
 *      Level module
 *
 */
window.Sylx.Tileset = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables 

    
    
    // Base level pseudoclass

    var baseTilesetPrototype = Object.assign(Object.create(Sylx.game()), {
        getTileData: function (index) {
            return this.data[index];
        },
        getTileProperties: function (key) {
            if (typeof key === 'number')
                return this.type[this.data[key]];
            else
                return this.type[key];
        },
        drawTile: function (index, ctx, x, y) {
            // get tile
            var tile = this.data[index].tile;
            // find position
            var clipX = tile * this.tileSize.x;
            // render
            if (this.image.data.complete)
                ctx.drawImage(
                    this.image.data,
                    clipX,
                    0,
                    this.tileSize.x,
                    this.tileSize.y,
                    x,
                    y,
                    this.tileSize.x,
                    this.tileSize.y
                );
        }
    });



    // Exportable object

    var $tileset = {
        create: function (tilesetObject) {
            var newTileset = Object.assign(Object.create(baseTilesetPrototype), tilesetObject);
            Sylx.log("Sylx.Tileset: Created new tileset", tilesetObject.name);
            if (!newTileset.data) window.console.warn("No data was provided for the tileset.");
            return newTileset;
        }
    };



    // Export
    return $tileset;



})(window, window.Sylx);
