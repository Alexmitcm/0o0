var _0xeffb0 = _0x2597;
function _0x2597(_0x156391, _0x45a957) {
  var _0x4b77bf = _0x4b77();
  return (
    (_0x2597 = function (_0x259746, _0x4c7c00) {
      _0x259746 = _0x259746 - 0x144;
      var _0x20728c = _0x4b77bf[_0x259746];
      return _0x20728c;
    }),
    _0x2597(_0x156391, _0x45a957)
  );
}
(function (_0x5305b4, _0x1901c1) {
  var _0x200728 = _0x2597,
    _0x4e0352 = _0x5305b4();
  while (!![]) {
    try {
      var _0x585639 =
        parseInt(_0x200728(0x165)) / 0x1 +
        -parseInt(_0x200728(0x188)) / 0x2 +
        parseInt(_0x200728(0x178)) / 0x3 +
        (-parseInt(_0x200728(0x176)) / 0x4) *
          (parseInt(_0x200728(0x160)) / 0x5) +
        (-parseInt(_0x200728(0x15b)) / 0x6) *
          (-parseInt(_0x200728(0x17b)) / 0x7) +
        (parseInt(_0x200728(0x147)) / 0x8) *
          (-parseInt(_0x200728(0x156)) / 0x9) +
        (-parseInt(_0x200728(0x170)) / 0xa) *
          (-parseInt(_0x200728(0x18b)) / 0xb);
      if (_0x585639 === _0x1901c1) break;
      else _0x4e0352["push"](_0x4e0352["shift"]());
    } catch (_0x46bbaa) {
      _0x4e0352["push"](_0x4e0352["shift"]());
    }
  }
})(_0x4b77, 0x54274);
var style = document[_0xeffb0(0x173)](_0xeffb0(0x15c));
(style[_0xeffb0(0x16d)] = _0xeffb0(0x14c)),
  document[_0xeffb0(0x161)][_0xeffb0(0x15f)](style);
var timerRunning = ![],
  idleTimer,
  idleTime = 0x3a98,
  elapsedTime = 0x0,
  coinsToSend = 0xa,
  apiUrl = _0xeffb0(0x169),
  iserror = ![];
function updateCounter() {
  var _0x1e1549 = new Date()["getTime"]() - elapsedTime;
  (timerRunning = !![]),
    (idleTimer = setTimeout(function () {
      var _0x5907e0 = _0x2597;
      (timerRunning = ![]),
        (document[_0x5907e0(0x163)]("clock")[_0x5907e0(0x145)] =
          "Don\x27t\x20be\x20idle");
    }, idleTime));
  var _0xde23f0 = setInterval(function () {
    var _0x55d60b = _0x2597;
    if (!timerRunning) {
      clearInterval(_0xde23f0);
      return;
    }
    var _0x273a41 = new Date()["getTime"]();
    elapsedTime = _0x273a41 - _0x1e1549;
    var _0x3b5812 = Math["floor"](elapsedTime / (0x3e8 * 0x3c * 0x3c)),
      _0x130e90 = Math["floor"](
        (elapsedTime % (0x3e8 * 0x3c * 0x3c)) / (0x3e8 * 0x3c)
      ),
      _0x5864fd = Math[_0x55d60b(0x18c)](
        (elapsedTime % (0x3e8 * 0x3c)) / 0x3e8
      );
    (document["getElementById"](_0x55d60b(0x16b))["innerText"] =
      _0x3b5812[_0x55d60b(0x14e)]()[_0x55d60b(0x179)](0x2, "0") +
      ":" +
      _0x130e90[_0x55d60b(0x14e)]()["padStart"](0x2, "0") +
      ":" +
      _0x5864fd[_0x55d60b(0x14e)]()[_0x55d60b(0x179)](0x2, "0")),
      _0x5864fd === 0x0 &&
        _0x130e90 % 0x1 === 0x0 &&
        timerRunning &&
        sendCoins(coinsToSend);
  }, 0x3e8);
}
function sendCoins(_0x417043) {
  var _0x128003 = _0xeffb0;
  if (!iserror) {
    var _0x37c8bc = new FormData();
    _0x37c8bc["append"](_0x128003(0x146), getWalletAddressFromQueryParams()),
      _0x37c8bc[_0x128003(0x157)](_0x128003(0x175), _0x417043),
      fetch(apiUrl, { method: _0x128003(0x189), body: _0x37c8bc })
        ["then"]((_0x9115c0) => {
          var _0x1be6c9 = _0x128003;
          if (!_0x9115c0["ok"]) throw new Error(_0x1be6c9(0x172));
          return _0x9115c0[_0x1be6c9(0x182)]();
        })
        [_0x128003(0x187)]((_0x46cb4c) => {
          var _0x1b97cf = _0x128003;
          getCoinsAndUpdateUI(getWalletAddressFromQueryParams()),
            console[_0x1b97cf(0x14b)](_0x46cb4c);
        })
        [_0x128003(0x186)]((_0x2360fe) => {
          var _0x31bd7e = _0x128003;
          console[_0x31bd7e(0x153)](
            "There\x20was\x20a\x20problem\x20with\x20your\x20fetch\x20operation:",
            _0x2360fe
          );
        });
  }
}
function initCounter() {
  updateCounter();
}
var clockContainer = document[_0xeffb0(0x173)](_0xeffb0(0x174));
clockContainer["id"] = "clockContainer";
var coinsContainer = document[_0xeffb0(0x173)]("div");
coinsContainer["id"] = _0xeffb0(0x17e);
var coinsIcon = document[_0xeffb0(0x173)](_0xeffb0(0x16f));
(coinsIcon[_0xeffb0(0x184)] = _0xeffb0(0x158)),
  (coinsIcon["id"] = _0xeffb0(0x144));
