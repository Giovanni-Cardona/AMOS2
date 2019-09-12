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
 * Fonts!
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 03/03/2018
 */

function Fonts( amos )
{
	this.amos = amos;
	this.manifest = amos.manifest;
	this.utilities = amos.utilities;
	this.miniCanvas = document.createElement( 'canvas' );
	this.miniCanvas.width = 16;
	this.miniCanvas.heigth = 16;
	this.miniContext = this.miniCanvas.getContext( '2d' );
	this.fontList = [];
}
Fonts.prototype.init = function( options, callback )
{
	this.getFonts();
	var font = this.manifest.default.screen.window.font;
	this.loadFont( font.name, font.height, font.weight, font.italic, font.stretch, this.manifest.display.screenScale, function( response, data, extra )
	{
		if ( response )
		{
			callback( true, data, extra );
		}
		else
		{
			callback( false, null, extra );
		}
	} );
};
Fonts.prototype.getFonts = function( type )
{
	this.fontList = [];
	var count = 0;

	// Text window font always first
	if ( !type || type.indexOf( 'amiga' ) >= 0 )
	{
		for ( var f in AmigaFonts )
		{
			var font = AmigaFonts[ f ];
			this.fontList.push(
			{
				index: f.toLowerCase(),
				name: f,
				height: 'any',
				type: 'amiga',
				number: count++,
				loaded: false
			} );
		}
	}
	if ( !type || type.indexOf( 'google' ) >= 0 )
	{
		for ( var f in GoogleFonts )
		{
			var font = GoogleFonts[ f ];
			this.fontList.push(
			{
				index: f.toLowerCase(),
				name: font.name,
				height: 'any',
				type: 'google',
				number: count++,
				loaded: false
			} );
		}
	}
};
Fonts.prototype.getFontInfo = function( reference )
{
	if ( !this.fontList )
		throw 'fonts_not_examined';

	var font;
	if ( this.utilities.isObject( reference ) )
		font = reference;
	else if ( typeof reference == 'number' )
	{
		if ( reference < 0 )
			throw 'illegal_function_call';
		if ( this.fontList[ reference ] )
			font = this.fontList[ reference ];
	}
	else
	{
		reference = reference.toLowerCase();
		for ( var f = 0; f < this.fontList.length; f++ )
		{
			if ( this.fontList[ f ].index == reference )
			{
				font = this.fontList[ f ];
				break;
			}
		}
	}
	if ( !font )
		throw 'font_not_available';
	return font;
};
Fonts.prototype.getAmigaFontDefinition = function( font, height, c )
{
	var result = {};
	result.definition = AmigaFonts[ font.index ];
	result.characters = AmigaCharacters[ font.index ];
	if ( !result.definition || !result.characters )
		throw 'font_not_defined';
	result.heightDefinition = result.definition[ font.baseHeight ];
	result.characterSet = result.characters[ font.baseHeight ];

	if ( typeof c != 'undefined' )
	{
		if ( c >= result.heightDefinition.loChar && c <= result.heightDefinition.hiChar )
		{
			result.charDefinition = result.characterSet[ c - result.heightDefinition.loChar ];
			result.charDefinition.empty = false;
		}
		else
		{
			result.charDefinition =
			{
				width: 4,
				space: 2,
				kern: 2,
				empty: true
			}
		}
	}
	return result;
};
Fonts.prototype.loadFont = function( reference, height, weight, italic, stretch, scale, callback, extra )
{
	weight = typeof weight == 'undefined' ? 'normal' : weight;
	italic = typeof italic == 'undefined' ? 'normal' : italic;
	stretch = typeof stretch == 'undefined' ? 'normal' : stretch;
	
	var font = this.getFontInfo( reference );
	if ( !font.loaded )
	{
		var self = this;
		if ( font.type == 'google' )
		{
			var props = 
			{
			   weight: weight,
			   style: italic,
			   strech: stretch
			}
			var observer = new FontFaceObserver( font.name, props );	  
			observer.load().then( function() 
			{
				font.loaded = true;
				font.italic = italic;
				font.weight = weight;
				font.stretch = stretch;
				font.height = height;
				font.scale = scale;
				font.baseLine = self.getTextMetrics( font.name, font.height, font.weight ).baseline;
				callback( true, font, extra );
			}, function() 
			{
				callback( false, font, extra );
			} );
	   	}
	   	else if ( font.type == 'amiga' )
	   	{
		   	var path = './resources/fonts/amiga/' + font.name + '.js';
			this.utilities.loadScript( path, {}, function( response, data, extra )
			{
				if ( response )
				{
					font.loaded = true;
					font.height = height;
					var fontDefinition = AmigaFonts[ font.index ];

					var foundHeight;
					var maxHeight = 0;
					for ( var h in fontDefinition )
					{
						maxHeight = Math.max( h, maxHeight );
						var delta = h - height;
						if ( delta >= 0 )
						{
							foundHeight = h;
							break;
						}
					}
					if ( foundHeight )
						font.baseHeight = foundHeight;
					else
						font.baseHeight = maxHeight;
					font.baseLine = fontDefinition[ font.baseHeight ].baseLine;
					font.italic = italic;
					font.weight = weight;
					font.stretch = stretch;
					font.canvasses = [];
					font.contexts = [];
					callback( true, font, extra );
				}
				else
				{
					callback( false, font, extra );
				}
			} );
	   	}
	}
	else
	{
		if ( font.type == 'google' )
		{
			if ( font.italic != italic || font.weight != weight || font.stretch != stretch || font.height != height )
			{
				font.baseLine = this.getTextMetrics( font.name, height, weight ).baseline;
			}
		}
		else if ( font.type == 'amiga' )		
		{
			if ( font.italic != italic || font.weight != weight || font.stretch != stretch || font.height != height )
			{
				font.canvasses = [];
				font.contexts = [];
			}
		}
		font.italic = italic;
		font.weight = weight;
		font.stretch = stretch;		
		font.height = height;
		callback( true, font, extra );
	}
};
Fonts.prototype.getNumberOfFonts = function( type )
{
	var amiga = typeof type == 'undefined' ? true : ( type.toLowerCase() == 'amiga');
	var google = typeof type == 'undefined' ? true : ( type.toLowerCase() == 'google');
	if ( amiga && google )
		return this.fontList.length;
	var count = 0;
	for ( var f = 0; f < this.fontList.length; f++ )
	{
		var font = this.fontList[ f ];
		if ( amiga && font.type == 'amiga' )
			count++;
		if ( google && font.type == 'google' )
			count++;
	}
	return count;
};
Fonts.prototype.getFont$ = function( reference )
{
	var result = '';
	var font = this.getFontInfo( reference );	
	if ( font && font.name )
	{
		if ( !this.manifest.fonts.listFonts || this.manifest.fonts.listFonts.toLowerCase() == 'amiga' )
		{
			result += font.name;
			while ( result.length < 32 )
				result += ' ';
			result += font.height;
			while ( result.length < 36 )
				result += ' ';
			result += font.type == 'amiga' ? 'rom' : 'disc';
		}
		else
		{
			result += font.name + ' ';
			result += '(' + font.type + '): ';
			if ( font.type == 'google' )
			{
				var fontDefinition = GoogleFonts[ font.index ];
				for ( var f = 0; f < fontDefinition.sizes.length; f++ )
				{	
					var fontDef = fontDefinition.sizes[ f ];
					result += fontDef.weight + ', ' + fontDef.style + ( f < fontDefinition.sizes.length -1 ? '; ' : '' );
				}
			}
			else
			{
				result += font.height;
			}
		}
	}
	return result;
};
Fonts.prototype.getBaseline = function( reference )
{
	var font = this.getFontInfo( reference );
	if ( font )
	{
		if ( font.type == 'google' )
			return font.baseLine;
		else if ( font.type == 'amiga' )
			return font.baseLine * ( font.height / font.baseHeight );
	}
	return 0;
};
Fonts.prototype.getTextLength = function( text, reference )
{
	var font = this.getFontInfo( reference );
	if ( font.type == 'amiga' )
	{
		var result = 0;
		var scale = font.height / font.baseHeight;
		var fontDefinition = this.getAmigaFontDefinition( font )
		for ( var p = 0; p < text.length; p++ )
		{
			var c = text.charCodeAt( p );
			if ( c >= fontDefinition.heightDefinition.loChar && c <= fontDefinition.heightDefinition.hiChar )
			{
				var charDefinition = fontDefinition.characterSet[ c - fontDefinition.heightDefinition.loChar ];
				result += ( charDefinition.space + charDefinition.kern ) * scale;
			}
		}
		return result;
	}
	else if ( font.type == 'google' )
	{
		this.miniContext.font = this.utilities.getFontString( font.name, font.height * font.scale, font.weight, font.italic );
		return this.miniContext.measureText( text ).width;
	}
	throw 'font_not_available';
};
Fonts.prototype.drawAmigaText = function( context, scale, x, y, text, font, textAlign, textBaseLine, direction, fillStyle, alpha, fontWidth )
{
	var fontDefinition = this.getAmigaFontDefinition( font );
	if ( textAlign == 'center' || textAlign == 'right' )
	{
		var width = this.getTextLength( text, font );
		if ( textAlign == 'center' )
			x -= ( width * scale ) / 2;
		else
			x -= width * scale;
	}

	for ( var c = 0; c < text.length; c++ )
	{
		var result = this.drawAmigaCharacter( font, fontDefinition, text.charCodeAt( c ), scale, fillStyle, alpha );
			
		if ( textBaseLine == 'top' )
			context.drawImage( result.canvas, x, y );
		else if ( textBaseLine == 'bottom' )
			context.drawImage( result.canvas, x, y - font.baseHeight * font.scale );
		else
			context.drawImage( result.canvas, x, y - font.baseLine * font.scale );
		if ( fontWidth )
			x += fontWidth * scale;
		else
			x += ( result.charDefinition.kern + result.charDefinition.space ) * font.scale;
	}
};
Fonts.prototype.drawAmigaCharacter = function( font, fontDefinition, c, scale, fillStyle, alpha )
{
	var charDefinition;
	if ( c >= fontDefinition.heightDefinition.loChar && c <= fontDefinition.heightDefinition.hiChar )
		charDefinition = fontDefinition.characterSet[ c - fontDefinition.heightDefinition.loChar ];
	else
	{
		charDefinition = 
		{
			kern: 2,
			space: 2,
			width: 4
		};
	}
	var context = font.contexts[ c ];
	if ( context )
	{
		if ( context.fillStyle == fillStyle.toLowerCase() && context.globalAlpha == alpha )
			return { canvas: font.canvasses[ c ], charDefinition: charDefinition };
	}
	
	// New canvas!
	font.scale = ( font.height / font.baseHeight ) * scale;
	var canvas = document.createElement( 'canvas' );
	var height = Math.max( font.height, font.baseHeight );
	canvas.width = height * font.scale;
	canvas.height = height * font.scale;
	font.canvasses[ c ] = canvas;
	var context = canvas.getContext( '2d' );
	context.globalAlpha = alpha;
	context.fillStyle = fillStyle;
	context.imageSmoothingEnabled = true;		
	font.contexts[ c ] = context;
	context.clearRect( 0, 0, font.canvasses[ c ].width, font.canvasses[ c ].height );
	if ( charDefinition.bitmap )
	{
		var modulo = Math.floor( charDefinition.width / 8 ) + ( ( charDefinition.width & 7 ) != 0 ? 1 : 0 );
		for ( var y = 0; y < font.baseHeight; y++ )
		{
			var address = y * modulo;
			var byte = charDefinition.bitmap[ address ];
			var mask = 0x80;
			for ( x = 0; x < charDefinition.width; x++ )
			{
				if ( ( byte & mask ) != 0 )
				{					
					context.fillRect( font.scale / 2 + x * font.scale, font.scale / 2 + y * font.scale, font.scale + font.scale / 10, font.scale  + font.scale / 10 );
				}
				mask >>= 1;
				if ( mask == 0 )
				{
					mask = 0x80;
					address++;
					byte = charDefinition.bitmap[ address ];
				}
			}
		}
	}
	return { canvas: font.canvasses[ c ], charDefinition: charDefinition };
};

