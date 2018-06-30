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
        /**
         * Gets the tile data for a tile index in the tileset
         * @param   {number} index Tile index to check for
         * @returns {object} Tile data
         */
        getTileData: function (index) {
            return this.data[index];
        },
        /**
         * Gets tile properties corresponding to a specific key
         * @param   {object} key Tile key
         * @returns {object} Tile data
         */
        getTileProperties: function (key) {
            if (typeof key === 'number')
                return this.type[this.data[key]];
            else
                return this.type[key];
        },
        /**
         * Draws a tile
         * @param {number} index Index of the tile to draw
         * @param {object} ctx   Canvas context to draw tile to
         * @param {number} x     X position to draw the tile
         * @param {number} y     Y position to draw the tile
         */
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
        /**
         * Creates a new tileset
         * @param   {object} tilesetObject The object to create the tileset from
         * @returns {object} A new tileset object
         */
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
