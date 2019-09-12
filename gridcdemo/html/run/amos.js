/*@****************************************************************************
*
*   █████╗ ███╗   ███╗ ██████╗ ███████╗    ██████╗
*  ██╔══██╗████╗ ████║██╔═══██╗██╔════╝    ╚════██╗
*  ███████║██╔████╔██║██║   ██║███████╗     █████╔╝
*  ██╔══██║██║╚██╔╝██║██║   ██║╚════██║    ██╔═══╝
*  ██║  ██║██║ ╚═╝ ██║╚██████╔╝███████║    ███████╗
*  ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝
*
****************************************************************************@*/
/** @file
 *
 * AMOS 2 Runtime
 *
 * The return of Basic!
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 03/12/2018
 */
function AMOS( canvasId, manifest )
{
	//this.dos = new DOS( this );
	//this.utilities = new Utilities( this );
	var self = this;
	this.manifest = manifest;
	this.memoryHashMultiplier = 1000000000000;
	this.utilities = new Utilities( this );
	this.errors = new Errors( this );
	this.banks = new Banks( this );
	this.filesystem = new Filesystem( this );
	this.sprites = new Sprites( this );
	this.renderer = new Renderer( this, canvasId );
	this.amal = new AMAL( this );
	this.fonts = new Fonts( this );

	this.setKeyboard();
	this.setMouse();
	this.setGamepads();

	this.sections = [];
	this.returns = [];
	this.section = null;
	this.position = 0;
	this.parent = null;
	this.maxLoopTime = 18;
	this.timeCheckCounter = 10000;
	this.manifest = manifest;
	this.onError = false;
	this.resume = 0;
	this.resumeLabel = 0;
	this.isErrorOn = false;
	this.isErrorProc = false;
	this.lastError = 0;
	this.displayAlerts = true;
	this.fix = 16;
	this.degreeRadian=1.0;
	this.timer = new Date().getTime();
	this.key$ = [];
	this.stringKey$ = '';
	this.handleKey$ = null;
	this.results = [];
	this.screensZ = [];
	this.inkeyShift = 0;
	this.memoryBlocks = [];
	this.memoryNumbers = 1;
	this.nowEvery = false;
	this.everyDefinition = null;
	this.everyReturn = -1;
	this.everyEndProc = -1;
	this.everySave = null;
	this.everySection = null;
	this.fps = [];
	this.fpsPosition = 0;
	this.frameCounter = 0;
	for ( var f = 0; f < 50; f++ )
		this.fps[ f ] = 20;
	this.channelsTo = [];
	this.amalErrors = [];
	this.amalErrorNumberCount = 0;
	this.amalErrorStringCount = 0;
	this.updateEvery = 0;
	this.updateEveryCount = 0;
	this.isUpdate = true;

	this.setScreenDisplay( this.renderer.width, this.renderer.height );

	this.usePalette = typeof manifest.compilation.usePalette != 'undefined' ? manifest.compilation.usePalette : true,
	this.useShortColors = typeof manifest.compilation.useShortColors != 'undefined' ? manifest.compilation.useShortColors : true,
	this.showCopperBlack = typeof manifest.compilation.showCopperBlack != 'undefined' ? manifest.compilation.showCopperBlack : true,
	this.unlimitedScreens = typeof manifest.compilation.unlimitedScreens != 'undefined' ? manifest.compilation.unlimitedScreens : false,
	this.unlimitedWindows = typeof manifest.compilation.unlimitedWindows != 'undefined' ? manifest.compilation.unlimitedWindows : false,
	this.maskHardwareCoordinates = typeof manifest.compilation.maskHardwareCoordinates != 'undefined' ? manifest.compilation.maskHardwardeCoordinates : true,

	this.defaultPalette = [];
	if ( this.usePalette )
	{
		for ( var c = 0; c < this.manifest.default.screen.palette.length; c++ )
			this.defaultPalette[ c ] = this.manifest.default.screen.palette[ c ];
	}

	this.waitInstructions =
	{
		waitKey: this.waitKey,
		waitKey_wait: this.waitKey_wait,
		wait: this.wait,
		wait_wait: this.wait_wait,
		waitVbl: this.waitVbl,
		waitVbl_wait: this.waitVbl_wait,
		input: this.input,
		input_wait: this.input_wait,
		input$: this.input$,
		input$_wait: this.input$_wait,
		bLoad: this.bLoad,
		bLoad_wait: this.fileOperation_wait,
		bSave: this.bSave,
		bSave_wait: this.fileOperation_wait,
		openOut: this.openOut,
		openOut_wait: this.fileOperation_wait,
		openIn: this.openIn,
		openIn_wait: this.fileOperation_wait,
		append: this.append,
		append_wait: this.fileOperation_wait,
		close: this.close,
		close_wait: this.fileOperation_wait,
		openRandom: this.openRandom,
		openRandom_wait: this.fileOperation_wait,
		amalStart: this.amalStart,
		amalStart_wait: this.amalStart_wait,
		setFont: this.setFont,
		setFont_wait: this.setFont_wait
	};

	// Initialisation of mathematic functions
	Math.tanh = Math.tanh || function( x )
	{
		var a = Math.exp( +x ), b = Math.exp( -x );
		return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (a + b);
	};
	Math.sinh = Math.sinh || function( x )
	{
		return ( Math.exp( x ) - Math.exp( -x ) ) / 2;
	};
	Math.cosh = Math.cosh || function( x )
	{
		return ( Math.exp( x ) + Math.exp( -x ) ) / 2;
	};

	// Main loop
	this.break = false;
	this.breakOn = true;

	// Load sprites and sounds
	var self = this;
	this.sprites.init( {}, function( response, data, extra )
	{
		if ( response )
		{
			self.fonts.init( {}, function( response, data, extra )
			{
				if ( response )
				{				
					self.textWindowFont = data;
					self.default();
					self.previousTime = new Date().getTime();
					window.requestAnimationFrame( doUpdate );
				}
			} );
		}
	}, 0 );

	function doUpdate()
	{
		if ( self.section )
		{
			var time = new Date().getTime();
			self.fps[ self.fpsPosition++ ] = time - self.previousTime;
			self.fpsPosition = self.fpsPosition >= self.fps.length ? 0 : self.fpsPosition;
			self.previousTime = time;
			self.frameCounter++;
			self.scanGamepads();

			self.loopCounter = self.timeCheckCounter;
			ret = null;
			while( !self.break )
			{
				do
				{
					try
					{
						if ( self.waiting )
						{
							if ( self.caughtError )
								throw self.caughtError;
							self.waiting.call( self );
							if ( self.waiting || self.everyNow )
								break;
						}
						while( !ret )
						{
							ret = self.section.blocks[ self.position++ ].call( self.section );
						};
					}
					catch( error )
					{
						self.caughtError = null;
						if ( error.stack )
						{
							self.setErrorNumber( self.errors.getErrorFromId( 'internal_error' ).number );
							console.log( error.message );
							console.log( error.stack );
							self.break = true;
							break;
						}
						self.setErrorNumber( self.errors.getErrorFromId( error ).number );
						if ( self.onError )
						{
							if ( typeof self.onError == 'number' )
							{
								self.resume = self.position;
								self.position = self.onError;
								self.isErrorOn = true;
							}
							else
							{
								// Push previous section
								self.sections.push(
								{
									section: self.section,
									position: self.position,
									parent: self.parent,
									onError: self.onError,
									isErrorProc: self.isErrorProc
								} );

								// Initialize procedure parameters
								self.position = 0;
								self.parent = self.section;
								self.section = self.onError;
								self.onError = false;
								self.isErrorProc = true;
							}
						}
						else
						{
							self.break = true;
						}
						ret = null;
						self.loopCounter--;
						continue;
					}

					if ( self.everyNow )
						break;

					switch ( ret.type )
					{
						// End!
						case 0:
							popSection();
							if ( self.sections.length == self.everyEndProc )
							{
								self.everyEndProc = -1;
								self.waiting = self.everyWaiting;
								ret = self.everySave;
								continue;
							}
							break;

						// Goto
						case 1:
							self.position = ret.label;
							break;

						// Gosub
						case 2:
							self.returns.push( ret.return );
							self.position = ret.label;
							break;

						// Return
						case 3:
							if ( self.returns.length == 0 )
							{
								self.setErrorNumber( self.errors.getErrorFromId( 'return_without_gosub' ).number );
								self.break = true;
								break;
							}
							self.position = self.returns.pop();
							if ( self.returns.length == self.everyReturn )
							{								
								self.waiting = self.everyWaiting;
								ret = self.everySave;
								continue;
							}
							break;

						// Procedure call
						case 4:
							// Push previous section
							self.sections.push(
							{
								section: self.section,
								position: self.position,
								parent: self.parent,
								onError: self.onError,
								isErrorProc: self.isErrorProc
							} );

							// Initialize procedure parameters
							self.onError = false;
							self.isErrorProc = false;
							self.position = 0;
							self.parent = self.section;
							self.section = new ret.procedure( self, self.root );
							self.section.reset();
							for ( var a in ret.args )
								self.section.vars[ a ] = ret.args[ a ];
							break;

						// Resume
						case 5:
							if ( !self.isErrorOn && !self.isErrorProc )
							{
								self.break = true;
							}
							else
							{
								if ( self.isErrorProc )
									popSection();
								if ( !ret.label )
									self.position = self.resume - 1;
								else
									self.position = ret.label;
								self.isErrorOn = false;
								self.lastError = 0;
							}
							break;

						// Resume next
						case 6:
							if ( !self.isErrorOn && !self.isErrorProc )
							{
								self.break = true;
							}
							else
							{
								if ( self.isErrorProc )
									popSection();
								self.position = self.resume;
								self.isErrorOn = false;
								self.lastError = 0;
							}
							break;

						// Resume label
						case 7:
							if ( !self.isErrorOn && !self.isErrorProc )
							{
								self.break = true;
							}
							else
							{
								if ( self.isErrorProc )
									popSection();
								self.position = self.resumeLabel;
								self.isErrorOn = false;
								self.lastError = 0;
							}
							break;

						// Blocking instruction
						case 8:
							self.waiting = self.waitInstructions[ ret.instruction + '_wait' ];
							try
							{
								self.waitInstructions[ ret.instruction ].call( self, ret.args );
							}
							catch( error )
							{
								self.caughtError = error;
							}
							break;

						// Blocking function
						case 9:
							self.waiting = self.waitInstructions[ ret.instruction + '_wait' ];
							self.waitInstructions[ ret.instruction ].call( self, ret.result, ret.args );
							break;

						// Instruction
						case 10:
							// Push previous section
							self.sections.push(
							{
								section: self.section,
								position: self.position,
								parent: self.parent,
								onError: self.onError,
								isErrorProc: self.isErrorProc
							} );

							// Initialize procedure parameters
							self.onError = false;
							self.isErrorProc = false;
							self.position = 0;
							self.parent = self.section;
							self.section = self.parent[ 'i' + ret.instruction ];
							self.section.reset();
							for ( var a in ret.args )
								self.section.vars[ a ] = ret.args[ a ];
							break;

						// Function
						case 11:
							// Push previous section
							self.sections.push(
							{
								section: self.section,
								position: self.position,
								parent: self.parent,
								onError: self.onError,
								isErrorProc: self.isErrorProc
							} );

							// Initialize procedure parameters
							self.onError = false;
							self.isErrorProc = false;
							self.position = 0;
							self.parent = self.section;
							self.section = self.parent[ 'f' + ret.instruction ];
							self.section.reset();
							for ( var a in ret.args )
								self.section.vars[ a ] = ret.args[ a ];
							break;
					}
					ret = null;
					self.loopCounter--;
				} while( !self.break && self.loopCounter > 0 && !self.waiting )

				// Every?
				if ( self.everyNow )
				{
					if ( self.everyHandle )
					{
						clearTimeout( this.everyHandle );
					}
					self.everyHandle = setTimeout( function()
					{
						self.everyNow = true;
					}, self.everyInterval * 20 );

					self.everyNow = false;
					self.everySave = ret;
					self.everySection = self.section;
					self.everyWaiting = self.waiting;
					self.waiting = null;
					ret = self.everyDefinition;
					if ( ret.type == 2 )
					{
						self.everyReturn = self.returns.length;
						self.everyEndProc = -1;
						ret.return = self.position;
					}
					else
					{
						self.everyEndProc = self.sections.length;
						self.everyReturn = -1;
					}
					continue;
				}

				// Check time in loop
				self.loopCounter = self.timeCheckCounter;
				if ( new Date().getTime() - time >= self.maxLoopTime || self.waiting )
					break;

				ret = null;
			}

			// Render the display!
			//var now = new Date().getTime();
			//console.log( 'Time since loop entry: ' + ( now - time ) + ' - Time since previous loop: ' + ( now - timeBefore ) );
			self.renderer.render();

			if ( self.break )
			{
				clearInterval( self.handle );
				var message = '';
				if ( self.lastError )
				{
					message = self.errors.getErrorFromNumber( self.error ).message;
					if ( self.lastErrorPos )
					{
						var pos = self.lastErrorPos.indexOf( ':' );
						var line = parseInt( self.lastErrorPos.substring( 0, pos ) ) + 1;
						var column = parseInt( self.lastErrorPos.substring( pos + 1 ) ) + 1;
						message += ' ' + self.errors.getErrorFromId( 'at_line' ).message + line + ', ';
						message += self.errors.getErrorFromId( 'at_column' ).message + column;
					}
					message += '.';
					console.log( message );
				}
				console.log( 'Program ended.' );
				if ( self.displayAlerts )
				{
					var text = 'Program ended.';
					if ( message != '' )
						text = message + '\n' + text;
					setTimeout( function()
					{
						alert( text );
					}, 500 );
				}
			}
			else
			{
				timeBefore = new Date().getTime();
				window.requestAnimationFrame( doUpdate );
			}
		}
		function popSection()
		{
			// Pop section
			var pop = self.sections.pop();
			self.section = pop.section;
			if ( self.section == null )
			{
				self.break = true;
			}
			else
			{
				self.position = pop.position;
				self.parent = pop.parent;
				self.onError = pop.onError;
				self.isErrorProc = pop.isErrorProc;
			}
		}
	}
};
AMOS.prototype.setHotSpot = function( number, deltaX, deltaY )
{
	this.sprites.setHotSpot( number, deltaX, deltaY );
	for ( var s = 0; s < this.screens.length; s++ )
	{
		this.screens[ s ].bobsUpdate( true, true );
	}
	this.sprites.spritesUpdate( true, true );
};
AMOS.prototype.displayWidth = function()
{
	var result;
	if ( this.manifest.compilation.emulation != 'PC' )
	{
		result = 342;
	}
	else
	{
		result = this.renderer.width;
	}
	return result;
};
AMOS.prototype.displayHeight = function()
{
	var result;
	if ( this.manifest.compilation.emulation != 'PC' )
	{
		result = this.manifest.display.tvStandard == 'ntsc' ? 261 : 311;
	}
	else
	{
		result = this.renderer.height;
	}
	return result;
};
AMOS.prototype.ntsc = function()
{
	return this.manifest.compilation.emulation != 'PC' && this.manifest.display.tvStandard == 'ntsc';
};
AMOS.prototype.setScreenDisplay = function( widthDraw, heightDraw )
{
	var hardTopY = 0, hardHeight = 0;
	if ( this.manifest.compilation.emulation != 'PC' )
	{
		switch( this.manifest.display.tvStandard )
		{
			case 'pal':
				hardTopY = 30;
				hardHeight = 311 - hardTopY;
				break;
			default:
			case 'ntsc':
				hardTopY = 30;
				hardHeight = 261 - hardTopY;
				break;
		}
	}
	switch( this.manifest.compilation.emulation )
	{
		default:
		case '500':
		case '600':
		case '1200':
		case '3000':
		case '4000':
			this.hardLeftX = 110;
			this.hardTopY = hardTopY;
			this.hardWidth = 342;
			this.hardHeight = hardHeight;
			break;
		case 'PC':
			this.hardLeftX = 0;
			this.hardTopY = 0;
			this.hardWidth = widthDraw / this.renderer.scaleX;
			this.hardHeight = heightDraw / this.renderer.scaleY;
			break;
	}
};
AMOS.prototype.allowRefresh = function()
{
	if ( this.loopCounter > self.timeCheckCounter / 4 )
		this.loopCounter /= 2;
};
AMOS.prototype.stop = function()
{
	debugger;
	//throw 'program_interrupted';
};
AMOS.prototype.every = function( interval, definition )
{
	if ( this.everyDefinition )
		throw 'every_already_defined';
	if ( interval <= 0 )
		throw 'illegal_function_call';
	this.everyInterval = interval;
	this.everyDefinition = definition;
	this.everyNow = true;
};
AMOS.prototype.everyOnOff = function( onOff )
{
	if ( onOff )
	{
		if ( this.everyDefinition )
		{
			this.everyNow = true;
		}
		else
		{
			throw 'every_not_defined';
		}
	}
	else
	{
		if ( this.everyHandle )
		{
			clearTimeout( this.everyHandle );
			this.everyHandle = 0;
		}
		this.everyNow = false;
		this.everyDefinition = null;
		this.section.every = null;
		this.everySection = null;
		this.everyReturn = -1;
		this.everyEndProc = -1;
	}
};

