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
 * AMOS 2 - True Color Screens
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 03/12/2018
 */

function Screen( amos, renderer, definition )
{
	this.amos = amos;
	this.utilities = amos.utilities;
	this.sprites = amos.sprites;
	this.renderer = renderer;
	this.x = typeof definition.x != 'undefined' ? definition.x : this.amos.manifest.default.screen.x;
	this.y = typeof definition.y != 'undefined' ? definition.y : this.amos.manifest.default.screen.y;
	this.width = typeof definition.width != 'undefined' ? definition.width : this.amos.manifest.default.screen.width;
	this.height = typeof definition.height != 'undefined' ? definition.height : this.amos.manifest.default.screen.width;
	this.numberOfColors = typeof definition.numberOfColors != 'undefined' ? definition.numberOfColors : this.amos.manifest.default.screen.numberOfColors;

	this.palette = [];
	if ( this.amos.usePalette )
		this.alphas = [];
	else
		this.alphas = {};
	var palette = definition.palette != 'undefined' ? definition.palette : this.amos.manifest.default.screen.palette;
	for ( var c = 0; c < Math.min( this.numberOfColors, palette.length ); c++ )
	{
		var colorString = palette[ c ].toUpperCase();;
		if ( typeof colorString == 'undefined' )
			colorString = '#000000';
		this.palette[ c ] = colorString;
		if ( this.amos.usePalette )
			this.alphas[ c ] = 1;
		else
			this.alphas[ colorString ] = 1;
	}

	this.pixelMode = typeof definition.pixelMode != 'undefined' ? definition.pixelMode : this.amos.manifest.display.pixelMode;
	this.angleDisplay = 0;
	this.xScaleDisplay = 1;
	this.yScaleDisplay = 1;
	this.xSkewDisplay = 0;
	this.ySkewDisplay = 0;
	this.isCenteredX = false;
	this.isCenteredY = false;
	if ( typeof this.pixelMode == 'number' )
	{
		var pixelString = '';
		if ( ( this.pixelMode & 1 ) != 0 )
			pixelString += 'hires';
		if ( ( this.pixelMode & 2 ) != 0 )
			pixelString += ' laced';
		if ( ( this.pixelMode & 4 ) != 0 )
			pixelString += ' hbm';
		this.pixelMode = pixelString;
	}

	if ( this.width <= 0 )
		throw 'illegal_function_call';
	if ( this.height <= 0 )
		throw 'illegal_function_call';
	this.halfBrightMode = false;
	this.hamMode = false;
	if ( this.amos.maskHardwareCoordinates )
	{
		this.x = this.x & 0xFFFFFFF0;
		this.width = this.width & 0xFFFFFFF0;
	}
	if ( !this.amos.unlimitedScreens )
	{
		if ( this.width >= 1024 || this.height >= 1024 )
			throw 'illegal_function_call';
	}
	if ( this.amos.amulation == '500' || this.amos.amulation == '1200' || this.amos.amulation == '3000' || this.amos.amulation == '4000' )
	{
		if (   this.numberOfColors != 2 && this.numberOfColors != 4
			&& this.numberOfColors != 8 && this.numberOfColors != 16
			&& this.numberOfColors != 16 && this.numberOfColors != 32
			&& this.numberOfColors != 64 && this.numberOfColors != 4096 )
			throw 'illegal_function_call';
	}
	else if ( this.amos.amulation == '600' || this.amos.amulation == '1200' )
	{
		if (   this.numberOfColors != 2 && this.numberOfColors != 4
			&& this.numberOfColors != 8 && this.numberOfColors != 16
			&& this.numberOfColors != 16 && this.numberOfColors != 32
			&& this.numberOfColors != 64 && this.numberOfColors != 128
			&& this.numberOfColors != 256 && this.numberOfColors != 4096 )
			throw 'illegal_function_call';
	}
	if ( this.numberOfColors == 64 || this.pixelMode.indexOf( 'hbm' ) >= 0 )
	{
		this.halfBrightMode = true;
		for ( var p = 0; p < 32; p++ )
		{
			this.setHalfBrightColor( p );
		}
		this.numberOfColors = 32;
	}
	if ( this.numberOfColors == 4096 )
	{
		this.numberOfColors = 64;
		this.hamMode = true;
	}
	this.displayWidth = this.width;
	this.displayHeight = this.height;
	this.offsetX = 0;
	this.offsetY = 0;
	this.hotSpotX = 0;
	this.hotSpotY = 0;
	this.ink = 2;
	this.pattern = 0;
	this.paint = false;
	this.border = 0;
	this.positionX = 0;
	this.positionY = 0;
	this.cloned = null;
	this.clipped = false;
	this.linePattern = [];
	this.blocks = [];
	this.cBlocks = [];

	// Create canvas
	this.zoomX = 1;
	this.zoomY = 1;
	this.scale = typeof amos.manifest.display.screenScale != 'undefined' ? amos.manifest.display.screenScale : 1;
	this.renderScaleX = ( this.pixelMode.indexOf( 'hires' ) >= 0 ? 0.5 : 1 );
	this.renderScaleY = ( this.pixelMode.indexOf( 'laced' ) >= 0 ? 0.5 : 1 );
	this.canvas = document.createElement( 'canvas' );
	this.canvas.width = this.width * this.scale;
	this.canvas.height = this.height * this.scale;
	this.context = this.canvas.getContext( '2d' );
	this.clipX1 = 0;
	this.clipY1 = 0;
	this.clipX2 = this.width;
	this.clipY2 = this.height;
	this.dualPlayfieldFront = false;
	this.dualPlayfieldBack = false;
	this.font = null;
	this.imageRendering = 'pixelated';

	// Default window
	this.windows = [];
	this.windowsZ = [];
	this.zones = [];
	this.scrolls = [];
	this.transparentColors = [];
	this.maxZones = 0;
	this.windOpen( 'default' );

	// Bobs
	this.bobs = {};
	this.bobsZ = [];
	this.lastBobNumber = -1;
	this.bobsToUpdate = false;
	this.bobsUpdateOn = true;
	this.bobsPriorityOn = false;
	this.bobsPriorityReverseOn = false;
};

