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
 * AMOS 2 - Text Windows
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 03/12/2018
 */

function TextWindow( amos, screen, definition )
{
	this.amos = amos;
	this.screen = screen;
	this.utilities = amos.utilities;

	// Font
	this.font = this.amos.textWindowFont;
	this.fontWidth = definition.fontWidth;
	this.fontHeight = definition.fontHeight;
	if ( this.font.type == 'google' )
		this.fontString = this.utilities.getFontString( this.font.name, definition.font.height * this.screen.scale, definition.font.weight, definition.font.italic, definition.font.italic, definition.font.stretch );

	// Width and height
	this.width = typeof definition.width != 'undefined' ? definition.width : Math.floor( screen.width / this.fontWidth );
	this.height = typeof definition.height != 'undefined' ? definition.height : Math.floor( screen.height / this.fontHeight );
	this.x = typeof definition.x != 'undefined' ? definition.x : 0;
	this.y = typeof definition.y != 'undefined' ? definition.y : 0;
	this.border = typeof definition.border != 'undefined' ? definition.border : 0;
	this.lineWidth = this.border == 0 ? this.width : this.width - 2;
	this.lineHeight = this.border == 0 ? this.height : this.height - 2;
	if ( this.width <= 0 )
		throw 'text_window_too_small';
	if ( this.height <= 0 )
		throw 'text_window_too_small';
	this.x = this.x & 0xFFFFFFF0;
	if ( this.x < 0 || this.x + this.width * this.fontWidth > this.screen.width )
		throw 'text_window_too_large';
	if ( this.y < 0 || this.y + this.height * this.fontHeight > this.screen.height )
		throw 'text_window_too_large';
	if ( this.border < 0 || this.border > 15 )
		throw 'illegal_text_window_parameter';
	this.xInside = 0;
	this.yInside = 0;
	if ( this.border )
	{
		this.xInside = 1;
		this.yInside = 1;
	}

	// Other properties
	this.pen = typeof definition.pen != 'undefined' ? ( definition.pen % 32 ): 2;
	this.paper = typeof definition.paper != 'undefined' ? ( definition.paper % 32 ) : 1;
	this.writing = TextWindow.FLAG_NORMAL;
	this.oldPaper = -1;
	this.oldPen = -1;
	this.oldWriting = -1;
	this.xCursor = 0;
	this.yCursor = 0;
	this.focus = true;
	this.scrollOn = true;
	this.tab = 4;
	this.borderPaper = 1;
	this.borderPen = 2;
	this.titleTop = '';
	this.titleBottom = '';
	this.memoryX = 0;
	this.memoryY = 0;
	this.activated = true;

	// Cursor
	this.cursorCanvas = document.createElement( 'canvas' );
	this.cursorCanvas.width = Math.max( Math.floor( this.fontWidth * this.screen.scale ), 1 );
	this.cursorCanvas.height = Math.max( Math.floor( this.fontHeight * this.screen.scale ), 1 );
	this.cursorContext = this.cursorCanvas.getContext( '2d' );
	this.cursorActive = true;
	this.cursorCount = 0; 
	this.cursorFlashCount = -1;
	this.cursorFlash = this.amos.manifest.default.screen.window.cursorColors;
	var self = this;
	this.utilities.loadUnlockedImage( './run/resources/cursor.js', 'image/png', {}, function( response, image, extra )
	{
		if ( response )
		{
			self.cursorImage = image;
			self.cursorImageCanvas = document.createElement( 'canvas' );		
			self.cursorImageCanvas.width = image.width;
			self.cursorImageCanvas.height = image.height;
			self.cursorImageContext = self.cursorImageCanvas.getContext( '2d' );
		}
	} );

	// Cursor animation
	var self = this;
	this.cursorHandle = setInterval( function()
	{
		if ( self.activated && self.cursorImage )
		{
			// Boot: save behind the cursor first
			if ( self.cursorFlashCount < 0 )
				self.cursorOn();

			// Cycle through animation
			self.cursorFlashCount++;
			if ( self.cursorFlashCount >= self.cursorFlash.length )
				self.cursorFlashCount = 0;

			// Remap image of cursor to new color
			self.cursorImageContext.drawImage( self.cursorImage, 0, 0 );
			self.utilities.remapBlock( self.cursorImageContext, [ { r: 255, g: 255, b: 255 } ], [ self.cursorFlash[ self.cursorFlashCount ] ], { x: 0, y: 0, width: self.cursorImageCanvas.width, height: self.cursorImageCanvas.height } );
			self.cursorDraw();
		}
	}, 40 );

	// Text save buffer
	this.lines = [];
	this.linePens = [];
	this.linePapers = [];
	this.lineWritings = [];

	// Clear
	this.clw();

	// Flashing cursor
};

// Writing flags
TextWindow.FLAG_INVERSE = 0x0001;
TextWindow.FLAG_UNDER = 0x0002;
TextWindow.FLAG_SHADE = 0x0004;
TextWindow.FLAG_BOLD = 0x0008;
TextWindow.FLAG_ITALIC = 0x0010;
TextWindow.FLAG_REPLACE = 0x0020;
TextWindow.FLAG_OR = 0x0040;
TextWindow.FLAG_XOR = 0x0080;
TextWindow.FLAG_AND = 0x0100;
TextWindow.FLAG_IGNORE = 0x0200;
TextWindow.FLAG_NORMAL = 0x0400;
TextWindow.FLAG_ONLYPAPER = 0x0800;
TextWindow.FLAG_ONLYPEN = 0x1000;
TextWindow.MASK_WRITING1 = ( TextWindow.FLAG_REPLACE | TextWindow.FLAG_OR | TextWindow.FLAG_XOR | TextWindow.FLAG_XOR | TextWindow.FLAG_AND );
TextWindow.MASK_WRITING2 = ( TextWindow.FLAG_NORMAL | TextWindow.FLAG_ONLYPAPER | TextWindow.FLAG_ONLYPEN );