AMOS.prototype.screenOpen = function( number, width, height, numberOfColors, pixelMode, palette )
{
	var screenDefinition = this.manifest.default.screen;
	if ( number < 0 )
		throw 'illegal_function_call';

	width = typeof width != 'undefined' ? width : screenDefinition.width;
	height = typeof height != 'undefined' ? height : screenDefinition.height;
	numberOfColors = typeof numberOfColors != 'undefined' ? numberOfColors : screenDefinition.numberOfColors;
	pixelMode = typeof pixelMode != 'undefined' ? pixelMode : screenDefinition.pixelMode;
	palette = typeof palette != 'undefined' ? palette : this.utilities.copyArray( this.defaultPalette );
	if ( !this.unlimitedScreens && number > 8 )
		throw 'illegal_function_call';

	screenDefinition.width = width;
	screenDefinition.height = height;
	screenDefinition.numberOfColors = numberOfColors;
	screenDefinition.pixelMode = pixelMode;
	screenDefinition.palette = palette;

	if ( this.currentScreen )
		this.currentScreen.deactivate();
	this.currentScreen = new Screen( this, this.renderer, screenDefinition );
	for ( var z = 0; z < this.screensZ.length; z++ )
	{
		if ( this.screensZ[ z ].number == number )
		{
			this.screensZ.splice( z, 1 );
			break;
		}
	}
	this.currentScreen.number = number;
	this.screens[ number ] = this.currentScreen;
	this.screensZ.push( this.currentScreen );
	this.renderer.modified = true;

	// First font is default
	if ( this.fonts.getNumberOfFonts() > 0 )
	{
		var font = this.fonts.getFontInfo( 0 );
		if ( font )
		{
			this.waiting = this.setFont_wait;
			this.setFont( [ font.name, 16 ] );
		}
	}
};
AMOS.prototype.screen = function( number )
{
	if ( number < 0 || ( !this.unlimitedScreens && number > 8 ) )
		throw 'illegal_function_call';
	if ( !this.screens[ number ] )
		throw 'screen_not_opened';
	if ( this.screens[ number ].cloned )
		throw 'illegal_function_call';
	if ( this.currentScreen )
		this.currentScreen.deactivate();
	this.currentScreen = this.screens[ number ];
	this.currentScreen.activate();
};
AMOS.prototype.screenClose = function( number )
{
	if ( typeof number == 'undefined' )
	{
		if ( this.currentScreen.number >= 0 )
			number = this.currentScreen.number;
		else
			throw 'screen_not_opened';
	}
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.screens[ number ] )
		throw 'screen_not_opened';

	var screen = this.screens[ number ];

	// Close cloned screens
	var self = this;
	do
	{
		var redo = false;
		for ( var s = 0; s < this.screens.length; s++ )
		{
			if ( this.screens[ s ].cloned == screen )
			{
				closeIt( this.screens[ s ] );
				redo = true;
				break;
			}
		}
	} while( redo );

	// Close screen
	closeIt( screen );
	this.renderer.setModified();

	function closeIt( screen )
	{
		screen.deactivate();
		for ( var z = 0; z < self.screensZ.length; z++ )
		{
			if ( self.screensZ[ z ] == screen )
			{
				self.screensZ.splice( z, 1 );
				break;
			}
		}
		self.screens[ screen.number ] = null;
		if ( self.screensZ.length > 0 )
			self.currentScreen = self.screensZ[ self.screensZ.length - 1 ];
		else
		{
			self.currentScreen = new ScreenEmpty( self );
		}
	}
};
AMOS.prototype.screenCenter = function( number, inX, inY )
{
	if ( typeof number == 'undefined' )
	{
		if ( this.currentScreen.number >= 0 )
			number = this.currentScreen.number;
		else
			throw 'screen_not_opened';
	}
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.screens[ number ] )
		throw 'screen_not_opened';
	this.screens[ number ].setCenter( inX, inY );
};
AMOS.prototype.screenDisplay = function( number, x, y, width, height )
{
	if ( typeof number == 'undefined' )
	{
		if ( this.currentScreen.number >= 0 )
			number = this.currentScreen.number;
		else
			throw 'screen_not_opened';
	}
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.screens[ number ] )
		throw 'screen_not_opened';
	this.screens[ number ].setDisplay( x, y, width, height );
};
AMOS.prototype.screenOffset = function( number, x, y )
{
	if ( typeof number == 'undefined' )
	{
		if ( this.currentScreen.number >= 0 )
			number = this.currentScreen.number;
		else
			throw 'screen_not_opened';
	}
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.screens[ number ] )
		throw 'screen_not_opened';
	this.screens[ number ].setOffset( x, y );
};
AMOS.prototype.getScreen = function( number )
{
	if ( typeof number == 'undefined' )
	{
		if ( this.currentScreen.number >=  0 )
			return this.currentScreen;
		throw 'screen_not_opened';
	}
	if ( number < 0 || number >= this.maxNumberOfScreens )
		throw 'illegal_function_call';
	if ( !this.screens[ number ] )
		throw 'screen_not_opened';
	return this.screens[ number ];
};
AMOS.prototype.getBob = function( screen, image, x1, y1, x2, y2 )
{
	screen = this.getScreen( screen );
	screen.getBob( image, x1, y1, x2, y2 );
};
AMOS.prototype.screenCopy3 = function( source, destination, mode )
{
	source = this.getScreen( source );
	destination = this.getScreen( destination );
	source.screenCopy( destination );
};
AMOS.prototype.screenCopy8 = function( source, x1, y1, x2, y2, destination, x3, y3, mode )
{
	source = this.getScreen( source );
	destination = this.getScreen( destination );
	source.screenCopy( destination, x1, y1, x2, y2, x3, y3, x3 + ( x2 - x1 ), y3 + ( y2 - y1 ), mode );
};
AMOS.prototype.screenCopy11 = function( source, x1, y1, x2, y2, destination, x3, y3, x4, y4, mode )
{
	source = this.getScreen( source );
	destination = this.getScreen( destination );
	source.screenCopy( destination, x1, y1, x2, y2, x3, y3, x4, y4, mode );
};
AMOS.prototype.screenCopy13 = function( source, x1, y1, x2, y2, destination, dx1, dy1, dx2, dy2, dx3, dy3, dx4, dy4 )
{
	source = this.getScreen( source );
	destination = this.getScreen( destination );
	source.screenProject( destination, x1, y1, x2, y2, dx1, dy1, dx2, dy2, dx3, dy3, dx4, dy4 );
};
AMOS.prototype.screenWidth = function( number )
{
	var screen = this.getScreen( number );
	return screen.width;
};
AMOS.prototype.screenHeight = function( number )
{
	var screen = this.getScreen( number );
	return screen.height;
};
AMOS.prototype.screenColour = function( number )
{
	var screen = this.getScreen( number );
	return screen.numberOfColors;
};
AMOS.prototype.screenHide = function( number )
{
	var screen = this.getScreen( number );
	screen.hidden = true;
	this.renderer.setModified();
};
AMOS.prototype.screenShow = function( number )
{
	var screen = this.getScreen( number );
	screen.hidden = false;
	this.renderer.setModified();
};
AMOS.prototype.screenClone = function( number )
{
	if ( this.currentScreen.number < 0 )
		throw 'screen_not_opened';
	if ( number < 0 || number > this.maxNumberOfScreens )
		throw 'illegal_function_call';
	var oldScreen = this.currentScreen;
	this.screenOpen( number, this.currentScreen.width, this.currentScreen.height, this.currentScreen.numberOfColors, this.currentScreen.pixelMode, this.currentScreen.palette );
	this.screens[ number ].setCloned( oldScreen );
	this.screen( oldScreen.number );
	this.renderer.setModified();
};
AMOS.prototype.screenToFront = function( number )
{
	var screen = this.getScreen( number );
	for ( var s = 0; s < this.screensZ.length; s++ )
	{
		if ( this.screensZ[ s ] == screen )
			break;
	}
	this.screensZ.splice( s, 1 );
	this.screensZ.push( screen );
	this.renderer.setModified();
};
AMOS.prototype.screenToBack = function( number )
{
	var screen = this.getScreen( number );
	for ( var s = 0; s < this.screensZ.length; s++ )
	{
		if ( this.screensZ[ s ] == screen )
			break;
	}
	this.screensZ.splice( s, 1 );
	this.screensZ.splice( 0, 0, screen );
	this.renderer.setModified();
};
AMOS.prototype.screenHotspot = function( number, xSpot, ySpot )
{
	var screen = this.getScreen( number );
	screen.setHotspot( xSpot, ySpot );
};
AMOS.prototype.screenRotate = function( number, angle )
{
	var screen = this.getScreen( number );
	screen.angleDisplay = typeof angle != 'undefined' ? angle : 0;
	screen.setModified();
};
AMOS.prototype.screenSkew = function( number, xSkew, ySkew )
{
	var screen = this.getScreen( number );
	screen.xSkewDisplay = typeof xSkew != 'undefined' ? xSkew : screen.xSkewDisplay;
	screen.ySkewDisplay = typeof ySkew != 'undefined' ? ySkew : screen.ySkewDisplay;
	screen.setModified();
};
AMOS.prototype.screenScale = function( number, xScale, yScale )
{
	var screen = this.getScreen( number );
	screen.xScaleDisplay = typeof xScale != 'undefined' ? xScale : screen.xScaleDisplay;
	screen.yScaleDisplay = typeof yScale != 'undefined' ? yScale : screen.yScaleDisplay;
	screen.setModified();
};