Screen.prototype.bob2 = function( number, imageName )
{
	this.bob4( number, undefined, undefined, imageName )
};
Screen.prototype.bob4 = function( number, x, y, image )
{
	if ( number < 0 )
		throw 'illegal_function_call';

	var bob = this.bobs[ number ];
	if ( !bob )
	{
		bob =
		{
			xDisplay: undefined,
			yDisplay: undefined,
			xScaleDisplay: undefined,
			yScaleDisplay: undefined,
			xSkewDisplay: undefined,
			ySkewDisplay: undefined,
			angleDisplay: undefined,
			imageDisplay: undefined,
			xNew: x,
			yNew: y,
			xScaleNew: 1,
			yScaleNew: 1,
			xSkewNew: 0,
			ySkewNew: 0,
			angleNew: 0,
			imageNew: image,
			limits: null,
			toUpdate: true,
			toUpdateCollisions: true,
			collisions: {}
		};
		this.bobsZ.push( bob );
		this.bobs[ number ] = bob;
		if ( typeof number == 'number' )
			this.lastBobNumber = Math.max( number, this.lastBobNumber );
	}
	x = typeof x == 'undefined' ? bob.xNew : x;
	y = typeof y == 'undefined' ? bob.yNew : y;
	image = typeof image == 'undefined' ? bob.imageNew : image;
	if ( !this.sprites.getImage( image ) )
		throw 'image_not_defined';
	bob.xNew = x;
	bob.yNew = y;
	bob.imageNew = image;
	this.setLimits( bob );
	bob.toUpdate = true;
	bob.toUpdateCollisions = true;
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.bobOff = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';

	if ( typeof number != 'undefined' )
	{
		var bob = this.bobs[ number ];
		if ( bob )
		{
			this.bobs[ number ] = null;
			if ( typeof number == 'number' )
			{
				this.lastBobNumber = 0;
				for ( var b in this.bobs )
				{
					if ( this.bobs[ b ] && typeof b == 'number' )
						this.lastBobNumber = Math.max( b, this.lastBobNumber );
				}
			}
			for ( var z = 0; z < this.bobsZ.length; z++ )
			{
				if ( this.bobsZ[ z ] == bob )
				{
					this.bobsZ = this.utilities.slice( this.bobsZ, z, 1 );
					break;
				}
			}
		}
	}
	else
	{
		this.bobs = {};
		this.bobsZ = [];
		this.lastBobNumber = -1;
	}
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.bobsUpdate = function( force, forceAll )
{
	if ( force || ( this.bobsUpdateOn && this.bobsToUpdate ) )
	{
		this.bobsToUpdate = false;

		var done = false;
		for ( var b = 0; b < this.bobsZ.length; b++ )
		{
			var bob = this.bobsZ[ b ];
			if ( bob.toUpdate || forceAll )
			{
				bob.toUpdate = false;
				bob.xDisplay = bob.xNew;
				bob.yDisplay = bob.yNew;
				bob.imageDisplay = bob.imageNew;
				bob.xScaleDisplay = bob.xScaleNew;
				bob.yScaleDisplay = bob.yScaleNew;
				bob.xSkewDisplay = bob.xSkewNew;
				bob.ySkewDisplay = bob.ySkewNew;
				bob.angleDisplay = bob.angleNew;
				done = true;
			}
		}
		if ( done )
		{
			this.sortBobsPriority();
			this.setModified();
		}
	}
};
Screen.prototype.setBobsUpdate = function( yes_no )
{
	this.bobsUpdateOn = yes_no;
};
Screen.prototype.xBob = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';
	return bob.xNew;
};
Screen.prototype.yBob = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';
	return bob.yNew;
};
Screen.prototype.iBob = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';
	return parseInt( bob.imageNew );
};
Screen.prototype.isBob = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	return this.bobs[ number ] != null;
};
Screen.prototype.getBobPalette = function( mask )
{
	var self = this;
	var palette = this.amos.sprites.getPalette();
	for ( var p = 0; p < Math.min( this.numberOfColors, palette.length ); p++ )
	{
		if ( typeof palette[ p ] != 'undefined' )
		{
			if ( typeof mask == 'undefined' )
				pokeColor( p, palette[ p ] );
			else if ( ( p & mask ) != 0 )
				pokeColor( p, palette[ p ] );
		}
	}
	function pokeColor( number, colorString )
	{
		self.palette[ number ] = color;
		if ( number < 16 && self.numberOfColors <= 16 )
			self.palette[ number + 16 ] = color;
	}
};
Screen.prototype.limitBob = function( number, x1, y1, x2, y2 )
{
	if ( typeof number != 'undefined' )
	{
		if ( number < 0 )
			throw 'illegal_function_call';
		var bob = this.bobs[ number ];
		if ( !bob )
			throw 'bob_not_defined';
		bob.limits =
		{
			x1: x1,
			y1: y1,
			x2: x2,
			y2: y2
		};
		this.setLimits( bob );
	}
	else
	{
		for ( var b in this.bobs )
		{
			var bob = this.bobs[ b ];
			bob.limits =
			{
				x1: x1,
				y1: y1,
				x2: x2,
				y2: y2
			};
			this.setLimits( bob );
		}
	}
};
Screen.prototype.bobScale = function( number, xScale, yScale )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';
	bob.xScaleNew = typeof xScale == 'undefined' ? bob.xScaleNew : xScale;
	bob.yScaleNew = typeof yScale == 'undefined' ? bob.yScaleNew : yScale;
	bob.toUpdate = true;
	bob.toUpdateCollisions = true;
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.bobSkew = function( number, xSkew, ySkew )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';
	bob.xSkewNew = typeof xSkew == 'undefined' ? bob.xSkewNew : xSkew;
	bob.ySkewNew = typeof ySkew == 'undefined' ? bob.ySkewNew : ySkew;
	bob.toUpdate = true;
	bob.toUpdateCollisions = true;
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.bobRotate = function( number, angle )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';
	bob.angleNew = angle;
	bob.toUpdate = true;
	bob.toUpdateCollisions = true;
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.bobShow = function( show_hide, number )
{
	if ( typeof number != 'undefined' )
	{
		if ( number < 0 )
			throw 'illegal_function_call';
		var bob = this.bobs[ number ];
		if ( !bob )
			throw 'bob_not_defined';
		bob.hidden = !show_hide;
	}
	else
	{
		for ( var b in this.bobs )
		{
			var bob = this.bobs[ b ];
			bob.hidden = !show_hide;
		}
	}
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.limitBobOff = function()
{
	for ( var b in this.bobs )
	{
		var bob = this.bobs[ b ];
		bob.limits = null;
	}
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.setLimits = function( bob )
{
	if ( bob.limits )
	{
		var image = this.sprites.getImage( bob.imageNew );
		if ( image )
		{
			if ( bob.xNew - image.hotSpotX < bob.limits.x1 )
				bob.xNew = bob.limits.x1 + image.hotSpotX;
			if ( bob.xNew - image.hotSpotX + bob.width > bob.limits.x2 )
				bob.xNew = bob.limits.x1 + image.hotSpotX - bob.width;
			if ( bob.yNew - image.hotSpotY < bob.limits.y1 )
				bob.yNew = bob.limits.y1 + image.hotSpotY;
			if ( bob.yNew - image.hotSpotY + bob.height > bob.limits.y2 )
				bob.yNew = bob.limits.y1 + image.hotSpotY - bob.height;
			bob.toUpdate = true;
			bob.toUpdateCollisions = true;
		}
	}
};
Screen.prototype.setBobsPriority = function( on_off )
{
	this.bobsPriorityOn = on_off;
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.setBobsPriorityReverse = function( on_off )
{
	this.bobsPriorityReverseOn  = on_off;
	this.bobsToUpdate = true;
	this.setModified();
};
Screen.prototype.sortBobsPriority = function()
{
	if ( this.bobsPriorityOn )
	{
		if ( this.bobsPriorityReverseOn )
		{
			this.bobsZ = this.bobsZ.sort( function( b1, b2 )
			{
				if ( b1.yNew == b2.yNew )
					return 0;
				return ( b1.yNew > b2.yNew ) ? -1 : 1;
			} );
		}
		else
		{
			this.bobsZ = this.bobsZ.sort( function( b1, b2 )
			{
				if ( b1.yNew == b2.yNew )
					return 0;
				return ( b1.yNew < b2.yNew ) ? -1 : 1;
			} );
		}
	}
};
Screen.prototype.getBob = function( image, x1, y1, x2, y2 )
{
	x1 = typeof x1 == 'undefined' ? 0 : x1;
	y1 = typeof y1 == 'undefined' ? 0 : y1;
	x2 = typeof x2 == 'undefined' ? this.width : x2;
	y2 = typeof y2 == 'undefined' ? this.height : y2;
	var zone = this.utilities.getZone( x1, y1, x2, y2, this.scale );

	var canvas = document.createElement( 'canvas' );
	canvas.width = zone.width;
	canvas.height = zone.height;
	var context = canvas.getContext( '2d' );
	context.imageSmoothingEnabled= false;
	this.currentWindow.cursorOff();
	context.drawImage( this.canvas, zone.x, zone.y, zone.width, zone.height, 0, 0, canvas.width, canvas.height );

	this.utilities.remapBlock( context, [ { r: 0, g: 0, b: 0, a: 255 } ], [ { r: 0, g: 0, b: 0, a: 0 } ], { x: 0, y: 0, width: canvas.width, height: canvas.height } );
	this.sprites.addImage( canvas, image );
};
Screen.prototype.putBob = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var bob = this.bobs[ number ];
	if ( !bob )
		throw 'bob_not_defined';

	this.pasteBob( bob.imageNew, bob.xNew, bob.yNew, bob.xScaleNew, bob.yScaleNew );
};
Screen.prototype.pasteBob = function( number, x, y, scaleX, scaleY )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	x = typeof x != 'undefined' ? x * this.scale : 0.0;
	y = typeof y != 'undefined' ? y * this.scale : 0.0;
	scaleX = typeof scaleX != 'undefined' ? scaleX : 1.0;	
	scaleY = typeof scaleY != 'undefined' ? scaleY : scaleX;
	var image = this.sprites.getImage( number );
	if ( image )
	{
		this.currentWindow.cursorOff();
		this.doclip();
		this.context.imageSmoothingEnabled= false;
		this.context.drawImage( image.canvas, x - image.hotSpotX * scaleX * this.scale, y - image.hotSpotY * scaleY * this.scale, image.width * scaleX * this.scale, image.height * scaleY * this.scale );
		this.unclip();
		this.currentWindow.cursorOn();
		this.setModified();
	}
};



Screen.prototype.setHalfBrightColor = function( p )
{
	if ( this.halfBrightMode )
	{
		var c = this.palette[ p ];
		var r = ( ( c & 0xF00 ) >> 1 ) & 0xF00;
		var g = ( ( c & 0x0F0 ) >> 1 ) & 0x0F0;
		var b = ( ( c & 0x00F ) >> 1 ) & 0x00F;
		this.palette[ p + 32 ] = r | g | b;
	}
};
Screen.prototype.getCurrentWindow = function()
{
	return this.currentWindow;
};

Screen.prototype.unclip = function()
{
	if ( this.clipped )
	{
		this.context.restore();
	}
};
Screen.prototype.doclip = function()
{
	if ( this.clipped )
	{
		this.context.save();
		this.context.rect( this.clipX1, this.clipY1, this.clipSX, this.clipSY );
		this.context.clip();
	}
};
Screen.prototype.clip = function( x1, y1, x2, y2 )
{
	var zone = this.utilities.getZone( x1, y1, x2, y2 );

	this.clipX1 = zone.x;
	this.clipY1 = zone.y;
	this.clipSX = zone.width;
	this.clipSY = zone.height;
	this.clipped = true;
};
Screen.prototype.clipOff = function()
{
	this.clipped = false;
};

Screen.prototype.cls = function( color, x1, y1, x2, y2 )
{
	color = typeof color == 'undefined' ? 0 : color;
	x1 = typeof x1 == 'undefined' ? 0 : x1;
	x2 = typeof x2 == 'undefined' ? this.width : x2;
	y1 = typeof y1 == 'undefined' ? 0 : y1;
	y2 = typeof y2 == 'undefined' ? this.height : y2;
	var zone = this.utilities.getZone( x1, y1, x2, y2, this.scale );

	this.currentWindow.cursorOff();
	this.doclip();
	if ( this.isTransparentColor( color ) )
	{
		this.context.clearRect( zone.x, zone.y, zone.width, zone.height );
	}
	else
	{
		this.context.globalAlpha = this.getColorAlpha( color );
		this.context.fillStyle = this.getColorString( color );
		this.context.fillRect( zone.x, zone.y, zone.width, zone.height );
	}
	this.currentWindow.home();
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();
};

Screen.prototype.reserveZone = function( number )
{
	if ( typeof number != undefined )
	{
		if ( number < 0 )
			throw 'illegal_function_call';
		this.maxZones = number;
	}
	else
	{
		this.zones = [];
		this.maxZones = 0;
	}
};
Screen.prototype.setZone = function( number, x1, y1, x2, y2 )
{
	if ( number <= 0 || number > this.maxZones )
		throw 'illegal_function_call';
	this.zones[ number ] = this.utilities.getZone( x1, y1, x2, y2 );
};
Screen.prototype.zone = function( number, x, y )
{
	var screen = this.amos.getScreen( number );
	for ( var z = 1; z < screen.zones.length; z++ )
	{
		if ( screen.zones[ z ] )
		{
			var zone = this.zones[ z ];
			if ( x >= zone.x && x < zone.x + zone.width && y >= zone.y && y < zone.y + zone.height )
			{
				return z;
			}
		}
	}
	return 0;
};
Screen.prototype.resetZone = function( number )
{
	if ( typeof number != 'undefined' )
	{
		if ( number < 1 || number > this.maxZones )
			throw 'illegal_function_call';
		this.zones[ number ] = null;
	}
	else
	{
		this.zones = [];
	}
};
Screen.prototype.isIn = function( x, y )
{
	x = Math.floor( ( x - this.x ) / this.renderScaleX );
	y = Math.floor( ( y - this.y ) / this.renderScaleY );
	return ( x >= 0 && x < this.width ) && ( y >= 0 && y < this.height );
};
Screen.prototype.getPalette = function( number, mask )
{
	var screen = this.amos.getScreen( number );
	var b = 1;
	for ( var c = 0; c < screen.palette.length; c++ )
	{
		if ( typeof mask != 'undefined' )
		{
			if ( ( mask & b ) != 0 )
			{
				this.palette[ c ] = screen.palette[ c ];
			}
			b = b << 1;
		}
		else
		{
			this.palette[ c ] = screen.palette[ c ];
		}
	}
};
Screen.prototype.setPalette = function( palette )
{
	for ( var p = 0; p < palette.length; p++ )
	{
		if ( typeof palette[ p ] != 'undefined' )
		{
			this.palette[ p ] = this.utilities.getModernColorString( palette[ p ], this.amos.manifest.compilation.useShortColors );
			if ( this.halfBrightMode && p < 32 )
				this.setHalfBrightColor( p );
		}
	}
};
Screen.prototype.setColour = function( number, color )
{
	if ( this.amos.usePalette )
	{
		if ( number < 0 )
			throw 'illegal_function_call';
		number = number % this.numberOfColors;
		this.palette[ number ] = this.utilities.getModernColorString( color, this.amos.manifest.compilation.useShortColors );
		if ( this.halfBrightMode && p < 32 )
			this.setHalfBrightColor( p );
	}
};
Screen.prototype.getColour = function( number )
{
	if ( !this.amos.usePalette )
		throw 'function_not_available_in_true_color_mode';

	if ( number < 0 )
		throw 'illegal_function_call';
	number = number % this.numberOfColors;
	var color = this.palette[ number ];
	if ( this.useShortColors )
		return parseInt( '0x' + color.substr( 1, 1 ) + color.substr( 3, 1 ) + color.substr( 5, 1 ) );
	return parseInt( '0x' + color.substr( 1, 2 ) + color.substr( 3, 2 ) + color.substr( 5, 2 ) );	
};
Screen.prototype.getColorAlpha = function( color )
{
	if ( this.amos.usePalette )
		return this.alphas[ color % this.numberOfColors ];

	color = this.getColorString( color );
	return typeof this.alphas[ color ] == 'undefined' ? 1.0 : this.alphas[ color ];
};
Screen.prototype.getColorString = function( color )
{
	// True color?
	if ( !this.amos.usePalette )
	{
		if ( typeof color == 'number' )
			color = color.toString( 16 );
		if ( color.charAt( 0 ) == '#' )
			color = color.substring( 1 );
		while ( color.length < 6 )
			color = '0' + color;
		return ( '#' + color ).toUpperCase();
	}

	// Palette index...
	color = color % this.numberOfColors;
	if ( this.dualPlayfieldBack )
		color += 8;
	return this.palette[ color ];
};
Screen.prototype.setTransparent = function( colors, trueFalse )
{	
	var alphas = [];
	for ( var c = 0; c < colors.length; c++ )
		alphas[ c ] = trueFalse ? 0.0 : 1.0;
	this.setColorAlpha( colors, alphas );
};
Screen.prototype.setColorAlpha = function( colors, alphas )
{
	if ( this.amos.usePalette )
	{
		for ( var c = 0; c < colors.length; c++ )
		{
			if ( colors[ c ] < 0 || alphas[ c ] < 0 || alphas[ c ] > 1 )
				throw 'illegal_function_call';
			this.alphas[ colors[ c ] % this.numberOfColors ] = alphas[ c ];
		}
	}
	else
	{
		for ( var c = 0; c < colors.length; c++ )
		{
			var color = this.getColorString( colors[ c ] );
			if ( alphas[ c ] < 0 || alphas[ c ] > 1 )
				throw 'illegal_function_call';
			this.alphas[ color ] = alphas[ c ];
		}
	}
};
Screen.prototype.isTransparentColor = function( color )
{
	if ( this.amos.usePalette )
	{
		if ( color < 0 )
			throw 'illegal_function_call';
		return this.alphas[ color % this.numberOfColors ] == 0;
	}
	color = this.getModernColorString( color, false );
	if ( typeof this.alphas[ color ] != 'undefined' && typeof this.alphas[ color ] > 0 )
		return false;
	return true;
};
Screen.prototype.remap = function( colorsSource, colorsDestination, x1, y1, x2, y2 )
{
	x1 = typeof x1 == 'undefined' ? 0 : x1;
	y1 = typeof y1 == 'undefined' ? 0 : y1;
	x2 = typeof x2 == 'undefined' ? this.width : x2;
	y2 = typeof y2 == 'undefined' ? this.height : y2;
	var zone = this.utilities.getZone( x1, y1, x2, y2, this.scale )

	// Check colors
	var rgbaSource = [], rgbaDestination = [];
	for ( var c = 0; c < colorsSource.length; c++ )
	{
		var a = ( Math.floor( this.getColorAlpha( colorsSource[ c ] ) * 255 ) ).toString( 16 );
		a += a.length < 2 ? ' ' : '';
		rgbaSource.push( this.utilities.getRGBAStringColors( this.getColorString( colorsSource[ c ] ) + a ) );
		if ( this.dualPlayfieldBack && colorsSource[ c ] == 0 )
		{
			rgbaDestination.push( this.utilities.getRGBAStringColors( '#00000000' ) );	
		}
		else
		{
			a = ( Math.floor( this.getColorAlpha( colorsDestination[ c ] ) * 255 ) ).toString( 16 );
			a += a.length < 2 ? ' ' : '';
			rgbaDestination.push( this.utilities.getRGBAStringColors( this.getColorString( colorsSource[ c ] ) + a ) );
		}
	}	
	this.currentWindow.cursorOff();
	this.doclip();
	this.utilities.remapBlock( this.context, rgbaSource, rgbaDestination, zone );
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();
};
Screen.prototype.setDualPlayfield = function( screen )
{
	if ( this.dualPlayfield || screen.dualPlayfield )
		throw 'cant_set_dual_playfield';
	if ( this.pixelMode != screen.pixelMode )
		throw 'cant_set_dual_playfield';

	this.dualPlayfieldFront = true;
	screen.dualPlayfieldBack = true;
	this.setTransparent( this.amos.usePalette ? 0 : '#000000', true );
	screen.setTransparent( this.amos.usePalette ? 0 : '#000000', false );
	screen.x = this.x;
	screen.y = this.y;
	this.amos.setBelowZScreenPosition( screen, this );
	this.setModified();
};
Screen.prototype.dualPriority = function( screen )
{
	var isGood = this.dualPlayfieldFront || this.dualPlayfieldBack || screen.dualPlayfieldFront || screen.dualPlayfieldBack;
	if ( !isGood )
		throw 'screen_not_in_dual_playfield';
	if ( !this.dualPlayfieldFront )
	{
		this.dualPlayfieldBack = false;
		this.dualPlayfieldFront = true;
		screen.dualPlayfieldBack = true;
		screen.dualPlayfieldFront = false;
		this.setTransparent( this.amos.usePalette ? 0 : '#000000', true );
		screen.setTransparent( this.amos.usePalette ? 0 : '#000000', false );
		this.amos.setBelowZScreenPosition( screen, this );
		screen.setModified();
		this.setModified();
	}
};
Screen.prototype.setCenter = function( inX, inY )
{
	this.isCenteredX = inX ? true : false;
	this.isCenteredY = inY ? true : false;
};
Screen.prototype.setDisplay = function( x, y, width, height )
{
	x = typeof x != 'undefined' ? x : this.x;
	y = typeof y != 'undefined' ? y : this.y;
	width = typeof width != 'undefined' ? width : this.width;
	height = typeof height != 'undefined' ? height : this.height;
	if ( this.amos.maskHardwareCoordinates )
	{
		x &= 0xFFFFFFF0;
		width &= 0xFFFFFFF0;
	}

	if ( width < 0 || height < 0 )
		throw 'illegal_function_call';

	this.x = x;
	this.y = y;
	this.displayWidth = Math.min( width, this.width );
	this.displayHeight = Math.min( height, this.height );
	this.setModified();
};
Screen.prototype.setHotspot = function( xSpot, ySpot )
{
	if ( xSpot == 'mask' )
	{
		switch ( ( ySpot & 0x70 ) >> 4 )
		{
			case 0:
				this.hotSpotX = 0;
				break;
			case 1:
				this.hotSpotX = this.width / 2;
				break;
			case 2:
				this.hotSpotX = this.width;
				break;
		}
		switch ( ySpot & 0x07 )
		{
			case 0:
				this.hotSpotY = 0;
				break;
			case 1:
				this.hotSpotY = this.height / 2;
				break;
			case 2:
				this.hotSpotY = this.height;
				break;
		}
	}
	else
	{
		this.hotSpotX = typeof xSpot != 'undefined' ? xSpot : this.hotSpotX;
		this.hotSpotY = typeof ySpot != 'undefined' ? ySpot : this.hotSpotY;
	}
	this.setModified();
};
Screen.prototype.setOffset = function( x, y )
{
	x = typeof x != 'undefined' ? x : this.offsetX;
	y = typeof y != 'undefined' ? y : this.offsetY;
	this.offsetX = x % this.width;
	this.offsetY = y % this.height;
	if ( this.offsetX + this.displayWidth > this.width )
		this.displayWidth = this.width - this.offsetX;
	if ( this.offsetY + this.displayHeight > this.height )
		this.displayHeight = this.height - this.offsetY;
	this.setModified();
};
Screen.prototype.deactivate = function()
{
	//this.currentWindow.deactivate();
};
Screen.prototype.activate = function()
{
	//this.currentWindow.activate( true );
};
Screen.prototype.screenCopy = function( destination, x1, y1, x2, y2, x3, y3, x4, y4, mode )
{
	if ( typeof x1 == 'undefined' && typeof y1 == 'undefined' && typeof x2 == 'undefined' && typeof y2 == 'undefined'
		&& typeof x3 == 'undefined' && typeof y3 == 'undefined' && typeof x4 == 'undefined' && typeof y4 == 'undefined' )
	{
		destination.context.imageSmoothingEnabled= false;
		destination.context.drawImage( this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height );
	}
	else
	{
		x1 = typeof x1 == 'undefined' ? 0 : x1;
		y1 = typeof y1 == 'undefined' ? 0 : y1;
		x2 = typeof x2 == 'undefined' ? this.width : x2;
		y2 = typeof y2 == 'undefined' ? this.height : y2;
		x3 = typeof x3 == 'undefined' ? 0 : x3;
		y3 = typeof y3 == 'undefined' ? 0 : y3;
		x4 = typeof x4 == 'undefined' ? destination.width : x4;
		y4 = typeof y4 == 'undefined' ? destination.height : y4;
		var szone = this.utilities.getZone( x1, y1, x2, y2, this.scale );
		var dzone = this.utilities.getZone( x3, y3, x4, y4, destination.scale );

		this.context.imageSmoothingEnabled= false;
		destination.context.imageSmoothingEnabled= false;
		destination.context.drawImage( this.canvas, szone.x, szone.y, szone.width, szone.height, dzone.x, dzone.y, dzone.width, dzone.height );
	}

	destination.setModified();
};
Screen.prototype.screenProject = function( destination, x1, y1, x2, y2, dx1, dy1, dx2, dy2, dx3, dy3, dx4, dy4 )
{
	this.currentWindow.cursorOff();
	destination.currentWindow.cursorOff();
	this.context.scale( 1 / this.scaleX, 1 / this.scaleY );
	if ( this != destination )
		destination.context.scale( 1 / destination.scaleX, 1 / destination.scaleY );

	x1 = typeof x1 == 'undefined' ? 0 : x1 * this.scaleX;
	y1 = typeof y1 == 'undefined' ? 0 : y1 * this.scaleY;
	x2 = typeof x2 == 'undefined' ? this.width * this.scaleX: x2 * this.scaleX;
	y2 = typeof y2 == 'undefined' ? this.height * this.scaleY : y2 * this.scaleY;
	dx1 = typeof dx1 == 'undefined' ? 0 : dx1 * destination.scaleX;
	dy1 = typeof dy1 == 'undefined' ? 0 : dy1 * destination.scaleY;
	dx2 = typeof dx2 == 'undefined' ? destination.width * destination.scaleX : dx2 * destination.scaleX;
	dy2 = typeof dy2 == 'undefined' ? 0 : dy2 * destination.scaleY;
	dx3 = typeof dx3 == 'undefined' ? destination.width * destination.scaleX : dx3 * destination.scaleX;
	dy3 = typeof dy3 == 'undefined' ? destination.height * destination.scaleY : dy3 * destination.scaleY;
	dx4 = typeof dx4 == 'undefined' ? 0 : dx4 * destination.scaleX;
	dy4 = typeof dy4 == 'undefined' ? destination.height * destination.scaleY : dy4 * destination.scaleY;

	var deltaDX1 = dx4 - dx1;
	var deltaDY1 = dy4 - dy1;
	var deltaDX2 = dx3 - dx2;
	var deltaDY2 = dy3 - dy2;
	var canvasLine = document.createElement( 'canvas' );
	canvasLine.width = x2 - x1;
	canvasLine.height = this.scaleY;
	var contextLine = canvasLine.getContext( '2d' );
	contextLine.imageSmoothingEnabled= false;

	var canvas = document.createElement( 'canvas' );
	canvas.width = this.width * this.scaleX;
	canvas.height = this.height * this.scaleY;
	var context = canvas.getContext( '2d' );
	context.drawImage( this.canvas, 0, 0 );

	destination.context.imageSmoothingEnabled= false;

	for ( var yy1 = y1; yy1 < y2; yy1 += this.scaleY )
	{
		contextLine.drawImage( canvas, x1, yy1, x2 - x1, this.scaleY, 0, 0, x2 - x1, this.scaleY );

		// Do copy
		var done = ( yy1 - y1 ) / ( y2 - y1 );
		var dXX1 = dx1 + deltaDX1 * done;
		var dYY1 = dy1 + deltaDY1 * done;
		var dXX2 = dx2 + deltaDX2 * done;
		var dYY2 = dy2 + deltaDY2 * done;

		var dx = dXX2 - dXX1;
		var dy = dYY2 - dYY1;
		var angle = Math.atan2( dy, dx );
		var distance = Math.hypot( dx, dy );
		destination.context.save();
		destination.context.translate( dXX1, dYY1 );
		destination.context.rotate( angle );
		destination.context.drawImage( canvasLine, 0, 0, x2 - x1, this.scaleY, 0, 0, distance, destination.scaleY * ( destination.scaleY / this.scaleY ) );
		destination.context.restore();
	}

	this.context.scale( this.scaleX, this.scaleY );
	if ( this != destination )
		destination.context.scale( destination.scaleX, destination.scaleY );
	destination.currentWindow.cursorOn();
	this.currentWindow.cursorOn();
	destination.setModified();
};
Screen.prototype.defScroll = function( number, x1, y1, x2, y2, dx, dy )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.amos.unlimitedScreens && number > 16 )
		throw 'illegal_function_call';
	x1 = typeof x1 == 'undefined' ? 0 : x1;
	y1 = typeof y1 == 'undefined' ? 0 : y1;
	x2 = typeof x2 == 'undefined' ? this.width : x2;
	y2 = typeof y2 == 'undefined' ? this.height : y2;
	dx = typeof dx == 'undefined' ? 0 : dx;
	dy = typeof dy == 'undefined' ? 0 : dy;
	var zone = this.utilities.getZone( x1, y1, x2, y2, this.scale );
	this.scrolls[ number ] =
	{
		zone: zone,
		dx: dx * this.scale,
		dy: dy * this.scale
	}
};
Screen.prototype.setCloned = function( screen )
{
	this.cloned = screen;
	this.canvas = screen.canvas;
	this.context = screen.context;
	clearInterval( this.windows[ 0 ].cursorHandle );
};
Screen.prototype.scroll = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.amos.unlimitedScreens && number > 16 )
		throw 'illegal_function_call';
	if ( !this.scrolls[ number ] )
		throw 'scrolling_not_defined';
	var scroll = this.scrolls[ number ];
	this.currentWindow.cursorOff();
	this.context.imageSmoothingEnabled= false;
	this.doclip();
	if ( this.dualPlayfieldFront )
	{
		var canvas = document.createElement( 'canvas' );
		canvas.width = scroll.sx;
		canvas.height = scroll.sy;
		var context = canvas.getContext( '2d' );
		context.imageSmoothingEnabled= false;
		context.drawImage( this.canvas, scroll.zone.x, scroll.zone.y, scroll.zone.width, scroll.zone.height, 0, 0, scroll.sx, scroll.sy );
		this.context.clearRect( scroll.zone.x, scroll.zone.y, scroll.zone.width, scroll.zone.height );
		this.context.drawImage( canvas, 0, 0, scroll.zone.width, scroll.zone.height, scroll.zone.x + scroll.dx, scroll.zone.y + scroll.dy, scroll.zone.width, scroll.zone.height );
	}
	else
	{
		this.context.drawImage( this.canvas, scroll.zone.x, scroll.zone.y, scroll.zone.width, scroll.zone.height, scroll.zone.x + scroll.dx, scroll.zone.y + scroll.dy, scroll.zone.width, scroll.zone.height );
	}
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();
};
Screen.prototype.setWindow = function( number )
{
	if ( number < 0 )
		throw 'illegal_text_window_parameter';
	if ( !this.windows[ number ] )
		throw 'text_window_not_opened';

	if ( this.currentWindow.number != number )
	{
		this.currentWindow.deactivate();
		for ( var z = 0; z < this.windowsZ.length; z++ )
		{
			if ( this.windowsZ[ z ].number == number )
			{
				this.windowsZ.splice( z, 1 );
				break;
			}
		}
		this.currentWindow = this.windows[ number ];
		this.windowsZ.push( this.currentWindow );
		this.currentWindow.activate();
	}
};
Screen.prototype.windOpen = function( number, x, y, width, height, border, extra )
{
	if ( number == 'default' )
		number = 0;
	else
	{
		if ( number <= 0 )
			throw 'illegal_text_window_parameter';
	}
	if ( !this.amos.unlimitedWindows && number >= 16 )
		throw 'illegal_text_window_parameter';

	if ( this.windows[ number ] )
		throw 'text_window_already_opened';

	var windowDefinition = this.amos.manifest.default.screen.window;
	windowDefinition.x = x;
	windowDefinition.y = y;
	windowDefinition.width = width;
	windowDefinition.height = height;
	windowDefinition.border = border;
	if ( this.currentWindow )
		this.currentWindow.deactivate();
	this.currentWindow = new TextWindow( this.amos, this, windowDefinition );
	this.windows[ number ] = this.currentWindow;
	this.currentWindow.number = number;
	this.windowsZ.push( this.currentWindow );
};
Screen.prototype.windClose = function()
{
	if ( this.currentWindow == this.windows[ 0 ] )
		throw 'text_window_0_cant_be_closed';

	this.currentWindow.close();
	this.windows[ this.currentWindow.number ] = null;
	this.windowsZ.pop();
	for ( var z = 0; z < this.windowsZ.length; z++ )
		this.windowsZ[ z ].restore();
	this.currentWindow = this.windowsZ[ this.windowsZ.length - 1 ];
	this.currentWindow.activate( true );
	this.setModified();
};
Screen.prototype.restoreWindows = function()
{
	for ( var z = 0; z < this.windowsZ.length - 1; z++ )
	{
		this.windowsZ[ z].restore();
	}
	this.setModified();
};
Screen.prototype.findColorIndex = function( r, g, b )
{
	for ( var p = 0; p < this.palette.length; p++ )
	{
		var rgb = this.utilities.getRGBAStringColors( this.palette[ p ] );
		if ( rgb.r == r && rgb.g == g && rgb.b == b )
		{
			return p;
		}
	}
	return -1;
};
Screen.prototype.setModified = function()
{
	this.renderer.modified = true;
};
Screen.prototype.setLine = function( pattern )
{
	this.linePattern = [];
	if ( pattern == 0 )
		return;
	var b = 0x8000;
	var on = true;
	var previousCount = 0;
	var delta = 1;					// Math.sqrt( Math.abs( this.scaleX ) + Math.abs( this.scaleY ) );
	for ( var count = 0; count < 16; count++ )
	{
		if ( ( pattern & b ) == 0 && on )
		{
			this.linePattern.push( ( count - previousCount ) * delta );
			previousCount = count;
			on = false;
		}
		else if ( ( pattern & b ) != 0 && !on )
		{
			this.linePattern.push( ( count - previousCount ) * delta );
			previousCount = count;
			on = true;
		}
		b = b >> 1;
	}
};
Screen.prototype.setInk = function( color, pattern, border )
{
	this.ink = Math.abs( color ) % this.numberOfColors;
	if ( typeof pattern != 'undefined' )
	{
		if ( pattern > 34 )
			throw 'illegal_function_call';
		this.pattern = pattern;
	}
	if ( typeof border != 'undefined' )
	{
		this.border = Math.abs( border ) % this.numberOfColors;
	}
};
Screen.prototype.setPattern = function( pattern )
{
	if ( pattern < 0 )
		throw 'not_implemented';
	if ( pattern > 34 )
		throw 'illegal_function_call';
	this.pattern = pattern;
};
Screen.prototype.setPaint = function( onOff )
{
	this.paint = onOff;
};