TextWindow.prototype.cursorOff = function()
{
	this.cursorCount--;
	if ( this.cursorCount == 0 && this.cursorActive && this.activated )
	{
		var x = ( this.x + ( this.xInside + this.xCursor * this.fontWidth ) ) * this.screen.scale;
		var y = ( this.y + ( this.yInside + this.yCursor * this.fontHeight ) ) * this.screen.scale;
		this.screen.context.drawImage( this.cursorCanvas, x, y );
		this.screen.setModified();
	}
};
TextWindow.prototype.cursorOn = function()
{
	this.cursorCount++;
	if ( this.cursorCount == 1 && this.cursorActive && this.activated )
	{
		var x = ( this.x + ( this.xInside + this.xCursor * this.fontWidth ) ) * this.screen.scale;
		var y = ( this.y + ( this.yInside + this.yCursor * this.fontHeight ) ) * this.screen.scale;
		this.cursorContext.drawImage( this.screen.canvas, x, y, this.cursorCanvas.width, this.cursorCanvas.height, 0, 0, this.cursorCanvas.width, this.cursorCanvas.height );
	}
};
TextWindow.prototype.cursorDraw = function()
{
	if ( this.cursorCount == 1 && this.cursorActive && this.activated && this.cursorImageCanvas )
	{
		var x = ( this.x + ( this.xInside + this.xCursor * this.fontWidth ) ) * this.screen.scale;
		var y = ( this.y + ( this.yInside + this.yCursor * this.fontHeight ) ) * this.screen.scale;
		this.screen.context.drawImage( this.cursorCanvas, x, y );
		this.screen.context.drawImage( this.cursorImageCanvas, 0, 0, this.cursorImageCanvas.width, this.cursorImageCanvas.height, x, y, this.fontWidth * this.screen.scale, this.fontHeight * this.screen.scale );
		this.screen.setModified();
	}
};
TextWindow.prototype.setCursPen = function( pen )
{
	this.cursorOff();
	this.cursPen = pen % this.screen.numberOfColors;
	var colors = this.utilities.getRGBAStringColors( this.screen.getColorString( this.cursPen ) );
	this.cursorRed = colors.r;
	this.cursorGreen = colors.g;
	this.cursorBlue = colors.b;
	this.cursorOn();
};
TextWindow.prototype.setCurs = function( b0, b1, b2, b3, b4, b5, b6, b7 )
{
	this.cursorOff();
	b0 = typeof b0 != 'undefined' ? b0 & 0xFF : 0;
	b1 = typeof b1 != 'undefined' ? b1 & 0xFF : 0;
	b2 = typeof b2 != 'undefined' ? b2 & 0xFF : 0;
	b3 = typeof b3 != 'undefined' ? b3 & 0xFF : 0;
	b4 = typeof b4 != 'undefined' ? b4 & 0xFF : 0;
	b5 = typeof b5 != 'undefined' ? b5 & 0xFF : 0;
	b6 = typeof b6 != 'undefined' ? b6 & 0xFF : 0;
	b7 = typeof b7 != 'undefined' ? b7 & 0xFF : 0;
	this.cursorShape = [ b0, b1, b2, b3, b4, b5, b6, b7 ];
	this.cursorOn();
};
TextWindow.prototype.close = function()
{
	clearInterval( this.cursorHandle );
};
TextWindow.prototype.clw = function()
{
	this.cursorOff();

	this.screen.context.fillStyle = this.screen.getColorString( this.paper );
	this.screen.context.fillRect( ( this.x + this.xInside * this.fontWidth ) * this.screen.scale, ( this.y + this.yInside * this.fontHeight ) * this.screen.scale, this.lineWidth * this.fontWidth * this.screen.scale, this.lineHeight * this.fontHeight * this.screen.scale );

	// Reset the save buffers
	var line = '';
	var linePen = '';
	var linePaper = '';
	var lineWriting = '';
	for ( var l = 0; l < this.lineWidth; l++ )
	{
		line += ' ';
		linePen += String.fromCharCode( this.pen + 32 );
		linePaper += String.fromCharCode( this.paper + 32 );
		lineWriting += String.fromCharCode( this.writing );
	}
	for ( var l = 0; l < this.lineHeight; l++ )
	{
		this.lines[ l ] = line;
		this.linePapers[ l ] = linePaper;
		this.linePens[ l] = linePen;
		this.lineWritings[ l ] = lineWriting;
	}

	// Draw the border
	this.drawBorders();

	// Cursor on top left
	this.xCursor = 0;
	this.yCursor = 0;
	this.yCursorAnchor = 0;

	this.cursorOn();
	this.screen.setModified();
};
TextWindow.prototype.windSave = function()
{
	this.cursorOff();

	var x = ( this.x + this.xInside * this.fontWidth ) * this.screen.scale;
	var y = ( this.y + this.yInside * this.fontHeight ) * this.screen.scale;
	var width = this.lineWidth * this.fontWidth * this.screen.scale ;
	var height = this.lineHeight * this.fontHeight * this.screen.scale;
	this.saveWidth = this.lineWidth;
	this.saveHeight = this.lineHeight;

	this.saveCanvas = document.createElement( 'canvas' );
	this.saveCanvas.width = width;
	this.saveCanvas.height = height;
	var context = this.saveCanvas.getContext( '2d' );
	context.drawImage( this.screen.canvas, x, y, width, height, 0, 0, width, height );

	this.cursorOn();
};
TextWindow.prototype.restore = function()
{
	this.cursorOff();
	if ( this.saveCanvas )
	{
		if ( this.saveWidth == this.lineWidth && this.saveHeight == this.lineHeight )
		{
			var x = ( this.x + this.xInside * this.fontWidth ) * this.screen.scale;
			var y = ( this.y + this.yInside * this.fontHeight ) * this.screen.scale;
			var width = this.lineWidth * this.fontWidth * this.screen.scale;
			var height = this.lineHeight * this.fontHeight * this.screen.scale;
			this.screen.context.drawImage( this.saveCanvas, 0, 0, this.saveCanvas.width, this.saveCanvas.height, x, y, width, height );
		}
		else
		{
			this.restoreText();
		}
	}
	else
	{
		this.restoreText();
	}
	this.drawBorders();
	this.cursorOn();
	this.screen.setModified();
};
TextWindow.prototype.windon = function()
{
	return this.number;
};
TextWindow.prototype.windMove = function( x, y )
{
	if ( this.number == 0 )
		throw 'illegal_text_window_parameter';

	x = typeof x != 'undefined' ? x : this.x;
	y = typeof y != 'undefined' ? y : this.y;
	x = x & 0xFFFFFFF0;
	if ( x < 0 || x + this.width * this.fontWidth > this.screen.width )
		throw 'text_window_too_large';
	if ( y < 0 || y + this.height * this.fontHeight > this.screen.height )
		throw 'text_window_too_large';

	if ( this.x != x || this.y != y )
	{
		this.cursorOff();
		this.screen.restoreWindows();
		this.x = x;
		this.y = y;
		this.restore();
		this.cursorOn();
	}
};
TextWindow.prototype.windSize = function( width, height )
{
	width = typeof width != 'undefined' ? width : this.width;
	height = typeof height != 'undefined' ? height : this.height;

	if ( width <= 0 )
		throw 'text_window_too_small';
	if ( height <= 0 )
		throw 'text_window_too_small';
	if ( this.x + width * this.fontWidth > this.screen.width )
		throw 'text_window_too_large';
	if ( this.y + height * this.fontHeight > this.screen.height )
		throw 'text_window_too_large';

	if ( width != this.width || height != this.height )
	{
		this.cursorOff();
		this.screen.restoreWindows();

		this.width = width;
		this.height = height;
		var oldLineWidth = this.lineWidth;
		var oldLineHeight = this.lineHeight;
		this.lineWidth = this.border == 0 ? this.width : this.width - 2;
		this.lineHeight = this.border == 0 ? this.height : this.height - 2;

		var line = '';
		var linePen = '';
		var linePaper = '';
		var lineWriting = '';
		if ( this.lineWidth > oldLineWidth )
		{
			for ( var c = 0; c < this.lineWidth - oldLineWidth; c++ )
			{
				line += ' ';
				linePen += String.fromCharCode( this.pen + 32 );
				linePaper += String.fromCharCode( this.paper + 32 );
				lineWriting += String.fromCharCode( this.writing );
			}
		}
		if ( this.lineWidth > oldLineWidth )
		{
			for ( var l = 0; l < Math.min( oldLineHeight, this.lineHeight ); l++ )
			{
				this.lines[ l ] = this.lines[ l ] + line;
				this.linePapers[ l ] = this.linePapers[ l ] + linePaper;
				this.linePens[ l ] = this.linePens[ l ] + linePen;
				this.lineWritings[ l ] = this.lineWritings[ l ] + lineWriting;
			}
		}
		else if ( this.lineWidth < oldLineWidth )
		{
			for ( var l = 0; l < Math.min( oldLineHeight, this.lineHeight ); l++ )
			{
				this.lines[ l ] = this.lines[ l ].substring( 0, this.lineWidth );
				this.linePapers[ l ] = this.linePapers[ l ].substring( 0, this.lineWidth );
				this.linePens[ l ] = this.linePens[ l ].substring( 0, this.lineWidth );
				this.lineWritings[ l ] = this.lineWritings[ l ].substring( 0, this.lineWidth );
			}
		}
		if ( this.lineHeight > oldLineHeight )
		{
			line = '';
			linePen = '';
			linePaper = '';
			lineWriting = '';
			for ( var c = 0; c < this.lineWidth; c++ )
			{
				line += ' ';
				linePen += String.fromCharCode( this.pen + 32 );
				linePaper += String.fromCharCode( this.paper + 32 );
				lineWriting += String.fromCharCode( this.writing );
			}
			for ( var l = oldLineHeight; l < this.lineHeight; l++ )
			{
				this.lines[ l ] = line;
				this.linePapers[ l ] = linePaper;
				this.linePens[ l ] = linePen;
				this.lineWritings[ l ] = lineWriting;
			}
		}
		else if ( this.lineHeight < oldLineHeight )
		{
			this.lines.length = this.lineHeight;
			this.linePapers.length = this.lineHeight;
			this.linePens.length = this.lineHeight;
			this.lineWritings.length = this.lineHeight;
		}

		if ( this.xCursor > this.lineWidth )
			this.xCursor = this.lineWidth - 1;
		if ( this.yCursor > this.lineHeight )
			this.yCursor = this.lineHeight -1;

		this.restore();
		this.cursorOn();
		this.screen.setModified();
	}
};
TextWindow.prototype.setTitleTop = function( title )
{
	this.titleTop = title;
	this.drawBorders();
};
TextWindow.prototype.setTitleBottom = function( title )
{
	this.titleBottom = title;
	this.drawBorders();
};
TextWindow.prototype.setBorder = function( border, paper, pen )
{
	if ( border < 0 || border > 15 )
		throw 'illegal_text_window_parameter';
	this.border = border;
	if ( typeof paper != 'undefined' )
	{
		if ( !this.amos.usePalette )
			this.borderPaper = paper;
		else
		{
			if ( paper < 0 )
				throw 'illegal_text_window_parameter';
			this.borderPaper = paper % this.screen.numberOfColors;
		}
	}
	if ( typeof pen != 'undefined' )
	{
		if ( !this.amos.usePalette )
			this.borderPen = pen;
		else
		{
			if ( pen < 0 )
				throw 'illegal_text_window_parameter';
			this.borderPen = pen % this.screen.numberOfColors;
		}
	}
	this.drawBorders();
};
TextWindow.prototype.activate = function( noRestore )
{
	this.activated = true;
	if ( !noRestore )
		this.restore();
	this.cursorOn();
};
TextWindow.prototype.deactivate = function()
{
	this.cursorOff();
	this.activated = false;
};
TextWindow.prototype.home = function()
{
	this.cursorOff();
	this.xCursor = 0;
	this.yCursor = 0;
	this.cursorOn();
};
TextWindow.prototype.xText = function( x )
{
	return Math.floor( ( x - this.xInside * this.fontWidth ) / this.fontWidth );
}
TextWindow.prototype.yText = function( y )
{
	return Math.floor( ( y - this.yInside * this.fontHeight ) / this.fontHeight );
}
TextWindow.prototype.setPen = function( pen )
{
	if ( !this.amos.usePalette )
		this.pen = pen;
	else
	{
		if ( pen < 0 )
			throw 'illegal_text_window_parameter';
		this.pen = pen % this.screen.numberOfColors;
	}
};
TextWindow.prototype.setPaper = function( paper )
{
	if ( !this.amos.usePalette )
		this.paper = paper;
	else
	{
		if ( paper < 0 )
			throw 'illegal_text_window_parameter';
		this.paper = paper % this.screen.numberOfColors;
	}
};
TextWindow.prototype.setWriting = function( mode1, mode2 )
{
	mode1 = typeof mode1 == 'undefined' ? 0 : mode1;
	mode2 = typeof mode2 == 'undefined' ? 0 : mode2;
	if ( mode1 < 0 || mode1 > 4 )
		throw 'illegal_text_window_parameter';
	if ( mode2 < 0 || mode > 2 )
		throw 'illegal_text_window_parameter';

	var modes1 = [ TextWindow.FLAG_REPLACE, TextWindow.FLAG_OR, TextWindow.FLAG_XOR, TextWindow.FLAG_AND, TextWindow.FLAG_IGNORE ];
	var modes2 = [ TextWindow.FLAG_NORMAL, TextWindow.FLAG_ONLYPAPER, TextWindow.FLAG_ONLYPEN ];
	this.writing = ( this.writing & ~( TextWindow.MASK_WRITING1 | TextWindow.MASK_WRITING2 ) ) | modes1[ mode1 ] | modes2[ mode2 ];
};
TextWindow.prototype.setText = function( mode )
{
	this.writing = ( this.writing & ~TextWindow.FLAG_UNDER ) | ( ( mode & 0x0001 ) != 0 ? TextWindow.FLAG_UNDER : 0 );
	this.writing = ( this.writing & ~TextWindow.FLAG_BOLD ) | ( ( mode & 0x0002 ) != 0 ? TextWindow.FLAG_BOLD : 0 );
	this.writing = ( this.writing & ~TextWindow.FLAG_ITALIC ) | ( ( mode & 0x0004 ) != 0 ? TextWindow.FLAG_ITALIC : 0 );
};
TextWindow.prototype.getTextStyles = function( mode )
{
	var result = ( this.writing & TextWindow.FLAG_UNDER ) != 0 ? 0x0001 : 0;
	result |= ( this.writing & TextWindow.FLAG_BOLD ) != 0 ? 0x0002 : 0;
	result |= ( this.writing & TextWindow.FLAG_ITALIC ) != 0 ? 0x0004 : 0;
	return result;
};
TextWindow.prototype.setInverse = function( onOff )
{
	this.writing = ( this.writing & ~TextWindow.FLAG_INVERSE ) | ( onOff ? TextWindow.FLAG_INVERSE : 0 );
};
TextWindow.prototype.setUnder = function( onOff )
{
	this.writing = ( this.writing & ~TextWindow.FLAG_UNDER ) | ( onOff ? TextWindow.FLAG_UNDER : 0 );
};
TextWindow.prototype.setShade = function( onOff )
{
	this.writing = ( this.writing & ~TextWindow.FLAG_SHADE ) | ( onOff ? TextWindow.FLAG_SHADE : 0 );
};
TextWindow.prototype.setScroll = function( onOff )
{
	this.scrollOn = onOff;
};
TextWindow.prototype.setCursor = function( onOff )
{
	this.cursorOff();
	this.cursorActive = onOff;
	this.cursorOn();
};
TextWindow.prototype.cursorUp = function( onOff )
{
	this.cMove( 0, -1 );
};
TextWindow.prototype.cursorDown = function( onOff )
{
	this.cMove( 0, 1 );
};
TextWindow.prototype.cursorLeft = function( onOff )
{
	this.cMove( -1, 0 );
};
TextWindow.prototype.cursorRight = function( onOff )
{
	this.cMove( 1, 0 );
};
TextWindow.prototype.cursorMove = function( dx, dy )
{
	this.cMove( dx, dy );
};
TextWindow.prototype.cursPen = function( pen )
{
	if ( pen < 0 || pen >= this.screen.numberOfColor )
		throw 'illegal_text_window_parameter';
	var values = this.utilities.getRGBAStringColors( this.getColorString( pen ) );
	this.cursorRed = values.r;
	this.cursorGreen = values.g;
	this.cursorBlue = values.b;
};
TextWindow.prototype.xGraphic = function( x )
{
	if ( x < 0 || x >= this.lineWidth )
		throw 'illegal_text_window_parameter';
	return ( this.xInside + x ) * this.fontWidth;
};
TextWindow.prototype.yGraphic = function( y )
{
	if ( y < 0 || y >= this.lineHeight )
		throw 'illegal_text_window_parameter';
	return ( this.yInside + y ) * this.fontHeight;
};
TextWindow.prototype.cLine = function( width )
{
	var x;
	if ( typeof width != 'undefined' )
	{
		x = this.xCursor;
		if ( width + this.xCursor > this.lineWidth )
			width = this.lineWidth - this.xCursor;
	}
	else
	{
		x = 0;
		width = this.lineWidth;
	}

	if ( width > 0 )
	{
		this.cursorOff();
		var space = '';
		for ( var c = 0; c < width; c++ )
			space += ' ';
		var xSave = this.xCursor;
		this.xCursor = x;
		this.printLine( space, this.paper, this.pen, this.writing, false, false );
		this.xCursor = xSave;
		this.cursorOn();
	}
};
TextWindow.prototype.setTab = function( value )
{
	if ( value < 0 )
		throw 'illegal_text_window_parameter';
	else
		this.tab = value;
};
TextWindow.prototype.locate = function( x, y )
{
	this.cursorOff();
	if ( typeof x != 'undefined' )
	{
		if ( x < 0 || x >= this.lineWidth )
		 	throw 'illegal_text_window_parameter';
		this.xCursor = x;
	}
	if ( typeof y != 'undefined' )
	{
		if ( y < 0 || y >= this.lineHeight )
			throw 'illegal_text_window_parameter';
		this.yCursor = y;
	}
	this.cursorOn();
};
TextWindow.prototype.anchorYCursor = function( y )
{
	this.yCursorAnchor = typeof y != 'undefined' ? y : this.yCursor;
};
TextWindow.prototype.cMove = function( dx, dy )
{
	this.cursorOff();
	if ( typeof dx != 'undefined' )
	{
		while( dx > 0 )
		{
			dx--;
			this.xCursor += 1;
			if ( this.xCursor >= this.lineWidth )
			{
				this.xCursor = 0;
				this.yCursor++;
				if ( this.yCursor >= this.lineHeight - 1 )
					this.scroll( 0, -1, true );
			}
		}
		while( dx < 0 )
		{
			dx++;
			this.xCursor--;
			if ( this.xCursor < 0 )
			{
				this.xCursor = this.lineWidth - 1;
				this.yCursor--;
				if ( this.yCursor < 0 )
					this.scroll( 0, 1, true );
			}
		}
	}
	if ( typeof dy != 'undefined' )
	{
		while( dy > 0 )
		{
			this.yCursor++;
			if ( this.yCursor >= this.lineHeight )
				this.scroll( 0, -1, true );
			dy--;
		}
		while( dy < 0 )
		{
			this.yCursor--;
			if ( this.yCursor < 0 )
				this.scroll( 0, 1, true );
			dy++;
		}
	}
	this.cursorOn();
};
TextWindow.prototype.scroll = function( dx, dy, moveCursor, xScroll, yScroll, sxScroll, syScroll )
{
	this.cursorOff();

	xScroll = typeof xScroll == 'undefined' ? 0 : xScroll;
	yScroll = typeof yScroll == 'undefined' ? 0 : yScroll;
	sxScroll = typeof sxScroll == 'undefined' ? this.lineWidth : sxScroll;
	syScroll = typeof syScroll == 'undefined' ? this.lineHeight : syScroll;

	var width = ( sxScroll * this.fontWidth ) * this.screen.scale;
	var height = ( syScroll * this.fontHeight ) * this.screen.scale;

	// Clip and paste with scrolling
	this.screen.context.save();
	var xClip = ( this.x + this.xInside * this.fontWidth ) * this.screen.scale;
	var yClip = ( this.y + this.yInside * this.fontHeight ) * this.screen.scale;
	var widthClip = this.lineWidth * this.fontWidth * this.screen.scale;
	var heightClip = this.lineHeight * this.fontHeight * this.screen.scale;
	this.screen.context.beginPath();
	this.screen.context.moveTo( xClip, yClip );
	this.screen.context.lineTo( xClip + widthClip, yClip );
	this.screen.context.lineTo( xClip + widthClip, yClip + heightClip );
	this.screen.context.lineTo( xClip, yClip + heightClip );
	this.screen.context.lineTo( xClip, yClip );
	this.screen.context.clip();
	var sourceX = ( this.x + ( this.xInside + xScroll + ( dx < 0 ? -dx : 0 ) ) * this.fontWidth ) * this.screen.scale;
	var sourceY = ( this.y + ( this.yInside + yScroll + ( dy < 0 ? -dy : 0 ) ) * this.fontHeight ) * this.screen.scale;
	var destX = ( this.x + ( this.xInside + xScroll + ( dx > 0 ? dx : 0 ) ) * this.fontWidth ) * this.screen.scale;
	var destY = ( this.y + ( this.yInside + yScroll + ( dy > 0 ? dy : 0 ) ) * this.fontHeight ) * this.screen.scale;
	this.screen.context.drawImage( this.screen.canvas, sourceX, sourceY, width, height, destX, destY, width, height );

	// Fill the new areas
	var x = ( this.x + ( this.xInside + xScroll ) * this.fontWidth ) * this.screen.scale;
	var y = ( this.y + ( this.yInside + yScroll ) * this.fontHeight ) * this.screen.scale;
	this.screen.context.fillStyle = this.screen.getColorString( this.paper );
	if ( dx < 0 )
	{
		var fWidth = -dx * this.fontWidth * this.screen.scale;
		this.screen.context.fillRect( x + width - fWidth, y, fWidth, height );
	}
	if ( dx > 0 )
	{
		var fWidth = dx * this.fontWidth * this.screen.scale;
		this.screen.context.fillRect( x, y, fWidth, height );
	}
	if ( dy < 0 )
	{
		var fHeight = -dy * this.fontHeight * this.screen.scale;
		this.screen.context.fillRect( x, y + height - fHeight, width, fHeight );
	}
	if ( dy > 0 )
	{
		var fHeight = dy * this.fontHeight * this.screen.scale;
		this.screen.context.fillRect( x, y, width, fHeight );
	}
	this.screen.context.restore();
	this.screen.setModified();

	// Scroll the save buffers
	var addLine = '';
	var addLinePapers = '';
	var addLinePens = '';
	var addLineWritings = '';
	if ( dx )
	{
		for ( var l = 0; l < Math.abs( dx ); l++ )
		{
			addLine += ' ';
			addLinePapers += String.fromCharCode( this.paper + 32 );
			addLinePens += String.fromCharCode( this.pen + 32 );
			addLineWritings += String.fromCharCode( this.writing );
		}
	}
	if ( dx < 0 )
	{
		for ( var l = yScroll; l < yScroll + syScroll; l++ )
		{
			this.lines[ l ] = this.lines[ l ].substring( 0, xScroll ) + this.lines[ l ].substr( xScroll - dx, sxScroll + dx ) + addLine + this.lines[ l ].substring( xScroll + sxScroll );
			this.linePapers[ l ] = this.linePapers[ l ].substring( 0, xScroll ) + this.linePapers[ l ].substr( xScroll - dx, sxScroll + dx ) + addLinePapers + this.linePapers[ l ].substring( xScroll + sxScroll );
			this.linePens[ l ] = this.linePens[ l ].substring( 0, xScroll ) + this.linePens[ l ].substr( xScroll - dx, sxScroll + dx) + addLinePens + this.linePens[ l ].substring( xScroll + sxScroll );
			this.lineWritings[ l ] = this.lineWritings[ l ].substring( 0, xScroll ) + this.lineWritings[ l ].substr( xScroll - dx, sxScroll + dx ) + addLineWritings + this.lineWritings[ l ].substring( xScroll + sxScroll );
		}
	}
	if ( dx > 0 )
	{
		for ( var l = yScroll; l < yScroll + syScroll; l++ )
		{
			this.lines[ l ] = this.lines[ l ].substring( 0, xScroll ) + addLine + this.lines[ l ].substr( xScroll, sxScroll - dx ) + this.lines[ l ].substring( xScroll + sxScroll );
			this.linePapers[ l ] = this.linePapers[ l ].substring( 0, xScroll ) + addLinePapers + this.linePapers[ l ].substr( xScroll, sxScroll - dx ) + this.linePapers[ l ].substring( xScroll + sxScroll );
			this.linePens[ l ] = this.linePens[ l ].substring( 0, xScroll ) + addLinePens + this.linePens[ l ].substr( xScroll, sxScroll - dx ) + this.linePens[ l ].substring( xScroll + sxScroll );
			this.lineWritings[ l ] = this.lineWritings[ l ].substring( 0, xScroll ) + addLineWritings + this.lineWritings[ l ].substr( xScroll, sxScroll - dx ) + this.lineWritings[ l ].substring( xScroll + sxScroll );
		}
	}
	if ( dy )
	{
		addLine = '';
		addLinePapers = '';
		addLinePens = '';
		addLineWritings = '';
		for ( var l = 0; l < sxScroll; l++ )
		{
			addLine += ' ';
			addLinePapers += String.fromCharCode( this.paper + 32 );
			addLinePens += String.fromCharCode( this.pen + 32 );
			addLineWritings += String.fromCharCode( this.writing );
		}
	}
	if ( dy < 0 )
	{
		for ( var l = yScroll; l < yScroll + syScroll + dy; l++ )
		{
			this.lines[ l ] = this.lines[ l ].substring( 0, xScroll ) + this.lines[ l - dy ].substr( xScroll, sxScroll ) + this.lines[ l ].substring( xScroll + sxScroll );
			this.linePapers[ l ] = this.linePapers[ l ].substring( 0, xScroll ) + this.linePapers[ l - dy ].substr( xScroll, sxScroll ) + this.linePapers[ l ].substring( xScroll + sxScroll );
			this.linePens[ l ] = this.linePens[ l ].substring( 0, xScroll ) + this.linePens[ l - dy ].substr( xScroll, sxScroll ) + this.linePens[ l ].substring( xScroll + sxScroll );
			this.lineWritings[ l ] = this.lineWritings[ l ].substring( 0, xScroll ) + this.lineWritings[ l - dy ].substr( xScroll, sxScroll ) + this.lineWritings[ l ].substring( xScroll + sxScroll );
		}
		for ( l = yScroll + syScroll + dy; l < yScroll + syScroll; l++ )
		{
			this.lines[ l ] = this.lines[ l ].substr( 0, xScroll ) + addLine + this.lines[ l ].substring( xScroll + sxScroll );
			this.linePapers[ l ] = this.linePapers[ l ].substr( 0, xScroll ) + addLinePapers + this.linePapers[ l ].substring( xScroll + sxScroll );
			this.linePens[ l ] = this.linePens[ l ].substr( 0, xScroll ) + addLinePens + this.linePens[ l ].substring( xScroll + sxScroll );
			this.lineWritings[ l ] = this.lineWritings[ l ].substr( 0, xScroll ) + addLineWritings + this.lineWritings[ l ].substring( xScroll + sxScroll );
		}
	}
	if ( dy > 0 )
	{
		for ( var l = yScroll + syScroll - 1; l >= yScroll + dy; l-- )
		{
			this.lines[ l ] = this.lines[ l ].substring( 0, xScroll ) + this.lines[ l - dy ].substr( xScroll, sxScroll ) + this.lines[ l ].substring( xScroll + sxScroll );
			this.linePapers[ l ] = this.linePapers[ l ].substring( 0, xScroll ) + this.linePapers[ l - dy ].substr( xScroll, sxScroll ) + this.linePapers[ l ].substring( xScroll + sxScroll );
			this.linePens[ l ] = this.linePens[ l ].substring( 0, xScroll ) + this.linePens[ l - dy ].substr( xScroll, sxScroll ) + this.linePens[ l ].substring( xScroll + sxScroll );
			this.lineWritings[ l ] = this.lineWritings[ l ].substring( 0, xScroll ) + this.lineWritings[ l - dy ].substr( xScroll, sxScroll ) + this.lineWritings[ l ].substring( xScroll + sxScroll );
		}
		for ( l = yScroll; l < yScroll + dy; l++ )
		{
			this.lines[ l ] = this.lines[ l ].substr( 0, xScroll ) + addLine + this.lines[ l ].substring( xScroll + sxScroll );
			this.linePapers[ l ] = this.linePapers[ l ].substr( 0, xScroll ) + addLinePapers + this.linePapers[ l ].substring( xScroll + sxScroll );
			this.linePens[ l ] = this.linePens[ l ].substr( 0, xScroll ) + addLinePens + this.linePens[ l ].substring( xScroll + sxScroll );
			this.lineWritings[ l ] = this.lineWritings[ l ].substr( 0, xScroll ) + addLineWritings + this.lineWritings[ l ].substring( xScroll + sxScroll );
		}
	}
	this.yCursorAnchor += dy;

	// Move the cursor
	if ( moveCursor )
	{
		this.xCursor += dx;
		if ( this.xCursor < 0 )
			this.xCursor = 0;
		if ( this.xCursor >= this.lineWidth )
			this.xCursor = this.lineWidth - 1;
		this.yCursor += dy;
		if ( this.yCursor < 0 )
			this.yCursor = 0;
		if ( this.yCursor >= this.lineHeight )
			this.yCursor = this.lineHeight - 1;
	}

	this.cursorOn();
};
TextWindow.prototype.hScroll = function( param )
{
	switch ( param )
	{
		case 1:
			this.scroll( -1, 0, false, 0, this.yCursor, this.lineWidth, 1 );
			break;
		case 2:
			this.scroll( -1 , 0, false );
			break;
		case 3:
			this.scroll( 1, 0, false, 0, this.yCursor, this.lineWidth, 1 );
			break;
		case 4:
			this.scroll( 1, 0, false );
			break;
		default:
			throw 'illegal_text_window_parameter';
	}
};
TextWindow.prototype.vScroll = function( param )
{
	switch ( param )
	{
		case 1:
			this.scroll( 0, 1, false, 0, this.yCursor, this.lineWidth, this.lineHeight - this.yCursor - 1 );
			break;
		case 2:
			this.scroll( 0, 1, false, 0, 0, this.lineWidth, this.yCursor );
			break;
		case 3:
			this.scroll( 0, -1, false, 0, 0, this.lineWidth, this.yCursor + 1 );
			break;
		case 4:
			this.scroll( 0, -1, false, 0, this.yCursor, this.lineWidth, this.lineHeight - this.yCursor - 1 );
			break;
		default:
			throw 'illegal_text_window_parameter';
	}
};
TextWindow.prototype.centre = function( text )
{
	if ( text.length > this.lineWidth )
		text = text.substring( this.lineWidth );
	this.cursorOff();
	this.xCursor = Math.floor( this.lineWidth / 2 ) - Math.floor( text.length / 2 );
	this.print( text, false, true );
	this.xCursor += text.length;
	this.cursorOn();
};
TextWindow.prototype.paper$ = function( value )
{
	if ( !this.amos.usePalette )
		return '$(COMPaper' + value + 'COM)$';
	else
	{
		if ( value < 0 )
			throw 'illegal_text_window_parameter';
		return '$(COMPaper' + value % this.screen.numberOfColors + 'COM)$';
	}
};
TextWindow.prototype.pen$ = function( value )
{
	if ( !this.amos.usePalette )
		return '$(COMPen' + value + 'COM)$';
	else
	{
		if ( value < 0 )
			throw 'illegal_text_window_parameter';
		return '$(COMPen' + value % this.screen.numberOfColors + 'COM)$';
	}
};
TextWindow.prototype.zone$ = function( text, zone )
{
	return '$(COMZ1' + zone + 'COM)$' + text + '$(COMZ2COM)$';
};
TextWindow.prototype.border$ = function( text, border )
{
	return '$(COMB1' + border + 'COM)$' + text + '$(COMB2COM)$';
};

