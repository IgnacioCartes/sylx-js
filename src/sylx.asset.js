/*
 * HYNE.js
 *
 *      Assets module
 *
 */
window.Sylx.Asset = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables

    var assetsObjectCollection = [];
    var preloadQueue = [],
        preloadQueueSize = 0;
    var cache = {};



    // Private methods

    function loadAsset(url) {
        var newImage = new window.Image();
        newImage.src = url;
        Sylx.log("Sylx.Assets: Loaded asset " + url);
        return newImage;
    }

    function preloadFromUrl(path) {
        // assuming image now

        // first, check if asset is cached already
        if (cache[path]) {
            preloadQueue.splice(preloadQueue.indexOf(path), 1);
            return cache[path];
        }

        // get new asset
        var newAsset = new window.Image();

        // set onload
        newAsset.onload = (function (path) {
            // find asset on preloading array and splice it
            preloadQueue.splice(preloadQueue.indexOf(path), 1);
            // if length is 0 then preloading is done
            if (preloadQueue.length === 0) $asset._isPreloading = false;

        }).bind(null, path);
        /*
        window.setTimeout((function (path) {
            // find asset on preloading array and splice it
            preloadQueue.splice(preloadQueue.indexOf(path), 1);
            // if length is 0 then preloading is done
            if (preloadQueue.length === 0) $asset._isPreloading = false;

        }).bind(null, path), Math.random() * 1500); // to simulate a longer load time
        */

        newAsset.src = path;
        Sylx.log("Sylx.Assets: Loaded asset " + path);
        cache[path] = newAsset;
        return newAsset;
    }


    // Exportable object
    var $asset = {
        get: function (path) {
            // actually load new asset
            // a relic from the past
            if (cache[path])
                return cache[path];
            else
                return loadAsset(path);

        },
        create: function (path, props) {
            // create base asset object
            var newAsset = Object.assign({
                path: path,
                loaded: false,
                data: null
            }, props || {});
            // see if this asset is in cache already
            if (cache[path]) {
                // "load" inmediately if true
                newAsset.data = cache[path];
                newAsset.loaded = true;
            } else {
                assetsObjectCollection.push(newAsset);
            }
            return newAsset;
        },
        queue: function () {
            if (arguments.length === 0) return null;
            // go through list of arguments to preload
            for (var index = 0; index < arguments.length; index++) {
                var asset = arguments[index];

                // was a string provided? path
                if (typeof asset === 'string') {
                    preloadQueue.push({
                        path: asset
                    });
                } else if (typeof asset === 'object') {
                    preloadQueue.push(asset);
                }
            }
        },
        preloadQueue: function () {
            // do nothing if preloading queue is empty
            if (preloadQueue.length === 0) return null;
            preloadQueueSize = preloadQueue.length;

            // mark ispreloading
            this._isPreloading = true;

            // iterate through queue
            for (var index = 0; index < preloadQueue.length; index++) {
                // run preload logic
                var path = preloadQueue[index].path;
                var data = preloadFromUrl(path);
                // find if any asset object requires this particular asset
                for (var objIndex = 0; objIndex < assetsObjectCollection.length; objIndex++) {
                    var assetObject = assetsObjectCollection[objIndex];
                    if ((assetObject.path === path) && (assetObject.loaded === false)) {
                        assetObject.data = data;
                        assetObject.loaded = true;
                        // once an asset has been loaded, this module can stop caring about it
                        assetsObjectCollection.splice(objIndex, 1);
                        break;
                    }
                }
            }
        },
        getProgress: function () {
            if (!this._isPreloading) return 1;
            return (1 - (preloadQueue.length / preloadQueueSize));
        },
        clearCache: function () {
            cache = {};
        },
        _getInfo: function () {
            return {
                assetsObjectCollection: assetsObjectCollection,
                preloadQueue: preloadQueue,
                cache: cache
            };
        },
        _isPreloading: false
    };



    // Export
    return $asset;



})(window, window.Sylx);