Screen.prototype.plot = function( x, y, color )
{
	var color = typeof color != 'undefined' ? color : this.ink;
	x = typeof x != 'undefined' ? x : this.positionX;
	y = typeof y != 'undefined' ? y : this.positionY;

	if ( !this.isTransparentColor( color ) )
	{
		this.currentWindow.cursorOff();
		this.doclip();
		this.context.fillStyle = this.getColorString( color );
		this.context.globalAlpha = this.getColorAlpha( color );
		this.context.fillRect( x * this.scale, y * this.scale, this.scale, this.scale );
		this.unclip();	
		this.currentWindow.cursorOn();
		this.setModified();
	}
	this.positionX = x;
	this.positionY = y;
};
Screen.prototype.draw = function( x1, y1, x2, y2 )
{
	this.currentWindow.cursorOff();
	x1 = typeof x1 != 'undefined' ? x1 : this.positionX;
	y1 = typeof y1 != 'undefined' ? y1 : this.positionY;
	if ( typeof x2 == 'undefined' || typeof y2 == 'undefined' )
		throw 'syntax_error';
	this.context.strokeStyle = this.getColorString( this.ink );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.context.setLineDash( this.linePattern );
	this.context.lineWidth = this.scale;
	this.doclip();
	this.context.beginPath();
	this.context.moveTo( x1 * this.scale, y1 * this.scale );
	this.context.lineTo( x2 * this.scale, y2 * this.scale );
	this.context.stroke();
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x2;
	this.positionY = y2;
};
Screen.prototype.drawTo = function( x2, y2 )
{
	x2 = typeof x2 != 'undefined' ? x2 : this.positionX;
	y2 = typeof y2 != 'undefined' ? y2 : this.positionY;

	this.currentWindow.cursorOff();
	this.context.strokeStyle = this.getColorString( this.ink );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.context.setLineDash( this.linePattern );
	this.context.lineWidth = this.scale;
	this.doclip();
	this.context.beginPath();
	this.context.moveTo( this.positionX * this.scale, this.positionY * this.scale );
	this.context.lineTo( x2 * this.scale, y2 * this.scale );
	this.context.stroke();
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x2;
	this.positionY = y2;
};
Screen.prototype.grLocate = function( x, y )
{
	x = typeof x != 'undefined' ? x : this.positionX;
	y = typeof y != 'undefined' ? y : this.positionY;
	this.positionX = x;
	this.positionY = y;
};
Screen.prototype.point = function( x, y )
{
	x = typeof x != 'undefined' ? x : this.positionX;
	y = typeof y != 'undefined' ? y : this.positionY;
	if ( x < 0 || x > this.width || y < 0 || y > this.height )
		return -1;
	var pixel = this.context.getImageData( x * this.scale, y * this.scale, 1, 1 );
	if ( this.amos.usePalette )
		return this.findColorIndex( pixel.data[ 0 ], pixel.data[ 1 ], pixel.data[ 2 ] );
	return this.utilities.getRGBAString( pixel.data[ 0 ], pixel.data[ 1 ], pixel.data[ 2 ], pixel.data[ 3 ] );
};
Screen.prototype.box = function( x1, y1, x2, y2 )
{
	x1 = typeof x1 != 'undefined' ? x1 : this.positionX;
	y1 = typeof y1 != 'undefined' ? y1 : this.positionY;
	x2 = typeof x2 != 'undefined' ? x2 : this.positionX;
	y2 = typeof y2 != 'undefined' ? y2 : this.positionY;
	var zone = this.utilities.getZone( x1, y1, x2, y2, this.scale );

	this.currentWindow.cursorOff();
	this.context.strokeStyle = this.getColorString( this.ink );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.context.setLineDash( this.linePattern );
	this.context.lineWidth = this.scale;
	this.doclip();
	this.context.strokeRect( zone.x, zone.y, zone.width, zone.height );
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x2;
	this.positionY = y2;
};
Screen.prototype.bar = function( x1, y1, x2, y2 )
{
	x1 = typeof x1 != 'undefined' ? x1 : this.positionX;
	y1 = typeof y1 != 'undefined' ? y1 : this.positionY;
	x2 = typeof x2 != 'undefined' ? x2 : this.width;
	y2 = typeof y2 != 'undefined' ? y2 : this.height;
	var zone = this.utilities.getZone( x1, y1, x2, y2, this.scale );

	this.currentWindow.cursorOff();
	if ( this.pattern == 0 )
		this.context.fillStyle = this.getColorString( this.ink );
	else
		this.context.fillStyle = this.createPattern( this.pattern );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.doclip();
	this.context.fillRect( zone.x, zone.y, zone.width, zone.height );
	if ( this.paint )
	{
		this.context.strokeStyle = this.getColorString( this.border );
		this.context.globalAlpha = this.getColorAlpha( this.border );
		this.context.setLineDash( this.linePattern );
		this.context.lineWidth = this.scale;
		this.context.strokeRect( zone.x, zone.y, zone.width, zone.height );
	}
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x2;
	this.positionY = y2;
};
Screen.prototype.circle = function( x, y, radius )
{
	this.ellipse( x, y, radius, radius );
};
Screen.prototype.ellipse = function( x, y, radius1, radius2 )
{
	x = typeof x != 'undefined' ? x : this.positionX;
	y = typeof y != 'undefined' ? y : this.positionY;

	this.currentWindow.cursorOff();
	if ( typeof radius1 == 'undefined' || typeof radius2 == 'undefined' )
		throw 'illegal_function_call';
	this.context.strokeStyle = this.getColorString( this.ink );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.context.setLineDash( this.linePattern );
	this.context.lineWidth = this.scale;
	this.doclip();
	this.context.beginPath();
	this.context.ellipse( x * this.scale, y * this.scale, radius1 * this.scale, radius2 * this.scale, 0, 0,  2 * Math.PI );
	this.context.stroke();
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x;
	this.positionY = y;
};
Screen.prototype.polyline = function( coords )
{
	var x = typeof coords[ 0 ] != 'undefined' ? coords[ 0 ] : this.positionX;
	var y = typeof coords[ 1 ] != 'undefined' ? coords[ 1 ] : this.positionX;

	this.currentWindow.cursorOff();
	this.context.strokeStyle = this.getColorString( this.ink );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.context.setLineDash( this.linePattern );
	this.context.lineWidth = this.scale;
	this.doclip();
	this.context.beginPath();
	this.context.moveTo( x * this.scale, y * this.scale );	
	for ( var c = 2; c < coords.length; c += 2)
	{
		x = typeof coords[ c ] != 'undefined' ? coords[ c ] : x;
		y = typeof coords[ c + 1 ] != 'undefined' ? coords[ c + 1 ] : y;
		this.context.lineTo( x * this.scale, y * this.scale );
	}
	this.context.stroke();
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x;
	this.positionY = y;
};
Screen.prototype.polygon = function( coords )
{
	var x = typeof coords[ 0 ] != 'undefined' ? coords[ 0 ] : this.positionX;
	var y = typeof coords[ 1 ] != 'undefined' ? coords[ 1 ] : this.positionX;

	this.currentWindow.cursorOff();
	if ( this.pattern == 0 )
		this.context.fillStyle = this.getColorString( this.ink );
	else
		this.context.fillStyle = this.createPattern( this.pattern );
	this.context.globalAlpha = this.getColorAlpha( this.ink );
	this.context.setLineDash( this.linePattern );

	this.doclip();
	this.context.beginPath();
	this.context.moveTo( x * this.scale, y * this.scale );
	for ( var c = 2; c < coords.length; c += 2)
	{
		x = typeof coords[ c ] != 'undefined' ? coords[ c ] : x;
		y = typeof coords[ c + 1 ] != 'undefined' ? coords[ c + 1 ] : y;
		this.context.lineTo( x * this.scale, y * this.scale );
	}
	this.context.closePath();
	this.context.fill();

	if ( this.paint )
	{
		this.context.strokeStyle = this.getColorString( this.border );
		this.context.globalAlpha = this.getColorAlpha( this.border );
		this.context.lineWidth = this.scale;
		this.context.stroke();
	}
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x;
	this.positionY = y;
};
Screen.prototype.setFont = function( reference, height, weight, italic, stretch, callback )
{
	var font = this.amos.fonts.getFontInfo( reference );
	if ( font )
	{
		height = typeof height != 'undefined' ? height : 16;
		if ( typeof weight == 'number' && weight < 0 )
			throw 'illegal_function_call';
		var self = this;
		this.amos.fonts.loadFont( reference, height, weight, italic, stretch, this.scale, function( response, data, extra )
		{
			self.font = data;
			if ( callback )
				callback( response, data, extra );
		} );
	}
	else
		throw 'font_not_available';
};
Screen.prototype.textLength = function( text )
{
	if ( this.font )
	{
		return this.amos.fonts.getTextLength( text, this.font );
	}
	throw 'font_not_available';
};
Screen.prototype.text = function( x, y, text, align )
{
	if ( !this.font )
		throw 'font_not_available';

	x = typeof x != 'undefined' ? x : this.positionX;
	y = typeof y != 'undefined' ? y : this.positionY;
	var width= this.textLength( text );

	var textAlign = "left";
	var textBaseLine = "alphabetic";
	var direction = "inherit";
	if ( align )
	{
		var temp;
		if ( ( temp = this.utilities.getTag( align, [ 'left', 'center', 'right', 'start', 'end' ] ) ) != '' )
			textAlign = temp;
		if ( ( temp = this.utilities.getTag( align, [ 'top', 'hanging', 'middle', 'alphabetic', 'ideographic', 'bottom' ] ) ) != '' )
			textBaseLine = temp;
		if ( ( temp = this.utilities.getTag( align, [ 'ltr', 'rtl', 'inherit' ] ) ) != '' )
			direction = temp;
	}

	var color = this.getColorString( this.ink );
	var alpha = this.getColorAlpha( this.ink );
	this.currentWindow.cursorOff();
	this.doclip();

	if ( this.font.type == 'amiga' )
	{
		this.context.imageSmoothingEnabled = true;
		this.amos.fonts.drawAmigaText( this.context, this.scale, x * this.scale, y * this.scale, text, this.font, textAlign, textBaseLine, direction, color, alpha )
	}
	else if ( this.font.type == 'google' )
	{
		this.context.textAlign = textAlign;
		this.context.textBaseline = textBaseLine;
		this.context.direction = direction;
		this.context.fillStyle = color;
		this.context.globalAlpha = alpha;
		this.context.font = this.utilities.getFontString( this.font.name, this.font.height * this.font.scale, this.font.weight, this.font.italic );
		this.context.fillText( text, x * this.scale, y * this.scale );
	}
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();

	this.positionX = x;
	this.positionY = y;
};
Screen.prototype.textBase = function()
{
	if ( !this.font )
		throw 'font_not_available';
	return this.font.baseLine;
};
Screen.prototype.getBlock = function( number, x, y, width, height, mask )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	this.blocks[ number ] = this.doGetBlock( x, y, width, height, mask );
};
Screen.prototype.getCBlock = function( number, x, y, width, height, mask )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	this.cBlocks[ number ] = this.doGetBlock( x, y, width, height, mask );
};
Screen.prototype.putBlock = function( number, x, y, bitPlanes, bitMode )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var block = this.blocks[ number ];
	if ( !block )
		throw 'block_not_defined';
	this.doPutBlock( block, x, y, bitPlanes, bitMode );
};
Screen.prototype.putCBlock = function( number, x, y, bitPlanes, bitMode )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var block = this.cBlocks[ number ];
	if ( !block )
		throw 'block_not_defined';
	this.doPutBlock( block, x, y, bitPlanes, bitMode );
};
Screen.prototype.delBlock = function( number )
{
	this.blocks = this.doDelBlock( this.blocks, number );
};
Screen.prototype.delCBlock = function( number )
{
	this.cBlocks = this.doDelBlock( this.cBlocks, number );
};
Screen.prototype.doGetBlock = function( x, y, width, height, mask )
{
	x = typeof x != 'undefined' ? x : this.positionX;
	y = typeof y != 'undefined' ? x : this.positionY;
	if ( typeof width == 'undefined' || typeof height == 'undefined' )
		throw 'illegal_function_call';
	if ( x + width > this.width )
		width = this.width - x;
	if ( y + height > this.height )
		height = this.height - x;
	if ( width <= 0 || height <= 0 )
		throw 'illegal_function_call';

	var block =
	{
		x: x,
		y: y,
		width: width,
		height: height,
		alpha: 1.0,
		canvas: document.createElement( 'canvas' )
	}
	this.currentWindow.cursorOff();
	block.canvas.width = width * this.scale;
	block.canvas.height = height * this.scale;
	var context = block.canvas.getContext( '2d' );
	context.drawImage( this.canvas, x * this.scale, y * this.scale, block.canvas.width, block.canvas.height, 0, 0, block.canvas.width, block.canvas.height );
	this.currentWindow.cursorOn();

	if ( typeof mask != 'undefined' && mask != 0 )
	{
		this.utilities.remapBlock( context, [ { r: 0, g: 0, b: 0, a: 255 } ], [ { r: 0, g: 0, b: 0, b: 0 } ], { x: 0, y: 0, width: block.canvas.width, height: block.canvas.height } );
	}
	return block;
};
Screen.prototype.doSetBlockAlpha = function( block, alpha )
{
	block.alpha = alpha / 255.0;
};
Screen.prototype.doPutBlock = function( block, x, y, bitPlanes, bitMode )
{
	x = typeof x != 'undefined' ? x : block.x;
	y = typeof y != 'undefined' ? y : block.y;
	this.currentWindow.cursorOff();
	this.doclip();
	this.context.globalAlpha = block.alpha;
	this.context.drawImage( block.canvas, x * this.scale, y * this.scale );
	this.unclip();
	this.currentWindow.cursorOn();
	this.setModified();
};
Screen.prototype.doDelBlock = function( blocks, number )
{
	if ( typeof number == 'undefined' )
		return [];
	else
	{
		if ( number < 0 )
			throw 'illegal_function_call';
		if ( !blocks[ number ] )
			throw 'block_not_defined';

		var dest = [];
		for ( var b = 0; b < blocks.length; b++ )
		{
			if ( b != number )
				dest[ b ] = blocks[ b ];
		}
		return dest;
	}
};
Screen.prototype.createPattern = function( pattern )
{
	// Create the imageData
	var imageData = this.context.createImageData( 8, 8  );
	var colorInk = this.utilities.getRGBAStringColors( this.getColorString( this.ink ) );
	var alpha = this.getColorAlpha( this.ink );
	var source = Patterns[ pattern ];
	for ( var y = 0; y < 8; y++ )
	{
		for ( var x = 0; x < 8; x++ )
		{
			var mask = 0x80 >> x;
			if ( ( source[ y ] & mask ) != 0 )
			{
				var offset = y * 32 + x * 4;
				imageData.data[ offset ] = 0;
				imageData.data[ offset + 1 ] = 0;
				imageData.data[ offset + 2 ] = 0;
				imageData.data[ offset + 3 ] = 0;
			}
			else
			{
				var offset = y * 32 + x * 4;
				imageData.data[ offset ] = colorInk.r;
				imageData.data[ offset + 1 ] = colorInk.g;
				imageData.data[ offset + 2 ] = colorInk.b;
				imageData.data[ offset + 3 ] = alpha;
			}
		}
	}

	// Create the canvas
	var canvas = document.createElement( 'canvas' );
	canvas.width = 8;
	canvas.height = 8;
	var context = canvas.getContext( '2d' );
	context.putImageData( imageData, 0, 0 );

	// Create the pattern
	return this.context.createPattern( canvas, 'repeat' );
}
Patterns =
[
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],         //  0
	[ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ],         //  1
	[ 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA ],         //  2
	[ 0xFF, 0xFF, 0xEF, 0xD7, 0xFF, 0xFF, 0xFE, 0x7D ],         //  3
	[ 0xFD, 0xFD, 0x55, 0xAF, 0xDF, 0xDF, 0x55, 0xFA ],         //  4
	[ 0xBF, 0x7F, 0xFF, 0xF7, 0xFB, 0xFD, 0xFF, 0xDF ],         //  5
	[ 0x99, 0x39, 0x27, 0xE7, 0x7E, 0x72, 0xF3, 0x9F ],         //  6
	[ 0xFF, 0xFF, 0xFB, 0xFF, 0xFF, 0xFF, 0x7F, 0xFF ],         //  7
	[ 0x07, 0x93, 0x39, 0x70, 0xE0, 0xC9, 0x9C, 0x0E ],         //  8
	[ 0xDE, 0xC0, 0xF3, 0x7B, 0x01, 0xFA, 0xF9, 0xFD ],         //  9
	[ 0xF7, 0xFF, 0x55, 0xFF, 0xF7, 0xFF, 0x77, 0xFF ],         //  10
	[ 0x88, 0x67, 0x07, 0x07, 0x88, 0x76, 0x70, 0x70 ],         //  11
	[ 0x7F, 0x7F, 0xBE, 0xC1, 0xF7, 0xF7, 0xEB, 0x1C ],         //  12
	[ 0x7E, 0xBD, 0xDB, 0xE7, 0xF9, 0xFE, 0x7F, 0x7F ],         //  13
	[ 0x0F, 0x0F, 0x0F, 0x0F, 0xF0, 0xF0, 0xF0, 0xF0 ],         //  14
	[ 0xF7, 0xE3, 0xC1, 0x80, 0x00, 0x80, 0xC1, 0xE3 ],         //  15
	[ 0xEE, 0xDD, 0xBB, 0x00, 0x77, 0xBB, 0xDD, 0x00 ],         //  16
	[ 0xFE, 0xFD, 0xFB, 0xF7, 0xEF, 0xDF, 0xBF, 0x7F ],         //  17
	[ 0xBD, 0x7E, 0x7E, 0xBD, 0xDB, 0xE7, 0xE7, 0xDB ],         //  18
	[ 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F ],         //  19
	[ 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ],         //  20
	[ 0x00, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F ],         //  21
	[ 0xFE, 0xFD, 0xFB, 0xF7, 0xEF, 0xDF, 0xBF, 0x7F ],         //  22
	[ 0xFC, 0xF8, 0xF1, 0xE3, 0xC7, 0x8F, 0x1F, 0x3F ],         //  23
	[ 0xFE, 0xFD, 0xFB, 0xF7, 0xEF, 0xDF, 0xBF, 0x7F ],         //  24
	[ 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F ],         //  25
	[ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ],         //  26
	[ 0x00, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F ],         //  27
	[ 0xFF, 0xBB, 0xFF, 0xEE, 0xFF, 0xBB, 0xFF, 0xEE ],         //  28
	[ 0xFF, 0xAA, 0xFF, 0xAA, 0xFF, 0xAA, 0xFF, 0xAA ],         //  29
	[ 0x77, 0xAA, 0xDD, 0xAA, 0x77, 0xAA, 0xDD, 0xAA ],         //  30
	[ 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA ],         //  31
	[ 0x55, 0x22, 0x55, 0x88, 0x55, 0x22, 0x55, 0x88 ],         //  32
	[ 0x55, 0x00, 0x55, 0x00, 0x55, 0x00, 0x55, 0x00 ],         //  33
	[ 0x11, 0x00, 0x44, 0x00, 0x11, 0x00, 0x44, 0x00 ]          //  34
]