TextWindow.prototype.at$ = function( x, y )
{
	var result = '';
	if ( typeof x != 'undefined' )
	{
		if ( x < 0 || x >= this.lineWidth )
			throw 'illegal_text_window_parameter';
		result += '$(COMX' + x + 'COM)$';
	}
	if ( typeof y != 'undefined' )
	{
		if ( y < 0 || x >= this.lineHeight )
			throw 'illegal_text_window_parameter';
		result += '$(COMY' + y + 'COM)$';
	}
	return result;
};
TextWindow.prototype.move$ = function( dx, dy )
{
	var result = '';
	if ( typeof dx != 'undefined' && dx != 0 )
	{
		result += '$(COMDX' + dx + 'COM)$';
	}
	if ( typeof dy != 'undefined' && dy != 0 )
	{
		result += '$(COMDY' + dy + 'COM)$';
	}
	return result;
};
TextWindow.prototype.printUsing = function( format, variables, newLine )
{
	var result = '';
	var variableNumber = 0;
	var formats = [];
	for ( var f = 0; f < variables.length; f++ )
		formats[ f ] = {};

	for ( var p = 0; p < format.length; p++ )
	{
		var variable = variables[ variableNumber ];
		var c = format.charAt( p );
		switch ( c )
		{
			case '~':
				if ( formats[ variableNumber ].type == 'number' )
					variableNumber++;
				if ( variableNumber < variables.length )
				{
					if ( !formats[ variableNumber ].type )
					{
						formats[ variableNumber ].variable = variables[ variableNumber ];
						formats[ variableNumber ].type = 'string';
						formats[ variableNumber ].position = p;
						formats[ variableNumber ].length = 1;
					}
					else
					{
						formats[ variableNumber ].length++;
					}
				}
				result += ' ';
				break;
			case '+':
			case '-':
			case '.':
			case ';':
			case '#':
			case '^':
				if ( formats[ variableNumber ].type == 'string' )
					variableNumber++;
				if ( variableNumber < variables.length )
				{
					if ( !formats[ variableNumber ].type )
					{
						formats[ variableNumber ].variable = variables[ variableNumber ];
						formats[ variableNumber ].type = 'number';
						formats[ variableNumber ].integers = [];
						formats[ variableNumber ].decimals = [];
						formats[ variableNumber ].exponentials = [];
						formats[ variableNumber ].integerCount = 0;
						formats[ variableNumber ].decimalCount = 0;
						formats[ variableNumber ].exponentialCount = 0;
						formats[ variableNumber ].dot = '';
					}
					switch ( c )
					{
						case '+':
							formats[ variableNumber ].sign = 'plus';
							formats[ variableNumber ].signPosition = p;
							break;
						case '-':
							formats[ variableNumber ].sign = 'minus';
							formats[ variableNumber ].signPosition = p;
							break;
						case '.':
							formats[ variableNumber ].dotPosition = p;
							formats[ variableNumber ].dot = 'dot';
							break;
						case ';':
							formats[ variableNumber ].dotPosition = p;
							formats[ variableNumber ].dot = 'semiColumn';
							break;
						case '^':
							formats[ variableNumber ].exponentials[ formats[ variableNumber ].exponentialCount++ ] = p;
							break;
						case '#':
							if ( formats[ variableNumber ].dot == '' )
								formats[ variableNumber ].integers[ formats[ variableNumber ].integerCount++ ] = p;
							else
								formats[ variableNumber ].decimals[ formats[ variableNumber ].decimalCount++ ] = p;
							break;
					}
				}
				result += ' ';
				break;
			default:
				result += c;
				break;
		}
	}

	var lastFormat = 0;
	for ( var v = 0; v < formats.length; v++ )
	{
		if ( formats[ v ].type == 'string' )
		{
			lastFormat = v;
			var variable = formats[ v ].variable;
			if ( typeof variable != 'string' )
				variable = this.amos.str$( variable );
			result = this.utilities.pokeString( result, variable, formats[ v ].position, formats[ v ].length );
		}
		else if ( formats[ v ].type == 'number' )
		{
			if ( typeof variable == 'string' )
				throw 'type_mismatch';
			lastFormat = v;
			var exponential;
			if ( formats[ v ].exponentialCount == 0 )
				variable = formats[ v ].variable.toFixed( formats[ v ].decimalCount );
			else
			{
				variable = formats[ v ].variable.toExponential( formats[ v ].decimalCount );
				exponential = variable.substring( variable.indexOf( 'e' ) );
				variable = variable.substring( 0, variable.indexOf( 'e' ) );
			}

			var start = variable >= 0 ? 0 : 1;
			if ( formats[ v ].sign == 'plus' )
			{
				if ( formats[ v ].variable >= 0 )
					result = this.utilities.pokeString( result, '+', formats[ v ].signPosition, 1 );
				else
					result = this.utilities.pokeString( result, '-', formats[ v ].signPosition, 1 );
			}
			else if ( formats[ v ].sign == 'minus' )
			{
				if ( formats[ v ].variable < 0 )
					result = this.utilities.pokeString( result, '-', formats[ v ].signPosition, 1 );
			}
			if ( formats[ v ].integerCount > 0 )
			{
				var pos = variable.indexOf( '.' );
				if ( pos < 0 )
					pos = variable.length;
				for ( d = formats[ v ].integerCount - 1, pos--; d >= 0; d--, pos-- )
				{
					if ( pos >= start )
						result = this.utilities.pokeString( result, variable.substr( pos, 1 ), formats[ v ].integers[ d ], 1 );
				}
			}
			if ( formats[ v ].dot == 'dot' )
			{
				result = this.utilities.pokeString( result, '.', formats[ v ].dotPosition, 1 );
			}
			if ( formats[ v ].decimalCount > 0 )
			{
				var pos = variable.indexOf( '.' );
				if ( pos < 0 )
					pos = variable.length;
				for ( d = 0, pos++; d < formats[ v ].decimalCount; d++, pos++ )
				{
					if ( pos < variable.length )
						result = this.utilities.pokeString( result, variable.substr( pos, 1 ), formats[ v ].decimals[ d ], 1 );
				}
			}
			if ( formats[ v ].exponentialCount > 0 )
			{
				for ( d = 0; d < formats[ v ].exponentialCount; d++ )
				{
					if ( d < exponential.length )
						result = this.utilities.pokeString( result, exponential.substr( d, 1 ), formats[ v ].exponentials[ d ], 1 );
				}
			}
		}
	}
	for ( v = lastFormat + 1; v < variables.length; v++ )
	{
		result += variables[ v ];
	}
	this.print( result, newLine );
};
TextWindow.prototype.print = function( text, newLine, centre )
{
	centre = typeof centre == 'undefined' ? false : centre;
	var commands = [ '$(COMPen', '$(COMPaper', '$(COMX', '$(COMY', '$(COMDX', '$(COMDY', '$(COMZ1', '$(COMZ2', '$(COMB1', '$(COMB2' ];
	var position = 0;
	var line = '';
	var zoneNumber = -1;
	var borderNumber = -1;
	var zoneX1, zoneY1;
	this.cursorOff();

	while( position < text.length )
	{
		var c = text.charAt( position++ );
		if ( c == '\t' )
		{
			if ( line != '' )
			{
				this.printLine( line, this.paper, this.pen, this.writing, true & !centre );
				line = '';
			}
			var newX = Math.floor( ( this.xCursor + this.tab ) / this.tab ) * this.tab;
			for ( var x = this.xCursor; x < newX; x++ )
				line += ' ';
			continue;
		}
		if ( c == '$' )
		{
			if ( text.indexOf( '$(COM', position - 1 ) == position - 1 )
			{
				for ( var commandNumber = 0; commandNumber < commands.length; commandNumber++ )
				{
					var command = commands[ commandNumber ];
					if ( text.substr( position - 1, command.length ) == command )
					{
						c = '';
						var end = text.indexOf( 'COM)$', position + command.length - 1 );
						if ( end >= 0 )
						{
							var parameter;
							if ( end > position + command.length - 1 )
								parameter = parseInt( text.substring( position + command.length - 1, end ) );
							position = end + 'COM)$'.length;
							switch( command )
							{
								case '$(COMPaper':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									this.setPaper( parameter );
									break;
								case '$(COMPen':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									this.setPen( parameter );
									break;
								case '$(COMX':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									this.locate( parameter );
									break;
								case '$(COMY':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									this.locate( undefined, parameter );
									break;
								case '$(COMDX':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									this.cMove( parameter );
									break;
								case '$(COMDY':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									this.cMove( undefined, parameter );
									break;
								case '$(COMZ1':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									zoneNumber = parameter;
									zoneX1 = this.xCursor;
									zoneY1 = this.yCursor;
									break;
								case '$(COMZ2':
									if ( zoneNumber >= 0 )
									{
										if ( line != '' )
										{
											this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
											line = '';
										}
										this.screen.setZone( zoneNumber, zoneX1 * this.fontWidth + this.xInside, zoneY1 * this.fontHeight + this.yInside, this.xCursor * this.fontWidth + this.xInside, ( this.yCursor + 1 ) * this.fontHeight + this.yInside );
										zoneNumber = -1;
									}
									break;
								case '$(COMB1':
									if ( line != '' )
									{
										this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
										line = '';
									}
									borderNumber = parameter;
									borderX1 = this.xCursor;
									borderY1 = this.yCursor;
									break;
								case '$(COMB2':
									if ( borderNumber >= 0 )
									{
										if ( line != '' )
										{
											this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
											line = '';
										}
										this.drawBorders( borderNumber, borderX1, borderY1, this.xCursor - borderX1, this.yCursor - borderY1 + 1, this.paper, this.pen, false );
										borderNumber = -1;
									}
									break;
							}
						}
						break;
					}
				}
				continue;
			}
		}
		line += c;
		if ( this.xCursor + line.length >= this.lineWidth )
		{
			this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
			line = '';
		}
	}
	if ( line != '' )
		this.printLine( line, this.paper, this.pen, this.writing, true & !centre  );
	if ( newLine )
	{
		this.xCursor = 0;
		this.yCursor++;
		if ( this.yCursor >= this.lineHeight )
		{
			if ( this.scrollOn )
				this.scroll( 0, -1, true );
			else
				this.yCursor = 0;
		}
	}
	this.cursorOn();
	this.amos.allowRefresh();
}; 
TextWindow.prototype.drawBorders = function( border, x, y, width, height, pen, paper, drawTitle )
{
	border = typeof border != 'undefined' ? border : this.border;
	if ( border == 0 )
		return;

	var xStart = ( x = typeof x != 'undefined' ? x : 0 );
	var yStart = ( typeof y != 'undefined' ? y : 0 );
	width = typeof width != 'undefined' ? width : this.lineWidth;
	height = typeof height != 'undefined' ? height : this.lineHeight;
	pen = typeof pen != 'undefined' ? pen : this.borderPen;
	paper = typeof paper != 'undefined' ? paper : this.borderPaper;
	drawTitle = typeof drawTitle != 'undefined' ? drawTitle : true;

	this.cursorOff();
	var positions =
	[
		// Top left
		{
			x: - 1,
			y: - 1	,
			width: 1,
			height: 1
		},
		// Top center
		{
			x: 0,
			y: - 1,
			width: width,
			height: 1
		},
		// Top right
		{
			x: width,
			y: -1,
			width: 1,
			height: 1
		},
		// Center left
		{
			x: -1,
			y: 0,
			width: 1,
			height: height
		},
		// Center right
		{
			x: width,
			y: 0,
			width: 1,
			height: height
		},
		// Bottom left
		{
			x: -1,
			y: height,
			width: 1,
			height: 1
		},
		// Bottom center
		{
			x: 0,
			y: height,
			width: width,
			height: 1
		},
		// Bottom right
		{
			x: width,
			y: height,
			width: 1,
			height: 1
		}
	]
	for ( var position = 0; position < 8; position++ )
	{
		var data = positions[ position ];
		var imageData = this.createBorderCharacter( border, position, paper, pen, this.writing );
		for ( var y = 0; y < data.height; y++ )
		{
			var yText = yStart + data.y + y;
			if ( !drawTitle )
			{
				if ( yText < 0 )
					yText = this.lineHeight + yText;
				if ( yText > this.lineHeight )
					yText = yText - this.lineHeight;
			}
			for ( var x = 0; x < data.width; x++ )
			{
				var xText = xStart + data.x + x;
				if ( !drawTitle )
				{
					if ( xText < 0 )
						xText = this.lineWidth + xText;
					if ( xText > this.lineWidth )
						xText = xText - this.lineWidth;
				}
				var xGraphic = this.x + ( xText + this.xInside ) * this.fontWidth * this.screen.scale;
				var yGraphic = this.y + ( yText + this.yInside ) * this.fontHeight * this.screen.scale;
				this.screen.context.putImageData( imageData, xGraphic, yGraphic );
			}
		}
	}

	// Draw the titles
	var self = this;
	if ( drawTitle )
	{
		if ( this.titleTop != '' )
			printIt( this.titleTop, -1 );
		if ( this.titleBottom != '' )
			printIt( this.titleBottom, this.lineHeight );
	}
	this.cursorOn();
	this.screen.setModified();

	function printIt( title, y )
	{
		if ( self.border > 0 )
		{
			if ( title.length > self.lineWidth )
				title = title.substring( self.lineWidth );
			var xSave = self.xCursor;
			var ySave = self.yCursor;
			self.xCursor = Math.floor( self.lineWidth / 2 ) - Math.floor( title.length / 2 );
			self.yCursor = y;
			self.printLine( title, self.borderPaper, self.borderPen, self.writing, false, true );
			self.xCursor = xSave;
			self.yCursor = ySave;
		}
	}
};
TextWindow.prototype.restoreText = function()
{
	var paper, pen, writing;
	this.cursorOff();
	paper = this.linePapers[ 0 ].charCodeAt( 0 ) - 32;
	pen = this.linePens[ 0 ].charCodeAt( 0 ) - 32;
	writing = this.lineWritings[ 0 ].charCodeAt( 0 );

	var xSaveCursor = this.xCursor;
	var ySaveCursor = this.yCursor;
	for ( var l = 0; l < this.lineHeight; l++ )
	{
		var line = '';
		var xCursor = 0;
		this.yCursor = l;
		for ( var c = 0; c < this.lineWidth; c++ )
		{
			if ( paper != this.linePapers[ l ].charCodeAt( c ) - 32 || pen != this.linePens[ l ].charCodeAt( c ) - 32 || writing != this.lineWritings[ l ].charCodeAt( c ) )
			{
				if ( line != '' )
				{
					this.xCursor = xCursor;
					this.printLine( line, paper, pen, writing, false );
					xCursor += line.length;
					line = '';
				}
				paper = this.linePapers[ l ].charCodeAt( c ) - 32;
				pen = this.linePens[ l ].charCodeAt( c ) - 32;
				writing = this.lineWritings[ l ].charCodeAt( c );
			}
			line += this.lines[ l ].charAt( c );
		}
		this.xCursor = xCursor;
		this.printLine( line, paper, pen, writing, false, false );
	}
	this.xCursor = xSaveCursor;
	this.yCursor = ySaveCursor;

	// Draw the border
	this.drawBorders();
	this.cursorOn();
	this.screen.setModified();
};
TextWindow.prototype.createBorderCharacter = function( border, position, paper, pen, writing )
{
	imageData = this.screen.context.createImageData( 8 * this.screen.scale, 8 * this.screen.scale );
	var source = Borders[ border * 8 + position ];

	var colorPaper = this.utilities.getRGBAStringColors( this.screen.getColorString( paper ) );
	var	colorPen = this.utilities.getRGBAStringColors( this.screen.getColorString( pen ) );
	for ( var y = 0; y < 8; y++ )
	{
		for ( var x = 0; x < 8; x++ )
		{
			var mask = 0x80 >> x;
			if ( ( source[ y ] & mask ) == 0 )
			{
				for ( var yy = 0; yy < this.screen.scale; yy++ )
				{
					var offset = ( y * 32 * this.screen.scale + ( yy * 8 + x ) * 4 ) * this.screen.scale;
					for ( var xx = 0; xx < this.screen.scale; xx++ )
					{
						imageData.data[ offset + xx * 4 ] = colorPaper.r;
						imageData.data[ offset + xx * 4 + 1 ] = colorPaper.g;
						imageData.data[ offset + xx * 4 + 2 ] = colorPaper.b;
						imageData.data[ offset + xx * 4 + 3 ] = 255;
					}
				}
			}
			else
			{
				for ( var yy = 0; yy < this.screen.scale; yy++ )
				{
					var offset = ( y * 32 * this.screen.scale + ( yy * 8 + x ) * 4 ) * this.screen.scale;
					for ( var xx = 0; xx < this.screen.scale; xx++ )
					{
						imageData.data[ offset + xx * 4 ] = colorPen.r;
						imageData.data[ offset + xx * 4 + 1 ] = colorPen.g;
						imageData.data[ offset + xx * 4 + 2 ] = colorPen.b;
						imageData.data[ offset + xx * 4 + 3 ] = 255;
					}
				}
			}
		}
	}
	return imageData;
};
TextWindow.prototype.printLine = function( line, paper, pen, writing, updatePosition, inTitle )
{
	var x, y;
	var colorPaper = this.screen.getColorString( paper );
	var colorPen = this.screen.getColorString( pen );

	// Erase background
	x = ( this.x + ( this.xInside + this.xCursor ) * this.fontWidth ) * this.screen.scale;
	y = ( this.y + ( this.yInside + this.yCursor ) * this.fontHeight ) * this.screen.scale;
	var width = line.length * this.fontWidth * this.screen.scale;
	var height = this.fontHeight * this.screen.scale;
	if ( ( writing & ( TextWindow.FLAG_NORMAL | TextWindow.FLAG_ONLYPAPER ) ) != 0 )
	{
		this.screen.context.fillStyle = colorPaper;
		this.screen.context.fillRect( x, y, width, height );
	}
	if ( ( writing & TextWindow.FLAG_UNDER ) != 0 )
	{
		this.screen.context.strokeStyle = colorPen;
		this.screen.context.beginPath();
		this.screen.context.moveTo( x, y + height - 1 );
		this.screen.context.lineTo( x + width, y + height - 1 );
		this.screen.context.stroke();
	}

	if ( this.font.type == 'google' )
	{
		y += this.fontHeight * this.screen.scale;
		this.screen.context.font = this.fontString;
		this.screen.context.textAlign = 'start';
		this.screen.context.textBaseline = 'bottom';
		this.screen.context.fillStyle = colorPen;
		this.screen.context.imageSmoothingEnabled = false;
		this.screen.canvas.imageRendering = 'pixelated';
		if ( ( writing & ( TextWindow.FLAG_NORMAL | TextWindow.FLAG_ONLYPEN ) ) != 0 )
		{
			this.screen.context.fillText( line, x, y );
			x += this.fontWidth * this.screen.scale * line.length;
		}
	}
	else if ( this.font.type == 'amiga' )
	{
		x = ( this.x + ( this.xInside + this.xCursor ) * this.fontWidth ) * this.screen.scale;
		y = ( this.y + ( this.yInside + this.yCursor ) * this.fontHeight ) * this.screen.scale;
		this.screen.context.imageSmoothingEnabled = true;
		this.amos.fonts.drawAmigaText( this.screen.context, this.screen.scale, x, y, line, this.font, 'left', 'top', '', colorPen, 1, this.amos.manifest.default.screen.window.fontWidth );
	}

	// Poke in save buffers
	if ( !inTitle )
	{
		var linePapers = '';
		var linePens = '';
		var lineWritings = '';
		for ( var l = 0; l < line.length; l++ )
		{
			linePapers += String.fromCharCode( paper + 32 );
			linePens += String.fromCharCode( pen + 32 );
			lineWritings += String.fromCharCode( writing );
		}
		this.lines[ this.yCursor ] = this.lines[ this.yCursor ].substring( 0, this.xCursor ) + line + this.lines[ this.yCursor ].substring( this.xCursor + line.length );
		this.linePapers[ this.yCursor ] = this.linePapers[ this.yCursor ].substring( 0, this.xCursor ) + linePapers + this.linePapers[ this.yCursor ].substring( this.xCursor + line.length );
		this.linePens[ this.yCursor ] = this.linePens[ this.yCursor ].substring( 0, this.xCursor ) + linePens + this.linePens[ this.yCursor ].substring( this.xCursor + line.length );
		this.lineWritings[ this.yCursor ] = this.lineWritings[ this.yCursor ].substring( 0, this.xCursor ) + lineWritings + this.lineWritings[ this.yCursor ].substring( this.xCursor + line.length );
	}

	// Update position
	if ( updatePosition )
	{
		this.xCursor += line.length;
		if ( this.xCursor >= this.lineWidth )
		{
			this.xCursor = 0;
			this.yCursor++;
			if ( this.yCursor >= this.lineHeight )
			{
				if ( this.scrollOn )
					this.scroll( 0, -1, true );
				else
					this.yCursor = 0;
			}
		}
	}

	// Update display
	this.screen.setModified();
}

