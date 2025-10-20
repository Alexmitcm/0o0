function CGame(oData, iLevel) {

    var _oInterface;
    var _oBg;

    var _oScene;
    var _oGloves;
    var _oBall;
    var _oOpponent = null;
    var _oGoal;
    var _oStageMouseMove = null;
    var _oContainerGame;
    var _bGoal = false;
    var _bKeeperSave = false;
    var _bPerfectSaved = false;
    var _bLaunched = false;
    var _bFieldCollide = false;
    var _iLevel;
    var _iScore;
    var _iLevelScore;
    var _iBallSaved = 0;
    var _iGoalOpponent = 0;
    var _iLaunch = 0;
    var _iPerfectBallSaved = 0;
    var _iCombo = 0;
    var _fTimeReset;
    var _aObjects;

    var _iGameState = STATE_INIT;
    var _oCamera = null;

    this._init = function () {
        this.pause(true);

        _iScore = 0;
        _iLevelScore = 0;

        _aObjects = new Array();

        _iLevel = iLevel;

        for (var i = 0; i < _iLevel; i++) {
            _iScore += s_aScores[i];
        }

        _oContainerGame = new createjs.Container();
        s_oStage.addChild(_oContainerGame);

        if (s_bMobile)
            this.velocityBall();

        _oBg = createBitmap(s_oSpriteLibrary.getSprite("bg_game"));
        _oContainerGame.addChild(_oBg);

        _oScene = new CScenario(_iLevel);

        if (SHOW_3D_RENDER) {
            _oCamera = camera;
        } else {
            _oCamera = createOrthoGraphicCamera();
        }

        var oSpriteOpponent = s_oSpriteLibrary.getSprite("opponent");
        _oOpponent = new COpponent(600, 480, oSpriteOpponent, _oContainerGame);

        var oSpriteBall = s_oSpriteLibrary.getSprite("ball");
        _oBall = new CBall(0, 0, oSpriteBall, _oScene.ballBody(), _oContainerGame);

        _aObjects.push(_oBall);

        this.ballPosition();

        resizeCanvas3D();

        setVolume("soundtrack", SOUNDTRACK_VOLUME_IN_GAME );

        _oInterface = new CInterface();

        var oSpriteGloves = s_oSpriteLibrary.getSprite("gloves");
        _oGloves = new CGloves(CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF, oSpriteGloves, _oScene.getHandKeeperBody(), _oContainerGame);

        _aObjects.push(_oGloves);

        var oSpriteGoal = s_oSpriteLibrary.getSprite("goal");
        _oGoal = new CGoal(0, 0, oSpriteGoal, _oScene.getGoalBody(), _oContainerGame);

        _aObjects.push(_oGoal);

        _oInterface.refreshBallSaved(_iBallSaved, BALL_TO_SAVED[_iLevel]);
        _oInterface.refreshMatchNum(_iLevel + 1);
        _oInterface.refreshLaunch(_iLaunch, MATCH_LAUNCH[_iLevel]);

        if (!SHOW_3D_RENDER) {
            _oInterface.createHelpPanel();
        } else {
            this.onExitHelp();
        }

    };

    this.velocityBall = function () {
        for (var i = 0; i < BALL_FORCE_Y.length; i++) {
            BALL_FORCE_Y[i] *= BALL_VELOCITY_MULTIPLIER;
            BALL_FORCE_Z[i].min /= (BALL_VELOCITY_MULTIPLIER + 0.1);
            BALL_FORCE_Z[i].max *= (BALL_VELOCITY_MULTIPLIER + 0.1);
            BALL_FORCE_X[i] *= BALL_VELOCITY_MULTIPLIER;
        }
    };

    this.sortDepth = function (oObj1, oObj2) {
        if (oObj1 === null || oObj2 === null) {
            return;
        }
        if (oObj1.getDepthPos() > oObj2.getDepthPos()) {
            if (_oContainerGame.getChildIndex(oObj1.getObject()) > _oContainerGame.getChildIndex(oObj2.getObject())) {
                _oContainerGame.swapChildren(oObj1.getObject(), oObj2.getObject());
            }
        } else if (oObj1.getDepthPos() < oObj2.getDepthPos()) {
            if (_oContainerGame.getChildIndex(oObj2.getObject()) > _oContainerGame.getChildIndex(oObj1.getObject())) {
                _oContainerGame.swapChildren(oObj2.getObject(), oObj1.getObject());
            }
        }
    };

    this.onExitHelp = function () {
        this.activeEventListeners();
        this.pause(false);
        this.startOpponentShot();
        _oInterface.onExitFromHelp();
    };

    this.activeEventListeners = function () {
        if (SHOW_3D_RENDER) {
            window.addEventListener("mousedown", this.addImpulseToBall);
            window.addEventListener("mousemove", this.onHandKeeper);
        } else {
            if (_oStageMouseMove === null) {
                _oStageMouseMove = s_oStage.on("stagemousemove", this.onHandKeeper);
            }
        }
    };

    this.deactiveEventListeners = function () {
        if (SHOW_3D_RENDER) {
            window.removeEventListener("mousedown", this.addImpulseToBall);
            window.removeEventListener("mousemove", this.onHandKeeper);
        } else {
            s_oStage.off("stagemousemove", _oStageMouseMove);
            _oStageMouseMove = null;
        }
    };

    this.ballPosition = function () {
        var oBallBody = _oScene.ballBody();


        var oPos2DBall = this.convert3dPosTo2dScreen(oBallBody.position, _oCamera);

        var fScaleDistance = _oBall.getStartScale() - oPos2DBall.z;

        this.shadowBall(oBallBody, fScaleDistance);

        _oBall.scale(fScaleDistance);
        _oBall.setPosition(oPos2DBall.x, oPos2DBall.y);
    };

    this.getLevel = function () {
        return _iLevel;
    };

    this.shadowBall = function (oBallBody, fScaleDistance) {
        var oFieldBody = _oScene.getFieldBody();

        var oPosShadow = {x: oBallBody.position.x, y: oBallBody.position.y, z: oFieldBody.position.z};

        var oPos2dShadow = this.convert3dPosTo2dScreen(oPosShadow, _oCamera);

        var fDistance = oBallBody.position.z - oFieldBody.position.z;

        var fScaleHeight = fScaleDistance / fDistance;
        _oBall.scaleShadow(fScaleHeight);

        var fDistanceShadow = (-(oBallBody.position.z) - oFieldBody.position.z * 0.1) * 0.1;
        _oBall.setAlphaByHeight(fDistanceShadow);

        _oBall.setPositionShadow(oPos2dShadow.x, oPos2dShadow.y);
    };

    this.unload = function () {
        s_oStage.removeAllChildren();
        _oInterface.unload();

        _oScene.destroyWorld();
        _oScene = null;

        this.deactiveEventListeners();

    };

    this.onContinue = function () {
        this.nextLevel();
        _iGameState = STATE_PLAY;
        this.resetValues();
        this.activeEventListeners();
    };

    this.resetValues = function () {
        _iGoalOpponent = 0;
        _iBallSaved = 0;
        _iPerfectBallSaved = 0;
        _iLevelScore = 0;
        _iLaunch = 0;

        _oInterface.refreshBallSaved(_iBallSaved, BALL_TO_SAVED[_iLevel]);
        _oInterface.refreshLaunch(_iLaunch, MATCH_LAUNCH[_iLevel]);
    };

    this.nextLevel = function () {
        _iLevel++;
        _oInterface.refreshMatchNum(_iLevel + 1);
        this.resetScene();
        $(s_oMain).trigger("start_level", _iLevel);
        this.startOpponentShot();
    };

    this.wallSoundCollision = function () {
        playSound("ball_collision", 1, false);
    };

    this.goal = function () {
        if (!_bGoal) {
            _bGoal = true;
            _fTimeReset = TIME_RESET_AFTER_GOAL;
            _oInterface.createAnimText(TEXT_GOAL, 80);
            playSound("goal", 1, false);
            _iCombo = 0;
        }
    };

    this.keeperSave = function (oContactPoint) {
        if (_bGoal) {
            return;
        }
        if (!_bKeeperSave) {
            if (oContactPoint.x > -BALL_SAVED_POINT.x && oContactPoint.x < BALL_SAVED_POINT.x && oContactPoint.z > -BALL_SAVED_POINT.z
                    && oContactPoint.z < BALL_SAVED_POINT.z) {
                _bPerfectSaved = true;
                _oBall.getPhysics().mass = 0;
                _fTimeReset = TIME_RESET_AFTER_PERFECT_KEEPER_SAVED;
                _iPerfectBallSaved++;
                _oGloves.changeState("perfect");
                createjs.Tween.get(_oContainerGame).wait(TIME_BALL_IN_HAND).call(function () {
                    _bPerfectSaved = false;
                    _oBall.getPhysics().mass = BALL_MASS;
                    _oGloves.changeState("normal");
                });
            } else {
                _bPerfectSaved = false;
                _fTimeReset = TIME_RESET_AFTER_KEEPER_SAVED;
            }

            createjs.Tween.get(_oContainerGame).wait(300).call(function () {
                if (!_bGoal)
                    s_oGame.textSave();

            });
            _bKeeperSave = true;
            playSound("kick", 0.65, false);
            playSound("keep_ball", 1, false);
        }
    };

    this.addImpulseToBall = function () {
        if (_bLaunched || _iGameState !== STATE_PLAY) {
            return;
        }

        var fX = (Math.random() * (BALL_FORCE_X[_iLevel] + BALL_FORCE_X[_iLevel])) - BALL_FORCE_X[_iLevel];
        var fZ = (Math.random() * (BALL_FORCE_Z[_iLevel].max - BALL_FORCE_Z[_iLevel].min)) + BALL_FORCE_Z[_iLevel].min;
        var oDir = {x: fX, y: -BALL_FORCE_Y[_iLevel], z: fZ};
        var oBall = _oScene.ballBody();
        _oScene.addImpulse(oBall, oDir);
        _oScene.setElementAngularVelocity(oBall, {x: 0, y: 0, z: 0});
        _bLaunched = true;
    };

    this.pause = function (bVal) {
        if (bVal) {
            _iGameState = STATE_PAUSE;
            if (_oOpponent !== null)
                _oOpponent.stopAnimation();
            this.deactiveEventListeners();
        } else {
            _iGameState = STATE_PLAY;
            if (_oOpponent !== null)
                _oOpponent.playAnimation();
            this.activeEventListeners();
        }
        createjs.Ticker.paused = bVal;
    };

    this.startOpponentShot = function () {
        _oOpponent.changeState("shot");
        _oOpponent.fadeAnimation(1);
        _oOpponent.onFinishAnimation();
    };

    this.onExit = function () {
        this.unload();

        $(s_oMain).trigger("show_interlevel_ad");
        $(s_oMain).trigger("end_session");
        setVolume("soundtrack", 1);
        s_oMain.gotoMenu();
    };

    this.restartLevel = function () {
        this.resetValues();
        this.resetScene();
        this.activeEventListeners();
        _iGameState = STATE_PLAY;
        this.startOpponentShot();
        $(s_oMain).trigger("restart_level", _iLevel);
    };

    this.resetBallPosition = function () {
        var oBallBody = _oScene.ballBody();

        oBallBody.position.set(POSITION_BALL.x, POSITION_BALL.y, POSITION_BALL.z);
        _oScene.setElementVelocity(oBallBody, {x: 0, y: 0, z: 0});
        _oScene.setElementAngularVelocity(oBallBody, {x: 0, y: 0, z: 0});

        _oBall.fadeAnimation(1, 500, 0);
    };

    this.ballFadeForReset = function () {
        if (_bGoal || _bKeeperSave) {
            var iWait = 1000;
            if (_bGoal) {
                iWait = 100;
            }
            if (!_bFieldCollide) {
                _oBall.fadeAnimation(0, 300, iWait);
                _bFieldCollide = true;
            }
        }
    };

    this._updateInit = function () {
        _oScene.update();
        this._updateBall2DPosition();
        _iGameState = STATE_PLAY;
    };

    this.onHandKeeper = function (e) {
        var oHandKeeperBody = _oScene.getHandKeeperBody();

        if (!SHOW_3D_RENDER) {
            var oPosMouse = {x: e.stageX / s_fInverseScaling, y: e.stageY / s_fInverseScaling};
        } else {
            var oPosMouse = {x: e.clientX - s_iCanvasOffsetWidth, y: e.clientY - s_iCanvasOffsetHeight};
        }

        if (s_bMobile) {
            oPosMouse.x = oPosMouse.x + MOBILE_OFFSET_GLOVES_X;
        }

        var oMouse3D = s_oGame.convert2dScreenPosTo3d(oPosMouse, oHandKeeperBody);

        if (oMouse3D.x < LIMIT_HAND_RANGE_POS.x && oMouse3D.x > -LIMIT_HAND_RANGE_POS.x) {
            oHandKeeperBody.position.x = oMouse3D.x;
        } else {
            if (oMouse3D.x < LIMIT_HAND_RANGE_POS.x) {
                oHandKeeperBody.position.x = -LIMIT_HAND_RANGE_POS.x;
            } else {
                oHandKeeperBody.position.x = LIMIT_HAND_RANGE_POS.x;
            }
        }

        if (oMouse3D.z > LIMIT_HAND_RANGE_POS.zMin && oMouse3D.z < LIMIT_HAND_RANGE_POS.zMax) {
            oHandKeeperBody.position.z = oMouse3D.z;
        } else {
            if (oMouse3D.z > LIMIT_HAND_RANGE_POS.zMin) {
                oHandKeeperBody.position.z = LIMIT_HAND_RANGE_POS.zMax;
            } else {
                oHandKeeperBody.position.z = LIMIT_HAND_RANGE_POS.zMin;
            }
        }

        var oPos2D = s_oGame.convert3dPosTo2dScreen(oHandKeeperBody.position, _oCamera);

        _oGloves.setPosition(oPos2D.x, oPos2D.y);

        if (_bPerfectSaved) {
            s_oGame.ballInHand(oHandKeeperBody.position);
        }
    };

    this.ballInHand = function (oPos) {
        var oBallBody = _oScene.ballBody();

        oBallBody.position.x = oPos.x;
        oBallBody.position.y = oPos.y + BALL_RADIUS * 0.7;
        oBallBody.position.z = oPos.z;

        var oPos2DBall = this.convert3dPosTo2dScreen(oBallBody.position, _oCamera);

        var fScaleDistance = _oBall.getStartScale() - oPos2DBall.z;

        this.shadowBall(oBallBody, fScaleDistance);

        _oBall.scale(_oBall.getStartScale() - oPos2DBall.z);
        _oBall.setPosition(oPos2DBall.x, oPos2DBall.y);
    };

    this.convert2dScreenPosTo3d = function (oPos2d) {
        var iWidth = (s_iCanvasResizeWidth);
        var iHeight = (s_iCanvasResizeHeight);

        var mouse3D = new THREE.Vector3((oPos2d.x / iWidth) * 2 - 1, //x
                -(oPos2d.y / iHeight) * 2 + 1, //y
                -1);                                            //z
        mouse3D.unproject(_oCamera);
        mouse3D.sub(_oCamera.position);
        mouse3D.normalize();

        var fFactor = 34.0;

        mouse3D.multiply(new THREE.Vector3(fFactor, 1, fFactor));

        return mouse3D;
    };

    this.convert3dPosTo2dScreen = function (pos, oCamera) {
        var v3 = new THREE.Vector3(pos.x, pos.y, pos.z);

        var vector = v3.project(oCamera);

        var widthHalf = Math.floor(s_iCanvasResizeWidth) * 0.5;
        var heightHalf = Math.floor(s_iCanvasResizeHeight) * 0.5;

        vector.x = ((vector.x * widthHalf) + widthHalf) * s_fInverseScaling;
        vector.y = (-(vector.y * heightHalf) + heightHalf) * s_fInverseScaling;

        return vector;
    };

    this.timeReset = function () {
        if (_fTimeReset > 0) {
            _fTimeReset -= FPS_TIME;
        } else {
            if (_bGoal) {
                _iGoalOpponent++;
                //   _oInterface.refreshGoalOpponent(_iGoalOpponent);
            } else {
                _iBallSaved++;
                _oInterface.refreshBallSaved(_iBallSaved, BALL_TO_SAVED[_iLevel]);
            }
            _iLaunch++;
            _oInterface.refreshLaunch(_iLaunch, MATCH_LAUNCH[_iLevel]);

            var iMaxLaunch = MATCH_LAUNCH[_iLevel];

            if (_iLaunch < iMaxLaunch) {
                this.resetScene();
                _bFieldCollide = false;
                this.startOpponentShot();
            } else {
                this.matchResult();
                _iGameState = STATE_FINISH;
                $(s_oMain).trigger("end_level", _iLevel);
                this.deactiveEventListeners();
            }
            _bLaunched = false;
        }
    };

    this.textSave = function () {
        if (_iCombo < TEXT_CONGRATULATION.length) {
            var bFlashEffect = false;
            if (_iCombo >= TEXT_CONGRATULATION.length - 1) {
                bFlashEffect = true;
            }
            _oInterface.createAnimText(TEXT_CONGRATULATION[_iCombo], TEXT_SIZE[_iCombo], bFlashEffect);
            _iCombo++;
        } else {
            var bFlashEffect = false;
            var iRand = Math.floor(Math.random() * (TEXT_CONGRATULATION.length - 1)) + 1;
            if (iRand >= TEXT_CONGRATULATION.length - 1) {
                bFlashEffect = true;
            }
            _oInterface.createAnimText(TEXT_CONGRATULATION[iRand], TEXT_SIZE[iRand], bFlashEffect);
        }
    };

    this.matchResult = function () {
        if (_iBallSaved >= BALL_TO_SAVED[_iLevel]) {
            this.wonMatch();
        } else {
            this.lostMatch();
        }
    };

    this.goalAnimation = function (fForce) {
        if (fForce > 500 && fForce < 1000) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[0].time, INTENSITY_DISPLAY_SHOCK[0].x, INTENSITY_DISPLAY_SHOCK[0].y);
        } else if (fForce > 999 && fForce < 2000) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[1].time, INTENSITY_DISPLAY_SHOCK[1].x, INTENSITY_DISPLAY_SHOCK[1].y);
        } else if (fForce > 1999 && fForce < 3000) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[2].time, INTENSITY_DISPLAY_SHOCK[2].x, INTENSITY_DISPLAY_SHOCK[2].y);
        } else if (fForce > 2999) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[3].time, INTENSITY_DISPLAY_SHOCK[3].x, INTENSITY_DISPLAY_SHOCK[3].y);
        }
    };

    this.displayShock = function (iTime, iXIntensity, iYIntensity) {
        var xShifting = iXIntensity;
        var yShifting = iYIntensity;

        createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting), y: Math.round(Math.random() * yShifting)}, iTime).call(function () {
            createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.8), y: -Math.round(Math.random() * yShifting * 0.8)}, iTime).call(function () {
                createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.6), y: Math.round(Math.random() * yShifting * 0.6)}, iTime).call(function () {
                    createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.4), y: -Math.round(Math.random() * yShifting * 0.4)}, iTime).call(function () {
                        createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.2), y: Math.round(Math.random() * yShifting * 0.2)}, iTime).call(function () {
                            createjs.Tween.get(_oContainerGame).to({y: 0, x: 0}, iTime).call(function () {
                            });
                        });
                    });
                });
            });
        });
    };

    this.wonMatch = function () {
        var bEnd = false;
        if (_iLevel >= MATCH_LAUNCH.length - 1) {
            bEnd = true;
        }
        var oScore = this.calculateNewScore();
        _iScore = oScore.new_score;
        this.saveProgress();
        _oInterface.createWinPanel(_iBallSaved, _iPerfectBallSaved, BALL_TO_SAVED[_iLevel], oScore, bEnd);
        playSound("win", 1, false);
    };

    this.lostMatch = function () {
        _oInterface.createLosePanel(_iBallSaved, BALL_TO_SAVED[_iLevel]);
        playSound("goal", 1, false);
    };

    this.calculateNewScore = function () {
        var oInfo = {score: _iScore, ball_saved: 0, ball_saved_perfect: 0, opponent_goal: 0, new_score: 0};

        oInfo.ball_saved = _iBallSaved * SCORE_BALL_SAVED;
        oInfo.ball_saved_perfect = _iPerfectBallSaved * SCORE_PERFECT_BALL_SAVED;
        oInfo.opponent_goal = _iGoalOpponent * SCORE_GOAL_OPPONENT;

        _iLevelScore = oInfo.ball_saved + oInfo.opponent_goal + oInfo.ball_saved_perfect;

        oInfo.new_score = oInfo.score + _iLevelScore;

        if (oInfo.new_score < 0) {
            oInfo.new_score = 0;
        }

        return oInfo;
    };

    this.saveProgress = function () {
        if (s_iLastLevel < _iLevel + 2) {
            s_iLastLevel = _iLevel + 2;
        }

        if (_iLevelScore > s_aScores[_iLevel]) {
            s_aScores[_iLevel] = _iLevelScore;
        }

        saveItem("LevelReached", s_iLastLevel);
        saveItem("Scores", JSON.stringify(s_aScores));
    };

    this.resetScene = function () {
        _bGoal = false;
        _bKeeperSave = false;
        this.resetBallPosition();
    };

    this._onEnd = function () {
        this.onExit();
    };

    this.swapChildrenIndex = function () {
        for (var i = 0; i < _aObjects.length - 1; i++) {
            for (var j = i + 1; j < _aObjects.length; j++) {
                this.sortDepth(_aObjects[i], _aObjects[j]);
            }
        }
    };

    this.rotateGuantes = function () {
        var fDistanceX = (_oGloves.getX() - CANVAS_WIDTH_HALF) * HAND_KEEPER_ANGLE_RATE;

        _oGloves.setRotation(fDistanceX);
    };

    this._updatePlay = function () {
        for (var i = 0; i < PHYSICS_ACCURACY; i++) {
            _oScene.update();
        }

        this._updateBall2DPosition();

        if (_bKeeperSave || _bGoal) {
            this.timeReset();
        }

        this.rotateGuantes();

        this.swapChildrenIndex();


    };

    this.update = function () {
        switch (_iGameState) {
            case STATE_INIT:
                {
                    this._updateInit();
                }
                break;
            case STATE_PLAY:
                {
                    this._updatePlay();
                }
                break;
            case STATE_FINISH:

                break;
            case STATE_PAUSE:

                break;
        }
    };

    this._updateBall2DPosition = function () {
        if (!_bPerfectSaved) {
            this.ballPosition();
            _oBall.rolls();
        }

        _oCamera.updateProjectionMatrix();
        _oCamera.updateMatrixWorld();
    };

    s_oGame = this;

    BALL_TO_SAVED = oData.ball_to_saved;
    BALL_FORCE_X = oData.ball_force_left_right;
    BALL_FORCE_Z = oData.ball_force_up;
    BALL_FORCE_Y = oData.ball_force_velocity;
    MATCH_LAUNCH = oData.max_launch;
    SCORE_PERFECT_BALL_SAVED = oData.score_perfect_ball_saved;
    SCORE_BALL_SAVED = oData.score_ball_saved;
    SCORE_GOAL_OPPONENT = oData.score_goal_opponent;
    BALL_SAVED_POINT = oData.perfect_ball_saved_point;
    NUM_LEVEL_FOR_ADS = oData.num_levels_for_ads;


    this._init();
}

var s_oGame;