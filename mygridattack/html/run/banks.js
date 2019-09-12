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
 * @date first pushed on 28/02/2018
 */
function Banks( amos )
{
	this.amos = amos;
	this.utilities = amos.utilities;
	this.manifest = amos.manifest;
	this.banks = [];
};

Banks.prototype.reserve = function( number, type, length )
{
	if ( number < 0 )
		throw 'illegal_function_call';
	if ( !this.manifest.unlimitedBanks && number > 16 )
		throw 'illegal_function_call';
	if ( length < 0 )
		throw 'illegal_function_call';
	var buffer = new ArrayBuffer( length );
	if ( buffer )
	{
		var memoryBlock = this.amos.allocMemoryBlock( buffer, this.manifest.compilation.endian );
		this.banks[ number ] =
		{
			type: type,
			length: length,
			memoryBlock: memoryBlock
		};
	}
	else
	{
		throw 'out_of_memory';
	}
};
Banks.prototype.erase = function( number )
{
	if ( number < 1 )
		throw 'illegal_function_call';
	if ( !this.manifest.unlimitedBanks && number > 16 )
		throw 'illegal_function_call';
	var bank = this.banks[ number ];
	if ( !bank )
		throw 'bank_not_reserved';
	this.amos.freeMemoryBlock( bank.memoryBlock );
	this.banks[ number ] = null;
};
Banks.prototype.getStart = function( number )
{
	if ( number < 1 )
		throw 'illegal_function_call';
	if ( !this.manifest.unlimitedBanks && number > 16 )
		throw 'illegal_function_call';
	var bank = this.banks[ number ];
	if ( !bank )
		throw 'bank_not_reserved';
	return bank.memoryBlock.memoryHash * this.amos.memoryHashMultiplier;
};
Banks.prototype.getLength = function( number )
{
	if ( number < 1 )
		throw 'illegal_function_call';
	if ( !this.manifest.unlimitedBanks && number > 16 )
		throw 'illegal_function_call';
	var bank = this.banks[ number ];
	if ( !bank )
		throw 'bank_not_reserved';
	return bank.length;
};
Banks.prototype.listBank = function()
{
	var result = '';
	for ( var b = 0; b < this.banks.length; b++ )
	{
		var bank = this.banks[ b ];
		if ( bank )
		{
			result = ' ' + b + ' - ' + bank.type + '     ' + 'S: ' + this.amos.hex$( bank.memoryBlock.memoryHash >> 8, 8 ) + ' L: ' + bank.length;
			this.amos.currentScreen.currentWindow.print( result, true );
		}
	}
};
