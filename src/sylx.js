/*
 * HYNE.js
 *
 *      Small canvas display manager for web games.
 *      This is meant to be a lightweight library to encapsulate the most barebones display logic 
 (create an interval to draw to a canvas) allowing the actual game logic to be completely separated.
 *      It also tries to be as prototype-based as possible, being a JavaScript library and all.
 *
 *  Version Sylx 5
 *
 */

(function (window, undefined) {
    'use strict';



    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - *
     *
     * Private variables
     * 
     *  Encapsulated inside closure
     *  
     */
    var
        // Environment object - object where all user modules are loaded
        environment = {
            $global: {}
        },

        // Modules, where user modules are kept until they're fully loaded and initialized
        modules = {},

        // Dependencies queue - used during loading to ensure modules are loaded in the right order
        dependenciesQueue = {},

        // Animation frame - requestAnimationFrame id
        animationFrame = null,

        // running - boolean that indicates whether the game is running
        running = false,

        // loading - boolean that indicates whether assets are loading
        loading = false,

        // ticks - frame counter
        ticks = 0,

        // active scene - bogus scene for now
        scene = {
            entities: []
        },

        // verbose - whether to spit out verbose info when loading modules
        verbose = false;



    /**
     * window.Sylx namespace
     * 
     *  Global properties
     *  
     */
    var Sylx = {
        /**
         * Loads modules
         * @param {string} name         - Module namespace
         * @param {Array}  dependencies - Array containing all dependencies
         * @param {object} body         - Object returning the module body
         */
        module: function (name, dependencies, body) {
            if (running) throw ("Cannot add/overwrite modules when the game system is running!");

            // Create new module
            modules[name] = {
                name: name,
                dependencies: dependencies,
                body: body,
                loaded: false
            };

            // Try to execute and initialize this module
            checkForDependencies(modules[name]);
        },
        /**
         * Adds an object directly to the game environment
         * @param {string} name   - Object name
         * @param {object} object - Object to be added
         */
        addToEnvironment: function (name, object) {
            if (environment[name]) throw ("The object name " + name + " is already in use! Please make sure you're not overwriting an already imported module.");
            if (typeof object === 'object') {
                environment[name] = Object.assign(Object.create(environment), object);
            } else if (typeof object === 'function') {
                environment[name] = object;
            } else {
                environment[name] = object;
            }
        },
        /**
         * Gets game environment
         * @returns {object} - Game environment
         */
        game: function () {
            return environment;
        },
        /**
         * Basic 2D point class
         * @param {number} x
         * @param {number} y
         */
        Point: function (x, y) {
            this.x = parseInt(x) || 0;
            this.y = parseInt(y) || 0;
        },
        /**
         * Runs the game once the document is ready
         * @param {function} callback - Function to be called when the game is ready to run
         */
        run: function run(callback) {
            // check document state
            if (window.document.readyState === 'complete') {
                // run game inmediately
                callFirstFrame(callback);
            } else {
                // else wait for document to load
                window.addEventListener('load', callFirstFrame.bind(this, callback), false);
            }
        },
        /**
         * Sylx log - only when verbose is set to true
         */
        log: function log() {
            if (this.verbose)
                console.log.apply(null, arguments);
        },
        VERSION: 5,
        verbose: verbose || false
    };



    /* Private methods */

    /**
     * Check each potential module for its required dependencies
     * @param {object}   module     - The module to check
     * @param {string}   queuedFrom - String indicating if this module load was queued from another module
     */
    function checkForDependencies(module, queuedFrom) {

        // check this module's dependencies
        if (module.dependencies.length === 0) {
            // no dependencies, this module can be initialized right away
            initModule(module);
        } else {
            // check if dependencies are loaded
            var canInit = true;
            for (var index = 0; index < module.dependencies.length; index++) {
                var dependency = modules[module.dependencies[index]];
                var loadedDependency = false;
                // is dependency ready?
                if (dependency) {
                    if (dependency.loaded) {
                        loadedDependency = true;
                    }
                }
                // if not, add this module to the queue
                if (!loadedDependency) {
                    Sylx.log("Sylx: Dependency not loaded yet, adding " + module.name + " to queue");
                    dependenciesQueue[module.dependencies[index]] = dependenciesQueue[module.dependencies[index]] || [];
                    dependenciesQueue[module.dependencies[index]].push(module.name);
                    canInit = false;
                }
            }
            // if all dependencies are ready, we can init this module
            if (canInit) {
                initModule(module);
                // Remove from queue
                if (queuedFrom) {
                    dependenciesQueue[queuedFrom].splice(dependenciesQueue[queuedFrom].indexOf(module.name), 1);
                }
            }
        }
    }



    /**
     * Initializes a module once all of its dependencies have been loaded
     * @param {object} module - The module to load
     */
    function initModule(module) {

        var index = 0;
        var envModule = {};

        // call body to create a service
        Sylx.log("Sylx: Initializing module " + module.name);

        // determine whether module body was provided as an object or a function
        if (typeof module.body === 'function') {
            // functions need their dependencies to be provided
            var moduleArgs = [];
            if (module.dependencies.length) {
                for (index = 0; index < module.dependencies.length; index++) {
                    moduleArgs.push(modules[module.dependencies[index]].body);
                }
            }
            module.body = module.body.apply(environment, moduleArgs) || {};
        }

        // create new object for the module in the environment
        // set our own proto only if original object has no "custom" prototype
        if (Object.getPrototypeOf(module.body) === Object.prototype) {
            envModule = Object.assign(Object.create(environment), module.body);
        } else {
            envModule = module.body;
        }

        // determine namespacing and store new module
        var split = module.name.split('.');
        var parent = environment;
        for (index = 0; index < split.length; index++) {
            var current = split[index];
            if (parseInt(index) === (split.length - 1)) {
                parent[current] = envModule;
            } else {
                parent[current] = parent[current] || {};
                parent = parent[current];
            }
        }

        // execute the onload method if it exists and is a function
        if (typeof envModule.onload === 'function') envModule.onload();

        // flag as loaded
        module.loaded = true;

        // see if any previously loaded module was waiting for this module and try to init it
        if (dependenciesQueue[module.name]) {
            // iterate through dependencies backwards
            for (index = dependenciesQueue[module.name].length - 1; index >= 0; index--) {
                checkForDependencies(modules[dependenciesQueue[module.name][index]], module.name);
            }
        }
    }



    /**
     * Calls the first request animation frame once the game is ready to run
     * @param {function} callback - Callback function once the frame animation has been requested
     */
    function callFirstFrame(callback) {
        // warn unresolved dependencies
        if (dependenciesQueue.length > 0)
            console.warn("There is unresolved dependencies! Your game might not have loaded properly.", dependenciesQueue);
        // kickstart things
        if (typeof callback === 'function') callback.call(environment);
        running = true;
        Sylx.log("Sylx: Game is now running!");
        animationFrame = window.requestAnimationFrame(runFrame.bind(environment));
    }



    /* Private system functions */

    /**
     * Main core loop
     */
    function runFrame() {

        if (window.stats) window.stats.begin();

        // update
        // hold off from running update method while game is loading
        if (!loading) updateFrame();

        // render
        if (!loading) renderFrame();
        else renderLoading();

        // see which entities need to die (yikes)
        Sylx.Entity._cleanupKilledEntities(scene.entities);

        // see if a new scene needs to be set
        if (Sylx.Scene._scheduledSceneToSet) {
            // run exit method if one exists
            if (scene)
                if (typeof scene.exit === 'function')
                    scene.exit(environment);

            // set new scene
            scene = Sylx.Scene._scheduledSceneToSet;

            // run preload method if one exists
            if (typeof scene.preload === 'function')
                scene.preload.apply(scene, Sylx.Scene._argumentsForScene);

            // if resources were set to be loaded during the preload method, set it here to wait
            if (Sylx.Resource.isLoading())
                loading = true;
            else
                initScene();

            // clear scheduled scene
            Sylx.Scene._scheduledSceneToSet = null;
        }

        // run loading logic
        if (loading) {
            // if done loading resources, proceed with the scene init
            if (!Sylx.Resource.isLoading()) {
                loading = false;
                initScene();
            }

        }

        // tick count
        ticks++;

        if (window.stats) window.stats.end();

        if (running)
            animationFrame = window.requestAnimationFrame(runFrame.bind(environment));
    }



    /**
     * Init scene
     */
    function initScene() {

        // run init method if one exists
        if (typeof scene.init === 'function')
            scene.init.apply(scene, Sylx.Scene._argumentsForScene);

        Sylx.log("Sylx: Setting scene", (scene.name || ""));
    }



    /**
     * Main update entities game loop
     */
    function updateFrame() {
        // update inputs
        Sylx.Input._update();

        // if there is a scene active, run its update method
        if (scene) {
            if (typeof scene.update === 'function')
                scene.update(environment);

            // only update entities if scene is not marked with frozenEntities
            if (!scene.frozenEntities) {

                // iterate through entities
                for (var index = 0, len = scene.entities.length; index < len; index++) {
                    var entity = scene.entities[index];

                    // ignore if this entity is scheduled to be deleted
                    if (entity._kill) continue;

                    // run their update method
                    if (typeof entity.update === 'function') entity.update.call(entity, environment);

                    // movement component
                    if (entity.movement) Sylx.Component.System.movement(entity);

                    // animator component
                    if (entity.animator) Sylx.Component.System.animator(entity);

                    // collision component
                    if (entity.collision)
                        entity.collision.collidesWith = [];

                    if (index < len)
                        for (var j = (index + 1); j < len; j++) {
                            var entityToCheckAgainst = scene.entities[j];
                            if (entity.collision && entityToCheckAgainst.collision)
                                Sylx.Component.System.collision(entity, entityToCheckAgainst);
                        }

                }
            }
        }
    }



    /**
     * Main render entities game loop
     */
    function renderFrame() {
        // get context
        var buffer = Sylx.Canvas.get('buffer');
        var ctx = buffer.context;

        ctx.globalAlpha = 1.0;

        // clear
        if (Sylx.Canvas.autoClear) buffer.clear();

        if (scene) {

            // call renderBefore if it exists
            if (typeof scene.renderBefore === 'function')
                scene.renderBefore(ctx);

            // render maps
            if (scene.maps)
                for (var mapIndex = 0; mapIndex < scene.maps.length; mapIndex++)
                    Sylx.Map.render(scene.maps[mapIndex], ctx);

            // sort entities
            scene.entities.sort(function (a, b) {
                return a.zOrder - b.zOrder;
            });

            // iterate through entities
            for (var index = 0, len = scene.entities.length; index < len; index++) {
                var entity = scene.entities[index];

                // ignore if this entity is scheduled to be deleted
                if (entity._kill) continue;

                // sprite component - draw
                if (entity.sprite) Sylx.Component.System.sprite(entity, ctx);

                // if entity has an additional render method, call it here
                if (typeof entity.render === 'function')
                    entity.render(ctx);
            }

            // debug data
            /*
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "#cdcdcd";
            ctx.fillText(fps.value.toString() + " FPS", 16, 16);
            ctx.fillText(ticks.toString() + " ticks", 16, 28);
            ctx.fillText(scene.entities.length.toString() + " entities", 16, 40);
            ctx.fillRect(0, 0, parseInt(fps.performance * Sylx.Canvas.width), 1);
            */

            // call renderAfter if it exists
            if (typeof scene.renderAfter === 'function')
                scene.renderAfter(ctx);
        }

        // set opacity from scene if it exists
        if (typeof scene.opacity === 'number')
            Sylx.Canvas.get('main').context.globalAlpha = scene.opacity;
        else
            Sylx.Canvas.get('main').context.globalAlpha = 1.0;

        // copy to main canvas
        if (Sylx.Canvas.autoCopy) Sylx.Canvas.copyMain();
    }



    /**
     * Loading rendering
     */
    function renderLoading() {
        // get context
        var buffer = Sylx.Canvas.get('buffer');
        var ctx = buffer.context;

        // clear
        if (Sylx.Canvas.autoClear) buffer.clear();

        // loading bar
        var progress = Sylx.Resource.getProgress() || 0.5;
        var progClr = progress * 255;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.fillStyle = "rgb(" + Math.floor(255 - progClr) + ", " + Math.floor(progClr) + ", 128)";

        // bar
        ctx.fillRect(0, Sylx.Canvas.height - 2, (Sylx.Canvas.width) * progress, 2);

        // copy to main canvas
        if (Sylx.Canvas.autoCopy) Sylx.Canvas.copyMain();

    }



    /* "Smart" export */

    if (window.Sylx) {
        window.Sylx = Object.assign(window.Sylx, Sylx);
    } else {
        window.Sylx = Sylx;
    }



})(window);
