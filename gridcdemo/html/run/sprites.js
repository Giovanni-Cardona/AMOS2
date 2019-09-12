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
 * Sprite bank and sprites
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2019
 */

function Sprites( amos )
{
	this.amos = amos;
	this.images = {};
	this.imageList = ["1.js"];
	this.palette = ["#000000","#0022CC","#0011AA","#223388","#FF0000","#00FF00","#0000FF","#666666","#555555","#333333","#773333","#337733","#777733","#333377","#773377","#337777","#000000","#EECC88","#CC6600","#EEAA00","#2277FF","#4499DD","#55AAEE","#AADDFF","#BBDDFF","#CCEEFF","#FFFFFF","#440088","#AA00EE","#EE00EE","#EE0088","#EEEEEE"];
	this.sprites = {};
	this.spritesZ = [];
	this.lastSpriteNumber = -1;
	this.spritesToUpdate = false;
	this.spritesUpdateOn = true;
	this.spritesPriorityOn = false;
	this.spritesPriorityReverseOn = false;
	this.collisionList = [];
	this.collisionBoxed = this.amos.manifest.sprites.collisionBoxed;
	this.collisionPrecision = this.amos.manifest.sprites.collisionPrecision;
	this.collisionAlphaThreshold = this.amos.manifest.sprites.collisionAlphaThreshold;
}
Sprites.prototype.init = function( options, callback, extra )
{
	this.utilities = this.amos.utilities;
	this.renderer = this.amos.renderer;
	this.loadAll( callback, extra );
};
Sprites.HREV = 0x80000000;
Sprites.VREV = 0x40000000;

