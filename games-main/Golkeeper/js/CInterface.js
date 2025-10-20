function CInterface() {
    var _pStartPosAudio;
    var _pStartPosExit;
    var _pStartPosPause;
    var _pStartPosKeeper;
    var _pStartPosLaunch;
    var _pStartPosMatch;
    var _pStartPosGuiBox;
    var _pStartPosFullscreen;
    
    var _oButExit;
    var _oButPause;
    var _oKeeperText;
    var _oLaunchText;
    var _oHelpPanel = null;
    var _oGuiBox;
    var _oAudioToggle;
    var _oMatchText;
    var _oWinPanel = null;
    var _oLosePanel = null;
    var _oPause;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    var _iStep;

    this._init = function () {
        _pStartPosGuiBox = {x: 0, y: 0};

        _oGuiBox = createBitmap(s_oSpriteLibrary.getSprite("gui_panel"));
        s_oStage.addChild(_oGuiBox);
        
        _pStartPosMatch = {x: 10, y: 28};
        _oMatchText = new CTLText(s_oStage, 
                    _pStartPosMatch.x, _pStartPosMatch.y, 200, 64, 
                    32, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    TEXT_MATCH + "\n0",
                    true, true, true,
                    false );
         
        _pStartPosLaunch = {x: 260, y: 28};            
        _oLaunchText = new CTLText(s_oStage, 
                    _pStartPosLaunch.x, _pStartPosLaunch.y, 200, 64, 
                    32, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    TEXT_LAUNCH + "\n0",
                    true, true, true,
                    false );
                    
        _pStartPosKeeper = {x: CANVAS_WIDTH/2-120, y: 28};
        _oKeeperText = new CTLText(s_oStage, 
                    _pStartPosKeeper.x, _pStartPosKeeper.y, 200, 64, 
                    32, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    TEXT_SCORE_BALL_SAVED + "\n0",
                    true, true, true,
                    false );

        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = {x: CANVAS_WIDTH - (oSprite.height / 2) - 10, y: (oSprite.height / 2) + 10};
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);

        var oSprite = s_oSpriteLibrary.getSprite('but_pause');
        _pStartPosPause = {x: _pStartPosExit.x - oSprite.height - 10, y: _pStartPosExit.y};
        _oButPause = new CGfxButton(_pStartPosPause.x, _pStartPosPause.y, oSprite);
        _oButPause.addEventListener(ON_MOUSE_UP, this.onButPauseRelease, this);

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _pStartPosAudio = {x: _pStartPosPause.x - oSprite.height - 10, y: _pStartPosExit.y};
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
            
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');
            _pStartPosFullscreen = {x:_pStartPosAudio.x - oSprite.width/2 - 10,y:_pStartPosAudio.y};
        }else{
            _pStartPosFullscreen = {x: _pStartPosPause.x - oSprite.height - 10, y: _pStartPosExit.y};
        }
        
        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        
        if(ENABLE_FULLSCREEN === false){
            _fRequestFullScreen = false;
        }
        
        if (_fRequestFullScreen && screenfull.isEnabled){
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');

            _oButFullscreen = new CToggle(_pStartPosFullscreen.x,_pStartPosFullscreen.y,oSprite,s_bFullscreen,s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
        }
        
        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
        
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        _oButExit.setPosition(_pStartPosExit.x - iNewX, iNewY + _pStartPosExit.y);
        _oButPause.setPosition(_pStartPosPause.x - iNewX, iNewY + _pStartPosPause.y);

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.setPosition(_pStartPosAudio.x - iNewX, iNewY + _pStartPosAudio.y);
        }
        
        if (_fRequestFullScreen && screenfull.isEnabled){
            _oButFullscreen.setPosition(_pStartPosFullscreen.x - s_iOffsetX,_pStartPosFullscreen.y + s_iOffsetY);
        }

        _oGuiBox.y = _pStartPosGuiBox.y + iNewY;

        _oKeeperText.setX(_pStartPosKeeper.x + iNewX);
        _oKeeperText.setY(_pStartPosKeeper.y + iNewY);
        _oLaunchText.setX(_pStartPosLaunch.x + iNewX);
        _oLaunchText.setY(_pStartPosLaunch.y + iNewY);

        _oMatchText.setX(_pStartPosMatch.x + iNewX);
        _oMatchText.setY( _pStartPosMatch.y + iNewY);
    };

    this.unload = function () {
        _oButExit.unload();
        _oButExit = null;

        this.onExitFromHelp();

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }
        
        if (_fRequestFullScreen && screenfull.isEnabled){
            _oButFullscreen.unload();
        }
        s_oInterface = null;
    };

    this.refreshBallSaved = function (iGoalSaved, iTarget) {
        _oKeeperText.refreshText(TEXT_SCORE_BALL_SAVED + "\n" + iGoalSaved + " " + TEXT_OF + " " + iTarget);
    };

    this.refreshLaunch = function (iLaunch, iMaxLaunch) {
        _oLaunchText.refreshText(TEXT_LAUNCH + "\n" + iLaunch + " " + TEXT_OF + " " + iMaxLaunch);
    };

    this.onExitFromHelp = function () {
        if (_oHelpPanel !== null) {
            _oHelpPanel.unload();
            _oHelpPanel = null;
        }
    };

    this.createLosePanel = function (iBallSaved, iTarget) {
        _oLosePanel = new CLosePanel(s_oSpriteLibrary.getSprite("msg_box"));
        _oLosePanel.show(iBallSaved, iTarget);
    };

    this.createWinPanel = function (iBallSaved, iPerfect, iTarget, oScore, bEnd) {
        _oWinPanel = new CWinPanel(s_oSpriteLibrary.getSprite("msg_box"), bEnd);
        _oWinPanel.show(iBallSaved, iPerfect, iTarget, oScore);
    };

    this.createHelpPanel = function () {
        createjs.Ticker.paused = false;
        _oHelpPanel = new CHelpPanel(0, 0, s_oSpriteLibrary.getSprite("msg_box"));
    };

    this.createAnimText = function (szText, iSize, bStrobo) {
        var oContainer = new createjs.Container();

        var oTextStroke = new createjs.Text(szText, iSize + "px " + SECONDARY_FONT, "#000000");
        oTextStroke.x = 0;
        oTextStroke.y = 0;
        oTextStroke.textAlign = "center";
        oTextStroke.outline = 3;
        oContainer.addChild(oTextStroke);

        var oText = new createjs.Text(oTextStroke.text, iSize + "px " + SECONDARY_FONT, "#ffffff");
        oText.x = 0;
        oText.y = 0;
        oText.textAlign = "center";
        oContainer.addChild(oText);

        oContainer.x = CANVAS_WIDTH_HALF;
        oContainer.y = -oTextStroke.getBounds().height;

        if (bStrobo) {
            s_oInterface.strobeText(oText);

        }

        s_oStage.addChild(oContainer);

        createjs.Tween.get(oContainer).to({y: CANVAS_HEIGHT_HALF}, 500, createjs.Ease.cubicOut).call(function () {
            createjs.Tween.get(oContainer).wait(250).to({y: CANVAS_HEIGHT + oTextStroke.getBounds().height}, 500, createjs.Ease.cubicIn).call(function () {
                if (bStrobo) {
                    createjs.Tween.removeTweens(oText);
                }
                s_oStage.removeChild(oContainer);
            });
        });
    };

    this.strobeText = function (oText) {
        createjs.Tween.get(oText).wait(30).call(function () {
            if (_iStep < TEXT_EXCELLENT_COLOR.length - 1) {
                _iStep++;
            } else {
                _iStep = 0;
            }
            oText.color = TEXT_EXCELLENT_COLOR[_iStep];
            s_oInterface.strobeText(oText);
        });
    };

    this.createExtendedTimeText = function () {
        var oContainer = new createjs.Container();

        var oExtTimeTextStroke = new createjs.Text(TEXT_TIE, "50px " + FONT_GAME, "#000000");
        oExtTimeTextStroke.x = 0;
        oExtTimeTextStroke.y = 0;
        oExtTimeTextStroke.textAlign = "center";
        oExtTimeTextStroke.outline = 5;
        oContainer.addChild(oExtTimeTextStroke);

        var oExtTimeText = new createjs.Text(oExtTimeTextStroke.text, "50px " + FONT_GAME, "#ffffff");
        oExtTimeText.x = 0;
        oExtTimeText.y = 0;
        oExtTimeText.textAlign = "center";
        oContainer.addChild(oExtTimeText);

        oContainer.x = -oExtTimeTextStroke.getBounds().width;
        oContainer.y = CANVAS_HEIGHT * 0.5;

        s_oStage.addChild(oContainer);

        createjs.Tween.get(oContainer).to({x: CANVAS_WIDTH * 0.5}, 750, createjs.Ease.cubicOut).call(function () {
            createjs.Tween.get(oContainer).to({x: CANVAS_WIDTH + oExtTimeTextStroke.getBounds().width}, 750, createjs.Ease.cubicIn).call(function () {
                s_oGame.extendLaunch();
                s_oStage.removeChild(oContainer);
            });
        });
    };

    this.refreshMatchNum = function (iLevel) {
        _oMatchText.refreshText(TEXT_MATCH + "\n" + iLevel);
    };

    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };

    this._onExit = function () {
        var _oAreYouSure = new CAreYouSurePanel(s_oStage);
        _oAreYouSure.show();
    };

    this.unloadPause = function () {
        _oPause.unload();
        _oPause = null;
    };

    this.onButPauseRelease = function () {
        _oPause = new CPause();
    };
    
    this.resetFullscreenBut = function(){
	if (_fRequestFullScreen && screenfull.isEnabled){
		_oButFullscreen.setActive(s_bFullscreen);
	}
    };

    this._onFullscreenRelease = function(){
        if(s_bFullscreen) { 
		_fCancelFullScreen.call(window.document);
	}else{
		_fRequestFullScreen.call(window.document.documentElement);
	}
	
	sizeHandler();

    };
    
    s_oInterface = this;

    this._init();

    return this;
}

var s_oInterface = null;