AMOS.prototype.dualPlayfield = function( screen1, screen2 )
{
	screen1 = this.getScreen( screen1 );
	screen2 = this.getScreen( screen2 );
	screen1.setDualPlayfield( screen2 );
};
AMOS.prototype.dualPriority = function( screen1, screen2 )
{
	screen1 = this.getScreen( screen1 );
	screen2 = this.getScreen( screen2 );
	screen1.dualPriority( screen2 );
};
AMOS.prototype.setDefaultPalette = function( palette )
{
	for ( var p = 0; p < palette.length; p++ )
	{
		if ( typeof palette[ p ] != 'undefined' )
		{
			this.defaultPalette[ p ] = this.getModernColorString( palette[ p ] );
		}
	}
};
AMOS.prototype.colourBack = function( color, isIndex )
{
	if ( !isIndex )
		color = this.getModernColorString( color );
	else
	{
		if ( color < 0 )
			throw 'illegal_function_call';
		color %= this.currentScreen.numberOfColors;
		color = this.currentScreen.palette[ color ];
	}
	this.renderer.setBackgroundColor( color );
};
AMOS.prototype.swapZScreenPosition = function( screen1, screen2 )
{
	var z1, z2;
	for ( z1 = 0; z1 < this.screensZ.length; z1++ )
	{
		if ( this.screensZ[ z1 ] == screen1 )
			break;
	}
	for ( z2 = 0; z2 < this.screensZ.length; z2++ )
	{
		if ( this.screensZ[ z2 ] == screen2 )
			break;
	}
	var temp = this.screensZ[ z1 ];
	this.screensZ[ z1 ] = this.screensZ[ z2 ];
	this.screensZ[ z2 ] = temp;
};
AMOS.prototype.setBelowZScreenPosition = function( screen1, screen2 )
{
	var z1, z2;
	for ( z1 = 0; z1 < this.screensZ.length; z1++ )
	{
		if ( this.screensZ[ z1 ].number == screen1.number )
			break;
	}
	for ( z2 = 0; z2 < this.screensZ.length; z2++ )
	{
		if ( this.screensZ[ z2 ].number == screen2.number )
			break;
	}
	if ( z1 > z2 )
	{
		this.screensZ.splice( z1, 1 );
		this.screensZ.splice( z2, 0, screen1 );
	}
}
AMOS.prototype.default = function()
{
	this.screens = [];
	this.screensZ = [];
	this.screenOpen( 0 );
};
AMOS.prototype.setErrorNumber = function( number )
{
	this.error = number;
	this.lastError = this.error;
	this.lastErrorPos = this.sourcePos;
};
AMOS.prototype.doError = function( number )
{
	throw this.errors.getErrorFromNumber( number ).index;
};
AMOS.prototype.run = function( section, position, parent )
{
	this.sections.push(
	{
		section: this.section,
		position: this.position,
		parent: this.parent,
		isErrorProc: this.isErrorProc,
		onError: this.onError
	} );
	this.section = section;
	this.root = section;
	this.position = position;
	this.parent = parent;
	this.isErrorProc = false;
	this.onError = null;
};

AMOS.prototype.asc = function( text )
{
	if ( text != '' )
		return text.charCodeAt( 0 );
	return 0;
};
AMOS.prototype.repeat$ = function( text, number )
{
	if ( number < 0 )
		throw( 'illegal_text_window_parameter' );
	var result = '';
	for ( var n = 0; n < number; n++ )
		result += text;
	return result;
};
AMOS.prototype.str$ = function( value )
{
	var space = value >= 0 ? ' ' : '';
	if ( this.fix == 16 )
		return space + value;
	if ( this.fix >= 0 )
		return space + value.toFixed( this.fix );
	return space + value.toExponential( -this.fix );
};
AMOS.prototype.val = function( value )
{
	var base = 10;
	if ( value.substring( 0, 1 ) == '$' )
	{
		value = value.substring( 1 );
		base = 16;
	}
	if ( value.substring( 0, 1 ) == '%' )
	{
		value = value.substring( 1 );
		base = 2;
	}
	var result = parseInt( value, base );
	if ( isNaN( result ) )
		result = 0;
	return result;
};
AMOS.prototype.space$ = function( value )
{
	if ( value < 0 )
		throw( 'illegal_function_call' );

	var result = '';
	for ( var s = 0; s < value; s++ )
		result += ' ';
	return result;
}
AMOS.prototype.toRadian = function( value )
{
	if ( this.degrees )
	 	return value / 180 * ( Math.PI / 2 );
	return value;
};
AMOS.prototype.toDegree = function( value )
{
	if ( this.degrees )
	 	return value * 180 / ( Math.PI / 2 );
	return value;
};

