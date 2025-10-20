function CWinPanel(oSpriteBg, bEnd) {

    var _oBg;
    var _oResultText;
    var _oTitleText;
    var _oScoreTextBallSaved;
    var _oScoreTextBallPerfect;
    var _oScoreOpponentText;

    var _oNewScoreText;
    var _oGroup;
    var _oButMenu;
    var _oButContinue;
    var _oFade;

    this._init = function (oSpriteBg, bEnd) {
        var iSizeFontSecondaryText = 34;

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

        _oTitleText = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2-oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF - 250, oSpriteBg.width-40, 60, 
                    60, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );


        _oResultText = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2 - oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF - 120, oSpriteBg.width-40, 34, 
                    34, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );

        _oScoreTextBallSaved = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2 - oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF - 70, oSpriteBg.width-40, iSizeFontSecondaryText, 
                    iSizeFontSecondaryText, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );


        _oScoreTextBallPerfect = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2 - oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF - 10, oSpriteBg.width-40, iSizeFontSecondaryText, 
                    iSizeFontSecondaryText, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );


        _oScoreOpponentText =  new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2 - oSpriteBg.width/2+20, CANVAS_HEIGHT_HALF + 50, oSpriteBg.width-40, iSizeFontSecondaryText, 
                    iSizeFontSecondaryText, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );


        _oNewScoreText = new CTLText(_oGroup, 
                    CANVAS_WIDTH / 2 - oSpriteBg.width/2+150, CANVAS_HEIGHT_HALF + 170, oSpriteBg.width-300, iSizeFontSecondaryText, 
                    iSizeFontSecondaryText, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    " ",
                    true, true, true,
                    false );


        var oSpriteButContinue = s_oSpriteLibrary.getSprite("but_continue");
        _oButContinue = new CGfxButton(CANVAS_WIDTH * 0.5 + 360, CANVAS_HEIGHT * 0.5 + 180, oSpriteButContinue, _oGroup);
        _oButContinue.pulseAnimation();

        if (bEnd === false) {
            var oSpriteButHome = s_oSpriteLibrary.getSprite("but_home");
            _oButMenu = new CGfxButton(CANVAS_WIDTH * 0.5 - 360, CANVAS_HEIGHT * 0.5 + 180, oSpriteButHome, _oGroup);
            _oButMenu.addEventListener(ON_MOUSE_DOWN, this._onExit, this);

            _oButContinue.addEventListener(ON_MOUSE_DOWN, this._onContinue, this);
        } else {
            _oButContinue.addEventListener(ON_MOUSE_DOWN, this._onEnd, this);
        }

        s_oStage.addChild(_oGroup);

    };

    this.unload = function () {

        s_oStage.removeChild(_oGroup);
        if (_oButMenu) {
            _oButMenu.unload();
            _oButMenu = null;
        }

        if (_oButContinue) {
            _oButContinue.unload();
            _oButContinue = null;
        }
    };

    this.show = function (iBallSaved, iPerfect, iTarget, oScore) {
        _oTitleText.refreshText(TEXT_WIN);

        _oResultText.refreshText(TEXT_WIN_RESULT + " " + iBallSaved + " " + TEXT_OF + " " + iTarget + " " + TEXT_BALLS);

        _oScoreTextBallSaved.refreshText(TEXT_SCORE_BALL_SAVED + ": " + oScore.ball_saved);

        _oScoreTextBallPerfect.refreshText(TEXT_SCORE_BALL_SAVED_PERFECT + ": " + oScore.ball_saved_perfect);

        _oScoreOpponentText.refreshText(TEXT_GOAL_OPPONENT + ": " + oScore.opponent_goal);
        
        _oNewScoreText.refreshText(TEXT_TOTAL_SCORE + ": " + oScore.new_score);

        _oGroup.visible = true;

        createjs.Tween.get(_oFade).to({alpha: 0.5}, 500, createjs.Ease.cubicOut);

        createjs.Tween.get(_oGroup).wait(250).to({y: 0}, 1250, createjs.Ease.bounceOut).call(function () {
            if (s_iAdsLevel === NUM_LEVEL_FOR_ADS) {
                $(s_oMain).trigger("show_interlevel_ad");
                s_iAdsLevel = 1;
            } else {
                s_iAdsLevel++;
            }
        });

        $(s_oMain).trigger("save_score", oScore.new_score);
        $(s_oMain).trigger("share_event", oScore.new_score);
    };

    this._onContinue = function () {
        var oParent = this;
        createjs.Tween.get(_oGroup).to({y: CANVAS_HEIGHT}, 750, createjs.Ease.quartIn).call(function () {
            oParent.unload();
        });

        createjs.Tween.get(_oFade).to({alpha: 0}, 400, createjs.Ease.cubicOut).call(function () {
            s_oStage.removeChild(_oFade);
            _oFade.removeAllEventListeners();
        });

        _oButContinue.block(true);
        _oButMenu.block(true);

        s_oGame.onContinue(s_oStage.getChildIndex(_oGroup));
    };

    this._onEnd = function () {
        this.unload();
        s_oGame._onEnd();
    };

    this._onExit = function () {
        this.unload();

        _oFade.off("click", function () {});

        s_oGame.onExit();
    };

    this._init(oSpriteBg, bEnd);

    return this;
}