/*
 * HYNE.js
 *
 *      Resources module
 *
 */
window.Sylx.Resource = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables
    var resources = {},
        queuedPaths = [],
        loading = false,
        internalLoad = false;



    // Private methods
    /**
     * Validates if all resources have been loaded
     * @param {function} resolve Callback function to be executed if all resources are loaded
     */
    function validateIfAllLoaded(resolve) {
        var allLoaded = true;
        for (var key in resources)
            if (!resources[key].loaded) allLoaded = false;

        if (allLoaded) {
            // important: set loading before calling resolve(), in case resolution involves loading more resources
            loading = false;
            internalLoad = false;
            if (typeof resolve === "function") resolve();
        }
    }



    /**
     * Validates if all resource corresponding to the paths in the queue have been loaded
     * @param {function} resolve Callback function to be executed if all resources are loaded
     */
    function validateIfQueueLoaded(resolve) {
        // iterate through items in queue in reverse
        for (var i = queuedPaths.length - 1; i >= 0; i--) {
            var path = queuedPaths[i];
            if (resources[path].loaded)
                queuedPaths.splice(i, 1);
        }
        if (queuedPaths.length === 0) {
            // important: set loading before calling resolve(), in case resolution involves loading more resources
            loading = false;
            internalLoad = false;
            if (typeof resolve === "function") resolve();
        }
    }



    /**
     * Determines resource type based on its extension
     * @param   {string} path   Resource path
     * @returns {string} Resource type as a string
     */
    function getResourceTypeFromPath(path) {
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



    // collection of resource types loading methods
    var loadResource = {
        /**
         * Load an image
         * @param {function} resolve [[Description]]
         * @param {function} reject  [[Description]]
         */
        image: function (resolve, reject) {
            // image
            this.data = new window.Image();
            this.data.src = this.path;
            this.data.onload = (function () {
                this.loaded = true;
                if (!internalLoad) loading = false;
                if (typeof resolve === "function") resolve(this.data);
            }).bind(this);
        },
        /**
         * Load a JSON file
         * @param {function} resolve [[Description]]
         * @param {function} reject  [[Description]]
         */
        json: function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            // this one line breaks cocoon - so lets comment it out
            //xhr.overrideMimeType("application/json");
            xhr.open('GET', this.path, true);
            xhr.responseType = 'json';

            // set the onload function
            xhr.onload = (function () {
                var status = xhr.status;
                var response = xhr.response;
                if (status === 200) {
                    this.data = response;
                    this.loaded = true;
                    if (!internalLoad) loading = false;
                    if (typeof resolve === "function") resolve(response);
                } else {
                    reject(response);
                    throw ("JSON asset " + this.path + " failed to load!", response);
                }
            }).bind(this);

            // send request -- have a safe trip, lil request!
            xhr.send();
        }
    };



    // Resource object prototype
    var resourcePrototype = {
        load: function (resolve, reject) {
            // load logic - do nothing if object is loaded already
            if (this.loaded) return this;
            
            // check for external loading (called from outside Resources object)
            if (!internalLoad) {
                if (loading) return this;
                loading = true;
            }

            // get resource type
            var resType = getResourceTypeFromPath(this.path);
            if (loadResource[resType])
                loadResource[resType].call(this, resolve, reject);
            else
                throw ("Unknown or unsupported resource type.");

            return this;
        }

    };



    // Exportable object
    var $resource = {
        /**
         * Creates a new resource object that will hold a resource in the future
         * @param   {string} path  Path to the resource to load, works as an identifier as well
         * @param   {object} props Optional props to be passed to the resource object
         * @returns {object} A new resource object
         */
        create: function (path, props) {
            // create base resource object if one doesn't exist for this path
            if (!resources[path])
                resources[path] = Object.assign(Object.create(resourcePrototype), {
                    path: path,
                    data: null,
                    loaded: false
                });
            // return
            return resources[path];
        },
        /**
         * Loads all created resource objects that haven't been loaded yet
         * @param   {function} resolve Callback function to execute once all resources have been loaded
         * @param   {function} reject  Callback function to execute if a resource fails to load
         * @returns {object}   The Resource object
         */
        loadAllCreated: function (resolve, reject) {
            // do nothing if there is a loading taking place already
            if (loading) return null;
            loading = true;
            internalLoad = true;

            // iterate and call all load methods
            for (var key in resources) {
                if (!resources[key].loaded)
                    resources[key].load(validateIfAllLoaded.bind(null, resolve), reject);
            }

            return this;
        },
        /**
         * Adds one or more paths to the resources queue
         * @returns {object} The Resource object
         */
        queue: function () {
            if (arguments.length === 0) return null;

            // go through list of arguments to preload
            for (var index = 0; index < arguments.length; index++) {
                var arg = arguments[index];

                // was a string provided? path
                if (typeof arg === 'string') {
                    if (queuedPaths.indexOf(arg) === -1)
                        queuedPaths.push(arg);
                } else if (typeof arg === 'object') {
                    if (Array.isArray(arg)) {
                        // array? recursive
                        this.queue.apply(this, arg);
                    } else if (typeof arg.path === "string") {
                        // other object? check for the path property
                        this.queue(arg.path);
                    }
                }
            }

            return this;
        },
        /**
         * Loads all resources in the queue
         * @param   {function} resolve Callback function to execute once all resources have been loaded
         * @param   {function} reject  Callback function to execute if a resource fails to load
         * @returns {object}   The Resource object
         */
        loadQueue: function (resolve, reject) {

            if (loading) return null;
            loading = true;
            internalLoad = true;

            for (var index in queuedPaths) {
                var path = queuedPaths[index];
                if (!resources[path]) this.create(path);

                if (!resources[path].loaded)
                    resources[path].load(validateIfQueueLoaded.bind(null, resolve), reject);

            }
        },
        /**
         * Checks whether resources are being loaded
         * @returns {boolean} State of loading
         */
        isLoading: function () {
            return loading;
        },
        /**
         * Returns loading progress, as a value between 0 (empty) and 1 (complete)
         * @returns {number} A number representing progress
         */
        getProgress: function() {
            if (!loading) return 0;
            return 0.5;
        },
        /**
         * Clears resources in cache
         */
        clearCache: function () {
            // find only resources that have been loaded, and delete those
            // we must hold on a reference to unloaded objects for later use
            for (var key in resources)
                if (resources[key].loaded) delete resources[key];
        }
    };



    // Export
    return $resource;



})(window, window.Sylx);
