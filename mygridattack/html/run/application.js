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
// GridAttackAmos.
// By Giovanni Cardona
// Version 1.0
// Created on the ...
// (c) Your Corporation Unlimited
//
// Compiled with AMOS 2 compiler version 0.7 - 07/08/2019 on the 12/09/2019-10:20:27
//

function Application( canvasId )
{
	this.manifest = JSON.parse('{"version":"6","infos":{"applicationName":"GridAttackAmos.","author":"By Giovanni Cardona","version":"Version 1.0","date":"Created on the ...","copyright":"(c) Your Corporation Unlimited","start":"main.amos"},"compilation":{"speed":"fast","syntax":"amos2","emulation":"PC","usePalette":true,"useShortColors":false,"showCopperBlack":false,"unlimitedScreens":true,"unlimitedWindows":true,"maskHardwareCoordinates":false,"endian":"little"},"display":{"tvStandard":"pal","width":1024,"height":720,"background":"color","backgroundColor":"#000000","bodyBackgroundColor":"#000000","bodyBackgroundImage":"./runtime/resources/star_night.jpeg","scaleX":3,"scaleY":3,"screenScale":2,"fps":false,"fpsFont":"12px Verdana","fpsColor":"#FFFF00","fpsX":10,"fpsY":16,"fullPage":0,"fullScreen":0,"keepProportions":true,"fullScreenIcon":true,"fullScreenIconX":-34,"fullScreenIconY":2,"fullScreenIconImage":"./runtime/resources/full_screen.png","smallScreenIconImage":"./runtime/resources/small_screen.png"},"sprites":{"collisionBoxed":false,"collisionPrecision":1,"collisionAlphaThreshold":1},"fonts":{"listFonts":"PC","amiga":["topaz"],"google":["roboto mono"]},"default":{"screen":{"x":0,"y":0,"width":320,"height":200,"numberOfColors":32,"pixelMode":"lowres","palette":["#000000","#FFFFFF","#000000","#222222","#FF0000","#00FF00","#0000FF","#666666","#555555","#333333","#773333","#337733","#777733","#333377","#773377","#337777","#000000","#EECC88","#CC6600","#EEAA00","#2277FF","#4499DD","#55AAEE","#AADDFF","#BBDDFF","#CCEEFF","#FFFFFF","#440088","#AA00EE","#EE00EE","#EE0088","#EEEEEE"],"window":{"x":0,"y":0,"fontWidth":8,"fontHeight":8,"border":0,"paper":0,"pen":2,"background":"opaque","font":{"name":"roboto mono","type":"google","height":10},"cursorImage":"./runtime/resources/cursor_pc.png","cursorColors":[{"r":68,"g":68,"b":0,"a":128},{"r":136,"g":136,"b":0,"a":128},{"r":187,"g":187,"b":0,"a":128},{"r":221,"g":221,"b":0,"a":128},{"r":238,"g":238,"b":0,"a":128},{"r":255,"g":255,"b":34,"a":128},{"r":255,"g":255,"b":136,"a":128},{"r":255,"g":255,"b":204,"a":128},{"r":255,"g":255,"b":255,"a":128},{"r":170,"g":170,"b":255,"a":128},{"r":136,"g":136,"b":204,"a":128},{"r":102,"g":102,"b":170,"a":128},{"r":34,"g":34,"b":102,"a":128},{"r":0,"g":0,"b":68,"a":128},{"r":0,"g":0,"b":17,"a":128},{"r":0,"g":0,"b":0,"a":128}]}}}}');
	this.parent = this;
	this.root = this;
	this.amos=new AMOS(canvasId,this.manifest);

	// Compiled program begins here
	// ----------------------------
	this.vars=
	{
		gridC$:"",
		gw:0,
		gsx:0,
		gh:0,
		gsy:0,
		gridColor_:0.0,
		enemyBaseCount:0,
		playerC$:"",
		playerLeft$:"",
		playerRight$:"",
		playerShoot$:"",
		playerColor_:0.0,
		pxBase:0,
		pybase:0,
		missileC$:"",
		missileColor_:0.0,
		bombC$:"",
		gameExit$:"",
		restart:0,
		timBase:0,
		timCount:0,
		score:0,
		highestScore:0,
		level:0,
		swapg:0,
		enemyColor_:0.0,
		enemyC$_array:new AArray(this.amos,"",0),
		gridArray$_array:new AArray(this.amos,"",0),
		enemy_array:new AArray(this.amos,0,0),
		ex_array:new AArray(this.amos,0,0),
		ey_array:new AArray(this.amos,0,0),
		ed_array:new AArray(this.amos,0,0),
		gy:0,
		gx:0,
		e:0,
		enemyTrigger:0,
		enemyCreateCount:0,
		enemyHitCount:0,
		pk$:"",
		px:0,
		pd:0,
		py:0,
		shoot:0,
		missile:0,
		mx:0,
		my:0,
		timthis_:0.0,
		s:0,
		k$:""
	}
	this.blocks=[];
	this.blocks[0]=function()
	{
		// 'AMOS 2 Character-based game 'a la PET' test by Giovanni Cardona v0.65  Feb 2019
		// Curs off
		this.amos.sourcePos="2:0";
		this.amos.currentScreen.getCurrentWindow().setCursor(false);
	};
	this.blocks[1]=function()
	{
		// InitVars:
		// gridC$="+": gw=32:gsx=3:gh=14:gsy=2: gridColor#=13
		this.amos.sourcePos="6:1";
		this.vars.gridC$="+";
		this.amos.sourcePos="6:13";
		this.vars.gw=32;
		this.amos.sourcePos="6:19";
		this.vars.gsx=3;
		this.amos.sourcePos="6:25";
		this.vars.gh=14;
		this.amos.sourcePos="6:31";
		this.vars.gsy=2;
		this.amos.sourcePos="6:38";
		this.vars.gridColor_=13;
		// enemyBaseCount=gw:
		this.amos.sourcePos="7:1";
		this.vars.enemyBaseCount=Math.floor(this.vars.gw);
		// playerC$="T": playerLeft$=",": playerRight$=".": playerShoot$=" ": playerColor#=1: pxBase=20: pybase=gh+gsy+2
		this.amos.sourcePos="8:1";
		this.vars.playerC$="T";
		this.amos.sourcePos="8:15";
		this.vars.playerLeft$=",";
		this.amos.sourcePos="8:32";
		this.vars.playerRight$=".";
		this.amos.sourcePos="8:50";
		this.vars.playerShoot$=" ";
		this.amos.sourcePos="8:68";
		this.vars.playerColor_=1;
		this.amos.sourcePos="8:84";
		this.vars.pxBase=20;
		this.amos.sourcePos="8:95";
		this.vars.pybase=Math.floor(this.vars.gh+this.vars.gsy+2);
		// missileC$="^": missileColor#=5
		this.amos.sourcePos="9:1";
		this.vars.missileC$="^";
		this.amos.sourcePos="9:16";
		this.vars.missileColor_=5;
		// bombC$="x": gameExit$=" `"
		this.amos.sourcePos="10:1";
		this.vars.bombC$="x";
		this.amos.sourcePos="10:13";
		this.vars.gameExit$=" `";
		// restart=true
		this.amos.sourcePos="11:1";
		this.vars.restart=Math.floor(true);
		// timBase=60 : timCount=0
		this.amos.sourcePos="12:1";
		this.vars.timBase=60;
		this.amos.sourcePos="12:14";
		this.vars.timCount=0;
		// score=0 : highestScore=0
		this.amos.sourcePos="13:1";
		this.vars.score=0;
		this.amos.sourcePos="13:11";
		this.vars.highestScore=0;
		// level=0
		this.amos.sourcePos="14:1";
		this.vars.level=0;
		// swapg=1
		this.amos.sourcePos="15:1";
		this.vars.swapg=1;
		// enemyColor# = 10
		this.amos.sourcePos="16:1";
		this.vars.enemyColor_=10;
		// Dim enemyC$(3) :enemyC$(0)="o":enemyC$(1)=".":enemyC$(2)="*"
		this.amos.sourcePos="17:1";
		this.vars.enemyC$_array.dim([3],0);
		this.amos.sourcePos="17:17";
		this.vars.enemyC$_array.setValue([0],"o");
		this.amos.sourcePos="17:32";
		this.vars.enemyC$_array.setValue([1],".");
		this.amos.sourcePos="17:47";
		this.vars.enemyC$_array.setValue([2],"*");
		// Dim gridArray$((gw+gsx),(gh+gsy))
		this.amos.sourcePos="18:1";
		this.vars.gridArray$_array.dim([(this.vars.gw+this.vars.gsx),(this.vars.gh+this.vars.gsy)],0);
		// Dim enemy(enemyBaseCount),ex(enemyBaseCount),ey(enemyBaseCount),ed(enemyBaseCount)
		this.amos.sourcePos="19:1";
		this.vars.enemy_array.dim([this.vars.enemyBaseCount],0);
		this.vars.ex_array.dim([this.vars.enemyBaseCount],0);
		this.vars.ey_array.dim([this.vars.enemyBaseCount],0);
		this.vars.ed_array.dim([this.vars.enemyBaseCount],0);
		// 'BEGIN MAIN LOOP --------
		// Get Fonts
		this.amos.sourcePos="23:0";
		this.amos.fonts.getFonts();
		// Set Font "topaz",11
		this.amos.sourcePos="24:1";
		return{type:8,instruction:"setFont",args:["topaz",11]};
	};
	this.blocks[2]=function()
	{
		// Do
		this.amos.sourcePos="25:0";
	};
	this.blocks[3]=function()
	{
		// Paper 0
		this.amos.sourcePos="26:1";
		this.amos.currentScreen.getCurrentWindow().setPaper(0);
		// Clw
		this.amos.sourcePos="27:1";
		this.amos.currentScreen.getCurrentWindow().clw();
	};
	this.blocks[4]=function()
	{
		// NEWLEVEL:
		// If restart
		this.amos.sourcePos="32:2";
		if(!(this.vars.restart))
			return{type:1,label:12};
		// For gy=0 to (gh+gsy)-1
		this.amos.sourcePos="33:3";
		this.vars.gy=0;
		if(this.vars.gy>(this.vars.gh+this.vars.gsy)-1)
			return{type:1,label:8};
	};
	this.blocks[5]=function()
	{
		// For gx=0 to (gw+gsx)-1
		this.amos.sourcePos="34:4";
		this.vars.gx=0;
		if(this.vars.gx>(this.vars.gw+this.vars.gsx)-1)
			return{type:1,label:7};
	};
	this.blocks[6]=function()
	{
		// gridArray$(gx,gy)=gridC$
		this.amos.sourcePos="35:5";
		this.vars.gridArray$_array.setValue([this.vars.gx,this.vars.gy],this.vars.gridC$);
		// Next gx
		this.amos.sourcePos="36:4";
		this.vars.gx+=1;
		if(this.vars.gx<=(this.vars.gw+this.vars.gsx)-1)
			return{type:1,label:6}
	};
	this.blocks[7]=function()
	{
		// Next gy
		this.amos.sourcePos="37:3";
		this.vars.gy+=1;
		if(this.vars.gy<=(this.vars.gh+this.vars.gsy)-1)
			return{type:1,label:5}
	};
	this.blocks[8]=function()
	{
		// For e=0 To enemyBaseCount
		this.amos.sourcePos="38:3";
		this.vars.e=0;
		if(this.vars.e>this.vars.enemyBaseCount)
			return{type:1,label:10};
	};
	this.blocks[9]=function()
	{
		// enemy(e)=false: ex(e)=false: ey(e)=false: ed(e)=-1
		this.amos.sourcePos="39:4";
		this.vars.enemy_array.setValue([this.vars.e],Math.floor(false));
		this.amos.sourcePos="39:20";
		this.vars.ex_array.setValue([this.vars.e],Math.floor(false));
		this.amos.sourcePos="39:33";
		this.vars.ey_array.setValue([this.vars.e],Math.floor(false));
		this.amos.sourcePos="39:46";
		this.vars.ed_array.setValue([this.vars.e],-1);
		// Next e
		this.amos.sourcePos="40:3";
		this.vars.e+=1;
		if(this.vars.e<=this.vars.enemyBaseCount)
			return{type:1,label:9}
	};
	this.blocks[10]=function()
	{
		// enemyTrigger=true: enemyCreateCount=enemyBaseCount: enemyHitCount=0
		this.amos.sourcePos="42:3";
		this.vars.enemyTrigger=Math.floor(true);
		this.amos.sourcePos="42:22";
		this.vars.enemyCreateCount=Math.floor(this.vars.enemyBaseCount);
		this.amos.sourcePos="42:55";
		this.vars.enemyHitCount=0;
		// pk$="": px=pxBase: pd=0: py=pybase: shoot=false
		this.amos.sourcePos="43:3";
		this.vars.pk$="";
		this.amos.sourcePos="43:11";
		this.vars.px=Math.floor(this.vars.pxBase);
		this.amos.sourcePos="43:22";
		this.vars.pd=0;
		this.amos.sourcePos="43:28";
		this.vars.py=Math.floor(this.vars.pybase);
		this.amos.sourcePos="43:39";
		this.vars.shoot=Math.floor(false);
		// missile=false: mx=0: my=0
		this.amos.sourcePos="44:3";
		this.vars.missile=Math.floor(false);
		this.amos.sourcePos="44:18";
		this.vars.mx=0;
		this.amos.sourcePos="44:24";
		this.vars.my=0;
		// level=level+1
		this.amos.sourcePos="45:3";
		this.vars.level=Math.floor(this.vars.level+1);
		// if score>highestScore Then highestScore=score
		this.amos.sourcePos="47:3";
		if(!(this.vars.score>this.vars.highestScore))
			return{type:1,label:11};
		this.amos.sourcePos="47:30";
		this.vars.highestScore=Math.floor(this.vars.score);
	};
	this.blocks[11]=function()
	{
		// score=0
		this.amos.sourcePos="48:3";
		this.vars.score=0;
		// timCount=timBase
		this.amos.sourcePos="49:3";
		this.vars.timCount=Math.floor(this.vars.timBase);
		// restart=false
		this.amos.sourcePos="51:3";
		this.vars.restart=Math.floor(false);
		// End If
		this.amos.sourcePos="52:2";
	};
	this.blocks[12]=function()
	{
	};
	this.blocks[13]=function()
	{
		// CREATEGRID:
		// Pen gridColor#
		this.amos.sourcePos="56:2";
		this.amos.currentScreen.getCurrentWindow().setPen(this.vars.gridColor_);
		// For gy=gsy-1 to gsy+gh-1
		this.amos.sourcePos="57:2";
		this.vars.gy=Math.floor(this.vars.gsy-1);
		if(this.vars.gy>this.vars.gsy+this.vars.gh-1)
			return{type:1,label:17};
	};
	this.blocks[14]=function()
	{
		// For gx=gsx-1 to gsx+gw-1
		this.amos.sourcePos="58:3";
		this.vars.gx=Math.floor(this.vars.gsx-1);
		if(this.vars.gx>this.vars.gsx+this.vars.gw-1)
			return{type:1,label:16};
	};
	this.blocks[15]=function()
	{
		// Locate gx+1,gy+1: Print gridArray$(gx,gy)
		this.amos.sourcePos="59:4";
		this.amos.currentScreen.getCurrentWindow().locate(this.vars.gx+1,this.vars.gy+1);
		this.amos.sourcePos="59:22";
		this.amos.currentScreen.currentWindow.print(this.vars.gridArray$_array.getValue([this.vars.gx,this.vars.gy]),true);
		// Next gx
		this.amos.sourcePos="60:3";
		this.vars.gx+=1;
		if(this.vars.gx<=this.vars.gsx+this.vars.gw-1)
			return{type:1,label:15}
	};
	this.blocks[16]=function()
	{
		// Next gy
		this.amos.sourcePos="61:2";
		this.vars.gy+=1;
		if(this.vars.gy<=this.vars.gsy+this.vars.gh-1)
			return{type:1,label:14}
	};
	this.blocks[17]=function()
	{
	};
	this.blocks[18]=function()
	{
		// GameInterface:
		// Pen 7: Locate 0,0: Centre "AMOS Attack"
		this.amos.sourcePos="66:2";
		this.amos.currentScreen.getCurrentWindow().setPen(7);
		this.amos.sourcePos="66:9";
		this.amos.currentScreen.getCurrentWindow().locate(0,0);
		this.amos.sourcePos="66:21";
		this.amos.currentScreen.getCurrentWindow().centre("AMOS Attack");
		// Pen 8: Locate 0,1: Centre "Use < > and SPC"
		this.amos.sourcePos="67:2";
		this.amos.currentScreen.getCurrentWindow().setPen(8);
		this.amos.sourcePos="67:9";
		this.amos.currentScreen.getCurrentWindow().locate(0,1);
		this.amos.sourcePos="67:21";
		this.amos.currentScreen.getCurrentWindow().centre("Use < > and SPC");
		// Pen 6
		this.amos.sourcePos="68:2";
		this.amos.currentScreen.getCurrentWindow().setPen(6);
		// Locate 1,pybase+2: Print "score: ";score
		this.amos.sourcePos="69:2";
		this.amos.currentScreen.getCurrentWindow().locate(1,this.vars.pybase+2);
		this.amos.sourcePos="69:21";
		this.amos.currentScreen.currentWindow.print("score: "+this.amos.str$(this.vars.score),true);
		// Locate 1,pybase+3: Print "time:  ";timCount
		this.amos.sourcePos="70:2";
		this.amos.currentScreen.getCurrentWindow().locate(1,this.vars.pybase+3);
		this.amos.sourcePos="70:21";
		this.amos.currentScreen.currentWindow.print("time:  "+this.amos.str$(this.vars.timCount),true);
		// Locate 1,pybase+4: Print "high:  ";highestScore
		this.amos.sourcePos="71:2";
		this.amos.currentScreen.getCurrentWindow().locate(1,this.vars.pybase+4);
		this.amos.sourcePos="71:21";
		this.amos.currentScreen.currentWindow.print("high:  "+this.amos.str$(this.vars.highestScore),true);
		// Locate 1,pybase+5: Print "level: ";level
		this.amos.sourcePos="72:2";
		this.amos.currentScreen.getCurrentWindow().locate(1,this.vars.pybase+5);
		this.amos.sourcePos="72:21";
		this.amos.currentScreen.currentWindow.print("level: "+this.amos.str$(this.vars.level),true);
	};
	this.blocks[19]=function()
	{
		// PlayerActions:
		// pk$=inkey$
		this.amos.sourcePos="76:2";
		this.vars.pk$=this.amos.inkey$();
		// If pk$=playerLeft$ Then pd=-1
		this.amos.sourcePos="77:2";
		if(!(this.vars.pk$==this.vars.playerLeft$))
			return{type:1,label:20};
		this.amos.sourcePos="77:26";
		this.vars.pd=-1;
	};
	this.blocks[20]=function()
	{
		// If pk$=playerRight$ Then pd=1
		this.amos.sourcePos="78:2";
		if(!(this.vars.pk$==this.vars.playerRight$))
			return{type:1,label:21};
		this.amos.sourcePos="78:27";
		this.vars.pd=1;
	};
	this.blocks[21]=function()
	{
		// If px>gw+gsx-1 Then px=gw+gsx-1
		this.amos.sourcePos="79:2";
		if(!(this.vars.px>this.vars.gw+this.vars.gsx-1))
			return{type:1,label:22};
		this.amos.sourcePos="79:22";
		this.vars.px=Math.floor(this.vars.gw+this.vars.gsx-1);
	};
	this.blocks[22]=function()
	{
		// If px<gsx+1  Then px=gsx+1
		this.amos.sourcePos="80:2";
		if(!(this.vars.px<this.vars.gsx+1))
			return{type:1,label:23};
		this.amos.sourcePos="80:20";
		this.vars.px=Math.floor(this.vars.gsx+1);
	};
	this.blocks[23]=function()
	{
		// If pk$=playerShoot$
		this.amos.sourcePos="81:2";
		if(!(this.vars.pk$==this.vars.playerShoot$))
			return{type:1,label:25};
		// If missile and my < pybase-2 Then missile = false
		this.amos.sourcePos="82:3";
		if(!(this.vars.missile&&this.vars.my<this.vars.pybase-2))
			return{type:1,label:24};
		this.amos.sourcePos="82:37";
		this.vars.missile=Math.floor(false);
	};
	this.blocks[24]=function()
	{
		// shoot=true
		this.amos.sourcePos="83:3";
		this.vars.shoot=Math.floor(true);
		// End If
		this.amos.sourcePos="84:2";
	};
	this.blocks[25]=function()
	{
		// px=px+pd
		this.amos.sourcePos="86:2";
		this.vars.px=Math.floor(this.vars.px+this.vars.pd);
		// Pen playerColor#: Locate px,py: Print playerC$
		this.amos.sourcePos="88:2";
		this.amos.currentScreen.getCurrentWindow().setPen(this.vars.playerColor_);
		this.amos.sourcePos="88:20";
		this.amos.currentScreen.getCurrentWindow().locate(this.vars.px,this.vars.py);
		this.amos.sourcePos="88:34";
		this.amos.currentScreen.currentWindow.print(this.vars.playerC$,true);
		// If pk$=gameExit$ Then Exit
		this.amos.sourcePos="89:2";
		if(!(this.vars.pk$==this.vars.gameExit$))
			return{type:1,label:26};
		this.amos.sourcePos="89:24";
		return{type:1,label:56};
	};
	this.blocks[26]=function()
	{
	};
	this.blocks[27]=function()
	{
		// MissileActions:
		// If shoot
		this.amos.sourcePos="94:2";
		if(!(this.vars.shoot))
			return{type:1,label:29};
		// If not missile
		this.amos.sourcePos="95:3";
		if(!(!(this.vars.missile)))
			return{type:1,label:28};
		// missile=true
		this.amos.sourcePos="96:4";
		this.vars.missile=Math.floor(true);
		// mx=px: my=py
		this.amos.sourcePos="97:4";
		this.vars.mx=Math.floor(this.vars.px);
		this.amos.sourcePos="97:11";
		this.vars.my=Math.floor(this.vars.py);
		// End If
		this.amos.sourcePos="98:3";
	};
	this.blocks[28]=function()
	{
		// shoot=false
		this.amos.sourcePos="99:3";
		this.vars.shoot=Math.floor(false);
		// End If
		this.amos.sourcePos="100:2";
	};
	this.blocks[29]=function()
	{
		// If missile
		this.amos.sourcePos="102:2";
		if(!(this.vars.missile))
			return{type:1,label:31};
		// Dec my
		this.amos.sourcePos="103:3";
		this.vars.my--;
		// Pen missileColor#: Locate mx,my: Print missileC$
		this.amos.sourcePos="104:3";
		this.amos.currentScreen.getCurrentWindow().setPen(this.vars.missileColor_);
		this.amos.sourcePos="104:22";
		this.amos.currentScreen.getCurrentWindow().locate(this.vars.mx,this.vars.my);
		this.amos.sourcePos="104:36";
		this.amos.currentScreen.currentWindow.print(this.vars.missileC$,true);
		// If my<gsy
		this.amos.sourcePos="105:3";
		if(!(this.vars.my<this.vars.gsy))
			return{type:1,label:30};
		// missile=false
		this.amos.sourcePos="106:4";
		this.vars.missile=Math.floor(false);
		// End If
		this.amos.sourcePos="107:3";
	};
	this.blocks[30]=function()
	{
		// End If
		this.amos.sourcePos="108:2";
	};
	this.blocks[31]=function()
	{
	};
	this.blocks[32]=function()
	{
		// CollisionActions:
		// For e=0 To enemyBaseCount
		this.amos.sourcePos="112:3";
		this.vars.e=0;
		if(this.vars.e>this.vars.enemyBaseCount)
			return{type:1,label:35};
	};
	this.blocks[33]=function()
	{
		// If enemy(e) and missile and (mx=ex(e) and my=ey(e))
		this.amos.sourcePos="113:3";
		if(!(this.vars.enemy_array.getValue([this.vars.e])&&this.vars.missile&&(this.vars.mx==this.vars.ex_array.getValue([this.vars.e])&this.vars.my==this.vars.ey_array.getValue([this.vars.e]))))
			return{type:1,label:34};
		// missile=false
		this.amos.sourcePos="114:4";
		this.vars.missile=Math.floor(false);
		// enemy(e)=false
		this.amos.sourcePos="115:4";
		this.vars.enemy_array.setValue([this.vars.e],Math.floor(false));
		// enemyTrigger=true
		this.amos.sourcePos="116:4";
		this.vars.enemyTrigger=Math.floor(true);
		// gridArray$(mx-1,my-1)=bombC$
		this.amos.sourcePos="117:4";
		this.vars.gridArray$_array.setValue([this.vars.mx-1,this.vars.my-1],this.vars.bombC$);
		// Inc enemyHitCount
		this.amos.sourcePos="118:4";
		this.vars.enemyHitCount++;
		// score = score + pybase-my
		this.amos.sourcePos="119:4";
		this.vars.score=Math.floor(this.vars.score+this.vars.pybase-this.vars.my);
		// End If
		this.amos.sourcePos="120:3";
	};
	this.blocks[34]=function()
	{
		// Next e
		this.amos.sourcePos="121:2";
		this.vars.e+=1;
		if(this.vars.e<=this.vars.enemyBaseCount)
			return{type:1,label:33}
	};
	this.blocks[35]=function()
	{
	};
	this.blocks[36]=function()
	{
		// EnemyActions:
		// If enemyCreateCount>=0
		this.amos.sourcePos="125:2";
		if(!(this.vars.enemyCreateCount>=0))
			return{type:1,label:38};
		// If enemyTrigger and not enemy(enemyCreateCount)
		this.amos.sourcePos="126:3";
		if(!(this.vars.enemyTrigger&&!(this.vars.enemy_array.getValue([this.vars.enemyCreateCount]))))
			return{type:1,label:37};
		// enemy(enemyCreateCount)=true
		this.amos.sourcePos="127:4";
		this.vars.enemy_array.setValue([this.vars.enemyCreateCount],Math.floor(true));
		// ex(enemyCreateCount)=gw+gsx: ey(enemyCreateCount)=gsy
		this.amos.sourcePos="128:4";
		this.vars.ex_array.setValue([this.vars.enemyCreateCount],Math.floor(this.vars.gw+this.vars.gsx));
		this.amos.sourcePos="128:33";
		this.vars.ey_array.setValue([this.vars.enemyCreateCount],Math.floor(this.vars.gsy));
		// ed(enemyCreateCount)=-1
		this.amos.sourcePos="129:4";
		this.vars.ed_array.setValue([this.vars.enemyCreateCount],-1);
		// Dec enemyCreateCount
		this.amos.sourcePos="130:4";
		this.vars.enemyCreateCount--;
		// End If
		this.amos.sourcePos="131:3";
	};
	this.blocks[37]=function()
	{
		// Else
		return{type:1,label:39};
	};
	this.blocks[38]=function()
	{
		// enemyTrigger=false
		this.amos.sourcePos="133:4";
		this.vars.enemyTrigger=Math.floor(false);
		// End If
		this.amos.sourcePos="134:2";
	};
	this.blocks[39]=function()
	{
		// If enemyHitCount <= enemyBaseCount
		this.amos.sourcePos="137:2";
		if(!(this.vars.enemyHitCount<=this.vars.enemyBaseCount))
			return{type:1,label:48};
		// For e=0 To enemyBaseCount
		this.amos.sourcePos="138:3";
		this.vars.e=0;
		if(this.vars.e>this.vars.enemyBaseCount)
			return{type:1,label:47};
	};
	this.blocks[40]=function()
	{
		// If enemy(e)
		this.amos.sourcePos="139:4";
		if(!(this.vars.enemy_array.getValue([this.vars.e])))
			return{type:1,label:46};
		// ex(e)=ex(e)+ed(e)
		this.amos.sourcePos="140:5";
		this.vars.ex_array.setValue([this.vars.e],Math.floor(this.vars.ex_array.getValue([this.vars.e])+this.vars.ed_array.getValue([this.vars.e])));
		// If ex(e)<gsx+1 or ex(e)>gw+gsx-1 Then ey(e)=ey(e)+1
		this.amos.sourcePos="141:5";
		if(!(this.vars.ex_array.getValue([this.vars.e])<this.vars.gsx+1||this.vars.ex_array.getValue([this.vars.e])>this.vars.gw+this.vars.gsx-1))
			return{type:1,label:41};
		this.amos.sourcePos="141:43";
		this.vars.ey_array.setValue([this.vars.e],Math.floor(this.vars.ey_array.getValue([this.vars.e])+1));
	};
	this.blocks[41]=function()
	{
		// If gridArray$(ex(e)-1,ey(e)-1)=bombC$
		this.amos.sourcePos="142:5";
		if(!(this.vars.gridArray$_array.getValue([this.vars.ex_array.getValue([this.vars.e])-1,this.vars.ey_array.getValue([this.vars.e])-1])==this.vars.bombC$))
			return{type:1,label:42};
		// ey(e)=ey(e)+Rnd(2) : Rem try to avoid multiple enemies together
		this.amos.sourcePos="143:6";
		this.vars.ey_array.setValue([this.vars.e],Math.floor(this.vars.ey_array.getValue([this.vars.e])+this.amos.rnd(2)));
		// ed(e)=ed(e)*-1
		this.amos.sourcePos="144:6";
		this.vars.ed_array.setValue([this.vars.e],Math.floor(this.vars.ed_array.getValue([this.vars.e])*-1));
		// End If
		this.amos.sourcePos="145:5";
	};
	this.blocks[42]=function()
	{
		// If ey(e)>gh+gsy Then ey(e)=gsy
		this.amos.sourcePos="146:5";
		if(!(this.vars.ey_array.getValue([this.vars.e])>this.vars.gh+this.vars.gsy))
			return{type:1,label:43};
		this.amos.sourcePos="146:26";
		this.vars.ey_array.setValue([this.vars.e],Math.floor(this.vars.gsy));
	};
	this.blocks[43]=function()
	{
		// swapg = -swapg
		this.amos.sourcePos="147:5";
		this.vars.swapg=Math.floor(-this.vars.swapg);
		// Pen enemyColor#: Locate ex(e),ey(e): Print enemyC$(1+swapg)
		this.amos.sourcePos="148:5";
		this.amos.currentScreen.getCurrentWindow().setPen(this.vars.enemyColor_);
		this.amos.sourcePos="148:22";
		this.amos.currentScreen.getCurrentWindow().locate(this.vars.ex_array.getValue([this.vars.e]),this.vars.ey_array.getValue([this.vars.e]));
		this.amos.sourcePos="148:42";
		this.amos.currentScreen.currentWindow.print(this.vars.enemyC$_array.getValue([1+this.vars.swapg]),true);
		// If ex(e)<gsx+1 Then ed(e)=1
		this.amos.sourcePos="149:5";
		if(!(this.vars.ex_array.getValue([this.vars.e])<this.vars.gsx+1))
			return{type:1,label:44};
		this.amos.sourcePos="149:25";
		this.vars.ed_array.setValue([this.vars.e],1);
	};
	this.blocks[44]=function()
	{
		// If ex(e)>gw+gsx-1 Then ed(e)=-1
		this.amos.sourcePos="150:5";
		if(!(this.vars.ex_array.getValue([this.vars.e])>this.vars.gw+this.vars.gsx-1))
			return{type:1,label:45};
		this.amos.sourcePos="150:28";
		this.vars.ed_array.setValue([this.vars.e],-1);
	};
	this.blocks[45]=function()
	{
		// End If
		this.amos.sourcePos="151:4";
	};
	this.blocks[46]=function()
	{
		// Next e
		this.amos.sourcePos="152:3";
		this.vars.e+=1;
		if(this.vars.e<=this.vars.enemyBaseCount)
			return{type:1,label:40}
	};
	this.blocks[47]=function()
	{
		// Else
		return{type:1,label:49};
	};
	this.blocks[48]=function()
	{
		// restart = true
		this.amos.sourcePos="154:3";
		this.vars.restart=Math.floor(true);
		// End If
		this.amos.sourcePos="155:2";
	};
	this.blocks[49]=function()
	{
		// Wait Vbl
		this.amos.sourcePos="157:1";
		return{type:8,instruction:"waitVbl",args:[]};
	};
	this.blocks[50]=function()
	{
		// Wait 1
		this.amos.sourcePos="158:1";
		return{type:8,instruction:"wait",args:[1]};
	};
	this.blocks[51]=function()
	{
		// timthis# = (Timer /1000)/timBase
		this.amos.sourcePos="159:4";
		this.vars.timthis_=(this.amos.getTimer()/1000)/this.vars.timBase;
		// timCount = timBase - ((timthis#)-int(timthis#))*timBase
		this.amos.sourcePos="160:2";
		this.vars.timCount=Math.floor(this.vars.timBase-((this.vars.timthis_)-Math.floor(this.vars.timthis_))*this.vars.timBase);
		// if timCount <1 or restart
		this.amos.sourcePos="161:2";
		if(!(this.vars.timCount<1||this.vars.restart))
			return{type:1,label:55};
		// Locate 0,0
		this.amos.sourcePos="162:3";
		this.amos.currentScreen.getCurrentWindow().locate(0,0);
		// For s=0 to 20
		this.amos.sourcePos="163:3";
		this.vars.s=0;
		if(this.vars.s>20)
			return{type:1,label:54};
	};
	this.blocks[52]=function()
	{
		// vscroll 1
		this.amos.sourcePos="164:4";
		this.amos.currentScreen.getCurrentWindow().vScroll(1);
		// Wait 3
		this.amos.sourcePos="165:4";
		return{type:8,instruction:"wait",args:[3]};
	};
	this.blocks[53]=function()
	{
		// Next s
		this.amos.sourcePos="166:3";
		this.vars.s+=1;
		if(this.vars.s<=20)
			return{type:1,label:52}
	};
	this.blocks[54]=function()
	{
		// restart=true
		this.amos.sourcePos="167:3";
		this.vars.restart=Math.floor(true);
		// End if
		this.amos.sourcePos="168:2";
	};
	this.blocks[55]=function()
	{
		// Loop
		this.amos.sourcePos="170:0";
		return{type:1,label:3};
	};
	this.blocks[56]=function()
	{
		// 'END MAIN LOOP--------
	};
	this.blocks[57]=function()
	{
		// ExitKey:
		// k$=""
		this.amos.sourcePos="174:1";
		this.vars.k$="";
		// while k$=""
		this.amos.sourcePos="175:1";
		if(!(this.vars.k$==""))
			return{type:1,label:59};
	};
	this.blocks[58]=function()
	{
		// k$=inkey$
		this.amos.sourcePos="176:2";
		this.vars.k$=this.amos.inkey$();
		// wend
		this.amos.sourcePos="177:1";
		if(this.vars.k$=="")
			return{type:1,label:58};
	};
	this.blocks[59]=function()
	{
		// clw
		this.amos.sourcePos="178:1";
		this.amos.currentScreen.getCurrentWindow().clw();
		// end
		this.amos.sourcePos="179:1";
		return{type:0}
		// '
	};
	this.blocks[60]=function()
	{
		return {type:0};
	};

	// Labels...
	this.labels=
	{
		InitVars:
		{
			dataPosition:0,
			labelBlock:1
		},
		NEWLEVEL:
		{
			dataPosition:0,
			labelBlock:4
		},
		CREATEGRID:
		{
			dataPosition:0,
			labelBlock:13
		},
		GameInterface:
		{
			dataPosition:0,
			labelBlock:18
		},
		PlayerActions:
		{
			dataPosition:0,
			labelBlock:19
		},
		MissileActions:
		{
			dataPosition:0,
			labelBlock:27
		},
		CollisionActions:
		{
			dataPosition:0,
			labelBlock:32
		},
		EnemyActions:
		{
			dataPosition:0,
			labelBlock:36
		},
		ExitKey:
		{
			dataPosition:0,
			labelBlock:57
		}
	};
	this.amos.run(this,0,null);
};