// Keyboard / mouse
AMOS.SHIFT = 0x0001;
AMOS.CONTROL = 0x0002;
AMOS.ALT = 0x0004;
AMOS.META = 0x0008;
AMOS.keyCodeToScanCode =
{
	37: 79,			// Left
	39: 78,			// Right
	38: 76,			// Up
	40: 77, 		// Down
	13: 68,			// Return
	46: 70,			// Del
	8: 65,			// Backspace
	34: 95,			// Page down
	112: 80,		// F1
	113: 81,		// F2
	114: 82,		// F3
	115: 83,		// F4
	116: 84,		// F5
	117: 85,		// F6
	118: 86,		// F7
	119: 87,		// F8
	120: 88,		// F9
	121: 89,		// F10
	122: 90,		// F11
	123: 91,		// F12
	48: 10,			// 0
	49: 1,			// 1
	50: 2,			// 2
	51: 3,			// 3
	52: 4,			// 4
	53: 5,			// 5
	54: 6,			// 6
	55: 7,			// 7
	56: 8,			// 8
	57: 9,			// 9
	96: 10,			// Numpad 0
	97: 1,			// Numpad 1
	98: 2,			// Numpad 2
	99: 3,			// Numpad 3
	100: 4,			// Numpad 4
	101: 5,			// Numpad 5
	102: 6,			// Numpad 6
	103: 7,			// Numpad 7
	104: 8,			// Numpad 8
	105: 9,			// Numpad 9
	144: 0,			// Numlock
	81: 16,			// Q
	87: 17,			// W
	69: 18,			// E
	82: 19,			// R
	84: 20,			// T
	89: 21,			// Y
	85: 22,			// U
	73: 23,			// I
	79: 24,			// O
	80: 25,			// P
	65: 32,			// A
	83: 33,			// S
	68: 34,			// D
	70: 35,			// F
	71: 36,			// G
	72: 37,			// H
	74: 38,			// J
	75: 39,			// K
	76: 40,			// L
	90: 49,			// Z
	88: 50,			// X
	67: 51,			// C
	86: 52,			// V
	66: 53,			// B
	78: 54,			// N
	77: 55,			// M
	222: 42,		// '
	186: 41,		// ;
	219: 26,		// [
	221: 27,		//
	220: 13,		// \
	188: 56, 		// ,
	190: 57,		// .
	191: 58,		// /
	189: 11, 		// -
	187: 12, 		// =
	111: 92,		// Numpad /
	106: 93,		// Numpad *
	109: 74, 		// Numpad -
	107: 94, 		// Numpad +
	32: 64, 		// Space
	145: 0,			// Scroll lock
	110: 0,			// Numpad .
	17: 0,			// Control
	91: 0,			// Meta
	18: 0, 			// Alt
	16: 0, 			// Shift
	45: 0,			// Ins
	36: 0,			// Home
	33: 0,			// Page up
	35: 0,			// End
	27: 0			// Esc
};
AMOS.prototype.setKeyboard = function()
{
	this.keymap = [];
	for ( var c = 0; c < 256; c++ )
		this.keymap[ c ] = false;
	this.modifiers = 0;
	this.lastKeyPressed = 0;
	this.lastKeyPressedModifier = 0;
	this.lastScancode = 0;

	document.onkeydown = onKeyDown;
	document.onkeypress = onKeyPress;
	document.onkeyup = onKeyUp;

	var self = this;
	function onKeyDown( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}
		self.modifiers = 0;
		self.modifiers |= event.shiftKey ? AMOS.SHIFT : 0;
		self.modifiers |= event.altKey ? AMOS.ALT : 0;
		self.modifiers |= event.ctrlKey ? AMOS.CONTROL : 0;
		self.modifiers |= event.metaKey ? AMOS.META : 0;
		self.keymap[ event.keyCode ] = true;
		self.lastEventKeycode = event.keyCode;
		self.lastScancode = AMOS.keyCodeToScanCode[ event.keyCode ];

		// Function keys?
		if ( self.lastScancode > 80 && self.lastScancode < 90 )
		{
			var number = self.lastScancode - 80;
			if ( ( self.modifier & AMOS.SHIFT ) != 0 )
				number += 10;
			if ( self.key$[ number + 1 ] && self.key$[ number + 1 ] != '' )
			{
				self.startKeyboardInput( self.key$[ number + 1 ] );
			}
		}

		// Perticular cases of arrow keys returned by inkey$ as string
		switch ( event.keyCode )
		{
			case 37: self.lastKeyPressed = 29; break;	// Left
			case 39: self.lastKeyPressed = 28; break;	// Right
			case 38: self.lastKeyPressed = 30; break;  	// Up
			case 40: self.lastKeyPressed = 31; break;	// Down
		}

		// Control-C?
		if ( event.keyCode == 67 && ( self.modifiers & AMOS.CONTROL ) != 0 && self.breakOn == true )
		{
			self.break = true;
		}
	};
	function onKeyPress( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}
		self.lastKeyPressed = event.charCode || event.keyCode;
		var modifiers = 0;
		modifiers |= event.shiftKey ? AMOS.SHIFT : 0;
		modifiers |= event.altKey ? AMOS.ALT : 0;
		modifiers |= event.ctrlKey ? AMOS.CONTROL : 0;
		modifiers |= event.metaKey ? AMOS.META : 0;
		self.lastKeyPressedModifiers = modifiers;
		self.waitKey = true;
	};
	function onKeyUp( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}
		self.modifiers = 0;
		self.modifiers |= event.shiftKey ? AMOS.SHIFT : 0;
		self.modifiers |= event.altKey ? AMOS.ALT : 0;
		self.modifiers |= event.ctrlKey ? AMOS.CONTROL : 0;
		self.modifiers |= event.metaKey ? AMOS.META : 0;
		self.keymap[ event.keyCode ] = false;
	}
};
AMOS.prototype.keyState = function( code )
{
	for ( var k in AMOS.keyCodeToScanCode )
	{
		if ( AMOS.keyCodeToScanCode[ k ] == code )
		{
			return this.keymap[ parseInt( k ) ];
		}
	}
	return 0;
};
AMOS.prototype.keyShift = function( shift )
{
	var result = 0;
	if ( ( this.modifiers & AMOS.SHIFT ) != 0 )
		result |= 0x03;
	if ( ( this.modifiers & AMOS.CONTROL ) != 0 )
		result |= 0x08;
	if ( ( this.modifiers & AMOS.ALT ) != 0 )
		result |= 0x30;
	if ( ( this.modifiers & AMOS.META ) != 0 )
		result |= 0xC0;
	return result;
};
AMOS.prototype.startKeyboardInput = function( text )
{
	var self = this;
	self.positionKey$ = 0;
	self.stringKey$ += text;
	self.lastScancode = 0;
	self.lastKeyPressed = 0;
	self.modifiers = 0;
	self.clearKeyFlag = false;
	if ( !self.handleKey$ )
	{
		setTimeout( function()
		{
			self.handleKey$ = setInterval( function()
			{
				if ( self.clearKeyFlag )
				{
					clearInterval( self.handleKey$ );
					self.handleKey$ = null;
					self.stringKey$ = '';
				}
				else
				{
					self.modifiers = 0;
					if ( self.stringKey$.indexOf( '$(SCAN', self.positionKey$ ) == self.positionKey$ )
					{
						var end = self.stringKey$.indexOf( 'SCAN)$', self.positionKey$ + 6 );
						if ( end > 0 )
						{
							self.lastScancode = parseInt( self.stringKey$.substring( self.positionKey$ + 6, end ) );
							switch ( self.lastScancode )
							{
								case 13: self.lastKeyPressed = 13; break;	// Return
								case 37: self.lastKeyPressed = 29; break;	// Left
								case 39: self.lastKeyPressed = 28; break;	// Right
								case 38: self.lastKeyPressed = 30; break;  	// Up
								case 40: self.lastKeyPressed = 31; break;	// Down
							}
						}
						self.positionKey$ = end + 6;
					}
					else if ( self.stringKey$.indexOf( '$(MASK', self.positionKey$ ) == self.positionKey$ )
					{
						var end = self.stringKey$.indexOf( 'MASK)$', self.positionKey$ + 6 );
						if ( end > 0 )
						{
							var mask = parseInt( self.stringKey$.substring( self.positionKey$ + 6, end ) );
							if ( ( mask & 0x0003 ) != 0 )			// Shift
								self.modifiers |= AMOS.SHIFT;
							else if ( ( mask & 0x0004 ) != 0 )		// Caps lock
								self.modifiers |= AMOS.SHIFT;
							else if ( ( mask & 0x0008 )	!= 0 )		// Ctrl
								self.modifiers |= AMOS.CONTROL;
							else if ( ( mask & 0x0030 ) != 0 )		// Alt
								self.modifiers |= AMOS.ALT;
							else if ( ( mask & 0x0040 ) != 0 )		// Meta
								self.modifiers |= AMOS.META;
						}
						self.positionKey$ = end + 6;
					}
					else
					{
						self.lastKeyPressed = self.stringKey$.charCodeAt( self.positionKey$++ );
						self.lastKeyPressedModifiers = 0;
					}
					if ( self.positionKey$ >= self.stringKey$.length )
					{
						clearInterval( self.handleKey$ );
						self.handleKey$ = null;
						self.stringKey$ = '';
					}
				}
			}, 20 );
		}, 100 );
	}
};
AMOS.prototype.debugOnKeyPress = function( key )
{
	if ( this.lastKeyPressed == key.charCodeAt( 0 ) )
	{
		debugger;
	}
};
AMOS.prototype.putKey = function( text )
{
	this.startKeyboardInput( text );
};
AMOS.prototype.clearKey = function()
{
	this.lastKeyPressed = 0;
	this.clearKeyFlag = true;
};
AMOS.prototype.inkey$ = function()
{
	var key = this.lastKeyPressed;
	if ( this.lastKeyPressed )
	{
		this.lastKeyPressed = 0;
		this.inkeyShift = this.lastKeyPressedModifiers;
		return String.fromCharCode( key );
	}
	return '';
};
AMOS.prototype.scanShift = function()
{
	return ( this.inkeyShift & AMOS.SHIFT ) == 0 ? 0 : 3;
};
AMOS.prototype.scancode = function()
{
	if ( this.lastScancode )
	{
		var key = this.lastScancode;
		this.lastScancode = 0;
		return key;
	}
	return 0;
};
AMOS.prototype.waitKey = function()
{
	this.waitKey = false;
};
AMOS.prototype.waitKey_wait = function()
{
	if ( this.waitKey )
	{
		this.waiting = null;
		this.lastKeyPressed = 0;
		this.waitKey = false;
	}
};
AMOS.prototype.waitVbl = function()
{
	this.waitVblCount = 1;
};
AMOS.prototype.waitVbl_wait = function()
{
	this.waitVblCount--;
	if ( this.waitVblCount == 0 )
	{
		this.waiting = null;
	}
};
AMOS.prototype.setKey$ = function( value, number, mask )
{
	if ( number <= 0 || number > 20 )
		throw 'illegal_function_call';
	this.key$[ number ] = value;
};
AMOS.prototype.getKey$ = function( number, mask )
{
	if ( number < 0 || number > 20 )
		throw 'illegal_function_call';
	return this.key$[ number ];
};
AMOS.prototype.scan$ = function( number, mask )
{
	var result = '$(SCAN' + number + 'SCAN)$';
	if ( typeof mask != 'undefined' )
	{
		result += '$(MASK' + mask + 'MASK)$';
	}
	return result;
};