Sprites.prototype.sprite = function( number, x, y, image )
{
	if ( number < 0 )
		throw 'illegal_function_call';

	var sprite = this.sprites[ number ];
	if ( !sprite )
	{
		sprite =
		{
			xDisplay: undefined,
			yDisplay: undefined,
			imageDisplay: undefined,
			xScaleDisplay: undefined,
			yScaleDisplay: undefined,
			xSkewDisplay: undefined,
			ySkewDisplay: undefined,
			angleDisplay: undefined,
			xNew: x,
			yNew: y,
			imageNew: image,
			angleNew: 0,
			xScaleNew: 1,
			yScaleNew: 1,
			xSkewNew: 0,
			ySkewNew: 0,
			toUpdate: true,
			toUpdateCollisions: true,
			collisions: {}
		};
		this.spritesZ.push( sprite );
		this.sprites[ number ] = sprite;
		if ( typeof number == 'number' )
			this.lastSpriteNumber = Math.max( number, this.lastSpriteNumber );
	}
	x = typeof x == 'undefined' ? sprite.xNew : x;
	y = typeof y == 'undefined' ? sprite.yNew : y;
	image = typeof image == 'undefined' ? sprite.imageNew : image;
	if ( !this.getImage( image ) )
		throw 'image_not_defined';
	sprite.xNew = x;
	sprite.yNew = y;
	sprite.imageNew = image;
	sprite.toUpdate = true;
	sprite.toUpdateCollisions = true;
	this.spritesToUpdate = true;
	this.renderer.setModified();
};
Sprites.prototype.spriteOff = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';

	if ( typeof number != 'undefined' )
	{
		var sprite = this.sprites[ number ];
		if ( sprite )
		{
			this.sprites[ number ] = null;
			if ( typeof number == 'number' )
			{
				this.lastSpriteNumber = 0;
				for ( var s in this.sprites )
				{
					if ( this.sprites[ s ] && typeof s == 'number' )
						this.lastSpriteNumber = Math.max( s, this.lastSpriteNumber );
				}
			}
			for ( var z = 0; z < this.spritesZ.length; z++ )
			{
				if ( this.spritesZ[ z ] == sprite )
				{
					this.spritesZ = this.utilities.slice( this.spritesZ, z, 1 );
					break;
				}
			}
		}
	}
	else
	{
		this.sprites = {};
		this.spritesZ = [];
		this.lastSpriteNumber = -1;
	}
	this.spritesToUpdate = true;
	this.renderer.setModified();
};
Sprites.prototype.spritesUpdate = function( force, forceAll )
{
	if ( force || ( this.spritesUpdateOn && this.spritesToUpdate ) )
	{
		this.spritesToUpdate = false;

		var done = false;
		for ( var b = 0; b < this.spritesZ.length; b++ )
		{
			var sprite = this.spritesZ[ b ];
			if ( sprite.toUpdate || forceAll )
			{
				sprite.toUpdate = false;
				sprite.xDisplay = sprite.xNew;
				sprite.yDisplay = sprite.yNew;
				sprite.imageDisplay = sprite.imageNew;
				sprite.xScaleDisplay = sprite.xScaleNew;
				sprite.yScaleDisplay = sprite.yScaleNew;
				sprite.xSkewDisplay = sprite.xSkewNew;
				sprite.ySkewDisplay = sprite.ySkewNew;
				sprite.angleDisplay = sprite.angleNew;
				done = true;
			}
		}
		if ( done )
		{
			this.sortSpritesPriority();
			this.renderer.setModified();
		}
	}
};
Sprites.prototype.setSpritesUpdate = function( yes_no )
{
	this.spritesUpdateOn = yes_no;
};
Sprites.prototype.setScale = function( number, xScale, yScale )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	if ( typeof xScale != 'undefined' )
		sprite.xScaleNew = xScale;
	if ( typeof yScale != 'undefined' )
		sprite.yScaleNew = yScale;

	sprite.toUpdate = true;
	sprite.toUpdateCollisions = true;
	this.spritesToUpdate = true;
};
Sprites.prototype.setSkew = function( number, xSkew, ySkew )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	if ( typeof xSkew != 'undefined' )
		sprite.xSkewNew = xSkew;
	if ( typeof ySkew != 'undefined' )
		sprite.ySkewNew = ySkew;

	sprite.toUpdate = true;
	sprite.toUpdateCollisions = true;
	this.spritesToUpdate = true;
};
Sprites.prototype.setAngle = function( number, angle )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	sprite.angleNew = angle;

	sprite.toUpdate = true;
	sprite.toUpdateCollisions = true;
	this.spritesToUpdate = true;
};
Sprites.prototype.xSprite = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	return sprite.xNew;
};
Sprites.prototype.ySprite = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	return sprite.yNew;
};
Sprites.prototype.iSprite = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	return parseInt( sprite.imageNew );
};
Sprites.prototype.getPalette = function()
{
	return this.palette;
};
Sprites.prototype.isSprite = function( number )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	return this.sprites[ number ] != null;
};
Sprites.prototype.setSpritesPriority = function( on_off )
{
	this.spritesPriorityOn = on_off;
	this.spritesToUpdate = true;
};
Sprites.prototype.setSpritesPriorityReverse = function( on_off )
{
	this.spritesPriorityReverseOn  = on_off;
	this.spritesToUpdate = true;
};
Sprites.prototype.sortSpritesPriority = function()
{
	if ( this.spritesPriorityOn )
	{
		if ( this.spritesPriorityReverseOn )
		{
			this.spritesZ = this.spritesZ.sort( function( b1, b2 )
			{
				if ( b1.yNew == b2.yNew )
					return 0;
				return ( b1.yNew > b2.yNew ) ? -1 : 1;
			} );
		}
		else
		{
			this.spritesZ = this.spritesZ.sort( function( b1, b2 )
			{
				if ( b1.yNew == b2.yNew )
					return 0;
				return ( b1.yNew < b2.yNew ) ? -1 : 1;
			} );
		}
	}
};

