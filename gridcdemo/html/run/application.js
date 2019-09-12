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
//
// Paralbounce.
// By Giovanni Cardona
// Version 1.0
// Sep. 2019
// (c) Evermagica
//
// Compiled with AMOS 2 compiler version 0.7 - 07/08/2019 on the 07/09/2019-12:12:05
//

function Application( canvasId )
{
	this.manifest = JSON.parse('{"version":"6","infos":{"applicationName":"Paralbounce.","author":"By Giovanni Cardona","version":"Version 1.0","date":"Sep. 2019","copyright":"(c) Evermagica","start":"main.amos"},"compilation":{"speed":"fast","syntax":"amos2","emulation":"PC","usePalette":true,"useShortColors":false,"showCopperBlack":false,"unlimitedScreens":true,"unlimitedWindows":true,"maskHardwareCoordinates":false,"endian":"little"},"display":{"tvStandard":"pal","width":1024,"height":720,"background":"color","backgroundColor":"#000000","bodyBackgroundColor":"#000000","bodyBackgroundImage":"./runtime/resources/star_night.jpeg","scaleX":3,"scaleY":3,"screenScale":2,"fps":false,"fpsFont":"12px Verdana","fpsColor":"#FFFF00","fpsX":10,"fpsY":16,"fullPage":0,"fullScreen":0,"keepProportions":true,"fullScreenIcon":true,"fullScreenIconX":-34,"fullScreenIconY":2,"fullScreenIconImage":"./runtime/resources/full_screen.png","smallScreenIconImage":"./runtime/resources/small_screen.png"},"sprites":{"collisionBoxed":false,"collisionPrecision":1,"collisionAlphaThreshold":1},"fonts":{"listFonts":"PC","amiga":["topaz"],"google":["roboto mono"]},"default":{"screen":{"x":0,"y":0,"width":320,"height":200,"numberOfColors":32,"pixelMode":"lowres","palette":["#000000","#0022CC","#0011AA","#223388","#FF0000","#00FF00","#0000FF","#666666","#555555","#333333","#773333","#337733","#777733","#333377","#773377","#337777","#000000","#EECC88","#CC6600","#EEAA00","#2277FF","#4499DD","#55AAEE","#AADDFF","#BBDDFF","#CCEEFF","#FFFFFF","#440088","#AA00EE","#EE00EE","#EE0088","#EEEEEE"],"window":{"x":0,"y":0,"fontWidth":8,"fontHeight":8,"border":0,"paper":0,"pen":7,"background":"opaque","font":{"name":"topaz","type":"amiga","height":8},"cursorImage":"./runtime/resources/cursor_pc.png","cursorColors":[{"r":68,"g":68,"b":0,"a":128},{"r":136,"g":136,"b":0,"a":128},{"r":187,"g":187,"b":0,"a":128},{"r":221,"g":221,"b":0,"a":128},{"r":238,"g":238,"b":0,"a":128},{"r":255,"g":255,"b":34,"a":128},{"r":255,"g":255,"b":136,"a":128},{"r":255,"g":255,"b":204,"a":128},{"r":255,"g":255,"b":255,"a":128},{"r":170,"g":170,"b":255,"a":128},{"r":136,"g":136,"b":204,"a":128},{"r":102,"g":102,"b":170,"a":128},{"r":34,"g":34,"b":102,"a":128},{"r":0,"g":0,"b":68,"a":128},{"r":0,"g":0,"b":17,"a":128},{"r":0,"g":0,"b":0,"a":128}]}}}}');
	this.parent = this;
	this.root = this;
	this.amos=new AMOS(canvasId,this.manifest);

	// Compiled program begins here
	// ----------------------------
	this.vars=
	{
		mscreenx:0,
		mscreeny:0,
		mscreenHalfx:0,
		mscreenHalfy:0,
		bobsize:0,
		bobhalfsize:0,
		bobquartsize:0,
		screencount:0,
		spx:0,
		spy:0,
		x1:0,
		y1:0,
		PiHalf_:0.0,
		PiRound_:0.0,
		lyball:0,
		lybdirection:0,
		pastScale:0,
		bOnce:0,
		bZFlag:0,
		screensize_array:new AArray(this.amos,0,0),
		gridblocksize_array:new AArray(this.amos,0,0),
		gridinkcolor_array:new AArray(this.amos,0,0),
		gridweight_array:new AArray(this.amos,0,0),
		sinxmult_array:new AArray(this.amos,0,0),
		sinymult_array:new AArray(this.amos,0,0),
		sinxoffs_array:new AArray(this.amos,0,0),
		sinyoffs_array:new AArray(this.amos,0,0),
		screens:0,
		bx:0,
		ly:0
	}
	this.blocks=[];
	this.blocks[0]=function()
	{
		// Curs Off :
		this.amos.sourcePos="1:0";
		this.amos.currentScreen.getCurrentWindow().setCursor(false);
		// 'Set Transparent 0
		// 'Cls 0: Paper 0: Pen 6
		// Hot Spot 1, $32
		this.amos.sourcePos="4:0";
		this.amos.setHotSpot(1,"mask",0x32);
		// degree
		this.amos.sourcePos="5:0";
		this.amos.degreeRadian=180.0/Math.PI;
		// ' --- Init vars
		// mscreenx=320: mscreeny=200: mscreenHalfx=mscreenx/2 : mscreenHalfy=mscreeny/2
		this.amos.sourcePos="8:0";
		this.vars.mscreenx=320;
		this.amos.sourcePos="8:14";
		this.vars.mscreeny=200;
		this.amos.sourcePos="8:28";
		this.vars.mscreenHalfx=Math.floor(this.vars.mscreenx/2);
		this.amos.sourcePos="8:54";
		this.vars.mscreenHalfy=Math.floor(this.vars.mscreeny/2);
		// bobsize=64: bobhalfsize=bobsize/2: bobquartsize=bobhalfsize/2
		this.amos.sourcePos="9:0";
		this.vars.bobsize=64;
		this.amos.sourcePos="9:12";
		this.vars.bobhalfsize=Math.floor(this.vars.bobsize/2);
		this.amos.sourcePos="9:35";
		this.vars.bobquartsize=Math.floor(this.vars.bobhalfsize/2);
		// screencount=4: spx=1: spy=2
		this.amos.sourcePos="10:0";
		this.vars.screencount=4;
		this.amos.sourcePos="10:15";
		this.vars.spx=1;
		this.amos.sourcePos="10:22";
		this.vars.spy=2;
		// x1=mscreenHalfx: y1=mscreenHalfy
		this.amos.sourcePos="11:0";
		this.vars.x1=Math.floor(this.vars.mscreenHalfx);
		this.amos.sourcePos="11:17";
		this.vars.y1=Math.floor(this.vars.mscreenHalfy);
		// PiHalf#=Pi#/2 : PiRound#=2*Pi#
		this.amos.sourcePos="12:0";
		this.vars.PiHalf_=Math.PI/2;
		this.amos.sourcePos="12:16";
		this.vars.PiRound_=2*Math.PI;
		// lyball = 1: lybdirection = 1 : pastScale = 1
		this.amos.sourcePos="13:0";
		this.vars.lyball=1;
		this.amos.sourcePos="13:12";
		this.vars.lybdirection=1;
		this.amos.sourcePos="13:31";
		this.vars.pastScale=1;
		// bOnce = 0: bZFlag = 0
		this.amos.sourcePos="14:0";
		this.vars.bOnce=0;
		this.amos.sourcePos="14:11";
		this.vars.bZFlag=0;
		// Dim screensize(screencount,2):
		this.amos.sourcePos="15:0";
		this.vars.screensize_array.dim([this.vars.screencount,2],0);
		// screensize(1,spx)=mscreenx: screensize(1,spy)=mscreeny
		this.amos.sourcePos="16:0";
		this.vars.screensize_array.setValue([1,this.vars.spx],Math.floor(this.vars.mscreenx));
		this.amos.sourcePos="16:28";
		this.vars.screensize_array.setValue([1,this.vars.spy],Math.floor(this.vars.mscreeny));
		// screensize(2,spx)=256: screensize(2,spy)=160
		this.amos.sourcePos="17:0";
		this.vars.screensize_array.setValue([2,this.vars.spx],256);
		this.amos.sourcePos="17:23";
		this.vars.screensize_array.setValue([2,this.vars.spy],160);
		// screensize(3,spx)=240: screensize(3,spy)=112
		this.amos.sourcePos="18:0";
		this.vars.screensize_array.setValue([3,this.vars.spx],240);
		this.amos.sourcePos="18:23";
		this.vars.screensize_array.setValue([3,this.vars.spy],112);
		// screensize(4,spx)=224: screensize(4,spy)=88
		this.amos.sourcePos="19:0";
		this.vars.screensize_array.setValue([4,this.vars.spx],224);
		this.amos.sourcePos="19:23";
		this.vars.screensize_array.setValue([4,this.vars.spy],88);
		// Dim gridblocksize(screencount): gridblocksize(2)=32: gridblocksize(3)=16: gridblocksize(4)=8
		this.amos.sourcePos="20:0";
		this.vars.gridblocksize_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="20:32";
		this.vars.gridblocksize_array.setValue([2],32);
		this.amos.sourcePos="20:53";
		this.vars.gridblocksize_array.setValue([3],16);
		this.amos.sourcePos="20:74";
		this.vars.gridblocksize_array.setValue([4],8);
		// Dim gridinkcolor(screencount) : gridinkcolor(2)=1  : gridinkcolor(3)=2  : gridinkcolor(4)=3
		this.amos.sourcePos="21:0";
		this.vars.gridinkcolor_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="21:32";
		this.vars.gridinkcolor_array.setValue([2],1);
		this.amos.sourcePos="21:53";
		this.vars.gridinkcolor_array.setValue([3],2);
		this.amos.sourcePos="21:74";
		this.vars.gridinkcolor_array.setValue([4],3);
		// Dim gridweight(screencount)   : gridweight(1)=1    : gridweight(2)=3    : gridweight(3)=2   : gridweight(4)=1
		this.amos.sourcePos="22:0";
		this.vars.gridweight_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="22:32";
		this.vars.gridweight_array.setValue([1],1);
		this.amos.sourcePos="22:53";
		this.vars.gridweight_array.setValue([2],3);
		this.amos.sourcePos="22:74";
		this.vars.gridweight_array.setValue([3],2);
		this.amos.sourcePos="22:94";
		this.vars.gridweight_array.setValue([4],1);
		// Dim sinxmult(screencount) : sinxmult(1)=136: sinxmult(2)=22 : sinxmult(3)=42  : sinxmult(4)=56
		this.amos.sourcePos="23:0";
		this.vars.sinxmult_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="23:28";
		this.vars.sinxmult_array.setValue([1],136);
		this.amos.sourcePos="23:45";
		this.vars.sinxmult_array.setValue([2],22);
		this.amos.sourcePos="23:62";
		this.vars.sinxmult_array.setValue([3],42);
		this.amos.sourcePos="23:80";
		this.vars.sinxmult_array.setValue([4],56);
		// Dim sinymult(screencount) : sinymult(1)=56 : sinymult(2)=36 : sinymult(3)=24  : sinymult(4)=12
		this.amos.sourcePos="24:0";
		this.vars.sinymult_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="24:28";
		this.vars.sinymult_array.setValue([1],56);
		this.amos.sourcePos="24:45";
		this.vars.sinymult_array.setValue([2],36);
		this.amos.sourcePos="24:62";
		this.vars.sinymult_array.setValue([3],24);
		this.amos.sourcePos="24:80";
		this.vars.sinymult_array.setValue([4],12);
		// Dim sinxoffs(screencount) : sinxoffs(1)=12: sinxoffs(2)=44 : sinxoffs(3)=52  : sinxoffs(4)=60
		this.amos.sourcePos="25:0";
		this.vars.sinxoffs_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="25:28";
		this.vars.sinxoffs_array.setValue([1],12);
		this.amos.sourcePos="25:44";
		this.vars.sinxoffs_array.setValue([2],44);
		this.amos.sourcePos="25:61";
		this.vars.sinxoffs_array.setValue([3],52);
		this.amos.sourcePos="25:79";
		this.vars.sinxoffs_array.setValue([4],60);
		// Dim sinyoffs(screencount) : sinyoffs(1)=bobsize : sinyoffs(2)=44 : sinyoffs(3)=27  : sinyoffs(4)=12
		this.amos.sourcePos="26:0";
		this.vars.sinyoffs_array.dim([this.vars.screencount],0);
		this.amos.sourcePos="26:28";
		this.vars.sinyoffs_array.setValue([1],Math.floor(this.vars.bobsize));
		this.amos.sourcePos="26:50";
		this.vars.sinyoffs_array.setValue([2],44);
		this.amos.sourcePos="26:67";
		this.vars.sinyoffs_array.setValue([3],27);
		this.amos.sourcePos="26:85";
		this.vars.sinyoffs_array.setValue([4],12);
		// ' -- create screens
		// for screens=1 to screencount
		this.amos.sourcePos="29:0";
		this.vars.screens=1;
		if(this.vars.screens>this.vars.screencount)
			return{type:1,label:3};
	};
	this.blocks[1]=function()
	{
		// CreateScreen[screens,screensize(screens,spx),screensize(screens,spy),gridweight(screens)]
		this.amos.sourcePos="30:1";
		return {type:4,procedure:procCreateScreen,args:{p_screen_num:this.vars.screens,p_width:this.vars.screensize_array.getValue([this.vars.screens,this.vars.spx]),p_height:this.vars.screensize_array.getValue([this.vars.screens,this.vars.spy]),p_weight:this.vars.gridweight_array.getValue([this.vars.screens])}};
	};
	this.blocks[2]=function()
	{
		// next screens
		this.amos.sourcePos="31:0";
		this.vars.screens+=1;
		if(this.vars.screens<=this.vars.screencount)
			return{type:1,label:1}
	};
	this.blocks[3]=function()
	{
		// ' -- draw grids
		// for screens=2 to screencount
		this.amos.sourcePos="34:0";
		this.vars.screens=2;
		if(this.vars.screens>this.vars.screencount)
			return{type:1,label:6};
	};
	this.blocks[4]=function()
	{
		// DrawGrid[screens, gridblocksize(screens), gridinkcolor(screens), gridweight(screens)]
		this.amos.sourcePos="35:1";
		return {type:4,procedure:procDrawGrid,args:{p_screen_num:this.vars.screens,p_steps:this.vars.gridblocksize_array.getValue([this.vars.screens]),p_ink:this.vars.gridinkcolor_array.getValue([this.vars.screens]),p_weight:this.vars.gridweight_array.getValue([this.vars.screens])}};
	};
	this.blocks[5]=function()
	{
		// next screens
		this.amos.sourcePos="36:0";
		this.vars.screens+=1;
		if(this.vars.screens<=this.vars.screencount)
			return{type:1,label:4}
	};
	this.blocks[6]=function()
	{
		// ' --
		// screen 1: Bob 1,mscreenHalfx-bobhalfsize,mscreenHalfy-bobhalfsize,1
		this.amos.sourcePos="39:0";
		this.amos.screen(1);
		this.amos.sourcePos="39:10";
		this.amos.currentScreen.bob4(1,this.vars.mscreenHalfx-this.vars.bobhalfsize,this.vars.mscreenHalfy-this.vars.bobhalfsize,1);
		// 'screen to back 0
		// screen close 0
		this.amos.sourcePos="42:0";
		this.amos.screenClose(0);
		// '-- START LOOP
		// Do
		this.amos.sourcePos="45:1";
	};
	this.blocks[7]=function()
	{
		// 'move screens
		// bx=-(sin(PiHalf#*x1*2))*sinxmult(1)+sinxoffs(1)
		this.amos.sourcePos="47:5";
		this.vars.bx=Math.floor(-(Math.sin((this.vars.PiHalf_*this.vars.x1*2)/this.amos.degreeRadian))*this.vars.sinxmult_array.getValue([1])+this.vars.sinxoffs_array.getValue([1]));
		// Screen Display 1,bx,-(sin(PiRound#*y1*2))*sinymult(1)+sinyoffs(1),,
		this.amos.sourcePos="48:2";
		this.amos.screenDisplay(1,this.vars.bx,-(Math.sin((this.vars.PiRound_*this.vars.y1*2)/this.amos.degreeRadian))*this.vars.sinymult_array.getValue([1])+this.vars.sinyoffs_array.getValue([1]),undefined,undefined);
		// for screens=2 to screencount
		this.amos.sourcePos="49:2";
		this.vars.screens=2;
		if(this.vars.screens>this.vars.screencount)
			return{type:1,label:9};
	};
	this.blocks[8]=function()
	{
		// Screen Display screens,(sin(PiHalf#*x1*2))*sinxmult(screens)+sinxoffs(screens),(sin(PiRound#*y1*2))*sinymult(screens)+sinyoffs(screens),,
		this.amos.sourcePos="50:6";
		this.amos.screenDisplay(this.vars.screens,(Math.sin((this.vars.PiHalf_*this.vars.x1*2)/this.amos.degreeRadian))*this.vars.sinxmult_array.getValue([this.vars.screens])+this.vars.sinxoffs_array.getValue([this.vars.screens]),(Math.sin((this.vars.PiRound_*this.vars.y1*2)/this.amos.degreeRadian))*this.vars.sinymult_array.getValue([this.vars.screens])+this.vars.sinyoffs_array.getValue([this.vars.screens]),undefined,undefined);
		// next screens
		this.amos.sourcePos="51:8";
		this.vars.screens+=1;
		if(this.vars.screens<=this.vars.screencount)
			return{type:1,label:8}
	};
	this.blocks[9]=function()
	{
		// 'Screen Offset 2,,y1 : 'offset not working with line draw
		// 'if ball right screen
		// if ((bx >= sinxmult(1)+sinxoffs(1)-1) or (bx <= -(sinxmult(1)-sinxoffs(1)))) and bOnce = 0
		this.amos.sourcePos="56:8";
		if(!(((this.vars.bx>=this.vars.sinxmult_array.getValue([1])+this.vars.sinxoffs_array.getValue([1])-1)|(this.vars.bx<=-(this.vars.sinxmult_array.getValue([1])-this.vars.sinxoffs_array.getValue([1]))))&&this.vars.bOnce==0))
			return{type:1,label:14};
		// 'screen 0: cls 0: locate 0,0: print lyball
		// bOnce = 1 'once per loop
		this.amos.sourcePos="58:3";
		this.vars.bOnce=1;
		// 'change ball direction
		// lyball = lyball + lybdirection
		this.amos.sourcePos="60:3";
		this.vars.lyball=Math.floor(this.vars.lyball+this.vars.lybdirection);
		// if (lyball > screencount or lyball < 1)
		this.amos.sourcePos="61:3";
		if(!((this.vars.lyball>this.vars.screencount|this.vars.lyball<1)))
			return{type:1,label:10};
		// lybdirection = lybdirection * -1 'reverse direction
		this.amos.sourcePos="62:4";
		this.vars.lybdirection=Math.floor(this.vars.lybdirection*-1);
		// lyball = lyball + lybdirection   'reset pos if out of bounds
		this.amos.sourcePos="63:4";
		this.vars.lyball=Math.floor(this.vars.lyball+this.vars.lybdirection);
		// end if
		this.amos.sourcePos="64:3";
	};
	this.blocks[10]=function()
	{
		// screen 1 : 'scale and move up ball between screens
		this.amos.sourcePos="65:3";
		this.amos.screen(1);
		// Bob Scale 1,1/lyball,1/lyball
		this.amos.sourcePos="66:3";
		this.amos.currentScreen.bobScale(1,1/this.vars.lyball,1/this.vars.lyball);
		// Bob 1,(mscreenHalfx-bobhalfsize),(mscreenHalfy-bobhalfsize)-(lyball*bobquartsize)+bobquartsize,1
		this.amos.sourcePos="67:3";
		this.amos.currentScreen.bob4(1,(this.vars.mscreenHalfx-this.vars.bobhalfsize),(this.vars.mscreenHalfy-this.vars.bobhalfsize)-(this.vars.lyball*this.vars.bobquartsize)+this.vars.bobquartsize,1);
		// 're-arrange screen layers to move ball between layers
		// for ly=2 to 4
		this.amos.sourcePos="69:3";
		this.vars.ly=2;
		if(this.vars.ly>4)
			return{type:1,label:13};
	};
	this.blocks[11]=function()
	{
		// Screen to back ly
		this.amos.sourcePos="70:6";
		this.amos.screenToBack(this.vars.ly);
		// if lyball=ly
		this.amos.sourcePos="71:6";
		if(!(this.vars.lyball==this.vars.ly))
			return{type:1,label:12};
		// Screen to back 1
		this.amos.sourcePos="72:8";
		this.amos.screenToBack(1);
		// end if
		this.amos.sourcePos="73:6";
	};
	this.blocks[12]=function()
	{
		// next ly
		this.amos.sourcePos="74:3";
		this.vars.ly+=1;
		if(this.vars.ly<=4)
			return{type:1,label:11}
	};
	this.blocks[13]=function()
	{
		// pastScale = lyball
		this.amos.sourcePos="75:3";
		this.vars.pastScale=Math.floor(this.vars.lyball);
		// end if
		this.amos.sourcePos="76:5";
	};
	this.blocks[14]=function()
	{
		// if ((bx < sinxmult(1)+sinxoffs(1)-1) and (bx > -(sinxmult(1)-sinxoffs(1)))) then bOnce=0 'reset once per loop flag
		this.amos.sourcePos="78:2";
		if(!(((this.vars.bx<this.vars.sinxmult_array.getValue([1])+this.vars.sinxoffs_array.getValue([1])-1)&(this.vars.bx>-(this.vars.sinxmult_array.getValue([1])-this.vars.sinxoffs_array.getValue([1]))))))
			return{type:1,label:15};
		this.amos.sourcePos="78:83";
		this.vars.bOnce=0;
	};
	this.blocks[15]=function()
	{
		// Inc y1: Inc x1
		this.amos.sourcePos="80:2";
		this.vars.y1++;
		this.amos.sourcePos="80:10";
		this.vars.x1++;
		// 'screen 0: cls 0: locate 10,0: print bx
		// if Inkey$ <> "" Then Exit
		this.amos.sourcePos="83:2";
		if(!(this.amos.inkey$()!=""))
			return{type:1,label:16};
		this.amos.sourcePos="83:23";
		return{type:1,label:19};
	};
	this.blocks[16]=function()
	{
		// Wait Vbl: Wait Vbl
		this.amos.sourcePos="85:2";
		return{type:8,instruction:"waitVbl",args:[]};
	};
	this.blocks[17]=function()
	{
		this.amos.sourcePos="85:12";
		return{type:8,instruction:"waitVbl",args:[]};
	};
	this.blocks[18]=function()
	{
		// 'Wait 1
		// Loop
		this.amos.sourcePos="88:1";
		return{type:1,label:7};
	};
	this.blocks[19]=function()
	{
		// end
		this.amos.sourcePos="91:1";
		return{type:0}
	};
	this.blocks[20]=function()
	{
		return {type:0};
	};
	this.amos.run(this,0,null);
};
function procCreateScreen(amos,root)
{
	this.amos=amos;
	this.root=root;
	var self=this;
	this.reset=function()
	{
		self.vars=
		{
			p_screen_num:0,
			p_width:0,
			p_height:0,
			p_weight:0
		};
	};
	this.blocks=[];
	this.blocks[0]=function()
	{
		// Screen Open p_screen_num,p_width+p_weight-1,p_height+p_weight-1,8,Lowres
		this.amos.sourcePos="95:2";
		this.amos.screenOpen(this.vars.p_screen_num,this.vars.p_width+this.vars.p_weight-1,this.vars.p_height+this.vars.p_weight-1,8,0);
		// Palette $000000, $0066EE, $1144BB, $224477
		this.amos.sourcePos="96:1";
		this.amos.currentScreen.setPalette([0x000000,0x0066EE,0x1144BB,0x224477]);
		// Curs Off : Flash Off: Set Transparent 0: Cls 0
		this.amos.sourcePos="97:1";
		this.amos.currentScreen.getCurrentWindow().setCursor(false);
		this.amos.sourcePos="97:12";
		this.amos.sourcePos="97:23";
		this.amos.currentScreen.setTransparent([0],true);
		this.amos.sourcePos="97:42";
		this.amos.currentScreen.cls(0);
		// Screen Display p_screen_num,0,0,p_width,p_height
		this.amos.sourcePos="98:1";
		this.amos.screenDisplay(this.vars.p_screen_num,0,0,this.vars.p_width,this.vars.p_height);
		// 'Screen Offset p_screen_num,p_width,p_height
		// screen to back
		this.amos.sourcePos="100:2";
		this.amos.screenToBack();
		// end proc
		return{type:0};
	};
};
function procDrawGrid(amos,root)
{
	this.amos=amos;
	this.root=root;
	var self=this;
	this.reset=function()
	{
		self.vars=
		{
			p_screen_num:0,
			p_steps:0,
			p_ink:0,
			p_weight:0,
			BoxSize:0,
			y:0,
			x:0
		};
	};
	this.blocks=[];
	this.blocks[0]=function()
	{
		// Screen p_screen_num
		this.amos.sourcePos="104:4";
		this.amos.screen(this.vars.p_screen_num);
		// Ink p_ink
		this.amos.sourcePos="105:1";
		this.amos.currentScreen.setInk(this.vars.p_ink);
		// BoxSize = p_steps
		this.amos.sourcePos="106:1";
		this.vars.BoxSize=Math.floor(this.vars.p_steps);
		// y=0: x=0 'why?
		this.amos.sourcePos="107:1";
		this.vars.y=0;
		this.amos.sourcePos="107:6";
		this.vars.x=0;
		// 'horizontal lines
		// for y=0 to Screen Height step 1
		this.amos.sourcePos="109:1";
		this.vars.y=0;
		if(this.vars.y>this.amos.currentScreen.height)
			return{type:1,label:5};
	};
	this.blocks[1]=function()
	{
		// if (y mod BoxSize) = 0
		this.amos.sourcePos="110:2";
		if(!((this.vars.y%this.vars.BoxSize)==0))
			return{type:1,label:4};
		// for w=0 to p_weight-1
		this.amos.sourcePos="111:3";
		this.root.vars.w=0;
		if(this.root.vars.w>this.vars.p_weight-1)
			return{type:1,label:3};
	};
	this.blocks[2]=function()
	{
		// Draw 0,y+w to Screen Width,y+w
		this.amos.sourcePos="112:4";
		this.amos.currentScreen.draw(0,this.vars.y+this.root.vars.w,this.amos.currentScreen.width,this.vars.y+this.root.vars.w);
		// next w
		this.amos.sourcePos="113:6";
		this.root.vars.w+=1;
		if(this.root.vars.w<=this.vars.p_weight-1)
			return{type:1,label:2}
	};
	this.blocks[3]=function()
	{
		// end if
		this.amos.sourcePos="114:5";
	};
	this.blocks[4]=function()
	{
		// next y
		this.amos.sourcePos="115:1";
		this.vars.y+=1;
		if(this.vars.y<=this.amos.currentScreen.height)
			return{type:1,label:1}
	};
	this.blocks[5]=function()
	{
		// 'vertical lines
		// for x=0 to Screen Width step 1
		this.amos.sourcePos="117:1";
		this.vars.x=0;
		if(this.vars.x>this.amos.currentScreen.width)
			return{type:1,label:10};
	};
	this.blocks[6]=function()
	{
		// if (x mod BoxSize) = 0
		this.amos.sourcePos="118:2";
		if(!((this.vars.x%this.vars.BoxSize)==0))
			return{type:1,label:9};
		// for w=0 to p_weight-1
		this.amos.sourcePos="119:3";
		this.root.vars.w=0;
		if(this.root.vars.w>this.vars.p_weight-1)
			return{type:1,label:8};
	};
	this.blocks[7]=function()
	{
		// Draw x+w,0 to x+w,Screen Height
		this.amos.sourcePos="120:4";
		this.amos.currentScreen.draw(this.vars.x+this.root.vars.w,0,this.vars.x+this.root.vars.w,this.amos.currentScreen.height);
		// next w
		this.amos.sourcePos="121:3";
		this.root.vars.w+=1;
		if(this.root.vars.w<=this.vars.p_weight-1)
			return{type:1,label:7}
	};
	this.blocks[8]=function()
	{
		// end if
		this.amos.sourcePos="122:5";
	};
	this.blocks[9]=function()
	{
		// next x
		this.amos.sourcePos="123:1";
		this.vars.x+=1;
		if(this.vars.x<=this.amos.currentScreen.width)
			return{type:1,label:6}
	};
	this.blocks[10]=function()
	{
		// end proc
		return{type:0};
	};
};
