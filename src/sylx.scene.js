/*
 * HYNE.js
 *
 *      Scenes module
 *
 */
window.Sylx.Scene = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables 

    var scenes = {},
        current;



    // Base scene pseudoclass

    var baseScenePrototype = Object.assign(Object.create(Sylx.game()), {
        /**
         * Adds an already created entity to this scene
         * @param   {object} entity The created entity object
         * @returns {object} The entity
         */
        addEntity: function (entity) {
            this.entities.push(entity);
            return entity;
        },
        /**
         * Creates and adds a new entity to the scene
         * @param   {object} definition The entity definition used to create the entity
         * @returns {object} The created entity
         */
        createEntity: function (definition) {
            if (typeof definition === 'string')
                definition = Sylx.Entity.getDefinitionFromName(definition);

            if (typeof definition.create !== 'function')
                throw "The provided definition does not have a create method!";

            var args = (Array.prototype.slice.call(arguments)).slice(1);
            var newEntity = definition.create.apply(definition, args);
            this.entities.push(newEntity);
            return newEntity;
        },
        /**
         * Checks for all entities in this scene that correspond to a specific definition
         * @param   {object} definition An entity definition to compare to
         * @returns {Array}  An array with all entities that correspond to the provided definition
         */
        getEntitiesByType: function (definition) {
            // empty pool - return an empty array
            if (this.entities.length === 0) return [];
            // definition as string or object?
            var defObject, entitiesByType = [];
            if (typeof definition === 'object') {
                defObject = definition;
            } else if (typeof definition === 'string') {
                defObject = Sylx.Entity.getDefinitionFromName(definition);
            }
            // iterate through pool
            for (var index = 0, len = this.entities.length; index < len; index++) {
                var entity = this.entities[index];
                // ignore dead entities
                if (entity._kill) continue;
                // if entity is the right type, return
                if (defObject.isPrototypeOf(entity))
                    entitiesByType.push(entity);
            }
            return entitiesByType;
        },
        /**
         * Sets a level (consisting of maps and entities automatically generated)
         * @param {object} levelObject The level object
         */
        setLevel: function (levelObject) {
            // mount level data
            this.maps = new Array(levelObject.map.length);
            var index, len;

            // create new maps
            for (index = 0, len = levelObject.map.length; index < len; index++)
                this.maps[index] = Sylx.Map.create(levelObject.map[index]);

            // create entities
            for (index = 0, len = levelObject.entities.length; index < len; index++)
                this.createEntity.apply(this, levelObject.entities[index]);

        },
        /**
         * Gets a map
         * @param   {number} index Map index
         * @returns {object} The map object
         */
        getMap: function (index) {
            if (this.maps)
                return this.maps[index];
        },
        /**
         * Directly adds a map object to the scene
         * @param {object} mapObject The map object
         */
        addMap: function (mapObject) {
            // create maps array if it doesn't exist
            if (!this.maps) this.maps = [];

            // push map
            this.maps.push(mapObject);
        },
        /**
         * Directly removes a map object (use with care!)
         * @param   {object}   mapIndex A map index or the map object to remove
         */
        removeMap: function (mapIndex) {
            // ignore if maps array doesn't exist
            if (!this.maps) return null;

            // check argument type
            if (typeof mapIndex === "object")
                mapIndex = this.maps.indexOf(mapIndex);

            if ((mapIndex >= 0) && (mapIndex < this.maps.length))
                this.maps.splice(mapIndex, 1);

        }

    });



    // Exportable object

    var $scene = {
        /**
         * Creates a new scene
         * @param   {object} sceneObject Object to create a scene from
         * @returns {object} A new scene object
         */
        create: function (sceneObject) {
            // get base scene object
            var newScene = Object.assign(Object.create(baseScenePrototype), sceneObject);
            // add properties
            newScene.maps = [];
            newScene.entities = [];
            newScene.scroll = newScene.scroll || (new Sylx.Point());
            Sylx.log("Sylx.Scene: Created new scene", sceneObject.name);
            return newScene;
        },
        /**
         * Creates a new named scene
         * @param   {string} name        Scene name
         * @param   {object} sceneObject Object to create a scene from
         * @returns {object} A new scene object
         */
        createAs: function (name, sceneObject) {
            scenes[name] = this.create(sceneObject);
            return scenes[name];
        },
        /**
         * Gets the currently active scene
         * @returns {object} The current scene object
         */
        getCurrent: function () {
            return current;
        },
        /**
         * Sets a new scene as active
         * @param   {object} scene The scene to set as active
         * @returns {object} The new scene
         */
        set: function (scene) {
            var sceneToSet;
            if (typeof scene === 'object') {
                sceneToSet = scene;
            } else if (typeof scene === 'string') {
                if (!scenes[name]) throw ("Scene '" + scene + "' has not been created!");
                sceneToSet = scenes[scene];
            }
            if (!scene) throw ("Scene is empty!");
            this._scheduledSceneToSet = sceneToSet;
            this._argumentsForScene = (Array.prototype.slice.call(arguments)).slice(1);
            current = sceneToSet;
            return sceneToSet;
        },
        frozenEntities: false,
        _scheduledSceneToSet: null,
        _argumentsForScene: []
    };



    // Export
    return $scene;



})(window, window.Sylx);
