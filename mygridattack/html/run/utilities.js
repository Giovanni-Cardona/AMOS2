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
 * AMOS 2 - Utilities
 *
 * Various utilities
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 03/12/2018
 */
function Utilities( amos )
{
	this.amos = amos;
}

Utilities.prototype.rotate = function( x, y, cx, cy, angle )
{
	var cos = Math.cos( angle );
	var sin = Math.sin( angle );
	var nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
	var ny = (cos * (y - cy)) + (sin * (x - cx)) + cy;
	return { x: nx, y: ny };
};

Utilities.prototype.slice = function( arr, position, length )
{
	var result = [];
	length = typeof length != 'undefined' ? length : 1;
	for ( var p = 0; p < arr.length; p++ )
	{
		if ( p < position || p >= position + length )
		{
			result.push( arr[ p ] );
		}
	}
	return result;
};

Utilities.prototype.getFontString = function( name, height, weight, italic )
{
	var font = '';
	if ( italic )
		font += 'italic ';
	if ( weight )
		font += weight + ' ';
	font += height + 'px ' + name;
	return font;
};
Utilities.prototype.getFontStringHeight = function( fontString )
{
	var height = 10;
	var pos = fontString.indexOf( 'px' );
	if ( pos >= 0 )
		height = parseInt( fontString.substring( 0, pos ) );
	return height;
};


Utilities.prototype.getRGBA = function( r, g, b, a )
{
	a = ( typeof a == 'undefined' ? 255 : 0 );
	return ( ( r & 0xFF ) << 24 ) | ( ( g & 0xFF ) << 16 ) | ( ( b & 0xFF ) << 8 ) | ( a & 0xFF );
};
Utilities.prototype.getRGBAColors = function( rgba )
{
	var result =
	{
		r: ( rgba >> 24 ) & 0xFF,
		g: ( rgba >> 16 ) & 0xFF,
		b: ( rgba  >> 8 ) & 0xFF,
		a: ( rgba & 0xFF )
	};
	return result;
};
Utilities.prototype.getRGBAStringColors = function( rgbaString )
{
	var result = {};	
	result.r = parseInt( rgbaString.substr( 1, 2 ), 16 );
	result.g = parseInt( rgbaString.substr( 3, 2 ), 16 );
	result.b = parseInt( rgbaString.substr( 5, 2 ), 16 );
	result.a = 255;
	if ( rgbaString.length == 9 )
		result.a = parseInt( rgbaString.substr( 7, 2 ), 16 );
	return result;
};
Utilities.prototype.getRGBAString = function( r, g, b, a )
{
	var rr = r.toString( 16 );
	if ( rr.length < 2 ) rr = '0' + rr;
	var gg = g.toString( 16 );
	if ( gg.length < 2 ) gg = '0' + gg;
	var bb = b.toString( 16 );
	if ( bb.length < 2 ) bb = '0' + bb;
	var aa = '';
	if ( typeof a != 'undefined')
	{
		aa = a.toString( 16 );
		if ( aa.length < 2 ) aa = '0' + aa;	
	}
	return '#' + rr + gg + bb + aa;
}
Utilities.prototype.getModernColorString = function( color, short = false )
{
	var colorString = color.toString( 16 );
	if ( short )
	{
		while ( colorString.length < 3 )
			colorString = '0' + colorString;
		colorString = colorString.substr( 0, 1 ) + colorString.substr( 0, 1 ) + colorString.substr( 1, 1 ) + colorString.substr( 1, 1 ) + colorString.substr( 2, 1 ) + colorString.substr( 2, 1 );
	}
	else
	{
		while ( colorString.length < 6 )
			colorString = '0' + colorString;
	}
	return '#' + colorString;
};