// Empty screen -> reports error if anything called...
function ScreenEmpty( amos )
{
	this.amos = amos;
};
ScreenEmpty.prototype.getCurrentWindow = function()
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.cls = function( color, x1, y1, x2, y2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.reserveZone = function( number )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setZone = function( number, x1, y1, x2, y2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.zone = function( number, x, y )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.resetZone = function( number )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.isIn = function( x, y )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.hZone = function( number, x, y )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.mouseZone = function()
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setPalette = function( palette )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setColour = function( number, color )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setWindow = function( number )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.windOpen = function( number, x, y, width, height, border, extra )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.windClose = function()
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.restoreWindows = function()
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.findColorIndex = function( r, g, b )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setModified = function()
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setInk = function( color, pattern, border )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setPattern = function( pattern )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.setPaint = function( onOff )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.plot = function( x, y, color )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.draw = function( x1, y1, x2, y2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.drawTo = function( x2, y2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.grLocate = function( x, y )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.point = function( x, y )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.box = function( x1, y1, x2, y2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.bar = function( x1, y1, x2, y2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.circle = function( x, y, radius )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.ellipse = function( x, y, radius1, radius2 )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.polyline = function( coords )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.polygon = function( coords )
{
	throw 'screen_not_opened';
};
ScreenEmpty.prototype.deactivate = function()
{
};
ScreenEmpty.prototype.activate = function()
{
};