AMOS.prototype.setVariable = function( variable, value )
{
	if ( !variable.dimensions )
	{
		if ( !variable.parent )
			this.section.vars[ variable.name ] = value;
		else
			this.section.parent.vars[ variable.name ] = value;
	}
	else
	{
		if ( !variable.parent )
			this.section.vars[ variable.name ].setValue( variable.dimensions, value );
		else
			this.section.parent.vars[ variable.name ].setValue( variable.dimensions, value );
	}
};
AMOS.prototype.getVariable = function( variable )
{
	if ( !variable.dimensions )
	{
		if ( !variable.parent )
			return this.section.vars[ variable.name ];
		else
			return this.section.parent.vars[ variable.name ];
	}
	else
	{
		if ( !variable.parent )
			return this.section.vars[ variable.name ].getValue( variable.dimensions );
		else
			return this.section.parent.vars[ variable.name ].getValue( variable.dimensions );
	}
};
AMOS.prototype.input = function( args )
{
	this.inputArgs = args;
	this.inputPosition = 0;
	this.inputString = '';
	this.lastKeyPressed = 0;
	this.lastScanCode = 0;
	this.inputCursor = 0;
	if ( args.text != '' )
	{
		this.currentScreen.currentWindow.print( args.text );
	}
	this.inputXCursor = this.currentScreen.currentWindow.xCursor;
	this.currentScreen.currentWindow.anchorYCursor();
};
AMOS.prototype.input_wait = function( args )
{
	if ( this.lastKeyPressed )
	{
		if ( this.lastKeyPressed == 13 )
		{
			// Return
			var previousComma = 0;
			var inputString;
			while( true )
			{
				var comma = this.inputString.indexOf( ',', previousComma );
				if ( this.inputArgs.variables.length > 1 && comma >= 0 && !this.inputArgs.isLineInput )
				{
					inputString = this.inputString.substring( previousComma, comma );
					previousComma = comma + 1;
				}
				else
				{
					inputString = this.inputString.substring( previousComma );
					previousComma = this.inputString.length;
				}
				var variable = this.inputArgs.variables[ this.inputPosition ];
				var value;
				if ( variable.type == 0 )
					value = inputString.length > 0 ? parseInt( inputString ) : 0;
				else if ( variable.type == 1 )
					value = inputString.length > 0 ? parseFloat( inputString ) : 0;
				else
					value = inputString;
				if ( variable.type != 2 && isNaN( value ) )
				{
					this.currentScreen.currentWindow.print( '', true );
					this.currentScreen.currentWindow.print( this.errors.getErrorFromId( 'please_redo_from_start' ).message );
					this.inputXCursor = this.currentScreen.currentWindow.xCursor;
					this.currentScreen.currentWindow.anchorYCursor();
					this.inputPosition = 0;
					this.inputString = '';
					break;
				}
				this.setVariable( variable, value );
				this.inputPosition++;
				if ( this.inputPosition >= this.inputArgs.variables.length )
				{
					if ( this.inputArgs.newLine )
						this.currentScreen.currentWindow.print( '', true );
					this.waiting = null;
					break;
				}
				if ( previousComma >= this.inputString.length )
				{
					this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
					this.currentScreen.currentWindow.cMove( this.inputString.length, 0 );
					this.currentScreen.currentWindow.print( '', true );
					this.currentScreen.currentWindow.print( '?? ' );
					this.inputXCursor = this.currentScreen.currentWindow.xCursor;
					this.currentScreen.currentWindow.anchorYCursor();
					this.inputString = '';
					this.inputCursor = 0;
					break;
				}
			}
		}
		else if ( this.lastKeyPressed == 29 )
		{
			// Left
			if ( this.inputCursor > 0 )
			{
				this.inputCursor--;
				this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
				this.currentScreen.currentWindow.cMove( this.inputCursor, 0 );
			}
		}
		else if ( this.lastKeyPressed == 28 )
		{
			// Right
			if ( this.inputCursor < this.inputString.length )
			{
				this.inputCursor++;
				this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
				this.currentScreen.currentWindow.cMove( this.inputCursor, 0 );
			}
		}
		else
		{
			// Normal character
			this.inputString = this.inputString.substring( 0, this.inputCursor ) + String.fromCharCode( this.lastKeyPressed ) + this.inputString.substring( this.inputCursor );
			this.inputCursor++;
			this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
			this.currentScreen.currentWindow.print( this.inputString );
			this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
			this.currentScreen.currentWindow.cMove( this.inputCursor, 0 );
		}
		this.lastKeyPressed = 0;
		this.lastScancode = 0;
	}
	else
	{
		if ( this.lastScancode == 65 )
		{
			// Backspace
			if ( this.inputCursor > 0 )
			{
				this.inputCursor--;
				this.inputString = this.inputString.substring( 0, this.inputCursor ) + this.inputString.substring( this.inputCursor + 1 );
				this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
				this.currentScreen.currentWindow.print( this.inputString );
				this.currentScreen.currentWindow.print( ' $(COMDX-1COM)$', false );
				this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
				this.currentScreen.currentWindow.cMove( this.inputCursor, 0 );
			}
		}
		else if ( this.lastScancode == 70 )
		{
			// Del
			if ( this.inputCursor < this.inputString.length )
			{
				this.inputString = this.inputString.substring( 0, this.inputCursor ) + this.inputString.substring( this.inputCursor + 1 );
				this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
				this.currentScreen.currentWindow.print( this.inputString );
				this.currentScreen.currentWindow.print( ' $(COMDX-1COM)$', false );
				this.currentScreen.currentWindow.locate( this.inputXCursor, this.currentScreen.currentWindow.yCursorAnchor );
				this.currentScreen.currentWindow.cMove( this.inputCursor, 0 );
			}
		}
		this.lastScancode = 0;
	}
};

AMOS.prototype.input$ = function( resultNumber, args )
{
	this.resultNumber = resultNumber;
	this.input$String = '';
	this.input$Length = args[ 0 ];
	if ( this.input$length <= 0 )
		throw 'illegal_function_call';
	this.lastKeyPressed = 0;
	this.lastScanCode = 0;
};
AMOS.prototype.input$_wait = function( args )
{
	if ( this.lastKeyPressed )
	{
		this.input$String += String.fromCharCode( this.lastKeyPressed );
		this.lastKeyPressed = 0;
	}
	if ( this.input$String.length >= this.input$Length )
	{
		this.waiting = null;
		this.results[ this.resultNumber ] = this.input$String;
	}
};

// Mouse
AMOS.buttonToMouse =
{
	0: 0x0001,
	1: 0x0004,
	2: 0x0002
};
AMOS.prototype.setMouse = function()
{
	this.renderer.canvas.onmousemove = onMouseMove;
	this.renderer.canvas.onmouseleave = onMouseLeave;
	this.renderer.canvas.onmouseenter = onMouseEnter;
	this.renderer.canvas.onmousedown = onMouseDown;
	this.renderer.canvas.onmouseup = onMouseUp;
	this.renderer.canvas.onclick = onClick;
	this.renderer.canvas.ondblclick = onDblClick;
	this.renderer.canvas.oncontextmenu = onContextMenu;
	if ( document.body.addEventListener)
	{
    	document.body.addEventListener( 'mousewheel', onMouseWheel, false );
    	document.body.addEventListener( 'DOMMouseScroll', onMouseWheel, false );
	}
	else
	{
		document.body.attachEvent( 'onmousewheel', onMouseWheel );
	}

	this.xMouse = 0;
	this.yMouse = 0;
	this.mouseInside = false;
	this.mouseButtons = 0;
	this.clickMouse = 0;
	this.doubleClick = false;
	this.wheelMouse = 0;
	this.mouseCurrent = 'auto';
	this.mouseShown = true;

	var self = this;
	function onMouseMove( event )
	{
		self.xMouseDebug = event.clientX;
		self.yMouseDebug = event.clientX;
		self.xMouse = ( event.clientX - self.renderer.canvas.offsetLeft ) / ( self.renderer.width / self.hardWidth ) + self.hardLeftX;
		self.yMouse = ( event.clientY - self.renderer.canvas.offsetTop ) / ( self.renderer.height / self.hardHeight ) + self.hardTopY;
	}
	function onMouseEnter( event )
	{
		self.mouseInside = true;
	}
	function onMouseLeave( event )
	{
		self.mouseInside = false;
	}
	function onMouseWheel( event )
	{
		self.wheelMouse = Math.max( -1, Math.min( 1, ( event.wheelDelta || -event.detail ) ) );
	}
	function onMouseDown( event )
	{
		self.mouseButtons |= AMOS.buttonToMouse[ event.button ];
		//self.clickMouse = self.mouseButtons;
	}
	function onMouseUp( event )
	{
		self.mouseButtons &= ~AMOS.buttonToMouse[ event.button ];
	}
	function onClick( event )
	{
		self.clickMouse |= AMOS.buttonToMouse[ event.button ];
	}
	function onDblClick( event )
	{
		self.doubleClick = true;
	}
	function onContextMenu( event )
	{
		if (event.preventDefault != undefined )
		 	event.preventDefault();
		if( event.stopPropagation != undefined )
		 	event.stopPropagation();
	}
};
AMOS.prototype.screenIn = function( number, x, y )
{
	if ( typeof number != 'undefined' )
	{
		if ( number < 0 || ( !this.unlimitedScreens && number >= 8 ) )
			throw 'illegal_function_call';
		if ( !this.screens[ number ] )
			throw 'screen_not_opened';
		return this.screens[ number ].isIn( x, y ) ? number : -1;
	}
	for ( var s = this.screensZ.length - 1; s >= 0; s-- )
	{
		if ( this.screens[ s ] && this.screens[ s ].isIn( x, y ) )
		{
			return s;
		}
	}
	return -1;
};
AMOS.prototype.mouseScreen = function()
{
	return this.screenIn( undefined, this.xMouse, this.yMouse );
};
AMOS.prototype.mouseWheel = function()
{
	var temp = this.wheelMouse;
	this.wheelMouse = 0;
	return temp;
};
AMOS.prototype.showMouse = function( flag )
{
	if ( flag != this.mouseShown )
	{
		this.mouseShown = flag;
		if ( !flag )
			this.renderer.canvas.style.cursor = 'none';
		else
			this.renderer.canvas.style.cursor = this.mouseCurrent;
	}
};
AMOS.prototype.mouseClick = function()
{
	var click = this.clickMouse;
	this.clickMouse = 0;
	return click;
};
AMOS.prototype.changeMouse = function( type )
{
	switch ( type )
	{
		case 1:
		default:
			this.mouseCurrent = 'auto';
			break;
		case 2:
			this.mouseCurrent = 'crosshair';
			break;
		case 3:
			this.mouseCurrent = 'wait';
			break;
	}
	if ( this.mouseShown )
		this.renderer.canvas.style.cursor = this.mouseCurrent;
};
AMOS.prototype.xHard = function( x, screen )
{
	screen = this.getScreen( screen );
	return x * screen.renderScaleX + screen.x;
};
AMOS.prototype.yHard = function( y, screen )
{
	screen = this.getScreen( screen );
	return y * screen.renderScaleY + screen.y;
};
AMOS.prototype.xScreen = function( x, screen )
{
	screen = this.getScreen( screen );
	return ( x - screen.x ) / screen.renderScaleX;
};
AMOS.prototype.yScreen = function( y, screen )
{
	screen = this.getScreen( screen );
	return ( y - screen.y ) / screen.renderScaleY;
};
AMOS.prototype.isIn = function( x, y )
{
	x = ( x - screen.x ) / screen.renderScaleX;
	y = ( y - screen.y ) / screen.renderScaleY;
	this.currentScreen.isIn( x, y );
};
AMOS.prototype.hZone = function( number, x, y )
{
	var screen = this.getScreen( number );
	x = ( x - screen.x ) / screen.renderScaleX;
	y = ( y - screen.y ) / screen.renderScaleY;
	return screen.zone( number, x, y );
};
AMOS.prototype.mouseZone = function()
{
	return this.hZone( undefined, this.xMouse, this.yMouse );
};