Utilities.prototype.pokeString = function( str, replacement, position, length  )
{
	var result = str.substring( 0, position );
	if ( length < replacement.length )
	{
		result += replacement.substr( 0, length );
	}
	else
	{
		result += replacement;
		result += str.substr( position + replacement.length, length - replacement.length );
	}
	result += str.substring( position + length );
	return result;
};
Utilities.prototype.getFilename = function( path )
{
	var posPoint = path.lastIndexOf( '.' );
	if ( posPoint < 0 )
		posPoint = path.length;

	var posSlash1 = path.lastIndexOf( '/' );
	var posSlash2 = path.lastIndexOf( '\\' );
	if ( posSlash1 >= 0 && posSlash2 >= 0 )
		posSlash1 = Math.max( posSlash1, posSlash2 ) + 1;
	else if ( posSlash1 < 0 && posSlash2 < 0 )
		posSlash1 = 0;
	else if ( posSlash1 < 0 )
		posSlash1 = posSlash2 + 1;
	else
		posSlash1++;

	return path.substring( posSlash1, posPoint );
};
Utilities.prototype.convertStringToArrayBuffer = function( str )
{
	var lookup = window.base64Lookup;
	if ( !lookup )
	{
		var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		lookup = new Uint8Array(256);
		for ( var i = 0; i < chars.length; i++ )
		{
			lookup[ chars.charCodeAt( i ) ] = i;
		}
		window.base64Lookup = lookup;
	}

	var bufferLength = str.length * 0.75, len = str.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
	if ( str[ str.length - 1 ] === "=")
	{
		bufferLength--;
		if ( str[ str.length - 2 ] === "=")
		{
			bufferLength--;
		}
	}

	var arraybuffer = new ArrayBuffer( bufferLength ),
	bytes = new Uint8Array( arraybuffer );

	for ( i = 0; i < len; i += 4 )
	{
		encoded1 = lookup[str.charCodeAt(i)];
		encoded2 = lookup[str.charCodeAt(i+1)];
		encoded3 = lookup[str.charCodeAt(i+2)];
		encoded4 = lookup[str.charCodeAt(i+3)];

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
		bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
		bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	}
	return arraybuffer;
};
Utilities.prototype.convertArrayBufferToString = function( arrayBuffer )
{
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var bytes = new Uint8Array( arrayBuffer ), i, len = bytes.length, base64 = "";

	for (i = 0; i < len; i+=3)
	{
		base64 += chars[bytes[i] >> 2];
		base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
		base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
		base64 += chars[bytes[i + 2] & 63];
	}

	if ((len % 3) === 2)
	{
		base64 = base64.substring(0, base64.length - 1) + "=";
	}
	else if (len % 3 === 1)
	{
		base64 = base64.substring(0, base64.length - 2) + "==";
	}
	return base64;
};
Utilities.prototype.loadArraybuffer = function( path, options, callback, extra )
{
	var self = this;
	fetch( path )
  		.then( response => response.text() )
  		.then( ( data ) => {
			var arrayBuffer = self.convertStringToArrayBuffer( data );
			callback( true, arrayBuffer, extra );
		} )
		.catch( function( error )
		{
			callback( false, null, extra );
		} );
}
Utilities.prototype.replaceStringInText = function( text, mark, replacement )
{
	var pos = text.indexOf( mark );
	while( pos >= 0 )
	{
		text = text.substring( 0, pos ) + replacement + text.substring( pos + mark.length );
		pos = text.indexOf( mark );
	}
	return text;
};
Utilities.prototype.loadScript = function( scripts, options, callback, extra )
{
	options = typeof options != 'undefined' ? options : {};
	timeout = typeof options.timeout != 'undefined' ? options.timeout : 1000 * 10;
	if ( typeof scripts == 'string' )
		scripts = [ scripts ];

	var loaded = 0;
	var toLoad = scripts.length;
	var handle = setTimeout( onTimeout, timeout );
	for ( var s = 0; s < scripts.length; s++ )
	{
		var path = scripts[ s ];

		var element = document.createElement( 'script' );
		element.onload = onLoad;
		element.onError = onError;					// Not on all browsers
		element.src = path;
		document.head.appendChild( element ); 		// Adds to the document
		scripts[ s ] = element;

		function onLoad()
		{
			loaded++;
			if ( loaded == toLoad )
			{
				clearTimeout( handle );
				if ( callback )
					callback( true, scripts, extra );
			}
		};
		function onError()
		{
			clearTimeout( handle );
			if ( callback )
				callback( false, scripts, extra );
		};
		function onTimeout()
		{
			if ( callback )
				callback( false, scripts, extra );
		};
	}
};
Utilities.prototype.loadImages = function( images, options, callback, extra )
{
	options = typeof options != 'undefined' ? options : {};
	timeout = typeof options.timeout != 'undefined' ? options.timeout : 1000 * 10;
	if ( typeof images == 'string' )
		images = [ images ];

	var loaded = 0;
	var toLoad = images.length;
	var loadedImages = {};
	for ( var s = 0; s < images.length; s++ )
	{
		var path = images[ s ];

		var i = new Image();
		i.__name = this.getFilename( path );
		i.onload = function()
		{
			loaded++;
			loadedImages[ this.__name ] = this;
			if ( loaded == toLoad )
			{
				clearTimeout( handle );
				if ( callback )
					callback( true, loadedImages, extra );
			}
		};
		i.onerror = function()
		{
			clearTimeout( handle );
			if ( callback )
				callback( false, null, { error: 'load_error' } );
		};
		i.src = path;
	}
	var handle = setTimeout( onTimeout, timeout );
	function onTimeout()
	{
		if ( callback )
			callback( false, null, { error: 'timeout' } );
	};
};
Utilities.prototype.loadUnlockedImage = function( path, options, callback, extra )
{
	
};
Utilities.prototype.convertObjectToArray = function( obj, options )
{
	var	result = [];
	for ( var d = 0; d < obj.length; d++ )
	{
		result.push( obj[ d ] );
	}
	if ( options )
	{
		if ( options.sort == 'up' )
		{
			result.sort( function( a, b )
			{
				return ( a < b ) ? 1 : -1;
			} );
		}
		else if ( options.sort == 'down' )
		{
			result.sort( function( a, b )
			{
				return ( a > b ) ? 1 : -1;
			} );
		}
	}
	return result;
};