var coinsAmount = document["createElement"]("div");
(coinsAmount["id"] = "coinsAmount"),
  (coinsAmount[_0xeffb0(0x145)] = _0xeffb0(0x18d)),
  (coinsAmount[_0xeffb0(0x15c)][_0xeffb0(0x171)] = _0xeffb0(0x148)),
  (coinsAmount[_0xeffb0(0x15c)][_0xeffb0(0x17c)] = _0xeffb0(0x148)),
  coinsContainer[_0xeffb0(0x15f)](coinsIcon),
  coinsContainer["appendChild"](coinsAmount);
function _0x4b77() {
  var _0x59fb04 = [
    "div",
    "amount",
    "4CsTsqt",
    "${window.location.origin}/api/captcha-system/validate",
    "490167mCoUVo",
    "padStart",
    "Arial,\x20sans-serif",
    "14kWIPew",
    "height",
    "white",
    "coinsContainer",
    "hasOwnProperty",
    "Don\x27t\x20be\x20idle",
    "split",
    "text",
    "Network\x20response\x20was\x20not\x20ok.",
    "src",
    "Error:",
    "catch",
    "then",
    "302278UNhfKo",
    "POST",
    "touchend",
    "671xriWRR",
    "floor",
    "100",
    "coinsIcon",
    "innerText",
    "wallet_address",
    "80tHeJZz",
    "100%",
    "className",
    "search",
    "log",
    "\x0a\x20\x20\x20\x20body,\x20html\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20margin:\x200;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#clockContainer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20top:\x200\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20top:\x2050%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20z-index:\x20999999;\x0a\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#f0f0f0;\x0a\x20\x20\x20\x20\x20\x20\x20\x20border:\x201px\x20solid\x20#ccc;\x0a\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20space-between;\x0a\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#coinsContainer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#F63C01;\x0a\x20\x20\x20\x20\x20\x20\x20\x20padding:\x205px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#coinsIcon\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20width:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20margin-right:\x205px;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#coinsAmount\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x201rem;\x0a\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20cursive;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#clock\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x201rem;\x0a\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#585FF9;\x0a\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20cursive;\x0a\x20\x20\x20\x20\x20\x20\x20\x20padding:\x205px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20.fullscreen-error\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20fixed;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20top:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20rgba(0,\x200,\x200,\x201);\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20Arial,\x20sans-serif;\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x0a",
    "Unexpected\x20response\x20from\x20server.",
    "toString",
    "Missing\x20walletaddress\x20parameter\x20in\x20the\x20query\x20string",
    "substring",
    "walletaddress",
    "body",
    "error",
    "There\x20was\x20a\x20problem\x20with\x20your\x20fetch\x20operation:",
    "touchmove",
    "134613KEXDUk",
    "append",
    "${window.location.origin}/games-main",
    "token",
    "invalid",
    "395058XiVjVh",
    "style",
    "location",
    "addEventListener",
    "appendChild",
    "1456520tFOVlQ",
    "head",
    "length",
    "getElementById",
    "valid",
    "421603TjtHtr",
    "json",
    "coins",
    "user",
    "${window.location.origin}/api/coin-system/update",
    "touchstart",
    "clock",
    "Error.\x20Reload\x20page",
    "innerHTML",
    "coinsAmount",
    "img",
    "36070xFCvLJ",
    "width",
    "Network\x20response\x20was\x20not\x20ok",
    "createElement",
  ];
  _0x4b77 = function () {
    return _0x59fb04;
  };
  return _0x4b77();
}
var clock = document[_0xeffb0(0x173)](_0xeffb0(0x174));
(clock["id"] = _0xeffb0(0x16b)),
  clockContainer["appendChild"](coinsContainer),
  clockContainer[_0xeffb0(0x15f)](clock),
  document[_0xeffb0(0x152)][_0xeffb0(0x15f)](clockContainer),
  initCounter(),
  document[_0xeffb0(0x15e)]("click", function () {
    !timerRunning && updateCounter(),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x84a7c = _0x2597;
        (timerRunning = ![]),
          (document[_0x84a7c(0x163)]("clock")[_0x84a7c(0x145)] =
            _0x84a7c(0x180));
      }, idleTime));
  }),
  document["addEventListener"](_0xeffb0(0x16a), function () {
    !timerRunning && updateCounter(),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x3ec6d9 = _0x2597;
        (timerRunning = ![]),
          (document["getElementById"](_0x3ec6d9(0x16b))["innerText"] =
            _0x3ec6d9(0x180));
      }, idleTime));
  }),
  document["addEventListener"]("mousemove", function (_0x3cde2d) {
    !timerRunning && updateCounter(),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x3de111 = _0x2597;
        (timerRunning = ![]),
          (document["getElementById"](_0x3de111(0x16b))[_0x3de111(0x145)] =
            _0x3de111(0x180));
      }, idleTime));
  }),
  document["addEventListener"](_0xeffb0(0x155), function (_0x11374c) {
    !timerRunning && updateCounter(),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x1397e0 = _0x2597;
        (timerRunning = ![]),
          (document[_0x1397e0(0x163)]("clock")["innerText"] = _0x1397e0(0x180));
      }, idleTime));
  }),
  document[_0xeffb0(0x15e)](_0xeffb0(0x18a), function (_0x42a03b) {
    !timerRunning && updateCounter(),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x3a0e74 = _0x2597;
        (timerRunning = ![]),
          (document[_0x3a0e74(0x163)](_0x3a0e74(0x16b))[_0x3a0e74(0x145)] =
            _0x3a0e74(0x180));
      }, idleTime));
  });