// Data/read
AMOS.prototype.read = function( type )
{
	if ( this.section.dataPosition >= this.section.datas.length )
		throw( 'out_of_data' );

	var value = this.section.datas[ this.section.dataPosition++ ];
	if ( typeof value == 'function' )
		value = value.call( this.section );
	if ( type == 0 || type == 1 )
	{
		if ( typeof value == 'string' )
			throw( 'type_mismatch' );
	}
	else
	{
		if ( typeof value != 'string' )
			throw( 'type_mismatch' );
	}
	return value;
};
AMOS.prototype.add = function( variable, plus, start, end )
{
	var number = this.getVariableFromDescription( variable );
	number += plus;
	if ( typeof start != 'undefined' && typeof end != 'undefined' )
	{
		if ( number > end )
			number = start;
		if ( number < start )
			number = end;
	}
	this.setVariableFromDescription( variable, number );
};
AMOS.prototype.getVariableFromDescription = function( variable )
{
	var result;
	if ( variable.dimensions )
	{
		if ( !variable.root )
			result = this.section.vars[ variable.name ].getValue( variable.dimensions );
		else
			result = this.sections[ 1 ].section.vars[ variable.name ].getValue( variable.dimensions );
	}
	else
	{
		if ( !variable.root )
			result = this.section.vars[ variable.name ];
		else
			result = this.sections[ 1 ].section.vars[ variable.name ];
	}
	return result;
};
AMOS.prototype.setVariableFromDescription = function( variable, value )
{
	if ( variable.dimensions )
	{
		if ( !variable.root )
			this.section.vars[ variable.name ].setValue( variable.dimensions, value );
		else
			this.sections[ 1 ].section.vars[ variable.name ].setValue( variable.dimensions, value );
	}
	else
	{
		if ( !variable.root )
			this.section.vars[ variable.name ] = value;
		else
			this.sections[ 1 ].section.vars[ variable.name ] = value;
	}
};


// AMOS Array class
function AArray( amos, defaultValue, oneBased )
{
	this.amos = amos;
	this.defaultValue = defaultValue;
	this.oneBased = oneBased;
};
AArray.prototype.dim = function( dimensions )
{
	if ( typeof this.array != 'undefined' )
	{
		this.amos.error = 10;
		return;
	}

	var self = this;
	this.dimensions = dimensions;
	this.array = createArray( 0 );
	function createArray( d )
	{
		var arr = [];
		if ( d == dimensions.length - 1 )
		{
			for ( var dd = 0; dd <= dimensions[ d ]; dd++ )
				arr[ dd ] = self.defaultValue;
		}
		else
		{
			for ( var dd = 0; dd <= dimensions[ d ]; dd++ )
				arr[ dd ] = createArray( d + 1 );
		}
		return arr;
	}
}
AArray.prototype.getValue = function( dimensions )
{
	var obj = this.getVariable( dimensions );
	return obj.array[ obj.pointer ];
};
AArray.prototype.setValue = function( dimensions, value )
{
	var obj = this.getVariable( dimensions );
	obj.array[ obj.pointer ] = value;
};
AArray.prototype.sort = function( dimensions )
{
	var obj = this.getVariable( dimensions );
	if ( typeof this.defaultValue == 'string' )
		obj.array = obj.array.sort();
	else
	{
		obj.array = obj.array.sort( function( a, b )
		{
			return a - b;
		} );
	}
};
AArray.prototype.match = function( dimensions, value )
{
	if ( dimensions.length > 1 )
		throw 'illegal_function_call';
	var arr = this.getVariable( dimensions ).array;
	for ( var d = 0; d < arr.length; d++ )
	{
		if ( arr[ d ] == value )
		{
			return d;
		}
	}
	return -1;
};
AArray.prototype.inc = function( dimensions )
{
	var obj = this.getVariable( dimensions );
	obj.array[ obj.pointer ]++;
};
AArray.prototype.dec = function( dimensions )
{
	var obj = this.getVariable( dimensions );
	obj.array[ obj.pointer ]--;
};
AArray.prototype.getVariable = function( dimensions )
{
	if ( typeof this.array == 'undefined' )
		throw 'non_dimensionned_array';
	var pArr = this.array;
	for ( var d = 0; d < this.dimensions.length - 1; d++ )
	{
		dd = dimensions[ d ] - this.oneBased;
		if ( dd < 0 || dd > this.dimensions[ d ] )
			throw 'illegal_function_call';
		pArr = pArr[ dd ];
	}
	var dd = dimensions[ d ] - this.oneBased;
	if ( dd < 0 || dd > this.dimensions[ d ] )
		throw 'illegal_function_call';
	return { array: pArr, pointer: dd };
};


// Instruction set
AMOS.prototype.string$ = function( text, number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var result = '';
	var chr = text.charAt( 0 );
	for ( var c = 0; c < number; c++ )
		result += chr;
	return result;
};
AMOS.prototype.flip$ = function( text )
{
	var result = '';
	for ( var c = text.length -1; c >= 0; c-- )
		result += text.charAt( c );
	return result;
};
AMOS.prototype.getLeft$ = function( text, position )
{
	if ( position < 0 )
		throw( 'illegal_function_call' );
	return text.substring( 0, position );
};
AMOS.prototype.setLeft$ = function( text, variable, position )
{
	this.setMid$( text, variable, 0, position );
};
AMOS.prototype.getMid$ = function( text, start, len )
{
	if ( start < 0 )
		throw( 'illegal_function_call' );

	start = Math.max( start - 1, 0 );
	if ( typeof len == 'undefined' )
		len = text.length;
	else if ( len < 0 )
		throw( 'illegal_function_call )' );

	return text.substr( start, len );
};
AMOS.prototype.setMid$ = function( text, variable, start, len )
{
	if ( start < 0 )
		throw( 'illegal_function_call' );
	start = Math.max( start - 1, 0 );

	if ( typeof len == 'undefined' )
		len = text.length;
	else if ( len < 0 )
		throw( 'illegal_function_call )' );

	var value = this.getVariable( variable );
	if ( start > value.length )
		start = value.length;
	len = Math.min( len, text.length );
	if ( start + len > value.length )
		len = value.length - start;
	value = value.substring( 0, start ) + text.substr( 0, len ) + value.substring( start + len );
	this.setVariable( variable, value );
};
AMOS.prototype.getRight$ = function( text, len )
{
	if ( len < 0 )
		throw( 'illegal_function_call )' );

	return text.substring( text.length - len );
};
AMOS.prototype.setRight$ = function( text, variable, len )
{
	var value = this.getVariable( variable );
	if ( typeof len == 'undefined' )
		len = value.length;
	if ( len < 0 )
		throw( 'illegal_function_call )' );

	len = Math.min( len, value.length );
	var start = Math.max( 0, value.length - len );
	len = Math.min( len, text.length );
	value = value.substring( 0, start ) + text.substr( 0, len ) + value.substring( start + len );
	this.setVariable( variable, value );
};
AMOS.prototype.subtractString = function( string1, string2 )
{
	return this.utilities.replaceStringInText( string1, string2, '' );	
};
AMOS.prototype.wait = function( args )
{
	if ( args[ 0 ] < 0 )
		throw( 'illegal_function_call' );

	this.waitEnd = new Date().getTime() + args[ 0 ] * 20;
};
AMOS.prototype.wait_wait = function()
{
	var now = new Date().getTime();
	if ( now >= this.waitEnd )
		this.waiting = null;
};
AMOS.prototype.bin$ = function( value, digits )
{
	var result = value.toString( 2 );
	if ( typeof value != 'undefined' )
	{
		if ( value < 0 )
			throw 'illegal_function_call';
		for ( var l = result.length; l < digits; l++ )
			result = '0' + result;
	}
	return '%' + result;
};
AMOS.prototype.hex$ = function( value, digits )
{
	var result = value.toString( 16 );
	if ( typeof value != 'undefined' )
	{
		if ( value < 0 )
			throw 'illegal_function_call';
		for ( var l = result.length; l < digits; l++ )
			result = '0' + result;
	}
	return '$' + result;
};
AMOS.prototype.instr = function( text, search, position )
{
	if ( position < 0 )
		throw 'illegal_function_call';
	if ( typeof position == 'undefined' )
		position = 1;
	position = Math.max( position - 1, 0 );
	var result = text.indexOf( search, position );
	if ( result >= 0 )
		return result + 1;
	return 0;
};
AMOS.prototype.setTimer = function( time )
{
	if ( time < 0 )
		throw 'illegal_function_call';
	this.timer = new Date().getTime() + time;
};
AMOS.prototype.getTimer = function()
{
	return new Date().getTime() - this.timer;
};

// Mersene Twister random generator
AMOS.prototype.rnd = function( value )
{
	if ( this.merseneTwister )
	{
		var number = this.merseneTwister.genrand_res53() * ( value + 1 );
		return Math.floor( number );
	}
	if ( Math.floor( value ) == value )
		return Math.floor( Math.random() * ( value + 1 ) );
	else
		return Math.random() * value;
};
AMOS.prototype.randomize = function( initial )
{
	this.merseneTwister = new MersenneTwister( initial );
}

function MersenneTwister( seed )
{
	if ( seed == undefined )
	{
	  	seed = new Date().getTime();
	}
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 0x9908b0df;
	this.UPPER_MASK = 0x80000000;
	this.LOWER_MASK = 0x7fffffff;

	this.mt = new Array(this.N);
	this.mti=this.N+1;

	this.init_genrand(seed);
}

