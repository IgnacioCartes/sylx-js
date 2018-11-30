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



    // Base Entity pseudoclass

    var baseEntityConstructor = function Entity() {
        this._kill = false;
        return this;
    };

    var baseEntityPrototype = {
        constructor: null,
        environment: null,
        /**
         * Initialize function, ran when a new entity of this type is created
         */
        init: function () {},
        /**
         * Update function, ran once every frame
         */
        update: function () {},
        /**
         * Creates a new entity
         * @returns {object} New instance of entity
         */
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
        /**
         * Adds a new component to this entity
         * @param   {name}   name      Component name
         * @param   {object} component Component to create
         * @param   {object} data      Additional data to pass on to the component
         * @returns {object} The current entity
         */
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
        /**
         * Determines whether this entity was created from a certain entity definition
         * @param   {object}  definition The definition to compare to
         * @returns {boolean} A boolean indicating whether this entity was created from the provided definition
         */
        isInstanceOf: function (definition) {
            if (typeof definition === 'string') {
                return entityDefinitions[definition].isPrototypeOf(this);
            } else {
                return definition.isPrototypeOf(this);
            }
        },
        /**
         * Schedules this entity to be killed
         * @returns {object} The current entity
         */
        kill: function () {
            if (!this._kill) {
                this._kill = true;
                entityKillQueue.push(this);
            }
            return this;
        }
    };



    // Exportable objects -- based on
    // http://vasir.net/blog/game-development/how-to-build-entity-component-system-in-javascript

    var $entity = {
        /**
         * Creates a new entity definition
         * @param   {object} properties Properties to be passed to new entities of this type
         * @param   {object} proto      Custom prototype for new entities
         * @returns {object} The new entity definition
         */
        define: function (properties, proto) {
            if (baseEntityPrototype.environment === null) baseEntityPrototype.environment = Sylx.game();
            // define a new prototype
            if (proto) properties.$parent = proto;
            var newPrototype = Object.assign(Object.create(proto || baseEntityPrototype), properties);
            Sylx.log("Sylx.Entity: Defined new entity", newPrototype.name);
            return newPrototype;
        },
        /**
         * Creates a new entity definition with an alias
         * @param   {string} name       Alias for the entity definition
         * @param   {object} properties Properties to be passed to new entities of this type
         * @param   {object} proto      Custom prototype for new entities
         * @returns {object} The new entity definition
         */
        defineAs: function (name, properties, proto) {
            var newPrototype = this.define(properties, proto);
            entityDefinitions[name] = newPrototype;
            return newPrototype;
        },
        /**
         * Creates a new entity from a definition
         * @param   {object} definition Definition to create a new entity from
         * @param   {Array}  args       Arguments to pass to the entity creator
         * @returns {object} A new entity
         */
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
        /**
         * Gets a named definition
         * @param   {string} name Name of the definition
         * @returns {object} The definition corresponding to the name
         */
        getDefinitionFromName: function (name) {
            return entityDefinitions[name];
        },
        /**
         * Cleans entity array from entities schedules to be removed
         * @param   {Array} pool Pool of entities
         * @returns {Array} Cleaned up pool 
         */
        _cleanupKilledEntities: function (pool) {
            // leave inmediately if there's no entities to be killed
            if (entityKillQueue.length === 0) return;
            // iterate through the kill queue
            for (var index = entityKillQueue.length - 1; index >= 0; index--) {
                // get where is the entity to kill
                var indexInPool = pool.indexOf(entityKillQueue[index]);
                // give entity an opportunity to say goodbye
                if (typeof entityKillQueue[index].exit === 'function')
                    entityKillQueue[index].exit();
                // cya entity
                pool.splice(indexInPool, 1);
                entityKillQueue.splice(index, 1);
            }
            // cleanup queue
            return pool;
        }
    };



    // Export
    return $entity;



})(window, window.Sylx);
