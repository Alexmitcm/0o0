function CConfirmPanel(szText) {

    var _iTextY = -210;
    var _iButtonY = 70;

    var _oParent = this;

    var _aCbCompleted = new Array();
    var _aCbOwner = new Array();
    var _aParams = new Array();

    var _oBg;
    var _oContainer;
    var _oContainerPos = {x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + 50};

    var _szText = szText;
    var _oMsgText;

    var _oShape;

    var _oButNo;
    var _oButYes;

    this._init = function () {

        var oSpriteBg = s_oSpriteLibrary.getSprite('msg_box_small');

        _oContainer = new createjs.Container();
        _oContainer.x = _oContainerPos.x;
        _oContainer.y = CANVAS_HEIGHT + oSpriteBg.width * 0.5;

        _oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#000000").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oShape.alpha = 0;
        _oShape.on("mousedown", this._onClick);
        s_oStage.addChild(_oShape);

        _oBg = createBitmap(oSpriteBg);
        _oBg.regX = oSpriteBg.width / 2;
        _oBg.regY = oSpriteBg.height / 2;
        _oContainer.addChild(_oBg);

        _oMsgText = new CTLText(_oContainer, 
                    -oSpriteBg.width/2+20, _iTextY + 85, oSpriteBg.width-40, 105, 
                    35, "center", "#fff", FONT_GAME, 1,
                    0, 0,
                    _szText,
                    true, true, true,
                    false );


        _oButNo = new CGfxButton(-180, _iButtonY, s_oSpriteLibrary.getSprite('but_no'), _oContainer);
        _oButNo.pulseAnimation();

        _oButYes = new CGfxButton(180, _iButtonY, s_oSpriteLibrary.getSprite('but_yes'), _oContainer);

        s_oStage.addChild(_oContainer);

        this.show();
    };

    this._initListener = function () {
        _oButNo.addEventListener(ON_MOUSE_DOWN, this.buttonNoDown, this);
        _oButYes.addEventListener(ON_MOUSE_DOWN, this.buttonYesDown, this);
    };

    this.addEventListener = function (iEvent, cbCompleted, cbOwner) {
        _aCbCompleted[iEvent] = cbCompleted;
        _aCbOwner[iEvent] = cbOwner;
    };

    this.buttonNoDown = function () {
        if (_aCbCompleted[ON_BUT_NO_DOWN]) {
            _aCbCompleted[ON_BUT_NO_DOWN].call(_aCbOwner[ON_BUT_NO_DOWN], _aParams);
        }
    };

    this.buttonYesDown = function () {
        if (_aCbCompleted[ON_BUT_YES_DOWN]) {
            _aCbCompleted[ON_BUT_YES_DOWN].call(_aCbOwner[ON_BUT_YES_DOWN], _aParams);
        }
    };

    this._onClick = function () {

    };

    this.show = function () {
        createjs.Tween.get(_oShape).to({alpha: 0.9}, 500, createjs.Ease.quadOut);
        createjs.Tween.get(_oContainer).to({y: _oContainerPos.y}, 500, createjs.Ease.quadOut).call(function () {
            _oParent._initListener();
        });
    };

    this.unload = function () {
        createjs.Tween.get(_oContainer).to({y: CANVAS_HEIGHT * 1.5}, 500).call(function () {
            s_oStage.removeChild(_oContainer);
        });

        createjs.Tween.get(_oShape).to({alpha: 0}, 500, createjs.Ease.quadIn).call(function () {
            s_oStage.removeChild(_oShape);
        });

    };

    this._init();

    s_oVariousHelp = this;

    return this;
}

var s_oVariousHelp = null;