Sprites.prototype.loadAll = function( callback, extra )
{
	var self = this;
	var count = this.imageList.length;
	if ( count )
	{
		for ( var i = 0; i < this.imageList.length; i++ )
		{
			var path = './resources/sprites/' + this.imageList[ i ];
			this.utilities.loadUnlockedImage( path, 'image/png', {}, function( response, image, name )
			{
				if ( response )
				{
					self.images[ name ] =
					{
						name: name,
						canvas: image,
						width: image.width,
						height: image.height,
						hotSpotX: 0,
						hotSpotY: 0,
						collisionMaskPrecision: self.collisionPrecision,
						collisionMaskAlphaThreshold: self.collisionAlphaThreshold
					};
					count--;
					if ( count == 0 )
					{
						// Initialize the masks
						for ( var m in window.Masks )
						{
							var buffer = self.amos.utilities.convertStringToArrayBuffer( window.Masks[ m ] );
							var dataView = new Uint8Array( buffer );
							window.Masks[ m ] = dataView;						
						}
	
						// Done!
						callback( true, {}, extra );
					}
				}
			}, this.utilities.getFilename( this.imageList[ i ] ) );		
		}
	}
	else
	{
		callback( true, {}, extra );
	}
};
Sprites.prototype.load = function( numberOrName, callback, extra )
{
	var self = this;

	if ( typeof numberOrName == 'number' )
		numberOrName = '' + numberOrName;

	var imageName;
	for ( var f = 0; f < this.imageList.length; f++ )
	{
		if ( this.utilities.getFilename( this.imageList[ f ] ) == numberOrName )
		{
			imageName = this.imageList[ f ];
			break;
		}
	}
	if ( imageName )
	{
		var path = './resources/sprites/' + imageName;
		var image = new Image();
		image._name = numberOrName;
		image.onload = function()
		{
			this.crossOrigin = "Anonymous";
			var canvas = document.createElement( 'canvas' );
			canvas.width = this.width;
			canvas.height = this.height;
			var context = canvas.getContext( '2d' );
			context.imageSmoothingEnabled = false;
			context.drawImage( this, 0, 0 );
			self.images[ this._name ] =
			{
				name: this._name,
				canvas: canvas,
				width: this.width,
				height: this.height,
				hotSpotX: 0,
				hotSpotY: 0,
				collisionMaskPrecision: self.collisionPrecision,
				collisionMaskAlphaThreshold: self.collisionAlphaThreshold
			};
			callback( true, {}, extra );
		};
		image.src = path;
	}
};
Sprites.prototype.addImage = function( canvas, name )
{
	this.images[ name ] =
	{
		name: name,
		canvas: canvas,
		width: canvas.width,
		height: canvas.height,
		hotSpotX: 0,
		hotSpotY: 0
	};
};
Sprites.prototype.deleteAll = function()
{
	this.images = [];
};
Sprites.prototype.insert = function( first, last )
{
	last = typeof last != 'undefined' ? last : first + 1;
	if ( last < first )
		throw 'illegal_function_call';
	for ( var b = first; b < last; b++ )
	{
		var canvas = document.createElement( 'canvas' );
		canvas.width = 1;
		canvas.height = 1;
		this.addImage( canvas, b );
	}
};
Sprites.prototype.delete = function( numberOrName, last )
{
	if ( typeof last == 'undefined' )
	{
		this.images[ numberOrName ] = null;
	}
	else
	{
		if ( typeof numberOrName == 'string' )
			throw 'type_mismatch';
		if ( last < numberOrName )
			throw 'illegal_function_call';

		var temp = {};
		for ( var i in this.images )
		{
			var number = parseInt( b );
			if ( !isNaN( number ) )
			{
				if ( number < numberOrName && number > last )
					temp[ i ] = this.images[ i ];
			}
			else
			{
				temp[ i ] = this.images[ i ];
			}
		}
		this.images = temp;
	}
};
Sprites.prototype.getImage = function( number )
{
	if ( typeof number == 'number' )
		number &= ~( Sprites.HREV | Sprites.VREV );
	return this.images[ '' + number ];
};
Sprites.prototype.getImageWidth = function( number )
{
	var image = this.getImage( number );
	if ( image )
	{
		return image.width;
	}
	return 0;
};
Sprites.prototype.getImageHeight = function( number )
{
	var image = this.getImage( number );
	if ( image )
	{
		return image.height;
	}
	return 0;
};
Sprites.prototype.setHotSpot = function( numberOrName, x, y )
{
	if ( typeof numberOrName == 'number' )
		numberOrName = '' + numberOrName;
	var image = this.images[ numberOrName ];
	if ( !image )
		throw 'image_not_defined';

	if ( x == 'mask' )
	{
		switch ( ( y & 0x70 ) >> 4 )
		{
			case 0:
				image.hotSpotX = 0;
				break;
			case 1:
				image.hotSpotX = image.width / 2;
				break;
			case 2:
				image.hotSpotX = image.width;
				break;
		}
		switch ( y & 0x07 )
		{
			case 0:
				image.hotSpotY = 0;
				break;
			case 1:
				image.hotSpotY = image.height / 2;
				break;
			case 2:
				image.hotSpotY = image.height;
				break;
		}
	}
	else
	{
		image.hotSpotX = typeof x != 'undefined' ? x : 0;
		image.hotSpotY = typeof y != 'undefined' ? y : 0;
	}
};


