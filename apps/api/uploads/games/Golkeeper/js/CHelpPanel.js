function CHelpPanel(iXPos, iYPos, oSprite) {
    var _oTitle;
    var _oText1;

    var _oHelpBg;
    var _oFade;
    var _oGroup;
    var _oButContinue;
    var _oGloves;
    var _oContainerAnim;
    var _bClick = false;
    var _oHelpControl;

    this._init = function (iXPos, iYPos, oSprite) {
        _oGroup = new createjs.Container();
        _oGroup.x = iXPos;
        _oGroup.y = iYPos;
        s_oStage.addChild(_oGroup);

        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oFade.alpha = 0.5;

        _oGroup.addChild(_oFade);

        _oHelpBg = createBitmap(oSprite);
        _oHelpBg.x = CANVAS_WIDTH_HALF;
        _oHelpBg.y = CANVAS_HEIGHT_HALF;
        _oHelpBg.regX = oSprite.width * 0.5;
        _oHelpBg.regY = oSprite.height * 0.5;

        _oGroup.addChild(_oHelpBg);

        _oTitle = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2-oSprite.width/2+20, CANVAS_HEIGHT_HALF - 240, oSprite.width-40, 100, 
                    50, "center", TEXT_COLOR, FONT_GAME, 1,
                    0, 0,
                    TEXT_HOW_TO_PLAY,
                    true, true, true,
                    false );


        _oContainerAnim = new createjs.Container();

        var oSpriteGloves = s_oSpriteLibrary.getSprite("gloves");
        _oGloves = new CGloves(CANVAS_WIDTH_HALF, 306, oSpriteGloves, null, _oContainerAnim);
        _oGloves.changeState("perfect");

        var szText;
        var szControl;

        if (s_bMobile) {
            szText = TEXT_HELP1_MOBILE;
            szControl = "help_touch";
        } else {
            szText = TEXT_HELP1_PC;
            szControl = "help_mouse";
        }

        var oSpriteControl = s_oSpriteLibrary.getSprite(szControl);
        _oHelpControl = createBitmap(oSpriteControl);
        _oHelpControl.x = CANVAS_WIDTH_HALF + 6;
        _oHelpControl.y = 320;
        _oHelpControl.regX = oSpriteControl.width * 0.5;
        _oHelpControl.regY = oSpriteControl.height * 0.5;

        _oContainerAnim.addChild(_oHelpControl);

        _oGroup.addChild(_oContainerAnim);

        this.animGloves();

        _oText1 = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2-oSprite.width/2+20, CANVAS_HEIGHT_HALF + 34, oSprite.width-40, 64, 
                    32, "center", TEXT_COLOR, FONT_GAME, 1,
                    0, 0,
                    szText,
                    true, true, true,
                    false );
                    


        var oSpriteContiune = s_oSpriteLibrary.getSprite('but_continue');
        _oButContinue = new CGfxButton(CANVAS_WIDTH / 2, CANVAS_HEIGHT_HALF + 180, oSpriteContiune, _oGroup);
        _oButContinue.addEventListener(ON_MOUSE_UP, this._onExitHelp, this);
        _oButContinue.pulseAnimation();

        var oParent = this;
        _oGroup.on("pressup", function () {
            oParent._onExitHelp();
        });
    };

    this.animGloves = function () {
        var oParent = this;
        createjs.Tween.get(_oContainerAnim).to({x: 100}, 1000, createjs.Ease.cubicInOut).call(function () {
            createjs.Tween.get(_oContainerAnim).to({x: -100}, 1000, createjs.Ease.cubicInOut).call(function () {
                oParent.animGloves();
            });
        });
    };

    this.unload = function () {
        createjs.Tween.get(_oGroup).to({alpha: 0}, 500, createjs.Ease.cubicIn).call(function () {
            s_oStage.removeChild(_oGroup);
        });
        var oParent = this;
        createjs.Tween.removeTweens(_oContainerAnim);
        _oGroup.off("pressup", function () {
            oParent._onExitHelp();
        });
    };

    this._onExitHelp = function () {
        if (_bClick) {
            return;
        }
        _bClick = true;
        this.unload();
        s_oGame.onExitHelp();
    };

    this._init(iXPos, iYPos, oSprite);

}