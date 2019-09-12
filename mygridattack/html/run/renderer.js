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
 * AMOS 2 - Renderer
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 03/12/2018
 */

function Renderer( amos, canvasId )
{
	this.amos = amos;
	this.manifest = amos.manifest;
	this.sprites = amos.sprites;
	this.utilities = amos.utilities;
	this.canvas = document.getElementById( canvasId );
	this.context = this.canvas.getContext( '2d' );

	var width = this.canvas.width;
	var height = this.canvas.height;
	if ( this.manifest.display.fullScreen || this.manifest.display.fullPage )
	{
		width = window.innerWidth;
		height = window.innerHeight;
	}
	this.width = width;
	this.height = height;
	this.originalWidth = width;
	this.originalHeight = height;
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.scaleX = typeof this.manifest.display.scaleX != 'undefined' ? this.manifest.display.scaleX : 1;	
	this.scaleY = typeof this.manifest.display.scaleY != 'undefined' ? this.manifest.display.scaleY : 1;
	this.background = typeof this.manifest.display.background != 'undefined' ? this.manifest.display.background : 'color';
	this.backgroundColor = typeof this.manifest.display.backgroundColor != 'undefined' ? this.manifest.display.backgroundColor : '#000000';
	this.redrawBars = true;
	this.xLeftDraw = 0;
	this.yTopDraw = 0;
	this.widthDraw = 320;
	this.heightDraw = 200;

	// Display FPS?
	if ( this.manifest.display.fps )
	{
		var height = this.utilities.getFontStringHeight( this.manifest.display.fpsFont );
		this.fpsRectX = this.manifest.display.fpsX;
		this.fpsRectY = this.manifest.display.fpsY;
		this.fpsRectWidth = this.context.measureText( 'XXX FPS' ).width;
		this.fpsRectHeight = height;
	}
	
	this.debugX = 1;
	this.debugY = 1;
	var self = this;
	window.addEventListener( "resize", doResize );
	doResize( true );

	// Load the full screen icons
	if ( this.manifest.display.fullScreenIcon )
	{
		this.utilities.loadImages( 
		[
			'./run/resources/full_screen.png',
			'./run/resources/small_screen.png',
		], {}, function( response, data, extra )
		{
			if ( response )
			{
				self.fullScreenIcons = data;
			}
		} );
	}
	
	this.modified = true;
	this.doubleBuffer = false;
	this.viewOn = true;

	function doResize( force )
	{		
		if( force && ( self.manifest.display.fullScreen || self.manifest.display.fullPage ) )
		{
			self.width = window.innerWidth;
			self.height = window.innerHeight;
			self.canvas.width = self.width;
			self.canvas.height = self.height;
			self.fullScreenIconRatio = self.width / self.manifest.display.width;
			self.redrawBars = true;
			self.resetDisplay = true;
		}
	}	
};
Renderer.prototype.init = function()
{
};
Renderer.prototype.getSoftwareFromHardwareX = function( x )
{

};
Renderer.prototype.setDoubleBuffer = function()
{
	this.doubleBuffer = true;
};
Renderer.prototype.screenSwap = function()
{
	if ( !this.doubleBuffer )
		throw 'illegal_function_call';
	this.render( true );
};
Renderer.prototype.setModified = function()
{
	this.modified = true;
};
Renderer.prototype.setBackgroundColor = function( color )
{
	this.backgroundColor = color;
	this.setModified();
};
Renderer.prototype.setView = function( onOff )
{
	this.viewOn = onOff;
};
Renderer.prototype.view = function( onOff )
{
	this.render( true );
};
Renderer.prototype.render = function( force )
{	
	force = typeof force == 'undefined' ? false : true;
	if ( !this.rendering && ( ( !this.doubleBuffer && this.viewOn && this.modified ) || force ) )
	{
		this.rendering = true;
		this.context.save();
		this.context.imageSmoothingEnabled = true;
		this.context.imageRendering = 'pixelated';

		// Drawing area		
		var widthDraw = this.width;
		var heightDraw = this.height;
		var doClip = false;
		if ( this.manifest.display.fullPage || this.manifest.display.fullScreen )
		{
			if ( this.manifest.display.keepProportions )
			{
				var originalRatio = this.manifest.display.width / this.manifest.display.height;
				var w = heightDraw * originalRatio;
				var h = widthDraw / originalRatio;
				if ( h <= heightDraw )
				{
					widthDraw = h * originalRatio;
					heightDraw = h;
				}
				else
				{
					widthDraw = w;
					heightDraw = w / originalRatio;
				}	
				doClip = true;
			}
		}
		var xLeftDraw = ( this.width - widthDraw ) / 2;
		var yTopDraw = ( this.height - heightDraw ) / 2;

		this.xLeftDraw = xLeftDraw;
		this.yTopDraw = yTopDraw;
		this.widthDraw = widthDraw;
		this.heightDraw = heightDraw;
		this.amos.setScreenDisplay( widthDraw, heightDraw );

		// Reset display
		if ( this.background == 'transparent' )
		{
			if ( this.resetDisplay )
				this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			else
				this.context.clearRect( xLeftDraw, yTopDraw, widthDraw, heightDraw );
		}
		else
		{
			this.context.fillStyle = this.manifest.display.backgroundColor;
			if ( this.resetDisplay )
				this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
			else
				this.context.fillRect( xLeftDraw, yTopDraw, widthDraw, heightDraw );
		}
		this.resetDisplay = false;

		// If full screen, clip!
		if ( doClip )
		{
			path = new Path2D();
			path.rect( xLeftDraw, yTopDraw, widthDraw, heightDraw );
			this.context.clip( path );
		}
		var xRatioDisplay = widthDraw / this.amos.hardWidth;
		var yRatioDisplay = heightDraw / this.amos.hardHeight;
		if ( this.manifest.compilation.emulation.toLowerCase() == 'pc' )
		{
			xRatioDisplay *= ( widthDraw / this.manifest.display.width );
			yRatioDisplay *= ( heightDraw / this.manifest.display.height );
		}
		
		// Draw screens
		for ( var s = 0; s < this.amos.screensZ.length; s++ )
		{
			var screen = this.amos.screensZ[ s ];
			if ( !screen.hidden )
			{
				var xDrawScreen;
				var yDrawScreen;
				if ( screen.isCenteredX )
					xDrawScreen = xLeftDraw + widthDraw / 2 - screen.width * screen.xScaleDisplay - this.amos.hardLeftX * xRatioDisplay;
				else
					xDrawScreen = ( screen.x - this.amos.hardLeftX ) * xRatioDisplay + xLeftDraw;
				if ( screen.isCenteredY )
					yDrawScreen = yTopDraw + heightDraw / 2 - screen.height * screen.yScaleDisplay - this.amos.hardTopY * yRatioDisplay;
				else
					yDrawScreen = ( screen.y - this.amos.hardTopY ) * yRatioDisplay + yTopDraw;
				var xScaleScreen = screen.xScaleDisplay * screen.renderScaleX * ( xRatioDisplay / screen.scale );
				var yScaleScreen = screen.yScaleDisplay * screen.renderScaleY * ( yRatioDisplay / screen.scale );
				var width = screen.displayWidth * screen.scale;
				var height = screen.displayHeight * screen.scale;
				var widthDrawScreen = width * xScaleScreen;
				var heightDrawScreen = height * yScaleScreen;

				var screenRotated = false;
				if ( screen.angleDisplay == 0 && screen.xSkewDisplay == 0 && screen.ySkewDisplay == 0 )
				{
					this.context.drawImage( screen.canvas, -screen.hotSpotX * screen.scale, -screen.hotSpotY * screen.scale, width, height, xDrawScreen, yDrawScreen, widthDrawScreen, heightDrawScreen );
				}
				else
				{
					this.context.setTransform( xScaleScreen, screen.xSkewDisplay, screen.ySkewDisplay, yScaleScreen, xDrawScreen, yDrawScreen );
					this.context.rotate( screen.angleDisplay );
					this.context.drawImage( screen.canvas, -screen.hotSpotX * screen.scale, -screen.hotSpotY * screen.scale, width, height, 0, 0, width, height );
					screenRotated = true;
				}

				/*
				if ( this.amos.showCopperBlack && screen.xScale == 1 && screen.yScale == 1 && screen.angle == 0 )
				{
					var width = screen.displayWidth * screen.renderScaleX * ( widthDraw / this.amos.hardWidth );
					var height = screen.displayHeight * screen.renderScaleY * ( heightDraw / this.amos.hardHeight );
					this.context.fillStyle = this.backgroundColor;
					this.context.fillRect( 0, yDraw - this.scaleY, widthDraw, this.scaleY );
					this.context.fillRect( 0, yDraw + height, widthDraw, this.scaleY );
					this.context.fillRect( 0, yDraw, xDraw, height );
					this.context.fillRect( xDraw + width, yDraw, this.canvas.width - x - width, height );
				}
				*/
				// Update the bobs and sprites
				this.amos.rendererUpdate();

				// Bobs!
				if ( screen.bobsZ.length )
				{
					// Clip the canvas
					this.context.save();
					path = new Path2D();
					path.rect( xDrawScreen, yDrawScreen, widthDrawScreen, heightDrawScreen );
					this.context.clip( path );

					// Draw bobs
					for ( var b = 0; b < screen.bobsZ.length; b++ )
					{
						var bob = screen.bobsZ[ b ];
						if ( !bob.hidden && typeof bob.xDisplay != 'undefined' && typeof bob.yDisplay != 'undefined' && typeof bob.imageDisplay != 'undefined' )
						{
							var image = this.sprites.getImage( bob.imageDisplay );
							if ( image )
							{
								var canvas = image.canvas;
								if ( typeof bob.imageDisplay == 'number' && ( bob.imageDisplay & ( Sprites.HREV | Sprites.VREV ) ) != 0 )
								{
									if ( ( bob.imageDisplay & ( Sprites.HREV | Sprites.VREV ) ) == ( Sprites.HREV | Sprite.VREV ) )
									{
										if ( !image.canvasRev )
										{
											image.canvasRev = this.utilities.flipCanvas( image.canvas, Sprites.HREV | Sprites.VREV );
										}
										canvas = image.canvasRev;
									}
									else
									{
										if ( ( bob.imageDisplay & Sprites.HREV ) != 0 )
										{
											if ( !image.canvasHRev )
											{
												image.canvasHRev = this.utilities.flipCanvas( image.canvas, Sprites.HREV );
											}
											canvas = image.canvasHRev;
										}
										if ( ( bob.imageDisplay & Sprites.VREV ) != 0 )
										{
											if ( !image.canvasVRev )
											{
												image.canvasVRev = this.utilities.flipCanvas( image.canvas, Sprites.VREV );
											}
											canvas = image.canvasVRev;
										}
									}
								}
								var xBob = bob.xDisplay * screen.xScaleDisplay * xRatioDisplay + xDrawScreen;
								var yBob = bob.yDisplay * screen.yScaleDisplay * yRatioDisplay + yDrawScreen;
								var xScale = xScaleScreen * bob.xScaleDisplay * screen.scale;
								var yScale = yScaleScreen * bob.yScaleDisplay * screen.scale;
								if ( !screenRotated && ( bob.angleDisplay == 0 && bob.xSkewDisplay == 0 && bob.ySkewDisplay == 0 ) )
								{									
									var deltaX = image.hotSpotX * screen.xScaleDisplay * xScale;
									var deltaY = image.hotSpotY * screen.yScaleDisplay * yScale;
									this.context.drawImage( canvas, 0, 0, canvas.width, canvas.height, xBob - deltaX, yBob - deltaY, xScale * canvas.width, yScale * canvas.height );
									/*deltaX = image.hotSpotX * bob.xScaleDisplay * screen.xScaleDisplay;
									deltaY = image.hotSpotY * bob.yScaleDisplay * screen.yScaleDisplay;
									this.context.drawImage( canvas, 0, 0, canvas.width, canvas.height, xBob - deltaX, yBob - deltaY, xScale * canvas.width, yScale * canvas.height );
									deltaX = 0;
									deltaY = 0;
									this.context.drawImage( canvas, 0, 0, canvas.width, canvas.height, xBob - deltaX, yBob - deltaY, xScale * canvas.width, yScale * canvas.height );
									*/
									/*
									if ( bob.angleDisplay == 0 && bob.xSkewDisplay == 0 && bob.ySkewDisplay == 0 )
									{
										this.context.drawImage( canvas, 0, 0, canvas.width, canvas.height, xBob - deltaX, yBob - deltaY, xScale * canvas.width, yScale * canvas.height );
									}
									else
									{
										this.context.translate( xBob, yBob );
										if ( bob.angleDisplay != 0)
											this.context.rotate( bob.angleDisplay );
										this.context.translate( -deltaX, -deltaY );						
										this.context.drawImage( canvas, 0, 0, canvas.width, canvas.height, 0, 0, xScale * canvas.width, yScale * canvas.height );
										this.context.resetTransform();
										if ( bob.angleDisplay != 0 )
											this.context.rotate( 0 );
									}
									*/
								}
								else
								{
									var xCenter = ( screen.x - this.amos.hardLeftX ) * xRatioDisplay;
									var yCenter = ( screen.y - this.amos.hardTopY ) * yRatioDisplay;
									var bobDisplay = this.utilities.rotate( xBob, yBob, xCenter, yCenter, screen.angleDisplay );
									this.context.setTransform( xScale, screen.xSkewDisplay + bob.xSkewDisplay, screen.ySkewDisplay + bob.ySkewDisplay, yScale, bobDisplay.x, bobDisplay.y );
									this.context.rotate( screen.angleDisplay + bob.angleDisplay );
									this.context.drawImage( canvas, -image.hotSpotX, -image.hotSpotY );
									this.context.resetTransform();
									this.context.rotate( 0 );
								}
							}
						}
					}

					// Restore canvas
					this.context.restore();
				}
			}
		}

		// Sprites!
		if ( this.sprites.spritesZ.length )
		{
			// Draw sprites
			for ( var s = 0; s < this.sprites.spritesZ.length; s++ )
			{
				var sprite = this.sprites.spritesZ[ s ];
				if ( !sprite.hidden && typeof sprite.xDisplay != 'undefined' && typeof sprite.yDisplay != 'undefined' && typeof sprite.imageDisplay != 'undefined' )
				{
					var image = this.sprites.getImage( sprite.imageDisplay );
					if ( image )
					{
						var canvas = image.canvas;
						if ( typeof sprite.imageDisplay == 'number' && ( sprite.imageDisplay & ( Sprites.HREV | Sprites.VREV ) ) != 0 )
						{
							if ( ( sprite.imageDisplay & ( Sprites.HREV | Sprites.VREV ) ) == ( Sprites.HREV | Sprite.VREV ) )
							{
								if ( !image.canvasRev )
								{
									image.canvasRev = this.utilities.flipCanvas( image.canvas, Sprites.HREV | Sprites.VREV );
								}
								canvas = image.canvasRev;
							}
							else if ( ( sprite.imageDisplay & Sprites.HREV ) != 0 )
							{
								if ( !image.canvasHRev )
								{
									image.canvasHRev = this.utilities.flipCanvas( image.canvas, Sprites.HREV );
								}
								canvas = image.canvasHRev;
							}
							else
							{
								if ( !image.canvasVRev )
								{
									image.canvasVRev = this.utilities.flipCanvas( image.canvas, Sprites.VREV );
								}
								canvas = image.canvasVRev;
							}
						}

						var xDraw = ( sprite.xDisplay - this.amos.hardLeftX ) * ( widthDraw / this.amos.hardWidth ) + xLeftDraw;
						var yDraw = ( sprite.yDisplay - this.amos.hardTopY ) * ( heightDraw / this.amos.hardHeight ) + yTopDraw;
						if ( sprite.angleDisplay == 0 && sprite.xSkewDisplay == 0 && sprite.ySkewDisplay == 0 )
						{
							var deltaX = image.hotSpotX * ( widthDraw / this.amos.hardWidth );
							var deltaY = image.hotSpotY * ( heightDraw / this.amos.hardHeight );
							var width = image.width * ( widthDraw / this.amos.hardWidth );
							var height = image.height * ( heightDraw / this.amos.hardHeight );
							this.context.drawImage( canvas, 0, 0, image.width, image.height, xDraw - deltaX, yDraw - deltaY, width, height );
						}
						else
						{
							this.context.setTransform( sprite.xScaleDisplay * ( this.width / this.amos.hardWidth ), sprite.xSkewDisplay, sprite.ySkewDisplay, sprite.yScaleDisplay * ( this.height / this.amos.hardHeight ), xDraw, yDraw );
							this.context.rotate( sprite.angleDisplay );
							this.context.drawImage( canvas, -image.hotSpotX, -image.hotSpotY );
							this.context.rotate( 0 );
							this.context.setTransform( 1, 0, 0, 1, 0, 0 );
						}
					}
				}
			}
		}

		// All done!
		this.context.restore();
	}

	/*
	// Display full screen?
	debugger;
	if ( this.manifest.display.fullScreen  && this.iconsFullScreen )
	{
		// Take the color of the background
		var suffix = '_white';
		switch ( this.manifest.display.fullScreenIconColor )
		{
			case 'black':
			case 'white':
				suffix = '_' + this.manifest.display.fullScreenIconColor;
				break;
			case 'background':
			case 'automatic':
			default:
				var rgb = this.utilities.getRGBAColors( this.backgroundColor );
				suffix = '_white';
				if ( ( rgb.r * 1.0 + rgb.g * 0.8 + rgb.b * 0.8 ) / 3.0 > 128 )
					suffix = '_black';
				break;			
		}
		var icon;
		if ( this.isFullScreen )
			icon= this.iconsFullScreen[ 'small_screen' + suffix ];
		else
			icon= this.iconsFullScreen[ 'full_screen' + suffix ];

		this.canvas.drawImage( this.canvas.width - icon.width / 2  - 48, this.canvas.height -icon.height / 2 - 48, 32, 32 );
	}
	*/
	// Display FPS?
	if ( this.manifest.display.fps )
	{
		if ( ( this.amos.fpsPosition % 10 ) == 0 || !this.previousFps )
		{
			this.previousFps = 0;
			for ( var f = 0; f < this.amos.fps.length; f++ )
				this.previousFps += this.amos.fps[ f ];
			this.previousFps = 1000 / ( this.previousFps / this.amos.fps.length );
		}

		var text = this.amos.errors.getErrorFromNumber( 202 ).message;
		text = this.amos.utilities.replaceStringInText( text, '%1', '' + Math.floor( this.previousFps ) );
		this.context.fillStyle = this.manifest.display.backgroundColor;
		this.context.fillRect( this.fpsRectX, this.fpsRectY, this.fpsRectWidth, this.fpsRectHeight );
		this.context.fillStyle = this.manifest.display.fpsColor;
		this.context.font = this.manifest.display.fpsFont;
		this.context.textBaseline = 'top';
		this.context.fillText( text, this.manifest.display.fpsX, this.manifest.display.fpsY );
	}

	// Display Full Screen Icons?
	if ( this.manifest.display.fullScreenIcon && this.fullScreenIcons )
	{
		var image;
		if ( this.isFullScreen() )
			image = this.fullScreenIcons[ 'small_screen' ];
		else
			image = this.fullScreenIcons[ 'full_screen' ];
		this.fullScreenIconX = this.manifest.display.fullScreenIconX >= 0 ? this.manifest.display.fullScreenIconX * this.fullScreenIconRatio : this.width + this.manifest.display.fullScreenIconX  * this.fullScreenIconRatio;
		this.fullScreenIconY = this.manifest.display.fullScreenIconY >= 0 ? this.manifest.display.fullScreenIconY * this.fullScreenIconRatio : this.height + this.manifest.display.fullScreenIconY * this.fullScreenIconRatio;
		this.fullScreenIconWidth = image.width * this.fullScreenIconRatio;
		this.fullScreenIconHeight = image.height * this.fullScreenIconRatio;
		this.context.fillStyle = this.manifest.display.backgroundColor;
		this.context.fillRect( this.fullScreenIconX, this.fullScreenIconY, this.fullScreenIconWidth, this.fullScreenIconHeight );
		this.context.drawImage( image, this.fullScreenIconX, this.fullScreenIconY, this.fullScreenIconWidth, this.fullScreenIconHeight );
	}
	
	// The end!
	this.modified = false;
	this.rendering = false;
};

Renderer.prototype.isFullScreen = function()
{
	var full_screen_element = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
	return full_screen_element != null;
};
