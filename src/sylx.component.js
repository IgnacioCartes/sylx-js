/*
 * HYNE.js
 *
 *      Components module
 *
 */
window.Sylx.Component = (function (window, Sylx, undefined) {
    'use strict';



    // Define generic component constructors

    /* components!!
    - Movement
    - Sprite
    - Animation
    */

    var componentConstructor = {
        /**
         * Sprite component constructor
         * @param   {object} props Props for this component
         * @returns {object} A new sprite component
         */
        sprite: function Sprite(props) {
            if (!props) props = {};
            this.position = props.position || (new Sylx.Point());
            this.size = props.size || (new Sylx.Point(16, 16));
            this.offset = props.offset || (new Sylx.Point());
            this.sourcePosition = props.sourcePosition || (new Sylx.Point());
            this.image = props.image || null;
            this.visible = props.visible || true;
            this.opacity = props.opacity || 1.0;
            this.order = props.order || 0;
            return this;
        },
        /**
         * Movement component constructor
         * @param   {object} props Props for thos component
         * @returns {object} A new movement component
         */
        movement: function Movement(props) {
            if (!props) props = {};
            this.speed = props.speed || new Sylx.Point();
            this.acceleration = props.acceleration || new Sylx.Point();
            this.duration = 0;
            return this;
        },
        /**
         * Collision component constructor
         * @returns {object} A new collision component
         */
        collision: function Collision() {
            this.collidesWith = [];
            return this;
        },
        /**
         * Animator component constructor
         * @param   {object} props Props for this component
         * @returns {object} A new animator component
         */
        animator: function Animator(props) {
            this.collection = props.collection || {};
            this.current = props.current || null;
            this.next = null;
            this.step = 0;
            this.timeleft = 0;
            this.frame = 0;
            this.flip = {
                x: false,
                y: false
            };
            return this;
        }
    };



    /* Entity handling systems */

    var systems = {

        /**
         * Sprite system, that handles and renders the sprite
         * @param   {object}   entity Each entity
         * @param   {object}   ctx    Main canvas context
         */
        sprite: function (entity, ctx) {
            var sprite = entity.sprite;

            // do nothing if sprite is marked as non-visible
            if (!sprite.visible) return null;

            // is image ready?
            var image = sprite.image.data;
            if (image)
                if (image.complete) {
                    // prepare to draw
                    var sceneOffset = Sylx.Scene.getCurrent().scroll;
                    var realX = sprite.position.x - sprite.offset.x - sceneOffset.x,
                        realY = sprite.position.y - sprite.offset.y - sceneOffset.y;

                    // is the sprite on screen?
                    if ((realX > Sylx.Canvas.width) || (realY > Sylx.Canvas.height) || (realX < -sprite.size.x) || (realY < -sprite.size.y)) return null;

                    // set opacity
                    if (typeof sprite.opacity === 'number')
                        ctx.globalAlpha = sprite.opacity;
                    else
                        ctx.globalAlpha = 1.0;

                    // detect flipping
                    var flip = {
                        x: 1,
                        y: 1
                    };
                    if (sprite.flip) {
                        if (sprite.flip.x) flip.x = -1;
                        if (sprite.flip.y) flip.y = -1;
                    }

                    if ((flip.x === -1) || (flip.y === -1))
                        ctx.scale(flip.x, flip.y);

                    // render sprite
                    ctx.drawImage(
                        image,
                        sprite.sourcePosition.x, // * flip.x,
                        sprite.sourcePosition.y, // * flip.x,
                        sprite.size.x,
                        sprite.size.y,
                        realX * flip.x - (flip.x === -1 ? sprite.size.x : 0),
                        realY * flip.y - (flip.y === -1 ? sprite.size.y : 0),
                        sprite.size.x,
                        sprite.size.y
                    );

                    // revert scale
                    if ((flip.x === -1) || (flip.y === -1))
                        ctx.scale(flip.x, flip.y);
                }
        },



        /**
         * Movement system that controls sprite movement
         * @param   {object}   entity Entity to move
         */
        movement: function (entity) {
            // do nothing if there is no sprite component
            if (!entity.sprite) return null;

            var sprite = entity.sprite,
                movement = entity.movement;

            // move
            sprite.position.x += movement.speed.x;
            sprite.position.y += movement.speed.y;

            // accelerate
            movement.speed.x += movement.acceleration.x;
            movement.speed.y += movement.acceleration.y;

            // handle duration if one was specified
            if (movement.duration) {
                movement.duration--;

                if (movement.duration === 0) {
                    // cancel movement
                    movement.speed.x = 0;
                    movement.speed.y = 0;
                    movement.acceleration.x = 0;
                    movement.acceleration.y = 0;
                }
            }
        },



        /**
         * Collision system, to determine whether an entity is colliding with another one
         * @param {object} e1 First entity
         * @param {object} e2 Second entity
         */
        collision: function (e1, e2) {
            var e1s = e1.sprite,
                e2s = e2.sprite;

            // check collision
            if (e1s.position.x < e2s.position.x + e2s.size.x &&
                e1s.position.x + e1s.size.x > e2s.position.x &&
                e1s.position.y < e2s.position.y + e2s.size.y &&
                e1s.size.y + e1s.position.y > e2s.position.y) {
                // collision
                e1.collision.collidesWith.push(e2);
                e2.collision.collidesWith.push(e1);
            }
        },



        /**
         * Animator system, that handles animations
         * @param   {object}   entity Entity to animate
         */
        animator: function (entity) {
            // do nothing if there is no sprite component
            if (!entity.sprite) return null;

            var animation = entity.animator,
                sprite = entity.sprite;

            // if next is set, reset animation

            if (animation.next) {
                animation.current = animation.next;
                animation.step = 0;
                animation.timeleft = animation.collection[animation.current].duration;
                animation.frame = animation.collection[animation.current].cycle[0];
                animation.flip.x = animation.collection[animation.current].flipX || false;
                animation.flip.y = animation.collection[animation.current].flipY || false;

                animation.next = null;

                // update frame
                this.spritesheet(entity);
            }

            // if there is no "current" animation, do nothing
            if (!animation.current) return null;
            var current = animation.collection[animation.current];

            // if time left is negative then animation is "stuck" - do nothing
            if (animation.timeleft < 0) return null;

            // else decrease time left
            animation.timeleft--;

            // if it reaches 0, prepare to set a new sprite
            if (animation.timeleft <= 0) {
                // increase step
                animation.step++;

                // see if this is the last step
                if (animation.step === current.cycle.length) {
                    animation.step = 0;
                }

                // set new timeleft and frame values
                animation.timeleft = current.duration;
                animation.frame = current.cycle[animation.step];

                // update frame
                this.spritesheet(entity);
            }

        },



        /**
         * Spritesheet system, setting frames for animations
         * @param {object} entity Entity to handle
         */
        spritesheet: function (entity) {
            if (entity.spritesheet) {
                // if there is a spritesheet, get frame properties
                var framedata = entity.spritesheet[entity.animator.frame];
                entity.sprite.sourcePosition = framedata.position;
                entity.sprite.size = framedata.size || entity.sprite.size;
                entity.sprite.offset = framedata.offset || entity.sprite.offset;
            } else {
                // if there is no spritesheet component, set sprite the old fashioned way
                // (form left to right)
                entity.sprite.sourcePosition.x = entity.animator.frame * entity.sprite.size.x;
                entity.sprite.sourcePosition.y = 0;
            }
            // flip?
            entity.sprite.flip = entity.animator.flip;

        }

    };



    // Exportable object

    var $component = {
        /**
         * Gets a component constructor
         * @param   {string} name Name of the constructor to get
         * @returns {object} A component constructor
         */
        getConstructor: function (name) {
            // if no name was provided, return all constructors
            if (!name) return componentConstructor;
            return componentConstructor[name];
        },
        /**
         * Creates a new component constructor
         * @param {string}   name        Name of the new component
         * @param {function} constructor Constructor function
         */
        createComponent: function (name, constructor) {
            if (componentConstructor[name]) throw ("Component constructor " + name + " already exists!");
            componentConstructor[name] = constructor;
        },
        Constructor: componentConstructor,
        System: systems
    };



    // Export
    return $component;



})(window, window.Sylx);