// Collision detection
Sprites.prototype.spriteCol = function( number, from, to )
{
	if ( typeof number != 'number' )
		throw 'type_mismatch';
	if ( number < 0 )
		throw 'illegal_function_call';
	var sprite = this.sprites[ number ];
	if ( !sprite )
		throw 'sprite_not_defined';
	if ( sprite.toUpdateCollisions )
		this.setSpriteCollisionData( sprite );

	from = typeof from == 'undefined' ? 0 : from;
	to = typeof to == 'undefined' ? this.lastSpriteNumber : to;
	if ( from < 0 || to < 0 || from > to )
		throw 'illegal_function_call';

	this.collisionList = [];
	for ( var s = from; s <= to; s++ )
	{
		var testSprite = this.sprites[ s ];
		if ( testSprite && testSprite != sprite )
		{
			if ( testSprite.toUpdateCollisions )
				this.setSpriteCollisionData( testSprite );
			if ( this.isColliding( sprite, testSprite ) )
			{
				this.collisionList[ s ] = true;
			}
		}
	}
	return this.collisionList.length > 0;
};
Sprites.prototype.spriteBobCol = function( sprite, screen, from, to )
{
	if ( typeof sprite != 'number')
		throw 'type_mismatch';
	if ( sprite < 0 )
		throw 'illegal_function_call';
	sprite = this.sprites[ sprite ];
	if ( !sprite )
		throw 'sprite_not_defined';
	if ( sprite.toUpdateCollisions )
		this.setSpriteCollisionData( sprite );

	from = typeof from == 'undefined' ? 0 : from;
	to = typeof to == 'undefined' ? screen.lastBobNumber : to;
	if ( from < 0 || to < 0 || from > to )
		throw 'illegal_function_call';

	this.collisionList = [];
	for ( var b = from; b <= to; b++ )
	{
		var bob = screen.bobs[ b ];
		if ( bob )
		{
			if ( bob.toUpdateCollisions )
				this.setBobCollisionData( bob, screen );

			if ( this.collisionRectangle || this.isColliding( sprite, bob ) )
			{
				this.collisionList[ b ] = true;
			}
		}
	}
	return this.collisionList.length > 0;
};
Sprites.prototype.bobSpriteCol = function( bob, screen, from, to )
{
	if ( typeof bob != 'number' )
		throw 'type_mismatch';
	if ( bob < 0 )
		throw 'illegal_function_call';
	bob = screen.bobs[ bob ];
	if ( !bob )
		throw 'bob_not_defined';
	if ( bob.toUpdateCollisions )
		this.setBobCollisionData( bob, screen );

	from = typeof from == 'undefined' ? 0 : from;
	to = typeof to == 'undefined' ? this.lastSpriteNumber : to;
	if ( from < 0 || to < 0 || from > to )
		throw 'illegal_function_call';

	this.collisionList = [];
	for ( var s = from; s <= to; s++ )
	{
		var sprite = this.sprites[ s ];
		if ( sprite )
		{
			if ( sprite.toUpdateCollisions )
				this.setSpriteCollisionData( sprite );

			if ( this.isColliding( sprite, bob ) )
			{
				this.collisionList[ s ] = true;
			}
		}
	}
	return this.collisionList.length > 0;
};
Sprites.prototype.bobCol = function( bob, screen, from, to )
{
	// TODO: allow collision test with strings as bob reference.
	if ( typeof bob != 'number' )
		throw 'type_mismatch';
	if ( bob < 0 )
		throw 'illegal_function_call';
	bob = screen.bobs[ bob ];
	if ( !bob )
		throw 'bob_not_defined';
	if ( bob.toUpdateCollisions )
		this.setBobCollisionData( bob, screen );

	from = typeof from == 'undefined' ? 0 : from;
	to = typeof to == 'undefined' ? screen.lastBobNumber : to;
	if ( from < 0 || to < 0 || from > to )
		throw 'illegal_function_call';

	this.collisionList = [];
	for ( var b = from; b <= to; b++ )
	{
		var testBob = screen.bobs[ b ];
		if ( testBob && testBob != bob )
		{
			if ( testBob.toUpdateCollisions )
				this.setBobCollisionData( testBob, screen );

			if ( this.isColliding( bob, testBob ) )
			{
				this.collisionList[ b ] = true;
			}
		}
	}
	return this.collisionList.length > 0;
};
Sprites.prototype.col = function( number )
{
	if ( number < 0 )
	{
		for ( var c = 0; c < this.collisionList.length; c++ )
		{
			if ( this.collisionList[ c ] )
				return c;
		}
		return 0;
	}
	return this.collisionList[ number ] == true;
};
Sprites.prototype.setSpriteCollisionData = function( sprite )
{
	var collisions = sprite.collisions;
	var image = this.getImage( sprite.imageNew );
	if ( image )
	{
		if ( sprite.angleNew == 0 )
		{
			collisions.x1 = sprite.xNew - image.hotSpotX * sprite.xScaleNew;
			collisions.y1 = sprite.yNew - image.hotSpotY * sprite.yScaleNew;
			collisions.x2 = collisions.x1 + image.width * sprite.xScaleNew;
			collisions.y2 = collisions.y1 + image.height * sprite.yScaleNew;
		}
		else
		{
			var x1 = sprite.xNew - image.hotSpotX * sprite.xScaleNew;
			var y1 = sprite.yNew - image.hotSpotY * sprite.yScaleNew;
			var coords = this.utilities.rotate( x1, y1,	sprite.xNew, sprite.yNew, sprite.angleNew );
			collisions.x1 = coords.x;
			collisions.y1 = coords.y;
			coords = this.utilities.rotate( x1 + image.width * sprite.xScaleNew, y1 + image.height * sprite.yScaleNew, sprite.xNew, sprite.yNew, sprite.angle );
			collisions.x2 = coords.x;
			collisions.y2 = coords.y;
		}
	}
	else
	{
		collisions.x1 = 10000000;
		collisions.y1 = 10000000;
		collisions.x2 = -10000000;
		collisions.y2 = -10000000;
	}
	sprite.toUpdateCollisions = false;
};
Sprites.prototype.setBobCollisionData = function( bob, screen )
{
	var collisions = bob.collisions;
	var image = this.getImage( bob.imageNew );
	if ( image )
	{
		var xHard = bob.xNew * screen.renderScaleX + screen.x;
		var yHard = bob.yNew * screen.renderScaleY + screen.y;
		var xHotspotHard = image.hotSpotX * screen.renderScaleX;
		var yHotspotHard = image.hotSpotY * screen.renderScaleY;
		var widthHard = image.width * screen.renderScaleX;
		var heightHard = image.height * screen.renderScaleY;
		if ( bob.angleNew == 0 )
		{
			collisions.x1 = xHard - xHotspotHard * bob.xScaleNew;
			collisions.y1 = yHard - yHotspotHard * bob.yScaleNew;
			collisions.x2 = collisions.x1 + widthHard * bob.xScaleNew;
			collisions.y2 = collisions.y1 + heightHard * bob.yScaleNew;
		}
		else
		{
			var x1 = xHard - xHotspotHard * bob.xScaleNew;
			var y1 = yHard - yHotspothard * bob.yScaleNew;
			var coords = this.utilities.rotate( x1, y1,	xHard, yHard, bob.angleNew );
			collisions.x1 = coords.x;
			collisions.y1 = coords.y;
			coords = this.utilities.rotate( x1 + widthHard * bob.xScaleNew, y1 + heightHard * bob.yScaleNew, xHard, yHard, bob.angle );
			collisions.x2 = coords.x;
			collisions.y2 = coords.y;
		}
	}
	else
	{
		collisions.x1 = 10000000;
		collisions.y1 = 10000000;
		collisions.x2 = -10000000;
		collisions.y2 = -10000000;
	}
	bob.toUpdateCollisions = false;
};
Sprites.prototype.getCollisionMask = function( image )
{
	if ( !image.collisionMask )
	{
		var dataView = window.Masks[ image.name ];
		if ( !dataView )
			return null;
			
		image.collisionMask = dataView;
		image.collisionMaskWidth = image.width;
		image.collisionMaskHeight = image.height;
		image.collisionMaskPrecision = 1;
	}
	return { mask: image.collisionMask, width: image.collisionMaskWidth, height: image.collisionMaskHeight, precision: image.collisionMaskPrecision };
	
/*		
		var canvas = document.createElement( 'canvas' );
		canvas.width = image.width * image.collisionMaskPrecision;
		canvas.height = image.height * image.collisionMaskPrecision;
		var context = canvas.getContext( '2d' );
		context.imageSmoothingEnabled = false;
		context.drawImage( image.canvas, 0, 0, canvas.width, canvas.height );
		var imageData = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
		var arrayBuffer = new ArrayBuffer( canvas.width * canvas.height );
		var dataView = new Uint8Array( arrayBuffer );
		for ( var y = 0; y < canvas.height; y++ )
		{
			for ( var x = 0; x < canvas.width; x++ )
			{
				if ( imageData[ ( y * canvas.width + x ) * 4 + 3 ] >= image.collisionMaskAlphaThreshold )
				{
					dataView[ y * canvas.width + x ] = 0xFF;
				}
			}
		}
*/
};
Sprites.prototype.isColliding = function( object1, object2 )
{
	var collisions1 = object1.collisions;
	var collisions2 = object2.collisions;

	var colliding = ( collisions1.x2 > collisions2.x1 && collisions1.x1 <= collisions2.x2
				   && collisions1.y2 > collisions2.y1 && collisions1.y1 <= collisions2.y2 );

	if ( colliding && !this.collisionBoxed && ( object1.angleNew == 0 && object2.angleNew == 0 ) )		// TODO
	{
		var maskDefinition1 = this.getCollisionMask( this.getImage( object1.imageNew ) );
		var maskDefinition2 = this.getCollisionMask( this.getImage( object2.imageNew ) );
		if ( !maskDefinition1 || !maskDefinition2 )
			return colliging;

		colliding = false;
		var o1Left, o1Top, o1Right, o1Bottom;
		var o2Left, o2Top, o2Right, o2Bottom;
		if ( collisions1.x1 <= collisions2.x1 )
		{
			o2Left = 0;
			o1Left = collisions2.x1 - collisions1.x1;
			if ( collisions1.x2 < collisions2.x2 )
			{
				o1Right = collisions1.x2 - collisions1.x1;
				o2Right = collisions1.x2 - collisions2.x1;
			}
			else
			{
				o2Right = collisions2.x2 - collisions2.x1;
				o1Right = collisions2.x2 - collisions1.x1;
			}
		}
		else
		{
			o1Left = 0;
			o2Left = collisions1.x1 - collisions2.x1;
			if ( collisions1.x2 < collisions2.x2 )
			{
				o1Right = collisions1.x2 - collisions1.x1;
				o2Right = collisions1.x2 - collisions2.x1;
			}
			else
			{
				o1Right = collisions2.x2 - collisions1.x1;
				o2Right = collisions2.x2 - collisions2.x1;
			}
		}
		if ( collisions1.y1 <= collisions2.y1 )
		{
			o2Top = 0;
			o1Top = collisions2.y1 - collisions1.y1;
			if ( collisions1.y2 < collisions2.y2 )
			{
				o1Bottom = collisions1.y2 - collisions1.y1;
				o2Bottom = collisions1.y2 - collisions2.y1;
			}
			else
			{
				o2Bottom = collisions2.y2 - collisions2.y1;
				o1Bottom = collisions2.y2 - collisions1.y1;
			}
		}
		else
		{
			o1Top = 0;
			o2Top = collisions1.y1 - collisions2.y1;
			if ( collisions1.y2 < collisions2.y2 )
			{
				o1Bottom = collisions1.y2 - collisions1.y1;
				o2Bottom = collisions1.y2 - collisions2.y1;
			}
			else
			{
				o1Bottom = collisions2.y2 - collisions1.y1;
				o2Bottom = collisions2.y2 - collisions2.y1;
			}
		}

		o1Left = o1Left * maskDefinition1.precision / object1.xScaleNew;
		o1Top = o1Top * maskDefinition1.precision / object1.yScaleNew;
		o2Left = o2Left * maskDefinition2.precision / object2.xScaleNew;
		o2Top = o2Top * maskDefinition2.precision / object2.yScaleNew;
		o1Right = Math.floor( o1Right * maskDefinition1.precision / object1.xScaleNew );
		o1Bottom = Math.floor( o1Bottom * maskDefinition1.precision / object1.yScaleNew );
		o2Right = Math.floor( o2Right * maskDefinition2.precision / object2.xScaleNew );
		o2Bottom = Math.floor( o2Bottom * maskDefinition2.precision / object2.yScaleNew );
		var o1PlusX = maskDefinition1.precision / object1.xScaleNew;
		var o1PlusY = maskDefinition1.precision / object1.yScaleNew;
		var o2PlusX = maskDefinition2.precision / object2.xScaleNew;
		var o2PlusY = maskDefinition2.precision / object2.yScaleNew;

		var x1, y1, x2, y2;

		/*
		for ( y1 = o1Top, y2 = o2Top; y1 < o1Bottom && y2 < o2Bottom; y1 += o1PlusY, y2 += o2PlusY )
		{
			var offset1 = Math.floor( y1 ) * maskDefinition1.width;
			var offset2 = Math.floor( y2 ) * maskDefinition2.width;
			for ( x1 = o1Left, x2 = o2Left; x1 < o1Right && x2 < o2Right; x1 += o1PlusX, x2 += o2PlusX )
			{
				this.amos.currentScreen.plot( x1 - o1Left, y1 - o1Top, maskDefinition1.mask[ offset1 + Math.floor( x1 ) ] != 0 ? 2 : 0 );
				this.amos.currentScreen.plot( 100 + x2 - o2Left, y2 - o2Top, maskDefinition2.mask[ offset2 + Math.floor( x2 ) ] != 0 ? 2 : 0 );
				if ( ( maskDefinition1.mask[ offset1 + Math.floor( x1 ) ] & maskDefinition2.mask[ offset2 + Math.floor( x2 ) ] ) != 0 )
				{
					this.amos.currentScreen.plot( x1 - o1Left, y1 - o1Top, 5 );
					this.amos.currentScreen.plot( 100 + x2 - o2Left, y2 - o2Top, 5 );
				}
			}
		}
		*/

		for ( y1 = o1Top, y2 = o2Top; y1 < o1Bottom && y2 < o2Bottom && !colliding; y1 += o1PlusY, y2 += o2PlusY )
		{
			var offset1 = Math.floor( y1 ) * maskDefinition1.width;
			var offset2 = Math.floor( y2 ) * maskDefinition2.width;
			for ( x1 = o1Left, x2 = o2Left; x1 < o1Right && x2 < o2Right; x1 += o1PlusX, x2 += o2PlusX )
			{
				if ( ( maskDefinition1.mask[ offset1 + Math.floor( x1 ) ] & maskDefinition2.mask[ offset2 + Math.floor( x2 ) ] ) != 0 )
				{
					colliding = true;
					break;
				}
			}
		}
	}
	return colliding;
};