Utilities.prototype.copyArray = function ( arr )
{
	var result = [];
	for ( var i = 0; i < arr.length; i++ )
		result[ i ] = arr[ i ];
	return result;
};
Utilities.prototype.cleanArray = function ( arr, exclude )
{
	var temp = {};
	if ( typeof exclude == 'string' )
	{
		for ( var key in arr )
		{
			if ( key != exclude )
				temp[ key ] = arr[ key ];
		}
	}
	else
	{
		for ( var key in arr )
		{
			if ( arr[ key ] && arr[ key ] != exclude )
				temp[ key ] = arr[ key ];
		}
	}
	return temp;
};
Utilities.prototype.isObject = function( item )
{
    return typeof item != 'undefined' ? (typeof item === "object" && !Array.isArray(item) && item !== null) : false;
};
Utilities.prototype.isArray = function( item )
{
    return typeof item != 'undefined' ? item.constructor == Array : false;
};
Utilities.prototype.getTag = function( text, tags )
{
	text = text.toLowerCase();
	for ( var t = 0; t < tags.length; t++ )
	{
		if ( text.indexOf( '#' + tags[ t ].toLowerCase() ) >= 0 )
		{
			return tags[ t ];
		}
	}
	return '';
};



// Memory block class
function MemoryBlock( amos, buffer, endian )
{
	this.amos = amos;
	this.buffer = buffer;
	this.bufferView = new Uint8Array( buffer );
	this.endian = typeof endian != 'undefined' ? endian : 'big';
};
MemoryBlock.prototype.extractString = function( address, length )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	if ( length < 0 )
		throw 'illegal_function"call';
	if ( address + length > this.bufferView.length )
		throw 'illegal_function_call';
	var result = '';
	for ( var l = 0; l < length; l++ )
	{
		var c = this.bufferView[ address + l ];
		if ( c == 0 )
			break;
		if ( c < 32 )
			c = ' ';
		result += String.fromCharCode( c );
	}
	return result;
};
MemoryBlock.prototype.extractArrayBuffer = function( start, end )
{
	start = start - Math.floor( start / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	end = end - Math.floor( end / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	var length = end - start;
	if ( length < 0 || start + length > this.bufferView.length )
		throw 'illegal_function_call';
	var buffer = new ArrayBuffer( length );
	var view = new Uint8Array( buffer );
	for ( var l = 0; l < length; l++ )
	{
		view[ l ] = this.bufferView[ start + l ];
	}
	return buffer;
};
MemoryBlock.prototype.peek = function( address, signed )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	if ( address >= this.bufferView.length )
		throw 'illegal_function_call';
	if ( signed && v >= 0x80 )
		return -( 0x100 - v );
	return this.bufferView[ address ];
};
MemoryBlock.prototype.deek = function( address, signed )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	if ( address + 2 >= this.bufferView.length )
		throw 'illegal_function_call';
	var v;
	if ( this.endian == 'big' )
	{
		v = ( this.bufferView[ address ] & 0xFF ) << 8 | this.bufferView[ address + 1 ] & 0xFF;
	}
	else
	{
		v = ( this.bufferView[ address + 1 ] & 0xFF ) << 8 + this.bufferView[ address ] & 0xFF;
	}
	if ( signed && v >= 0x8000 )
		return -( 0x10000 - v );
	return v;
};
MemoryBlock.prototype.leek = function( address, signed )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	if ( address + 4 >= this.bufferView.length )
		throw 'illegal_function_call';
	var v;
	if ( this.endian == 'big' )
	{
		v = ( this.bufferView[ address ] & 0xFF ) << 24 | ( this.bufferView[ address + 1 ] & 0xFF ) << 16 | ( this.bufferView[ address + 2 ] & 0xFF ) << 8 | this.bufferView[ address + 3 ] & 0xFf;
	}
	else
	{
		v = ( this.bufferView[ address + 3 ] & 0xFF ) << 24 | ( this.bufferView[ address + 2 ] & 0xFF ) << 16 | ( this.bufferView[ address + 1 ] & 0xFF ) << 8 | this.bufferView[ address ] & 0xFF;
	}
	if ( signed && v >= 0x80000000 )
		return -( 0x100000000 - v );
	return v;
};
MemoryBlock.prototype.poke = function( address, value )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	value &= 0xFF;
	if ( address >= this.bufferView.length )
		throw 'illegal_function_call';
	this.bufferView[ address ] = value;
};
MemoryBlock.prototype.doke = function( address, value )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	value &= 0xFFFF;
	if ( address + 2 >= this.bufferView.length )
		throw 'illegal_function_call';
	if ( this.endian == 'big' )
	{
		this.bufferView[ address ] = ( value >> 8 ) & 0xFF;
		this.bufferView[ address + 1 ] = value & 0xFF;
	}
	else
	{
		this.bufferView[ address ] = value & 0xFF;
		this.bufferView[ address + 1 ] = ( value & 0xFF ) >> 8;
	}
};
MemoryBlock.prototype.loke = function( address, value )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	value &= 0xFFFFFFFF;
	if ( address + 4 >= this.bufferView.length )
		throw 'illegal_function_call';
	if ( this.endian == 'big' )
	{
		this.bufferView[ address ] = ( value >> 24 ) & 0xFF;
		this.bufferView[ address + 1 ] = ( value >> 16 ) & 0xFF;
		this.bufferView[ address + 2 ] = ( value  >> 8 ) & 0xFF;
		this.bufferView[ address + 3 ] = value & 0xFF;
	}
	else
	{
		this.bufferView[ address ] = value & 0xFF;
		this.bufferView[ address + 1 ] = ( value  >> 8 ) & 0xFF;
		this.bufferView[ address + 2 ] = ( value  >> 16 ) & 0xFF;
		this.bufferView[ address + 3 ] = ( value  >> 24 ) & 0xFF;
	}
};
MemoryBlock.prototype.pokeArrayBuffer = function( address, buffer )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	var view = new Uint8Array( buffer );
	if ( address + view.length > this.bufferView.length )
		throw 'illegal_function_call';
	for ( var b = 0; b < view.length; b++ )
		this.bufferView[ address + b ] = view[ b ];
};
MemoryBlock.prototype.poke$ = function( address, text )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	if ( address + text.length > this.bufferView.length )
		throw 'illegal_function_call';
	for ( var p = 0; p < text.length; p++ )
		this.bufferView[ address + p ] = text.charCodeAt( p ) & 0xFF;
};
MemoryBlock.prototype.peek$ = function( address, length, stop )
{
	address = address - Math.floor( address / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	var text = '';
	for ( var p = 0; p < length; p++ )
	{
		var c = String.fromCharCode( this.bufferView[ address + p ] );
		if ( c == stop )
			break;
		if ( address + p > this.bufferView.length )
			throw 'illegal_function_call';
		text += c;
	}
	return text;
};
MemoryBlock.prototype.fill = function( start, end, value )
{
	start = start - Math.floor( start / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	end = end - Math.floor( end / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	var length = end - start;
	if ( length < 0 || start + length > this.bufferView.length )
		throw 'illegal_function_call';

	for ( var p = 0; p <= length - 4; p += 4 )
		this.loke( start + p, value );
	for ( ; p < length; p++ )
	{
		if ( this.endian == 'big' )
		{
			this.poke( start + p, ( value & 0xFF000000 ) >> 24 );
			value = value << 8;
		}
		else
		{
			this.poke( start + p, value & 0xFF );
			value = value >> 8;
		}
	}
};
MemoryBlock.prototype.copy = function( source, destination, length )
{
	source = source - Math.floor( source / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	block = this.amos.getMemoryBlockFromAdress( destination );
	destination = destination - Math.floor( destination / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	if ( address + length > this.bufferView.length || destinationAddress + length > block.bufferView.length )
		throw 'illegal_function_call';
	if ( block == this )
	{
		if ( destination < source )
		{
			for ( var p = 0; p < length; p++ )
				this.bufferView[ destination + p ] = this.bufferView[ source + p ];
		}
		else
		{
			for ( var p = length - 1; p >= 0; p-- )
				this.bufferView[ destination + p ] = this.bufferView[ source + p ];
		}
	}
	else
	{
		for ( var p = length - 1; p >= 0; p-- )
			block.bufferView[ destination + p ] = this.bufferView[ source + p ];
	}
};
MemoryBlock.prototype.hunt = function( start, end, text )
{
	start = start - Math.floor( start / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	end = end - Math.floor( end / this.amos.memoryHashMultiplier ) * this.amos.memoryHashMultiplier;
	var length = end - start;
	if ( length < 0 )
		throw 'illegal_function_call';
	if ( start + text.length > this.bufferView.length )
		return 0;
	for ( var i = 0; i < length - text.length; i++ )
	{
		for ( var j = 0; j < text.length; j++ )
		{
			if ( this.bufferView[ start + i + j ] != text.charCodeAt( j ) & 0xFF )
				break;
		}
		if ( j == text.length )
			return this.memoryHash * this.amos.memoryHashMultiplier + i;
	}
	return 0;
};

Utilities.prototype.getCharacterType = function( c )
{
	if ( c >= '0' && c <= '9' )
		type = 'number';
	else if ( c == ' ' || c == "\t" )
		type = 'space';
	else if ( ( c >= 'a' && c <= 'z') || ( c >= 'A' && c <= 'Z' ) || c == '_' )
		type = 'letter';
	else if ( c == '"' || c == "'"  )
		type = 'quote';
	else if ( c == ':' )
		type = 'column';
	else if ( c == ';' )
		type = 'semicolumn';
	else if ( c == '-' )
		type = 'minus';
	else if ( c == '(' || c == ')' )
		type = 'bracket';
	else
		type = 'other';
	return type;
};

// Fix coordinates
Utilities.prototype.getZone = function( x1, y1, x2, y2, scale )
{
	scale = typeof scale == 'undefined' ? 1 : scale;
	var result = { x: x1 * scale, y: y1 * scale, width: ( x2 - x1 ) * scale, height: ( y2 - y1 ) * scale };
	if ( result.width < 0 )
	{
		result.x = x2;
		result.width = -result.width;
	}
	if ( result.height < 0 )
	{
		result.y = y2;
		result.height = -result.height;
	}
	return result;
};
Utilities.prototype.remapBlock = function( context, rgbaSource, rgbaDestination, coordinates )
{
	// Do the remapping
	if ( coordinates.width > 0 && coordinates.height > 0 )
	{
		var imageData = context.getImageData( coordinates.x, coordinates.y, coordinates.width, coordinates.height );

		var data = imageData.data;
		if ( rgbaSource.length == 1 )
		{
			rgbaSource = rgbaSource[ 0 ];
			rgbaDestination = rgbaDestination[ 0 ];
			var alpha = typeof rgbaDestination.a != 'undefined';
			for ( var p = 0; p < data.length; p += 4 )
			{
				if ( data[ p ] == rgbaSource.r && data[ p + 1 ] == rgbaSource.g && data[ p + 2 ] == rgbaSource.b )
				{			
					data[ p ] = rgbaDestination.r;
					data[ p + 1 ] = rgbaDestination.g;
					data[ p + 2 ] = rgbaDestination.b;
					if ( alpha )
						data[ p + 3 ] = rgbaDestination.a;
				}
			}
		}
		else
		{
			for ( var p = 0; p < data.length; p += 4 )
			{
				for ( var c = 0; c < rgbaSource.length; c++ )
				{
					var source = rgbaSource[ c ];
					if ( data[ p ] == source.r && data[ p + 1 ] == source.g && data[ p + 2 ] == source.b )
					{
						var destination = rgbaDestination[ c ];
						data[ p ] = destination.r;
						data[ p + 1 ] = destination.g;
						data[ p + 2 ] = destination.b;
						if ( typeof destination.a != 'undefined' )
							data[ p + 3 ] = destination.a;
					}
				}
			}
		}
		context.putImageData( imageData, coordinates.x, coordinates.y );
	}
};
Utilities.prototype.loadUnlockedImage = function( path, type, options, callback, extra )
{
	var self = this;
	this.loadScript( path, options, function( response, data, extra )
	{
		if ( response )
		{
			var name = 'image_' + self.getFilename( path );
			if ( window[ name ] )
			{
				if ( !type )
					type = 'image/png';
				var arrayBuffer = self.convertStringToArrayBuffer( window[ name ] );
				var blob = new Blob( [ arrayBuffer ], { type: type } );
				var urlCreator = window.URL || window.webkitURL;
				var imageUrl = urlCreator.createObjectURL( blob );
				var image = new Image();
				image.onload = function()
				{
					window[ name ] = '';
					callback( true, this, extra );
				};
				image.src = imageUrl;
			}
			else
			{
				callback( false, null, extra );
			}
		}
		else
		{
			callback( false, null, extra );
		}
	}, extra );
};