Fonts.prototype.getTextMetrics = function(fontFamily, fontSize, fontWeight)
{
	var padding;
	var context;
	var canvas;
	var chars =
	{
		capHeight: 'S',
		baseline: 'n',
		xHeight: 'x',
		descent: 'p',
		ascent: 'h',
		tittle: 'i'
	};

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	var padding = fontSize * 0.5;
	canvas.width = fontSize * 2;
	canvas.height = fontSize * 2 + padding;
	context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
	context.textBaseline = 'top';
	context.textAlign = 'center';

	var result =
	{
		capHeight: measureTop(chars.capHeight),
		baseline: measureBottom(chars.baseline),
		xHeight: measureTop(chars.xHeight),
		descent: measureBottom(chars.descent),
		bottom: computeLineHeight(),
		ascent: measureTop(chars.ascent),
		tittle: measureTop(chars.tittle),
		top: 0
	};
	return result;

	function measureTop(text)
	{
		var pixels = updateText( text );
		return Math.round(getFirstIndex(pixels) / canvas.width) - padding;
	};

	function measureBottom(text)
	{
		var pixels = updateText(text);
		return Math.round(getLastIndex(pixels) / canvas.width) - padding;
	};

	function updateText( text )
	{
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillText(text, canvas.width / 2, padding, canvas.width);
		return context.getImageData(0, 0, canvas.width, canvas.height).data;
	};

	function setAlignment(baseline = 'top')
	{
		const ty = baseline === 'bottom' ? canvas.height : 0;
		context.setTransform(1, 0, 0, 1, 0, ty);
		context.textBaseline = baseline;
	};

	function computeLineHeight()
	{
		const letter = 'A';
		setAlignment('bottom');
		updateText( letter );
		const gutter = canvas.height - measureBottom(letter);
		setAlignment('top');
		updateText( letter );
		return measureBottom(letter) + gutter;
	};

	function getFirstIndex( pixels )
	{
		for (var i = 3, n = pixels.length; i < n; i += 4)
		{
			if (pixels[i] > 0)
				return (i - 3) / 4;
		}
		return pixels.length;
	};

	function getLastIndex( pixels )
	{
		for (var i = pixels.length - 1; i >= 3; i -= 4)
		{
			if (pixels[i] > 0)
				return i / 4;
		}
		return 0;
	};

	function normalize(metrics, fontSize, origin)
	{
		const result = {};
		const offset = metrics[origin];
		for (let key in metrics)
		{
			result[key] = (metrics[key] - offset) / fontSize;
		}
		return result;
	};
};

// Fonts to be inserted after that!
AmigaCharacters = {};
GoogleFonts=
{
	"roboto mono":{name:"Roboto Mono",sizes:[{weight:"100",style:"normal"},{weight:"100",style:"italic"},{weight:"300",style:"normal"},{weight:"300",style:"italic"},{weight:"400",style:"normal"},{weight:"400",style:"italic"},{weight:"500",style:"normal"},{weight:"700",style:"normal"},{weight:"500",style:"italic"},{weight:"700",style:"italic"}]}
};
AmigaFonts={};
AmigaFonts["topaz"]=
{
	11:{
		width:8,
		height:11,
		style:0,
		flags:66,
		baseLine:9,
		boldSmear:1,
		accessors:0,
		loChar:32,
		hiChar:255
	}
};

