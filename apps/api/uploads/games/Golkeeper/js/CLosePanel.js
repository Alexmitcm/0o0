function CLosePanel(oSpriteBg) {

    var _oBg;
    var _oResultText;
    var _oTitleTextStoke;
    var _oTitleText;
    var _oGroup;
    var _oButMenu = null;
    var _oButRestart;
    var _oFade;
    var _bClick = false;

    this._init = function (oSpriteBg) {

        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oFade.alpha = 0.0;

        s_oStage.addChild(_oFade);

        _oGroup = new createjs.Container();
        _oGroup.alpha = 1;
        _oGroup.visible = false;
        _oGroup.y = CANVAS_HEIGHT;

        _oBg = createBitmap(oSpriteBg);
        _oBg.x = CANVAS_WIDTH_HALF;
        _oBg.y = CANVAS_HEIGHT_HALF;
        _oBg.regX = oSpriteBg.width * 0.5;
        _oBg.regY = oSpriteBg.height * 0.5;
        _oGroup.addChild(_oBg);

        _oResultText = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2-oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF -40, oSpriteBg.width-40, 90, 
                    45, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );


        _oTitleText = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2-oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF -220, oSpriteBg.width-40, 100, 
                    100, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, false,
                    false );


        s_oStage.addChild(_oGroup);

        var oSpriteButHome = s_oSpriteLibrary.getSprite("but_home");
        _oButMenu = new CGfxButton(CANVAS_WIDTH * 0.5 - 360, CANVAS_HEIGHT * 0.5 + 180, oSpriteButHome, _oGroup);
        _oButMenu.addEventListener(ON_MOUSE_DOWN, this._onExit, this);

        var oSpriteButRestart = s_oSpriteLibrary.getSprite("but_restart");
        _oButRestart = new CGfxButton(CANVAS_WIDTH * 0.5 + 360, CANVAS_HEIGHT * 0.5 + 180, oSpriteButRestart, _oGroup);
        _oButRestart.addEventListener(ON_MOUSE_DOWN, this._onRestart, this);
        _oButRestart.pulseAnimation();

    };

    this.unload = function () {
        createjs.Tween.get(_oGroup).to({alpha: 0}, 500, createjs.Ease.cubicOut).call(function () {
            s_oStage.removeChild(_oGroup);
            if (_oButMenu !== null) {
                _oButMenu.unload();
                _oButMenu = null;
            }

            _oFade.removeAllEventListeners();

            _oButRestart.unload();
            _oButRestart = null;
        });
    };

    this.show = function (iBallSaved, iTarget) {

        _oResultText.refreshText(TEXT_LOSE_RESULT + " " + iBallSaved + " " + TEXT_OF + " " + iTarget + " " + TEXT_BALLS);

        _oTitleText.refreshText(TEXT_LOSE);

        _oGroup.visible = true;

        createjs.Tween.get(_oFade).to({alpha: 0.5}, 500, createjs.Ease.cubicOut);

        _oFade.on("click", function () {});

        createjs.Tween.get(_oGroup).wait(250).to({y: 0}, 1250, createjs.Ease.elasticOut).call(function () {
            if (s_iAdsLevel === NUM_LEVEL_FOR_ADS) {
                $(s_oMain).trigger("show_interlevel_ad");
                s_iAdsLevel = 1;
            } else {
                s_iAdsLevel++;
            }
        });
    };

    this._onRestart = function () {
        if (_bClick) {
            return;
        }
        _bClick = true;
        this.unload();

        createjs.Tween.get(_oFade).to({alpha: 0}, 400, createjs.Ease.cubicOut).call(function () {
            s_oStage.removeChild(_oFade);
        });

        s_oGame.restartLevel();
    };

    this._onExit = function () {
        if (_bClick) {
            return;
        }
        _bClick = true;

        this.unload();
        s_oGame.onExit();
    };

    this._init(oSpriteBg);

    return this;
}