# sylx.js

A small, modular JavaScript 2D game engine for HTML5.

## Modules

### Sylx.module(name, dependencies, module);

Sylx games are composed of modules, which are how game elements are separated. The actual module can be anything, but typically they're functions that return an object. Using the **Sylx.module** method it's possible to create new modules.

- **name**: Indicates the name of the new module to create.
- **dependencies**: An array containing the name of all the other modules that must be loaded before this one. This is actually needed only to ensure modules are loaded in the right order. Be careful with circular dependencies! If this module has no dependencies, this can be left as an empty array object `[]`.
- **module**: The actual module object. This can be a plain JavaScript object, or a function that returns a more complex Sylx object.

````
Sylx.module('game.npc', [], () => {

	var variableInsideClosure;

	return Sylx.Entity.defineAs('npc', {
		init: function() {},
		/* ... */
	});

});
````

Modules can be accessed and used by other modules by injecting it as a dependency in them:

````
Sylx.module('game.useNpc', ['game.npc'], ($npc) => {

	return Sylx.Scene.create({
		init: function() {
			// $npc references the 'game.npc' module created earlier
			this.createEntity($npc);
		},
		/* ... */
	});

});
````

## Run game

### Sylx.run(fn);

The **Sylx.run** method sets a function that will be executed once the game environment is ready and all Sylx modules have been loaded.

- **fn**: function to be executed when the game is ready to start; this is usually a good point to create the game canvas, bind inputs and load a starting scene.

````
Sylx.run(() =>
	Sylx.Canvas.create(MyCanvasProps);
	Sylx.Scene.set(MyFirstScene);
);
````

Sylx.run() essentially initializes the game loop, which calls the update() methods of the active scene as well as of any active entities, plus does other things such as updating the display and check for player inputs.

## Sylx modules

Sylx comes with some modules to help kickstart a game.

### Sylx.Canvas

- **Sylx.Canvas.create(props)**: Creates the main game canvas, with the properties defined in the **props** object.
-- **width**: base width of the canvas, in pixels
-- **height**: base height of the canvas, in pixels
-- **scale**: scaling of the canvas - this will increase or decrease the final size of the canvas (i.e.: a 100x100 canvas with a scale of 2 will end up as a 200x200 canvas)
-- **appendTo**: DOM Element to append the canvas to - if ommited, it will be appended to the document body by default

**Example:**
````
Sylx.Canvas.create({
	width: 480,
	height: 360,
	scale: 2.0,
	appendTo: document.getElementById('game-container')
});
````

- **Sylx.Canvas.autoClear**: boolean that determines whether the game canvas will auto clear itself on every animation frame or not (default: true)
- **Sylx.Canvas.autoCopy**: boolean that determines whether the game canvas will auto copy itself on every animation frame or not (default: true)
- **Sylx.Canvas.fillColor**: string containing the color that the canvas will auto clear itself with if the **autoClear** property is set to true (default: '#000000')

___

### Sylx.Input

- **Sylx.Input.bind(binds)**: Binds keys to a text-string, used to identify each keypress. **binds** corresponds to an object containing pairs of strings and keycodes.

**Example:**
````
Sylx.Input.bind({
	'left': 37,
	'up': 38,
	'right': 39,
	'down': 40,
	'enter': 13
});
````

- **Sylx.Input.pressed(keystring)**: Returns **true** if the key bound to the provided keystring was pressed on the current frame, else it returns **false**.

- **Sylx.Input.down(keystring)**: Returns **true** if the key bound to the provided keystring is being held down, else it returns **false**.

___




