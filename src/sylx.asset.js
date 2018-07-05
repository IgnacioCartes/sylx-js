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

    /**
     * Loads a new asset into cache
     * @param {string}  path      Path to the asset
     * @param {boolean} isPreload Determines whether or not to attach a preload listener to this asset
     */
    function loadToCache(path, isPreload) {

        // defaults to true
        isPreload = isPreload || true;

        // get asset type
        var assetType = getAssetTypeFromPath(path);

        // prepare to load asset depending on type
        if (assetType === 'image') {
            // image
            var newImage = new window.Image();
            newImage.src = path;
            if (isPreload) {
                newImage.onload = onLoadAsset.bind(null, path, newImage);
            } else {
                cache[path] = newImage;
            }
            return newImage;
        } else if (assetType === 'json') {
            // json
            var xhr = new XMLHttpRequest();
            // this one line breaks cocoon - so lets comment it out
            //xhr.overrideMimeType("application/json");
            xhr.open('GET', path, true);
            xhr.responseType = 'json';

            // set the onload function
            // JSON assets will ALWAYS call a callback, regardless of what isPreload is set to
            xhr.onload = function () {
                var status = xhr.status;
                var response = xhr.response;
                if (status === 200) {
                    onLoadAsset(path, response);
                } else {
                    throw ("JSON asset " + path + " failed to load!", response);
                }
            };

            // send request -- have a safe trip, lil request!
            xhr.send();
        }
    }

    /**
     * Function passed to onload method for assets to track when they're loading
     * @param {string} path Asset path
     * @param {object} data Actual asset object
     */
    function onLoadAsset(path, data) {
        cache[path] = data;
        // find asset on preloading array and splice it
        preloadQueue.splice(preloadQueue.indexOf(path), 1);
        // if length is 0 then preloading is done
        if (preloadQueue.length === 0) updateAllLoadedAssets();
    }

    /**
     * Updates asset objects when all preloads are finished, fetching from cache object
     */
    function updateAllLoadedAssets() {
        // update asset objects
        for (var objIndex = 0; objIndex < assetsObjectCollection.length; objIndex++) {
            var assetObject = assetsObjectCollection[objIndex];
            // is this asset object referencing something we have in cache?
            var requestedPath = assetObject.path;
            if (cache[requestedPath]) {
                assetObject.data = cache[requestedPath];
                assetObject.type = getAssetTypeFromPath(requestedPath);
                assetObject.loaded = true;
                // once an asset has been loaded, this module can stop caring about it
                assetsObjectCollection.splice(objIndex, 1);
                break;
            }
        }

        // set property to let the main game module know we're done here
        $asset._isPreloading = false;
    }

    /**
     * Preloads an asset defined in the preload queue
     * Also sets an event to remove the asset from the queue once it has been loaded
     * @param   {string} path   - The path to the asset to load
     * @returns {object} The loaded asset
     */
    function preloadFromUrl(path) {
        // first, check if asset is cached already
        if (cache[path]) {
            preloadQueue.splice(preloadQueue.indexOf(path), 1);
            return cache[path];
        }

        // get new asset
        var newAsset = loadToCache(path, true);
        return newAsset;
    }

    /**
     * Determines asset type based on its extension
     * @param   {string} path   Asset path
     * @returns {string} Asset type as a string
     */
    function getAssetTypeFromPath(path) {
        // get file extension
        var a = path.split("."),
            ext;
        if (a.length === 1 || (a[0] === "" && a.length === 2)) {
            ext = "";
        } else {
            ext = a.pop().toLowerCase();
        }

        // determine extension
        switch (ext) {
            case "png":
            case "gif":
            case "jpg":
                return "image";
            case "json":
                return "json";
        }

    }


    // Exportable object
    var $asset = {
        /**
         * Creates a new asset object that will hold an asset in the future
         * @param   {path}   path  Path to the asset to load
         * @param   {object} props Optional props to be passed to the asset object
         * @returns {object} A new asset object
         */
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
                newAsset.type = getAssetTypeFromPath(path);
                newAsset.loaded = true;
            } else {
                assetsObjectCollection.push(newAsset);
            }
            return newAsset;
        },
        /**
         * Gets an asset directly from cache
         * @param   {string} path Asset path
         * @returns {object} The asset if it exists, else it returns null
         */
        getFromCache: function (path) {
            if (cache[path])
                return cache[path];
            else
                return null;
        },
        /**
         * Adds one or more assets to the preload queue
         */
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
                    // array?
                    if (Array.isArray(asset)) {
                        // recursive
                        this.queue.apply(this, asset);
                    } else {
                        preloadQueue.push(asset);
                    }
                }
            }
        },
        /**
         * Initializes the preloading of assets in the queue
         */
        preloadQueue: function () {
            // do nothing if preloading queue is empty
            if (preloadQueue.length === 0) return null;
            preloadQueueSize = preloadQueue.length;

            // mark ispreloading
            this._isPreloading = true;

            // iterate through queue
            for (var index = 0; index < preloadQueue.length; index++)
                // run preload logic
                preloadFromUrl(preloadQueue[index].path);

        },
        /**
         * Gets the preloading progress
         * @returns {number} A number from 0 to 1 indicating progress
         */
        getProgress: function () {
            if (!this._isPreloading) return 1;
            return (1 - (preloadQueue.length / preloadQueueSize));
        },
        /**
         * Clears loaded assets cache
         */
        clearCache: function () {
            cache = {};
        },
        _isPreloading: false
    };



    // Export
    return $asset;



})(window, window.Sylx);