// Definition of the collision masks
Masks = {};
Masks["1"]="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAA////////////////////////////////////////////////////////////////////////AAAAAAAAAAAA//////////////////////////////////////////////////////////////////////////8AAAAAAAAAAP//////////////////////////////////////////////////////////////////////////AAAAAAAAAP////////////////////////////////////////////////////////////////////////////8AAAAAAAD/////////////////////////////////////////////////////////////////////////////AAAAAAD///////////////////////////////////////////////////////////////////////////////8AAAAA////////////////////////////////////////////////////////////////////////////////AAAAAP///////////////////////////////////////////////////////////////////////////////wAAAAD///////////////////////////////////////////////////////////////////////////////8AAAD//////////////////////////////////////////////////////////////////////////////////wAA//////////////////////////////////////////////////////////////////////////////////8AAP//////////////////////////////////////////////////////////////////////////////////AAD//////////////////////////////////////////////////////////////////////////////////wAA//////////////////////////////////////////////////////////////////////////////////8AAP//////////////////////////////////////////////////////////////////////////////////AAD//////////////////////////////////////////////////////////////////////////////////wAA//////////////////////////////////////////////////////////////////////////////////8AAP//////////////////////////////////////////////////////////////////////////////////AAD//////////////////////////////////////////////////////////////////////////////////wAA//////////////////////////////////////////////////////////////////////////////////8AAP//////////////////////////////////////////////////////////////////////////////////AAD//////////////////////////////////////////////////////////////////////////////////wAA//////////////////////////////////////////////////////////////////////////////////8AAAD///////////////////////////////////////////////////////////////////////////////8AAAAA////////////////////////////////////////////////////////////////////////////////AAAAAP///////////////////////////////////////////////////////////////////////////////wAAAAD///////////////////////////////////////////////////////////////////////////////8AAAAAAP////////////////////////////////////////////////////////////////////////////8AAAAAAAD/////////////////////////////////////////////////////////////////////////////AAAAAAAAAP//////////////////////////////////////////////////////////////////////////AAAAAAAAAAD//////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAP///////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAP////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAP//////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAA////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