// AMOS Default font definition
AMOSFont =
[
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  32 -
	[ 0x00, 0x18, 0x18, 0x18, 0x18, 0x00, 0x18, 0x00 ],            //  33 - !
	[ 0x00, 0x66, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00 ],            //  34 - "
	[ 0x00, 0x66, 0xFF, 0x66, 0x66, 0xFF, 0x66, 0x00 ],            //  35 - #
	[ 0x18, 0x3E, 0x60, 0x3C, 0x06, 0x7C, 0x18, 0x00 ],            //  36 - $
	[ 0x00, 0x66, 0x6C, 0x18, 0x30, 0x66, 0x46, 0x00 ],            //  37 - %
	[ 0x1C, 0x36, 0x1C, 0x38, 0x6F, 0x66, 0x3B, 0x00 ],            //  38 - &
	[ 0x00, 0x18, 0x18, 0x10, 0x00, 0x00, 0x00, 0x00 ],            //  39 - '
	[ 0x0C, 0x18, 0x30, 0x30, 0x30, 0x18, 0x0C, 0x00 ],            //  40 - (
	[ 0x30, 0x18, 0x0C, 0x0C, 0x0C, 0x18, 0x30, 0x00 ],            //  41 - )
	[ 0x00, 0x66, 0x3C, 0xFF, 0x3C, 0x66, 0x00, 0x00 ],            //  42 - *
	[ 0x00, 0x18, 0x18, 0x7E, 0x18, 0x18, 0x00, 0x00 ],            //  43 - +
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x30 ],            //  44 - ,
	[ 0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00 ],            //  45 - -
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00 ],            //  46 - .
	[ 0x00, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x40, 0x00 ],            //  47 - /
	[ 0x00, 0x3C, 0x66, 0x6E, 0x76, 0x66, 0x3C, 0x00 ],            //  48 - 0
	[ 0x00, 0x18, 0x38, 0x18, 0x18, 0x18, 0x7E, 0x00 ],            //  49 - 1
	[ 0x00, 0x3C, 0x66, 0x0C, 0x18, 0x30, 0x7E, 0x00 ],            //  50 - 2
	[ 0x00, 0x7E, 0x0C, 0x18, 0x0C, 0x66, 0x3C, 0x00 ],            //  51 - 3
	[ 0x00, 0x0C, 0x1C, 0x3C, 0x6C, 0x7E, 0x0C, 0x00 ],            //  52 - 4
	[ 0x00, 0x7E, 0x60, 0x7C, 0x06, 0x66, 0x3C, 0x00 ],            //  53 - 5
	[ 0x00, 0x3C, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0x00 ],            //  54 - 6
	[ 0x00, 0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x00 ],            //  55 - 7
	[ 0x00, 0x3C, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  56 - 8
	[ 0x00, 0x3C, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0x00 ],            //  57 - 9
	[ 0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x00 ],            //  58 - :
	[ 0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x30 ],            //  59 - ;
	[ 0x00, 0x06, 0x18, 0x60, 0x18, 0x06, 0x00, 0x00 ],            //  60 - <
	[ 0x00, 0x00, 0x7E, 0x00, 0x7E, 0x00, 0x00, 0x00 ],            //  61 - =
	[ 0x00, 0x60, 0x18, 0x06, 0x18, 0x60, 0x00, 0x00 ],            //  62 - >
	[ 0x00, 0x3C, 0x66, 0x0C, 0x18, 0x00, 0x18, 0x00 ],            //  63 - ?
	[ 0x00, 0x3C, 0x66, 0x6E, 0x6E, 0x60, 0x3E, 0x00 ],            //  64 - @
	[ 0x00, 0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x00 ],            //  65 - A
	[ 0x00, 0x7C, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x00 ],            //  66 - B
	[ 0x00, 0x3C, 0x66, 0x60, 0x60, 0x66, 0x3C, 0x00 ],            //  67 - C
	[ 0x00, 0x7C, 0x66, 0x66, 0x66, 0x66, 0x7C, 0x00 ],            //  68 - D
	[ 0x00, 0x7E, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0x00 ],            //  69 - E
	[ 0x00, 0x7E, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x00 ],            //  70 - F
	[ 0x00, 0x3C, 0x66, 0x60, 0x6E, 0x66, 0x3C, 0x00 ],            //  71 - G
	[ 0x00, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00 ],            //  72 - H
	[ 0x00, 0x7E, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00 ],            //  73 - I
	[ 0x00, 0x06, 0x06, 0x06, 0x06, 0x66, 0x3C, 0x00 ],            //  74 - J
	[ 0x00, 0x66, 0x6C, 0x78, 0x78, 0x6C, 0x66, 0x00 ],            //  75 - K
	[ 0x00, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0x00 ],            //  76 - L
	[ 0x00, 0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x00 ],            //  77 - M
	[ 0x00, 0x46, 0x66, 0x76, 0x6E, 0x66, 0x66, 0x00 ],            //  78 - N
	[ 0x00, 0x3C, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  79 - O
	[ 0x00, 0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60, 0x00 ],            //  80 - P
	[ 0x00, 0x3C, 0x66, 0x66, 0x66, 0x6C, 0x36, 0x00 ],            //  81 - Q
	[ 0x00, 0x7C, 0x66, 0x66, 0x7C, 0x6C, 0x66, 0x00 ],            //  82 - R
	[ 0x00, 0x3C, 0x60, 0x3C, 0x06, 0x06, 0x3C, 0x00 ],            //  83 - S
	[ 0x00, 0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00 ],            //  84 - T
	[ 0x00, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  85 - U
	[ 0x00, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00 ],            //  86 - V
	[ 0x00, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x00 ],            //  87 - W
	[ 0x00, 0x66, 0x66, 0x3C, 0x3C, 0x66, 0x66, 0x00 ],            //  88 - X
	[ 0x00, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x00 ],            //  89 - Y
	[ 0x00, 0x7E, 0x0C, 0x18, 0x30, 0x60, 0x7E, 0x00 ],            //  90 - Z
	[ 0x1E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x1E, 0x00 ],            //  91 - [
	[ 0x00, 0x40, 0x60, 0x30, 0x18, 0x0C, 0x06, 0x00 ],            //  92 - \
	[ 0x78, 0x18, 0x18, 0x18, 0x18, 0x18, 0x78, 0x00 ],            //  93 - ]
	[ 0x00, 0x18, 0x3C, 0x7E, 0x00, 0x00, 0x00, 0x00 ],            //  94 - ^
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7E, 0x00 ],            //  95 - _
	[ 0x00, 0x18, 0x18, 0x08, 0x00, 0x00, 0x00, 0x00 ],            //  96 - `
	[ 0x00, 0x00, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  97 - a
	[ 0x00, 0x60, 0x60, 0x7C, 0x66, 0x66, 0x7C, 0x00 ],            //  98 - b
	[ 0x00, 0x00, 0x3C, 0x60, 0x60, 0x60, 0x3C, 0x00 ],            //  99 - c
	[ 0x00, 0x06, 0x06, 0x3E, 0x66, 0x66, 0x3E, 0x00 ],            //  100 - d
	[ 0x00, 0x00, 0x3C, 0x66, 0x7E, 0x60, 0x3C, 0x00 ],            //  101 - e
	[ 0x00, 0x0E, 0x18, 0x3E, 0x18, 0x18, 0x18, 0x00 ],            //  102 - f
	[ 0x00, 0x00, 0x3E, 0x66, 0x66, 0x3E, 0x06, 0x7C ],            //  103 - g
	[ 0x00, 0x60, 0x60, 0x7C, 0x66, 0x66, 0x66, 0x00 ],            //  104 - h
	[ 0x00, 0x18, 0x00, 0x38, 0x18, 0x18, 0x3C, 0x00 ],            //  105 - i
	[ 0x00, 0x06, 0x00, 0x06, 0x06, 0x06, 0x06, 0x3C ],            //  106 - j
	[ 0x00, 0x60, 0x60, 0x6C, 0x78, 0x6C, 0x66, 0x00 ],            //  107 - k
	[ 0x00, 0x38, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00 ],            //  108 - l
	[ 0x00, 0x00, 0x7C, 0x6A, 0x6A, 0x6A, 0x6A, 0x00 ],            //  109 - m
	[ 0x00, 0x00, 0x7C, 0x66, 0x66, 0x66, 0x66, 0x00 ],            //  110 - n
	[ 0x00, 0x00, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  111 - o
	[ 0x00, 0x00, 0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60 ],            //  112 - p
	[ 0x00, 0x00, 0x3E, 0x66, 0x66, 0x3E, 0x06, 0x06 ],            //  113 - q
	[ 0x00, 0x00, 0x7C, 0x66, 0x60, 0x60, 0x60, 0x00 ],            //  114 - r
	[ 0x00, 0x00, 0x3E, 0x60, 0x3C, 0x06, 0x7C, 0x00 ],            //  115 - s
	[ 0x00, 0x18, 0x7E, 0x18, 0x18, 0x18, 0x0E, 0x00 ],            //  116 - t
	[ 0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x3E, 0x00 ],            //  117 - u
	[ 0x00, 0x00, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00 ],            //  118 - v
	[ 0x00, 0x00, 0x42, 0x42, 0x5A, 0x7E, 0x66, 0x00 ],            //  119 - w
	[ 0x00, 0x00, 0x66, 0x3C, 0x18, 0x3C, 0x66, 0x00 ],            //  120 - x
	[ 0x00, 0x00, 0x66, 0x66, 0x66, 0x3E, 0x0C, 0x78 ],            //  121 - y
	[ 0x00, 0x00, 0x7E, 0x0C, 0x18, 0x30, 0x7E, 0x00 ],            //  122 - z
	[ 0x0E, 0x18, 0x18, 0x70, 0x18, 0x18, 0x0E, 0x00 ],            //  123 - {
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00 ],            //  124 - |
	[ 0x70, 0x18, 0x18, 0x0E, 0x18, 0x18, 0x70, 0x00 ],            //  125 - }
	[ 0x00, 0x00, 0x32, 0x4C, 0x00, 0x00, 0x00, 0x00 ],            //  126 - ~
	[ 0x0F, 0x3C, 0xF0, 0xC3, 0x0F, 0x3C, 0xF0, 0x00 ],            //  127 - 
	[ 0xFF, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0 ],            //  128 - �
	[ 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  129 - �
	[ 0xFF, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03 ],            //  130 - �
	[ 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0 ],            //  131 - �
	[ 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03 ],            //  132 - �
	[ 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xFF ],            //  133 - �
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF ],            //  134 - �
	[ 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0xFF ],            //  135 - �
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],            //  136 - �
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],            //  137 - �
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],            //  138 - �
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],            //  139 - �
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],            //  140 - �
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],            //  141 - �
	[ 0x00, 0x00, 0x00, 0xFF, 0x18, 0x18, 0x18, 0x18 ],            //  142 - �
	[ 0x18, 0x18, 0x18, 0xFF, 0x00, 0x00, 0x00, 0x00 ],            //  143 - �
	[ 0x18, 0x18, 0x18, 0x1F, 0x18, 0x18, 0x18, 0x18 ],            //  144 - �
	[ 0x18, 0x18, 0x18, 0xF8, 0x18, 0x18, 0x18, 0x18 ],            //  145 - �
	[ 0x18, 0x18, 0x18, 0xFF, 0x18, 0x18, 0x18, 0x18 ],            //  146 - �
	[ 0xFF, 0xC1, 0xC3, 0xC7, 0xC1, 0xC1, 0xC0, 0xFF ],            //  147 - �
	[ 0xFF, 0x83, 0xC3, 0xE3, 0x83, 0x83, 0x03, 0xFF ],            //  148 - �
	[ 0xFF, 0xC0, 0xC1, 0xC1, 0xC7, 0xC3, 0xC1, 0xFF ],            //  149 - �
	[ 0xFF, 0x03, 0x83, 0x83, 0xE3, 0xC3, 0x83, 0xFF ],            //  150 - �
	[ 0xFF, 0xC0, 0xCC, 0xDF, 0xDF, 0xCC, 0xC0, 0xFF ],            //  151 - �
	[ 0xFF, 0x03, 0x03, 0xF3, 0xF3, 0x03, 0x03, 0xFF ],            //  152 - �
	[ 0xFF, 0xC0, 0xC0, 0xCF, 0xCF, 0xC0, 0xC0, 0xFF ],            //  153 - �
	[ 0xFF, 0x03, 0x63, 0xF3, 0xF3, 0x63, 0x03, 0xFF ],            //  154 - �
	[ 0xFF, 0xC0, 0xC3, 0xCC, 0xCC, 0xC3, 0xC0, 0xFF ],            //  155 - �
	[ 0xFF, 0x03, 0xC3, 0x33, 0x33, 0xC3, 0x03, 0xFF ],            //  156 - �
	[ 0x00, 0x7F, 0x7F, 0x60, 0x6F, 0x6F, 0x6C, 0x6C ],            //  157 - �
	[ 0x1A, 0x1A, 0x1A, 0x1A, 0x1A, 0x1A, 0x1A, 0x1A ],            //  158 - �
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  159 - �
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  160 - �
	[ 0x18, 0x00, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00 ],            //  161 - �
	[ 0x00, 0x0C, 0x3E, 0x6C, 0x3E, 0x0C, 0x00, 0x00 ],            //  162 - �
	[ 0x1C, 0x36, 0x30, 0x78, 0x30, 0x30, 0x7E, 0x00 ],            //  163 - �
	[ 0x1C, 0x22, 0x78, 0x20, 0x70, 0x22, 0x1C, 0x00 ],            //  164 - �
	[ 0xC3, 0x66, 0x3C, 0x18, 0x3C, 0x18, 0x18, 0x00 ],            //  165 - �
	[ 0x18, 0x18, 0x18, 0x00, 0x18, 0x18, 0x18, 0x00 ],            //  166 - �
	[ 0x3C, 0x60, 0x3C, 0x66, 0x3C, 0x06, 0x3C, 0x00 ],            //  167 - �
	[ 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  168 - �
	[ 0x7E, 0x81, 0x9D, 0xB1, 0x9D, 0x81, 0x7E, 0x00 ],            //  169 - �
	[ 0x1C, 0x24, 0x44, 0x3C, 0x00, 0x7E, 0x00, 0x00 ],            //  170 - �
	[ 0x00, 0x33, 0x66, 0xCC, 0x66, 0x33, 0x00, 0x00 ],            //  171 - �
	[ 0x3E, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  172 - �
	[ 0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00 ],            //  173 - �
	[ 0x7E, 0x81, 0xB9, 0xA5, 0xB9, 0xA5, 0x81, 0x7E ],            //  174 - �
	[ 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  175 - �
	[ 0x3C, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  176 - �
	[ 0x18, 0x18, 0x7E, 0x18, 0x18, 0x00, 0x7E, 0x00 ],            //  177 - �
	[ 0x78, 0x0C, 0x18, 0x30, 0x7C, 0x00, 0x00, 0x00 ],            //  178 - �
	[ 0x78, 0x0C, 0x18, 0x0C, 0x78, 0x00, 0x00, 0x00 ],            //  179 - �
	[ 0x18, 0x30, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 ],            //  180 - �
	[ 0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x7F, 0x60 ],            //  181 - �
	[ 0x3E, 0x7A, 0x7A, 0x3A, 0x0A, 0x0A, 0x0A, 0x00 ],            //  182 - �
	[ 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00 ],            //  183 - �
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x30 ],            //  184 - �
	[ 0x30, 0x70, 0x30, 0x30, 0x30, 0x00, 0x00, 0x00 ],            //  185 - �
	[ 0x38, 0x44, 0x44, 0x38, 0x00, 0x7C, 0x00, 0x00 ],            //  186 - �
	[ 0x00, 0xCC, 0x66, 0x33, 0x66, 0xCC, 0x00, 0x00 ],            //  187 - �
	[ 0x40, 0xC6, 0x4C, 0x58, 0x32, 0x66, 0xCF, 0x02 ],            //  188 - �
	[ 0x40, 0xC6, 0x4C, 0x58, 0x3E, 0x62, 0xC4, 0x0E ],            //  189 - �
	[ 0xC0, 0x23, 0x66, 0x2C, 0xD9, 0x33, 0x67, 0x01 ],            //  190 - �
	[ 0x18, 0x00, 0x18, 0x30, 0x60, 0x66, 0x3C, 0x00 ],            //  191 - �
	[ 0x30, 0x18, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x00 ],            //  192 - �
	[ 0x0C, 0x18, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x00 ],            //  193 - �
	[ 0x18, 0x66, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x00 ],            //  194 - �
	[ 0x71, 0x8E, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x00 ],            //  195 - �
	[ 0x66, 0x00, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x00 ],            //  196 - �
	[ 0x18, 0x24, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x00 ],            //  197 - �
	[ 0x1F, 0x3C, 0x3C, 0x6F, 0x7C, 0xCC, 0xCF, 0x00 ],            //  198 - �
	[ 0x1E, 0x30, 0x60, 0x60, 0x30, 0x1E, 0x0C, 0x18 ],            //  199 - �
	[ 0x30, 0x18, 0x7E, 0x60, 0x78, 0x60, 0x7E, 0x00 ],            //  200 - �
	[ 0x0C, 0x18, 0x7E, 0x60, 0x78, 0x60, 0x7E, 0x00 ],            //  201 - �
	[ 0x18, 0x66, 0x7E, 0x60, 0x78, 0x60, 0x7E, 0x00 ],            //  202 - �
	[ 0x66, 0x00, 0x7E, 0x60, 0x78, 0x60, 0x7E, 0x00 ],            //  203 - �
	[ 0x30, 0x18, 0x3C, 0x18, 0x18, 0x18, 0x3C, 0x00 ],            //  204 - �
	[ 0x0C, 0x18, 0x3C, 0x18, 0x18, 0x18, 0x3C, 0x00 ],            //  205 - �
	[ 0x18, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x3C, 0x00 ],            //  206 - �
	[ 0x66, 0x00, 0x3C, 0x18, 0x18, 0x18, 0x3C, 0x00 ],            //  207 - �
	[ 0x78, 0x6C, 0x66, 0xF6, 0x66, 0x6C, 0x78, 0x00 ],            //  208 - �
	[ 0x71, 0xCE, 0xE6, 0xF6, 0xDE, 0xCE, 0xC6, 0x00 ],            //  209 - �
	[ 0x30, 0x18, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  210 - �
	[ 0x0C, 0x18, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  211 - �
	[ 0x18, 0x66, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  212 - �
	[ 0x71, 0x8E, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  213 - �
	[ 0x00, 0x66, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  214 - �
	[ 0x00, 0xC6, 0x6C, 0x38, 0x6C, 0xC6, 0x00, 0x00 ],            //  215 - �
	[ 0x3F, 0x66, 0x6E, 0x7E, 0x76, 0x66, 0xFC, 0x00 ],            //  216 - �
	[ 0x30, 0x18, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  217 - �
	[ 0x0C, 0x18, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  218 - �
	[ 0x18, 0x24, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  219 - �
	[ 0x66, 0x00, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00 ],            //  220 - �
	[ 0x06, 0x08, 0xC3, 0x66, 0x3C, 0x18, 0x18, 0x00 ],            //  221 - �
	[ 0xC0, 0xC0, 0xFC, 0xC6, 0xFC, 0xC0, 0xC0, 0x00 ],            //  222 - �
	[ 0x00, 0x3C, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x60 ],            //  223 - �
	[ 0x30, 0x18, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  224 - �
	[ 0x0C, 0x18, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  225 - �
	[ 0x18, 0x66, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  226 - �
	[ 0x71, 0x8E, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  227 - �
	[ 0x66, 0x00, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  228 - �
	[ 0x18, 0x24, 0x3C, 0x06, 0x3E, 0x66, 0x3E, 0x00 ],            //  229 - �
	[ 0x00, 0x00, 0x7E, 0x1B, 0x7F, 0xD8, 0x77, 0x00 ],            //  230 - �
	[ 0x00, 0x00, 0x3C, 0x60, 0x60, 0x60, 0x3C, 0x18 ],            //  231 - �
	[ 0x30, 0x18, 0x3C, 0x66, 0x7E, 0x60, 0x3C, 0x00 ],            //  232 - �
	[ 0x0C, 0x18, 0x3C, 0x66, 0x7E, 0x60, 0x3C, 0x00 ],            //  233 - �
	[ 0x18, 0x66, 0x3C, 0x66, 0x7E, 0x60, 0x3C, 0x00 ],            //  234 - �
	[ 0x66, 0x00, 0x3C, 0x66, 0x7E, 0x60, 0x3C, 0x00 ],            //  235 - �
	[ 0x30, 0x18, 0x00, 0x18, 0x18, 0x18, 0x0C, 0x00 ],            //  236 - �
	[ 0x0C, 0x18, 0x00, 0x18, 0x18, 0x18, 0x0C, 0x00 ],            //  237 - �
	[ 0x18, 0x66, 0x00, 0x18, 0x18, 0x18, 0x0C, 0x00 ],            //  238 - �
	[ 0x00, 0x66, 0x00, 0x18, 0x18, 0x18, 0x0C, 0x00 ],            //  239 - �
	[ 0x60, 0xFC, 0x18, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  240 - �
	[ 0x71, 0x8E, 0x00, 0x7C, 0x66, 0x66, 0x66, 0x00 ],            //  241 - �
	[ 0x30, 0x18, 0x00, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  242 - �
	[ 0x0C, 0x18, 0x00, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  243 - �
	[ 0x18, 0x66, 0x00, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  244 - �
	[ 0x71, 0x8E, 0x00, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  245 - �
	[ 0x00, 0x66, 0x00, 0x3C, 0x66, 0x66, 0x3C, 0x00 ],            //  246 - �
	[ 0x00, 0x18, 0x00, 0x7E, 0x00, 0x18, 0x00, 0x00 ],            //  247 - �
	[ 0x00, 0x02, 0x7C, 0xCE, 0xD6, 0xE6, 0x7C, 0x80 ],            //  248 - �
	[ 0x30, 0x18, 0x00, 0x66, 0x66, 0x66, 0x3E, 0x00 ],            //  249 - �
	[ 0x0C, 0x18, 0x00, 0x66, 0x66, 0x66, 0x3E, 0x00 ],            //  250 - �
	[ 0x18, 0x66, 0x00, 0x66, 0x66, 0x66, 0x3E, 0x00 ],            //  251 - �
	[ 0x00, 0x66, 0x00, 0x66, 0x66, 0x66, 0x3E, 0x00 ],            //  252 - �
	[ 0x0C, 0x18, 0x00, 0x66, 0x66, 0x3C, 0x18, 0x30 ],            //  253 - �
	[ 0x60, 0x60, 0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60 ],            //  254 - �
	[ 0x00, 0x66, 0x00, 0x66, 0x66, 0x3C, 0x18, 0x30 ]             //  255 - �
];

Borders =
[
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],        // Border  0
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  1
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0xFF, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0 ],        // Border  2
	[ 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
	[ 0xFF, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03 ],
	[ 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0 ],
	[ 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03 ],
	[ 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xFF ],
	[ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF ],
	[ 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0xFF ],
	[ 0x00, 0x7F, 0x7F, 0x60, 0x6F, 0x6F, 0x6C, 0x6C ],        // Border  3
	[ 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0x00 ],
	[ 0x00, 0xFE, 0xFE, 0x06, 0xF6, 0xF6, 0x36, 0x36 ],
	[ 0x6C, 0x6C, 0x6C, 0x6C, 0x6C, 0x6C, 0x6C, 0x6C ],
	[ 0x36, 0x36, 0x36, 0x36, 0x36, 0x36, 0x36, 0x36 ],
	[ 0x6C, 0x6C, 0x6F, 0x6F, 0x60, 0x7F, 0x7F, 0x00 ],
	[ 0x00, 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0x00 ],
	[ 0x36, 0x36, 0xF6, 0xF6, 0x06, 0xFE, 0xFE, 0x00 ],
	[ 0x00, 0x7F, 0x40, 0x57, 0x40, 0x57, 0x54, 0x54 ],        // Border  4
	[ 0x00, 0xFF, 0x00, 0x66, 0x00, 0xFF, 0x00, 0x00 ],
	[ 0x00, 0xFE, 0x02, 0xEA, 0x02, 0xEA, 0x2A, 0x2A ],
	[ 0x44, 0x54, 0x54, 0x44, 0x44, 0x54, 0x54, 0x44 ],
	[ 0x22, 0x2A, 0x2A, 0x22, 0x22, 0x2A, 0x2A, 0x22 ],
	[ 0x54, 0x54, 0x57, 0x40, 0x57, 0x40, 0x7F, 0x00 ],
	[ 0x00, 0x00, 0xFF, 0x00, 0x66, 0x00, 0xFF, 0x00 ],
	[ 0x2A, 0x2A, 0xEA, 0x02, 0xEA, 0x02, 0xFE, 0x00 ],
	[ 0x00, 0x00, 0x3F, 0x7F, 0x7F, 0x78, 0x70, 0x70 ],        // Border  5
	[ 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0xFC, 0xFE, 0xFE, 0x1E, 0x0E, 0x0E ],
	[ 0x70, 0x70, 0x70, 0x70, 0x70, 0x70, 0x70, 0x70 ],
	[ 0x0E, 0x0E, 0x0E, 0x0E, 0x0E, 0x0E, 0x0E, 0x0E ],
	[ 0x70, 0x70, 0x70, 0x78, 0x7F, 0x7F, 0x3F, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00 ],
	[ 0x0E, 0x0E, 0x0E, 0x1E, 0xFE, 0xFE, 0xFC, 0x00 ],
	[ 0x00, 0x7F, 0x40, 0x5F, 0x5F, 0x58, 0x58, 0x58 ],        // Border  6
	[ 0x00, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00 ],
	[ 0x00, 0xFE, 0x02, 0xFA, 0xFA, 0x1A, 0x1A, 0x1A ],
	[ 0x58, 0x58, 0x58, 0x58, 0x58, 0x58, 0x58, 0x58 ],
	[ 0x1A, 0x1A, 0x1A, 0x1A, 0x1A, 0x1A, 0x1A, 0x1A ],
	[ 0x58, 0x58, 0x58, 0x5F, 0x5F, 0x40, 0x7F, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0x00 ],
	[ 0x1A, 0x1A, 0x1A, 0xFA, 0xFA, 0x02, 0xFE, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  7
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  8
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  9
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  10
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  11
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  12
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  13
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  14
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0x0F, 0x18, 0x18, 0x18, 0x18 ],        // Border  15
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xF0, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18 ],
	[ 0x18, 0x18, 0x18, 0x0F, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00 ],
	[ 0x18, 0x18, 0x18, 0xF0, 0x00, 0x00, 0x00, 0x00 ]
];
