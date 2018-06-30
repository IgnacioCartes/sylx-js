/*
 * HYNE.js
 *
 *      Entities module
 *
 */
window.Sylx.Entity = (function (window, Sylx, undefined) {
    'use strict';



    // Private variables

    var entityDefinitions = {},
        entityKillQueue = [];
    //var namedInstancedEntities = {};



    // Base Entity pseudoclass

    var baseEntityConstructor = function Entity() {
        this._kill = false;
        return this;
    };

    var baseEntityPrototype = {
        constructor: null,
        environment: null,
        init: function () {},
        update: function () {},
        create: function () {
            // fetch constructor if one was provided, else use the base
            var constructor = this.constructor || baseEntityConstructor;
            // create new object, passing optional arguments to it
            var newObject = (constructor).apply((Object.create(constructor.prototype)), arguments);
            // create new instance
            var newInstance = Object.assign(Object.create(this), newObject);
            // run init method
            newInstance.init.apply(newInstance, arguments);
            // return new instance
            return newInstance;
        },
        addComponent: function (name, component, data) {
            // determine component type passed
            if (typeof component === 'function') {
                // function -- we need to create the object
                this[name] = new component(data);
            } else if (typeof component === 'object') {
                // already created object -- just stash it
                this[name] = component;
            }
            return this;
        },
        isInstanceOf: function (definition) {
            if (typeof definition === 'string') {
                return entityDefinitions[definition].isPrototypeOf(this);
            } else {
                return definition.isPrototypeOf(this);
            }
        },
        kill: function () {
            if (!this._kill) {
                this._kill = true;
                entityKillQueue.push(this);
            }
        }
    };



    // Exportable objects -- based on
    // http://vasir.net/blog/game-development/how-to-build-entity-component-system-in-javascript

    var $entity = {
        define: function (properties, proto) {
            if (baseEntityPrototype.environment === null) baseEntityPrototype.environment = Sylx.game();
            // define a new prototype
            if (proto) properties.$parent = proto;
            var newPrototype = Object.assign(Object.create(proto || baseEntityPrototype), properties);
            Sylx.log("Sylx.Entity: Defined new entity", newPrototype.name);
            return newPrototype;
        },
        defineAs: function (name, properties, proto) {
            var newPrototype = this.define(properties, proto);
            entityDefinitions[name] = newPrototype;
            return newPrototype;
        },
        create: function (definition, args) {
            if (typeof definition === 'object') {
                return baseEntityPrototype.create.apply(definition, args);
            } else if (typeof definition === 'string') {
                if (entityDefinitions[definition]) {
                    return baseEntityPrototype.create.apply(entityDefinitions[definition], args);
                } else {
                    throw ("Entity definition '" + definition + "' does not exist!");
                }
            }
            return null;
        },
        getDefinitionFromName: function (name) {
            return entityDefinitions[name];
        },
        _cleanupKilledEntities: function (pool) {
            // leave inmediately if there's no entities to be killed
            if (entityKillQueue.length === 0) return;
            // iterate through the kill queue
            for (var index = 0, len = entityKillQueue.length; index < len; index++) {
                // get where is the entity to kill
                var indexInPool = pool.indexOf(entityKillQueue[index]);
                // give entity an opportunity to say goodbye
                if (typeof entityKillQueue[index].exit === 'function')
                    entityKillQueue[index].exit();
                // cya entity
                pool.splice(indexInPool, 1);
            }
            // cleanup queue
            entityKillQueue = [];
            return pool;
        }
    };



    // Export
    return $entity;



})(window, window.Sylx);
