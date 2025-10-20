var CANVAS_WIDTH = 1280;
var CANVAS_HEIGHT = 768;

var CANVAS_WIDTH_HALF = CANVAS_WIDTH * 0.5;
var CANVAS_HEIGHT_HALF = CANVAS_HEIGHT * 0.5;

var EDGEBOARD_X = 90;
var EDGEBOARD_Y = 95;

var DISABLE_SOUND_MOBILE = false;
var FONT_GAME = "Arial";
var SECONDARY_FONT = "blackplotanregular";

var FPS = 30;

var FPS_DESKTOP = 60;

var FPS_TIME = 1 / FPS;

var ROLL_BALL_RATE = 60 / FPS;

var STATE_LOADING = 0;
var STATE_MENU = 1;
var STATE_HELP = 1;
var STATE_GAME = 3;

var ON_MOUSE_DOWN = 0;
var ON_MOUSE_UP = 1;
var ON_MOUSE_OVER = 2;
var ON_MOUSE_OUT = 3;
var ON_DRAG_START = 4;
var ON_DRAG_END = 5;
var ON_TWEEN_ENDED = 6;
var ON_BUT_NO_DOWN = 7;
var ON_BUT_YES_DOWN = 8;

var STEP_RATE = 1.5;

var TEXT_SIZE = [80, 100, 130];

var TEXT_EXCELLENT_COLOR = ["#fff", "#5d96fe"];

var TEXT_COLOR = "#ffffff";

var TEXT_COLOR_STROKE = "#000000";

var TIME_INTERVAL_STROBE = 0.2;

var PHYSICS_ACCURACY = 3;

var MOBILE_OFFSET_GLOVES_X = -100;

var BALL_VELOCITY_MULTIPLIER = 1;

var PHYSICS_STEP = 1 / (FPS * STEP_RATE);

var STATE_INIT = 0;
var STATE_PLAY = 1;
var STATE_FINISH = 2;
var STATE_PAUSE = 3;

var BALL_MASS = 0.5;

var BALL_RADIUS = 1;

var BALL_LINEAR_DAMPING = 0.2;

var OFFSET_BALL_POS_X = 10;

var OBJECT;

var TIME_TRY_TO_SHOT_BALL_OPPONENT = 0.7;

var START_POS_FLAG = {x: 277, y: 268};

var FLAG_ADDED_POS = {x: 61, y: 69};

var FLAG_LIMIT_POS_X = 690;

var TOT_TEAM = 32;

var MIN_BALL_VEL_ROTATION = 0.1;

var TIME_RESET_AFTER_GOAL = 1;

var TIME_RESET_AFTER_KEEPER_SAVED = 2;

var TIME_RESET_AFTER_PERFECT_KEEPER_SAVED = 3;

var TIME_BALL_IN_HAND = 1000;

var FOV = 45;

var INTERVAL_SHOOT = 1;

var HAND_KEEPER_ANGLE_RATE = 0.15;

var LIMIT_HAND_RANGE_POS = {x: 16.8, zMax: 3.1, zMin: -8.5};

var BACK_WALL_GOAL_SIZE = {width: 17.5, depth: 0.1, height: 7.5};

var LEFT_RIGHT_WALL_GOAL_SIZE = {width: 0.1, depth: 25, height: 7.5};

var UP_WALL_GOAL_SIZE = {width: 17.5, depth: 25, height: 0.1};

var BACK_WALL_GOAL_POSITION = {x: 0, y: 8, z: -2.7};

var POSITION_BALL = {x: 0, y: 125, z: -9};

var GOAL_LINE_POS = {x: 0, y: 31, z: -2.7};

var HAND_KEEPER_SIZE = {width: 1.8, depth: 0.5, height: 1.5};

var HAND_KEEPER_POSITION = {x: 0, y: 36, z: 0};

var POLE_UP_SIZE = {radius_top: 0.5, radius_bottom: 0.5, height: 35, segments: 10};

var POLE_RIGHT_LEFT_SIZE = {radius_top: 0.5, radius_bottom: 0.5, height: 15, segments: 10};

var GOAL_POSITION = {x: 0, y: 33, z: -2.7};

var OFFSET_FIELD_Y = 35;
var OFFSET_FIELD_X = 35;

var HIT_BALL_MAX_FORCE = 100;
var HIT_BALL_MIN_FORCE = 0.01;

var FIELD_POSITION;

var SHOW_3D_RENDER = false;
var CANVAS_3D_OPACITY = 0.7;

var CAMERA_TEST = false;

var MOUSE_SENSIBILTY = 0.03;

var BALL_Z_FORCE_RANGE = {min: 3, max: 10};

var INTENSITY_DISPLAY_SHOCK = [{x: 30, y: 20, time: 75}, {x: 50, y: 25, time: 75}, {x: 70, y: 30, time: 75}, {x: 90, y: 40, time: 75}];

var CAMERA_POSITION = {x: 0, y: 0, z: 100};
var NEAR = 10, FAR = 2000;

var SOUNDTRACK_VOLUME_IN_GAME = 0.35;