MersenneTwister.prototype.init_genrand = function( s )
{
	this.mt[ 0 ] = s >>> 0;
	for ( this.mti=1; this.mti < this.N; this.mti++ )
	{
		var s = this.mt[ this.mti -1 ] ^ ( this.mt[ this.mti -1 ] >>> 30 );
		this.mt[ this.mti ] = ( ( ( ( ( s & 0xffff0000 ) >>> 16 ) * 1812433253 ) << 16 ) + ( s & 0x0000ffff ) * 1812433253 ) + this.mti;
		this.mt[ this.mti ] >>>= 0;
	}
}
MersenneTwister.prototype.genrand_int32 = function()
{
	var y;
	var mag01 = new Array( 0x0, this.MATRIX_A );

	if ( this.mti >= this.N )
	{
	  	var kk;

	  	if ( this.mti == this.N+1 )
			this.init_genrand( 5489 );

		for ( kk=0; kk< this.N - this.M; kk++ )
		{
			y = ( this.mt[ kk ] & this.UPPER_MASK ) | ( this.mt[ kk + 1 ] & this.LOWER_MASK );
			this.mt[ kk ] = this.mt[ kk + this.M ] ^ ( y >>> 1 ) ^ mag01[ y & 0x1 ];
	  	}
		for ( ; kk < this.N - 1; kk++ )
		{
			y = ( this.mt[ kk ] & this.UPPER_MASK ) | ( this.mt[ kk + 1 ] & this.LOWER_MASK );
			this.mt[ kk ] = this.mt[ kk + ( this.M - this.N ) ] ^ ( y >>> 1 ) ^ mag01[ y & 0x1 ];
	  	}
	  	y = ( this.mt[ this.N - 1] & this.UPPER_MASK ) | ( this.mt[ 0 ] & this.LOWER_MASK );
	  	this.mt[ this.N - 1 ] = this.mt[ this.M - 1 ] ^ ( y >>> 1 ) ^ mag01[ y & 0x1 ];
  		this.mti = 0;
	}

	y = this.mt[ this.mti++ ];

	y ^= ( y >>> 11 );
	y ^= ( y << 7 ) & 0x9d2c5680;
	y ^= ( y << 15 ) & 0xefc60000;
	y ^= ( y >>> 18 );

	return y >>> 0;
}

MersenneTwister.prototype.genrand_real1 = function()
{
	return this.genrand_int32()*(1.0/4294967295.0);
}
MersenneTwister.prototype.genrand_res53 = function()
{
	var a = this.genrand_int32() >>> 5, b = this.genrand_int32() >>> 6;
	return( a * 67108864.0 + b ) * ( 1.0 / 9007199254740992.0 );
}

//
// MEMORY BANKS
//
AMOS.prototype.allocMemoryBlock = function( data, endian )
{
	var memoryBlock = new MemoryBlock( this, data, endian );
	memoryBlock.memoryHash = this.memoryNumbers++;
	if ( this.memoryNumber > 9000 )
		this.memoryNumber = 1;
	this.memoryBlocks.push( memoryBlock );
	return memoryBlock;
};
AMOS.prototype.freeMemoryBlock = function( block )
{
	for ( var b = 0; b < this.memoryBlocks.length; b++ )
	{
		if ( this.memoryBlocks[ b ] == block )
		{
			this.memoryBlocks = this.utilities.slice( this.memoryBlocks, b, 1 );
			break;
		}
	}
};
AMOS.prototype.getMemoryBlockFromAddress = function( address )
{
	var index = Math.floor( address / this.memoryHashMultiplier );
	for ( var b = 0; b < this.memoryBlocks.length; b++ )
	{
		if ( this.memoryBlocks[ b ].memoryHash == index )
		{
			return this.memoryBlocks[ b ];
		}
	}
	throw 'illegal_function_call';
};
AMOS.prototype.getMemory = function( number )
{
	var index = Math.floor( number / this.memoryHashMultiplier );
	if ( index == 0 )
	{
		return { start: this.banks.getStart( number ), length: this.banks.getLength( number ) };
	}
	var block = this.getMemoryBlockFromAddress( number );
	return { start: number, length: block.length };
};
AMOS.prototype.poke = function( address, value )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	memoryBlock.poke( address, value );
};
AMOS.prototype.doke = function( address, value )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	memoryBlock.doke( address, value );
};
AMOS.prototype.loke = function( address, value )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	memoryBlock.loke( address, value );
};
AMOS.prototype.peek = function( address )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	return memoryBlock.peek( address, false );
};
AMOS.prototype.deek = function( address )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	return memoryBlock.deek( address, false );
};
AMOS.prototype.leek = function( address )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	return memoryBlock.leek( address, false );
};
AMOS.prototype.poke$ = function( address, text )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	memoryBlock.poke$( address, text );
};
AMOS.prototype.doke$ = function( address, text )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	memoryBlock.doke$( address, text );
};
AMOS.prototype.peek$ = function( address, length, stop )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	return memoryBlock.peek$( address, length, stop );
};
AMOS.prototype.deek$ = function( address, length, stop )
{
	var memoryBlock = this.getMemoryBlockFromAddress( address );
	return memoryBlock.deek$( address, length, stop );
};
AMOS.prototype.fill = function( start, end, value )
{
	var startBlock = this.getMemoryBlockFromAddress( start );
	var endBlock = this.getMemoryBlockFromAddress( end );
	if ( startBlock != endBlock )
		throw 'illegal_function_call';
	startBlock.fill( start, end, value );
};
AMOS.prototype.copy = function( source, length, destination )
{
	var sourceBlock = this.getMemoryBlockFromAddress( source );
	sourceBlock.copy( destination, length );
};
AMOS.prototype.hunt = function( start, end, text )
{
	var startBlock = this.getMemoryBlockFromAddress( start );
	var endBlock = this.getMemoryBlockFromAddress( end );
	if ( startBlock != endBlock )
		throw 'illegal_function_call';
	return startBlock.hunt( start, end, text );
};



AMOS.prototype.bLoad = function( args )
{
	var options = this.getMemory( args[ 1 ] );
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	this.filesystem.loadBinary( args[ 0 ], options, function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.bSave = function( args )
{
	var startBlock = this.getMemoryBlockFromAddress( args[ 1 ] );
	var endBlock = this.getMemoryBlockFromAddress( args[ 2 ] );
	if ( startBlock != endBlock )
		throw 'illegal_function_call';
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	var options = { start: args[ 1 ], end: args[ 2 ] };
	this.filesystem.saveBinary( args[ 0 ], options, function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.openOut = function( args )
{
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	this.filesystem.openOut( args[ 0 ], args[ 1 ], function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.openIn = function( args )
{
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	this.filesystem.openIn( args[ 0 ], args[ 1 ], function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.append = function( args )
{
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	this.filesystem.append( args[ 0 ], args[ 1 ], function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.openRandom = function( args )
{
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	this.filesystem.openRandom( args[ 0 ], args[ 1 ], function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.close = function( args )
{
	var self = this;
	this.fileOperationEnd = false;
	this.fileOperationError = false;
	this.filesystem.close( args[ 0 ], function( response, data, extra )
	{
		if ( !response )
			self.fileOperationError = data;
		self.fileOperationEnd = true;
	} );
};
AMOS.prototype.fileOperation_wait = function()
{
	if ( this.fileOperationEnd )
	{
		if ( this.fileOperationError )
			throw this.fileOperationError;
		this.waiting = false;
	}
};



AMOS.prototype.bSet = function( variable, shift )
{
	var value = this.getVariable( variable );
	this.setVariable( variable, value | ( 1 << shift ) );
};
AMOS.prototype.bClr = function( variable, shift )
{
	var value = this.getVariable( variable );
	this.setVariable( variable, value & ( ~( 1 << shift ) ) );
};
AMOS.prototype.bChg = function( variable, shift )
{
	var value = this.getVariable( variable );
	this.setVariable( variable, value ^ ( 1 << shift ) );
};
AMOS.prototype.rolB = function( variable, shift )
{
	var value = this.getVariable( variable );
	var carry = ( value & 0x80 ) != 0 ? 0x01 : 0x00;
	this.setVariable( variable, ( value & 0xFFFFFF00 ) | ( ( value << shift ) & 0xFF ) | carry );
};
AMOS.prototype.rolW = function( variable, shift )
{
	var value = this.getVariable( variable );
	var carry = ( value & 0x8000 ) != 0 ? 0x01 : 0x00;
	this.setVariable( variable, ( value & 0xFFFF0000 ) | ( ( value << shift ) & 0xFFFF ) | carry );
};
AMOS.prototype.rolL = function( variable, shift )
{
	var value = this.getVariable( variable );
	var carry = ( value & 0x80000000 ) != 0 ? 0x01 : 0x00;
	this.setVariable( variable, ( value << shift ) | carry );
};
AMOS.prototype.rorB = function( variable, shift )
{
	var value = this.getVariable( variable );
	var carry = ( value & 0x01 ) != 0 ? 0x80 : 0x00;
	this.setVariable( variable, ( value & 0xFFFFFF00 ) | ( ( value >>> shift ) & 0xFF ) | carry );
};
AMOS.prototype.rorW = function( variable, shift )
{
	var value = this.getVariable( variable );
	var carry = ( value & 0x01 ) != 0 ? 0x8000 : 0x0000;
	this.setVariable( variable, ( value & 0xFFFF0000 ) | ( ( value >>> shift ) & 0xFFFF ) | carry );
};
AMOS.prototype.rorL = function( variable, shift )
{
	var value = this.getVariable( variable );
	var carry = ( value & 0x01 ) != 0 ? 0x80000000 : 0x00000000;
	this.setVariable( variable, ( value >>> shift ) | carry );
};


// Gamepads
AMOS.GAMEPAD_FIRE = 0;
AMOS.GAMEPAD_UP = 12;
AMOS.GAMEPAD_DOWN = 13;
AMOS.GAMEPAD_RIGHT = 15;
AMOS.GAMEPAD_LEFT = 14;
AMOS.GAMEPAD_A = 0;
AMOS.GAMEPAD_B = 1;
AMOS.GAMEPAD_X = 2;
AMOS.GAMEPAD_Y = 3;
AMOS.GAMEPAD_STICKLEFT = 10;
AMOS.GAMEPAD_STICKRIGHT = 11;
AMOS.GAMEPAD_BOTTOMLEFT = 6;
AMOS.GAMEPAD_TOPLEFT = 4;
AMOS.GAMEPAD_BOTTOMRIGHT = 7;
AMOS.GAMEPAD_TOPRIGHT = 5;
AMOS.GAMEPAD_CENTERLEFT = 8;
AMOS.GAMEPAD_CENTERRIGHT = 9;
AMOS.GAMEPAD_HAXELEFT = 0;
AMOS.GAMEPAD_VAXELEFT = 1;
AMOS.GAMEPAD_HAXERIGHT = 2;
AMOS.GAMEPAD_VAXERIGHT = 3;
AMOS.MAPPING_BUTTONS = 0;
AMOS.MAPPING_AXES = 16;
AMOS.MAPPING_TRIGGERS = 32
AMOS.prototype.setGamepads = function()
{
	this.gamepads = navigator.getGamepads();
	this.gamepadMaps = {};
};
AMOS.prototype.scanGamepads = function()
{
	this.gamepads = navigator.getGamepads();
};
AMOS.prototype.getMapping = function( gamepad, key, delta )
{
	if ( gamepad.mapping == 'standard' )
		return key;
	if ( this.gamepadMaps[ gamepad.id ] )
	{
		var keyMapped = this.gamepadMaps[ gamepad.id ][ key + delta ];
		if ( typeof keyMapped != 'undefined' )
			return keyMapped;
	}
	return key;
};
AMOS.prototype.jUp = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				return gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_UP, AMOS.MAPPING_BUTTONS ) ].pressed;
			}
		}
	}
	return false;
};
AMOS.prototype.jDown = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				return gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_DOWN, AMOS.MAPPING_BUTTONS ) ].pressed;
			}
		}
	}
	return false;
};
AMOS.prototype.jLeft = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				return gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_LEFT, AMOS.MAPPING_BUTTONS ) ].pressed;
			}
		}
	}
	return false;
};
AMOS.prototype.jRight = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				return gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_RIGHT, AMOS.MAPPING_BUTTONS ) ].pressed;
			}
		}
	}
	return false;
};
AMOS.prototype.fire = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				return gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_FIRE, AMOS.MAPPING_BUTTONS ) ].pressed;
			}
		}
	}
	return false;
};
AMOS.prototype.joy = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				var result = 0;
				result |= gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_UP, AMOS.MAPPING_BUTTONS ) ].pressed ? 0x01 : 0x00;
				result |= gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_DOWN, AMOS.MAPPING_BUTTONS ) ].pressed ? 0x02 : 0x00;
				result |= gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_LEFT, AMOS.MAPPING_BUTTONS ) ].pressed ? 0x04 : 0x00;
				result |= gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_RIGHT, AMOS.MAPPING_BUTTONS ) ].pressed ? 0x08 : 0x00;
				result |= gamepad.buttons[ this.getMapping( gamepad, AMOS.GAMEPAD_FIRE, AMOS.MAPPING_BUTTONS ) ].pressed ? 0x10 : 0x00;
				return result;
			}
		}
	}
	return 0;
};
AMOS.prototype.gamepadConnected = function( number )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	return ( this.gamepads && this.gamepads[ number ] && this.gamepads[ number ].connected );
};
AMOS.prototype.gamepadButton = function( number, button )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			var b = gamepad.buttons[ this.getMapping( gamepad, button, AMOS.MAPPING_BUTTONS ) ];
			if ( b )
			{
				return b.pressed;
			}
	   	}
   	}
	return false;
};
AMOS.prototype.gamepadAxe = function( number, axe )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
	   	{
			if ( gamepad.axes )
			{
				var value = gamepad.axes[ this.getMapping( gamepad, axe, AMOS.MAPPING_AXES ) ];
				return typeof value != 'undefined' ? value : 0;
			}
	   	}
   	}
	return 0;
};
AMOS.prototype.gamepadTrigger = function( number, trigger )
{
	if ( number < 0 || number > 4 )
		throw 'illegal_function_call';
	if ( this.gamepads )
	{
		var gamepad = this.gamepads[ number ];
		if ( gamepad && gamepad.connected )
		{
			if ( gamepad.mapping == 'standard' )
			{
				trigger = ( trigger == 0 ? AMOS.GAMEPAD_BOTTOMLEFT : AMOS.GAMEPAD_BOTTOMRIGHT );
				return gamepad.buttons[ trigger ].value;
			}
			else if ( gamepad.axes )
			{
				var value = gamepad.axes[ this.getMapping( gamepad, trigger, AMOS.MAPPING_TRIGGERS ) ];
				return typeof value != 'undefined' ? value : 0;
			}
		}
	}
	return 0;
};