function getQueryParams() {
  var _0x4bf58c = _0xeffb0,
    _0x6aad86 = {},
    _0x194133 =
      window[_0x4bf58c(0x15d)][_0x4bf58c(0x14a)][_0x4bf58c(0x150)](0x1),
    _0x2c30b8 = _0x194133[_0x4bf58c(0x181)]("&");
  for (
    var _0x3a80e4 = 0x0;
    _0x3a80e4 < _0x2c30b8[_0x4bf58c(0x162)];
    _0x3a80e4++
  ) {
    var _0x1d0e6e = _0x2c30b8[_0x3a80e4][_0x4bf58c(0x181)]("=");
    _0x6aad86[decodeURIComponent(_0x1d0e6e[0x0])] = decodeURIComponent(
      _0x1d0e6e[0x1]
    );
  }
  return _0x6aad86;
}
function getWalletAddressFromQueryParams() {
  var _0x4028c1 = _0xeffb0,
    _0x4cc406 = getQueryParams();
  return _0x4cc406[_0x4028c1(0x17f)](_0x4028c1(0x151))
    ? (console[_0x4028c1(0x14b)](_0x4cc406[_0x4028c1(0x151)]),
      _0x4cc406["walletaddress"])
    : (console[_0x4028c1(0x153)](_0x4028c1(0x14f)), null);
}
function getCoinsAndUpdateUI(_0x1432ac) {
  var _0x2593e6 = _0xeffb0,
    _0xd7a561 = "${window.location.origin}/api/coin-system/",
    _0x1f7eb1 = new FormData();
  _0x1f7eb1["append"]("walletaddress", _0x1432ac),
    fetch(_0xd7a561, { method: _0x2593e6(0x189), body: _0x1f7eb1 })
      [_0x2593e6(0x187)]((_0x2687d6) => {
        var _0x506f31 = _0x2593e6;
        if (!_0x2687d6["ok"])
          throw new Error("Network\x20response\x20was\x20not\x20ok");
        return _0x2687d6[_0x506f31(0x166)]();
      })
      [_0x2593e6(0x187)]((_0x3887d6) => {
        var _0x1253f5 = _0x2593e6;
        if (
          _0x3887d6 &&
          _0x3887d6[_0x1253f5(0x168)] &&
          _0x3887d6[_0x1253f5(0x168)]["coins"]
        ) {
          var _0x37f214 = _0x3887d6[_0x1253f5(0x168)][_0x1253f5(0x167)];
          document[_0x1253f5(0x163)](_0x1253f5(0x16e))[_0x1253f5(0x145)] =
            _0x37f214;
        } else
          console[_0x1253f5(0x153)]("Invalid\x20response\x20data:", _0x3887d6);
      })
      [_0x2593e6(0x186)]((_0x489119) => {
        var _0x31882c = _0x2593e6;
        console[_0x31882c(0x153)](_0x31882c(0x154), _0x489119);
      });
}
getCoinsAndUpdateUI(getWalletAddressFromQueryParams());
function checkTokenAndAddress(_0x5b5e3e, _0x3c3eeb) {
  return new Promise((_0x5d4787, _0xcda3ca) => {
    var _0x498e36 = _0x2597;
    const _0x1845de = _0x498e36(0x177),
      _0x2e7cb9 = new URLSearchParams();
    _0x2e7cb9[_0x498e36(0x157)](_0x498e36(0x151), _0x5b5e3e),
      _0x2e7cb9[_0x498e36(0x157)](_0x498e36(0x159), _0x3c3eeb);
    const _0x1c7ede = { method: "POST", body: _0x2e7cb9 };
    fetch(_0x1845de, _0x1c7ede)
      [_0x498e36(0x187)]((_0x34417c) => {
        var _0x665d43 = _0x498e36;
        if (_0x34417c["ok"]) return _0x34417c[_0x665d43(0x182)]();
        else throw new Error(_0x665d43(0x183));
      })
      [_0x498e36(0x187)]((_0x2c4943) => {
        var _0x37bc13 = _0x498e36;
        if (_0x2c4943 === _0x37bc13(0x164)) _0x5d4787(!![]);
        else
          _0x2c4943 === _0x37bc13(0x15a)
            ? _0x5d4787(![])
            : _0xcda3ca(new Error(_0x37bc13(0x14d)));
      })
      [_0x498e36(0x186)]((_0xd2a784) => {
        _0xcda3ca(_0xd2a784);
      });
  });
}
function handleTokenVerification() {
  function _0x14b945() {
    var _0xd54c25 = _0x2597,
      _0xae3131 = {},
      _0x3ec4a5 =
        window[_0xd54c25(0x15d)][_0xd54c25(0x14a)][_0xd54c25(0x150)](0x1),
      _0x4349fb = _0x3ec4a5[_0xd54c25(0x181)]("&");
    for (
      var _0x250722 = 0x0;
      _0x250722 < _0x4349fb[_0xd54c25(0x162)];
      _0x250722++
    ) {
      var _0x5c0cf7 = _0x4349fb[_0x250722][_0xd54c25(0x181)]("=");
      _0xae3131[decodeURIComponent(_0x5c0cf7[0x0])] = decodeURIComponent(
        _0x5c0cf7[0x1]
      );
    }
    return _0xae3131;
  }
  function _0x22a6a0() {
    var _0x585866 = _0x2597,
      _0x11e8b1 = document[_0x585866(0x173)](_0x585866(0x174));
    (_0x11e8b1["id"] = "errorDiv"),
      (_0x11e8b1[_0x585866(0x149)] = "fullscreen-error");
    var _0x55b953 = document["createElement"]("div");
    (_0x55b953[_0x585866(0x145)] = _0x585866(0x16c)),
      (_0x55b953[_0x585866(0x15c)]["color"] = _0x585866(0x17d)),
      (_0x55b953[_0x585866(0x15c)]["fontFamily"] = _0x585866(0x17a)),
      (iserror = !![]),
      _0x11e8b1[_0x585866(0x15f)](_0x55b953),
      document[_0x585866(0x152)][_0x585866(0x15f)](_0x11e8b1);
  }
  function _0x56218c() {
    var _0x14bbac = _0x2597,
      _0x1d38b7 = _0x14b945(),
      _0x25aff4 = _0x1d38b7["walletaddress"],
      _0x5bcf97 = _0x1d38b7["token"];
    if (!_0x25aff4 || !_0x5bcf97) {
      _0x22a6a0();
      return;
    }
    checkTokenAndAddress(_0x25aff4, _0x5bcf97)
      [_0x14bbac(0x187)]((_0x1dad82) => {
        if (_0x1dad82) {
        } else _0x22a6a0();
      })
      [_0x14bbac(0x186)]((_0x9cd2ad) => {
        var _0x353bf5 = _0x14bbac;
        console["error"](_0x353bf5(0x185), _0x9cd2ad);
      });
  }
  _0x56218c();
}
handleTokenVerification();
