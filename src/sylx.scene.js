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
        addEntity: function (entity) {
            this.entities.push(entity);
            return entity;
        },
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
        getEntitiesByType: function (definition) {
            // empty pool
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


        }
    });



    // Exportable object

    var $scene = {
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
        createAs: function (name, sceneObject) {
            scenes[name] = this.create(sceneObject);
            return scenes[name];
        },
        getCurrent: function () {
            return current;
        },
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
        _scheduledSceneToSet: null,
        _argumentsForScene: []
    };



    // Export
    return $scene;



})(window, window.Sylx);