AMOS.prototype.setUpdate = function( onOff )
{
	if ( this.isUpdate != onOff )
	{
		this.isUpdate = onOff;
		this.sprites.setSpritesUpdate( onOff );
		for ( var s = 0; s < this.screensZ.length; s++ )
		{
			this.screensZ[ s ].setBobUpdate( onOff );
		}
	}
}
AMOS.prototype.update = function( force )
{
	if ( !force )
		force = this.isUpdate;
	else
		force = !this.isUpdate;
	if ( force )
	{
		this.sprites.spritesUpdate( force );
		for ( var s = 0; s < this.screensZ.length; s++ )
		{
			this.screensZ[ s ].bobsUpdate( force );
		}
	}
};
AMOS.prototype.rendererUpdate = function()
{
	this.updateEveryCount++;
	if ( this.updateEveryCount > this.updateEvery )
	{
		this.updateEveryCount = 0;
		this.update();
	}
}
AMOS.prototype.updateEvery = function( every )
{
	if ( every < 1 )
		throw 'illegal_function_call';
	this.updateEvery = every;
	this.updateEveryCount = 0;
};

// Set font
AMOS.prototype.setFont= function( args )
{
	var self = this;
	this.fontLoaded = false;
	this.currentScreen.setFont( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ], args[ 4 ], function( response, data, extra )
	{
		if ( response )
			self.fontLoaded = true;
		else
			throw 'cannot_load_font';
	} );
}
AMOS.prototype.setFont_wait = function( channel, source, address )
{
	if ( this.fontLoaded )
	{
		this.waiting = null;
	}
};

// AMAL!
AMOS.prototype.amalOnOff = function( onOff, channelNumber )
{
	this.initializeChannels();
	this.amal.setOnOff( onOff, channelNumber );
}
AMOS.prototype.amalStart = function( args )
{
	var channel = args[ 0 ];
	var source = args[ 1 ];
	var address = args[ 2 ];
	var compiler = new AMALCompiler( this );
	if ( typeof source == 'number' )
		debugger;

	this.amalErrors = [];
	this.amalErrorNumberCount = 0;
	this.amalErrorStringCount = 0;
	var code = compiler.compile( source, {} )
	if ( this.utilities.isArray( code ) )
	{
		this.amalErrors = code;
		throw 'amal_error';
	}
	
	var self = this;
	this.amalStarted = false;
	this.amal.runChannel( channel, code, function( response, data, extra )
	{
		if ( !response )
			throw 'illegal_function_call';
		
		if ( !data )
		{
			self.initializeChannels();			
			self.amalStarted = true;
		}
		else if ( data.toUpdate )
		{
			if ( self.channelsTo[ channel ] )
			{
				var channelTo = self.channelsTo[ data.channelNumber ];
				switch ( channelTo.type )
				{
					case 'bob':
						channelTo.screen.bob4( channelTo.bobNumber, data.x, data.y, data.image );
						break;
					case 'sprite':
						self.sprites.sprite( channelTo.spriteNumber, data.x, data.y, data.image );
						break;
					case 'screenPos':
						channelTo.screen.setDisplay( data.x, data.y );
						break;
					case 'screenSize':
						channelTo.screen.setDisplay( undefined, undefined, data.x, data.y );
						break;
					case 'screenScroll':
						channelTo.screen.setOffset( data.x, da-ta.y );
						break;
				}
			}
		}
	} );
};
AMOS.prototype.amalStart_wait = function( channel, source, address )
{
	if ( this.amalStarted )
	{
		this.waiting = null;
	}
};
AMOS.prototype.initializeChannels = function()
{
	for ( var c = 0; c < this.channelsTo.length; c++ )
	{
		var channelTo = this.channelsTo[ c ];
		if ( channelTo && !channelTo.initialized )
		{
			switch ( channelTo.type )
			{
				case 'bob':
					this.amal.setChannelPosition( c, this.currentScreen.xBob( channelTo.bobNumber ), this.currentScreen.yBob( channelTo.bobNumber ), this.currentScreen.iBob( channelTo.bobNumber ) );
					break;
				case 'sprite':
					self.amal.setChannelPosition( c, this.sprites.xSprite( channelTo.spriteNumber ), this.sprites.ySprite( channelTo.spriteNumber ), this.sprites.iSprite( channelTo.spriteNumber ) );
					break;
				case 'screenPos':
					self.amal.setChannelPosition( c, channelTo.screen.x, channelTo.screen.y );
					break;
				case 'screenSize':
					self.amal.setChannelPosition( c, channelTo.screen.displayWidth, channelTo.screen.displayHeight );
					break;
				case 'screenScroll':
					self.amal.setChannelPosition( c, channelTo.screen.offsetX, channelTo.screen.offsetY );
					break;
			}
			channelTo.initialized = true;
		}		
	}
}

AMOS.prototype.amalError = function()
{
	if ( this.amalErrorNumberCount < this.amalErrors.length )
	{
		return this.amalErrors[ this.amalErrorNumberCount++ ].position;
	}
	return 0;
};
AMOS.prototype.amalError$ = function()
{
	if ( this.amalErrorStringCount < this.amalErrors.length )
	{
		return this.errors.getErrorFromId( this.amalErrors[ this.amalErrorStringCount++ ].error );
	}
	return '';
};
AMOS.prototype.amalChannelToSprite = function( channel, number )
{
	this.channelsTo[ channel ] = { type: 'sprite', spriteNumber: number, channelNumber: channel };
	if ( this.sprites.isSprite( number ) )
	{
		this.amal.setChannelPosition( channel, this.sprites.xSprite( number ), this.sprites.ySprite( number ), this.sprites.iSprite( number ) );
		this.channelsTo[ channel ].initialized = true;
	}
};
AMOS.prototype.amalChannelToBob = function( channel, number )
{
	this.channelsTo[ channel ] = { type: 'bob', screen: this.currentScreen, bobNumber: number, channelNumber: channel };
	if ( this.currentScreen.isBob( number ) )
	{
		this.amal.setChannelPosition( channel, this.currentScreen.xBob( number ), this.currentScreen.yBob( number ), this.currentScreen.iBob( number ) );
		this.channelsTo[ channel ].initialized = true;
	}
};
AMOS.prototype.amalChannelToScreenPos = function( channel, number )
{
	this.channelsTo[ channel ] = { type: 'screenPos', screen: this.currentScreen, channelNumber: channel };
	if ( this.screens[ number ] )
	{
		this.amal.setChannelPosition( channel, this.screens[ number ].x, this.screens[ number ].y );
		this.channelsTo[ channel ].initialized = true;
	}
};
AMOS.prototype.amalChannelToScreenSize = function( channel, number )
{
	this.channelsTo[ channel ] = { type: 'screenSize', screen: this.currentScreen, channelNumber: channel };
	if ( this.screens[ number ] )
	{
		this.amal.setChannelPosition( channel, this.screens[ number ].displayWidth, this.screens[ number ].displayHeight );
		this.channelsTo[ channel ].initialized = true;
	}
};
AMOS.prototype.amalChannelToScreenScroll = function( channel, number )
{
	this.channelsTo[ channel ] = { type: 'screenScroll', screen: this.currentScreen, channelNumber: channel };
	if ( this.screens[ number ] )
	{
		this.amal.setChannelPosition( channel, this.screens[ number ].offsetX, this.screens[ number ].offsetY );
		this.channelsTo[ channel ].initialized = true;
	}
};
