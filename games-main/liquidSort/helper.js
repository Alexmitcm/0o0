var _0x917466 = _0x3d03;
(function (_0x1284f5, _0x47f0c5) {
  var _0x5ba6ee = _0x3d03,
    _0x1d5783 = _0x1284f5();
  while (!![]) {
    try {
      var _0x852ff2 =
        -parseInt(_0x5ba6ee(0xbc)) / 0x1 +
        parseInt(_0x5ba6ee(0xca)) / 0x2 +
        (parseInt(_0x5ba6ee(0xf1)) / 0x3) * (-parseInt(_0x5ba6ee(0xd3)) / 0x4) +
        (-parseInt(_0x5ba6ee(0xe3)) / 0x5) * (parseInt(_0x5ba6ee(0xb8)) / 0x6) +
        (parseInt(_0x5ba6ee(0xd2)) / 0x7) * (-parseInt(_0x5ba6ee(0xd4)) / 0x8) +
        (-parseInt(_0x5ba6ee(0xef)) / 0x9) * (parseInt(_0x5ba6ee(0xbd)) / 0xa) +
        (parseInt(_0x5ba6ee(0xb6)) / 0xb) * (parseInt(_0x5ba6ee(0xd6)) / 0xc);
      if (_0x852ff2 === _0x47f0c5) break;
      else _0x1d5783["push"](_0x1d5783["shift"]());
    } catch (_0x4aa1bf) {
      _0x1d5783["push"](_0x1d5783["shift"]());
    }
  }
})(_0x2117, 0x61d39);
var style = document[_0x917466(0xe1)]("style");
(style[_0x917466(0xb5)] = _0x917466(0xc8)),
  document[_0x917466(0xd1)][_0x917466(0xbb)](style);
var timerRunning = ![],
  idleTimer,
  idleTime = 0x3a98,
  elapsedTime = 0x0,
  coinsToSend = 0xa,
  apiUrl = _0x917466(0xf3),
  iserror = ![];
function updateCounter() {
  var _0x58aaae = new Date()["getTime"]() - elapsedTime;
  (timerRunning = !![]),
    (idleTimer = setTimeout(function () {
      var _0x58e578 = _0x3d03;
      (timerRunning = ![]),
        (document[_0x58e578(0xed)]("clock")[_0x58e578(0xcd)] = _0x58e578(0xee));
    }, idleTime));
  var _0x1ed718 = setInterval(function () {
    var _0x2a8d83 = _0x3d03;
    if (!timerRunning) {
      clearInterval(_0x1ed718);
      return;
    }
    var _0x49ea54 = new Date()[_0x2a8d83(0xe0)]();
    elapsedTime = _0x49ea54 - _0x58aaae;
    var _0x2df0af = Math[_0x2a8d83(0xcf)](elapsedTime / (0x3e8 * 0x3c * 0x3c)),
      _0x3a1d74 = Math["floor"](
        (elapsedTime % (0x3e8 * 0x3c * 0x3c)) / (0x3e8 * 0x3c)
      ),
      _0x4a3953 = Math["floor"]((elapsedTime % (0x3e8 * 0x3c)) / 0x3e8);
    (document["getElementById"](_0x2a8d83(0xf6))[_0x2a8d83(0xcd)] =
      _0x2df0af[_0x2a8d83(0xbf)]()[_0x2a8d83(0xb3)](0x2, "0") +
      ":" +
      _0x3a1d74[_0x2a8d83(0xbf)]()[_0x2a8d83(0xb3)](0x2, "0") +
      ":" +
      _0x4a3953[_0x2a8d83(0xbf)]()["padStart"](0x2, "0")),
      _0x4a3953 === 0x0 &&
        _0x3a1d74 % 0x1 === 0x0 &&
        timerRunning &&
        sendCoins(coinsToSend);
  }, 0x3e8);
}
function sendCoins(_0x5e4180) {
  var _0x579d9d = _0x917466;
  if (!iserror) {
    var _0x1f86c5 = new FormData();
    _0x1f86c5[_0x579d9d(0xe6)](
      _0x579d9d(0xd9),
      getWalletAddressFromQueryParams()
    ),
      _0x1f86c5[_0x579d9d(0xe6)](_0x579d9d(0xeb), _0x5e4180),
      fetch(apiUrl, { method: "POST", body: _0x1f86c5 })
        ["then"]((_0x1fa3e8) => {
          var _0x4d34c8 = _0x579d9d;
          if (!_0x1fa3e8["ok"]) throw new Error(_0x4d34c8(0xc6));
          return _0x1fa3e8[_0x4d34c8(0xb9)]();
        })
        [_0x579d9d(0xce)]((_0x28dbb5) => {
          var _0x195e37 = _0x579d9d;
          getCoinsAndUpdateUI(getWalletAddressFromQueryParams()),
            console[_0x195e37(0xc5)](_0x28dbb5);
        })
        [_0x579d9d(0xea)]((_0x576403) => {
          var _0x5e990b = _0x579d9d;
          console[_0x5e990b(0xf4)](_0x5e990b(0xae), _0x576403);
        });
  }
}
function initCounter() {
  updateCounter();
}
function _0x3d03(_0x16b0f3, _0xaec38f) {
  var _0x211707 = _0x2117();
  return (
    (_0x3d03 = function (_0x3d03f4, _0x11a3bd) {
      _0x3d03f4 = _0x3d03f4 - 0xae;
      var _0x548835 = _0x211707[_0x3d03f4];
      return _0x548835;
    }),
    _0x3d03(_0x16b0f3, _0xaec38f)
  );
}
var clockContainer = document[_0x917466(0xe1)](_0x917466(0xb0));
clockContainer["id"] = "clockContainer";
var coinsContainer = document[_0x917466(0xe1)]("div");
coinsContainer["id"] = _0x917466(0xd7);
var coinsIcon = document[_0x917466(0xe1)](_0x917466(0xcc));
(coinsIcon[_0x917466(0xc7)] = _0x917466(0xba)),
  (coinsIcon["id"] = _0x917466(0xc2));
var coinsAmount = document[_0x917466(0xe1)]("div");
(coinsAmount["id"] = _0x917466(0xe4)),
  (coinsAmount[_0x917466(0xcd)] = "100"),
  (coinsAmount["style"][_0x917466(0xdf)] = "100%"),
  (coinsAmount["style"]["height"] = "100%"),
  coinsContainer[_0x917466(0xbb)](coinsIcon),
  coinsContainer[_0x917466(0xbb)](coinsAmount);
var clock = document[_0x917466(0xe1)](_0x917466(0xb0));
(clock["id"] = "clock"),
  clockContainer[_0x917466(0xbb)](coinsContainer),
  clockContainer[_0x917466(0xbb)](clock),
  document[_0x917466(0xe2)][_0x917466(0xbb)](clockContainer),
  initCounter(),
  document[_0x917466(0xb2)]("click", function () {
    var _0x356782 = _0x917466;
    !timerRunning &&
      (console[_0x356782(0xc5)](_0x356782(0xdc)), updateCounter()),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x241f6b = _0x356782;
        (timerRunning = ![]),
          (document[_0x241f6b(0xed)]("clock")["innerText"] = _0x241f6b(0xee));
      }, idleTime));
  }),
  document[_0x917466(0xb2)]("touchstart", function () {
    var _0x2c6e1f = _0x917466;
    !timerRunning &&
      (console[_0x2c6e1f(0xc5)](_0x2c6e1f(0xdc)), updateCounter()),
      clearInterval(idleTimer),
      (idleTimer = setTimeout(function () {
        var _0x1d542b = _0x2c6e1f;
        (timerRunning = ![]),
          (document["getElementById"](_0x1d542b(0xf6))[_0x1d542b(0xcd)] =
            _0x1d542b(0xee));
      }, idleTime));
  });
function getQueryParams() {
  var _0x51f3ea = _0x917466,
    _0x4dd5fd = {},
    _0x51298b = window[_0x51f3ea(0xec)]["search"][_0x51f3ea(0xf5)](0x1),
    _0x329fdb = _0x51298b[_0x51f3ea(0xe7)]("&");
  for (var _0x1fb051 = 0x0; _0x1fb051 < _0x329fdb["length"]; _0x1fb051++) {
    var _0x43f20c = _0x329fdb[_0x1fb051][_0x51f3ea(0xe7)]("=");
    _0x4dd5fd[decodeURIComponent(_0x43f20c[0x0])] = decodeURIComponent(
      _0x43f20c[0x1]
    );
  }
  return _0x4dd5fd;
}
function getWalletAddressFromQueryParams() {
  var _0x151568 = _0x917466,
    _0x33b127 = getQueryParams();
  return _0x33b127[_0x151568(0xc4)]("walletaddress")
    ? (console["log"](_0x33b127["walletaddress"]), _0x33b127[_0x151568(0xda)])
    : (console[_0x151568(0xf4)](_0x151568(0xc0)), null);
}
function getCoinsAndUpdateUI(_0x3e6b37) {
  var _0x181a5d = _0x917466,
    _0x494ee7 = _0x181a5d(0xe8),
    _0x365c55 = new FormData();
  _0x365c55[_0x181a5d(0xe6)](_0x181a5d(0xda), _0x3e6b37),
    fetch(_0x494ee7, { method: _0x181a5d(0xb4), body: _0x365c55 })
      [_0x181a5d(0xce)]((_0x3e9517) => {
        var _0x519f14 = _0x181a5d;
        if (!_0x3e9517["ok"]) throw new Error(_0x519f14(0xc6));
        return _0x3e9517[_0x519f14(0xd5)]();
      })
      [_0x181a5d(0xce)]((_0x197996) => {
        var _0x8c5c0c = _0x181a5d;
        if (
          _0x197996 &&
          _0x197996["user"] &&
          _0x197996[_0x8c5c0c(0xb1)][_0x8c5c0c(0xc3)]
        ) {
          var _0x183549 = _0x197996[_0x8c5c0c(0xb1)][_0x8c5c0c(0xc3)];
          document[_0x8c5c0c(0xed)](_0x8c5c0c(0xe4))[_0x8c5c0c(0xcd)] =
            _0x183549;
        } else console[_0x8c5c0c(0xf4)](_0x8c5c0c(0xdb), _0x197996);
      })
      [_0x181a5d(0xea)]((_0x4b1f20) => {
        var _0x832be8 = _0x181a5d;
        console[_0x832be8(0xf4)](_0x832be8(0xae), _0x4b1f20);
      });
}
getCoinsAndUpdateUI(getWalletAddressFromQueryParams());
function _0x2117() {
  var _0x1fcdc6 = [
    "innerText",
    "then",
    "floor",
    "length",
    "head",
    "68677QjCwxi",
    "1812GFwBrH",
    "184wXczOd",
    "json",
    "1675200IutadV",
    "coinsContainer",
    "style",
    "wallet_address",
    "walletaddress",
    "Invalid\x20response\x20data:",
    "Resuming\x20timer...",
    "Error.\x20Reload\x20page",
    "Unexpected\x20response\x20from\x20server.",
    "width",
    "getTime",
    "createElement",
    "body",
    "18115ggTkUm",
    "coinsAmount",
    "token",
    "append",
    "split",
    "${window.location.origin}/api/coin-system/",
    "${window.location.origin}/api/captcha-system/validate",
    "catch",
    "amount",
    "location",
    "getElementById",
    "Don\x27t\x20be\x20idle",
    "2212065UmahQd",
    "fullscreen-error",
    "4158YSRQEL",
    "color",
    "${window.location.origin}/api/coin-system/update",
    "error",
    "substring",
    "clock",
    "There\x20was\x20a\x20problem\x20with\x20your\x20fetch\x20operation:",
    "errorDiv",
    "div",
    "user",
    "addEventListener",
    "padStart",
    "POST",
    "innerHTML",
    "99mGeWnN",
    "Network\x20response\x20was\x20not\x20ok.",
    "72NFmuef",
    "text",
    "${window.location.origin}/games-main",
    "appendChild",
    "385768YjcLQt",
    "10KHfmqj",
    "invalid",
    "toString",
    "Missing\x20walletaddress\x20parameter\x20in\x20the\x20query\x20string",
    "className",
    "coinsIcon",
    "coins",
    "hasOwnProperty",
    "log",
    "Network\x20response\x20was\x20not\x20ok",
    "src",
    "\x0a\x20\x20\x20\x20body,\x20html\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20margin:\x200;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#clockContainer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20top:\x200\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20top:\x2050%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20z-index:\x20999999;\x0a\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#f0f0f0;\x0a\x20\x20\x20\x20\x20\x20\x20\x20border:\x201px\x20solid\x20#ccc;\x0a\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20space-between;\x0a\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#coinsContainer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#F63C01;\x0a\x20\x20\x20\x20\x20\x20\x20\x20padding:\x205px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#coinsIcon\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20width:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20margin-right:\x205px;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#coinsAmount\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x201rem;\x0a\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20cursive;\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20\x20\x20#clock\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x201rem;\x0a\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20#585FF9;\x0a\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20cursive;\x0a\x20\x20\x20\x20\x20\x20\x20\x20padding:\x205px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20.fullscreen-error\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20fixed;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20top:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20rgba(0,\x200,\x200,\x201);\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20align-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-family:\x20Arial,\x20sans-serif;\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x0a",
    "Error:",
    "1345674SoyZVm",
    "white",
    "img",
  ];
  _0x2117 = function () {
    return _0x1fcdc6;
  };
  return _0x2117();
}
function checkTokenAndAddress(_0x48bdf4, _0x5749ff) {
  return new Promise((_0x4d0034, _0x15a7a4) => {
    var _0x16ce50 = _0x3d03;
    const _0x43823b = _0x16ce50(0xe9),
      _0x421d74 = new URLSearchParams();
    _0x421d74[_0x16ce50(0xe6)](_0x16ce50(0xda), _0x48bdf4),
      _0x421d74[_0x16ce50(0xe6)]("token", _0x5749ff);
    const _0x72580c = { method: _0x16ce50(0xb4), body: _0x421d74 };
    fetch(_0x43823b, _0x72580c)
      [_0x16ce50(0xce)]((_0x1fcab3) => {
        var _0x296f3d = _0x16ce50;
        if (_0x1fcab3["ok"]) return _0x1fcab3[_0x296f3d(0xb9)]();
        else throw new Error(_0x296f3d(0xb7));
      })
      [_0x16ce50(0xce)]((_0x26d31f) => {
        var _0x4739d2 = _0x16ce50;
        if (_0x26d31f === "valid") _0x4d0034(!![]);
        else
          _0x26d31f === _0x4739d2(0xbe)
            ? _0x4d0034(![])
            : _0x15a7a4(new Error(_0x4739d2(0xde)));
      })
      [_0x16ce50(0xea)]((_0x5490d3) => {
        _0x15a7a4(_0x5490d3);
      });
  });
}
function handleTokenVerification() {
  function _0x2a0aa2() {
    var _0x3d7261 = _0x3d03,
      _0x16d4df = {},
      _0xe44f7 = window[_0x3d7261(0xec)]["search"][_0x3d7261(0xf5)](0x1),
      _0x3af6ee = _0xe44f7[_0x3d7261(0xe7)]("&");
    for (
      var _0x183551 = 0x0;
      _0x183551 < _0x3af6ee[_0x3d7261(0xd0)];
      _0x183551++
    ) {
      var _0x4a2c78 = _0x3af6ee[_0x183551][_0x3d7261(0xe7)]("=");
      _0x16d4df[decodeURIComponent(_0x4a2c78[0x0])] = decodeURIComponent(
        _0x4a2c78[0x1]
      );
    }
    return _0x16d4df;
  }
  function _0x21491f() {
    var _0x556b8f = _0x3d03,
      _0x25cd09 = document["createElement"](_0x556b8f(0xb0));
    (_0x25cd09["id"] = _0x556b8f(0xaf)),
      (_0x25cd09[_0x556b8f(0xc1)] = _0x556b8f(0xf0));
    var _0x4744a9 = document[_0x556b8f(0xe1)]("div");
    (_0x4744a9[_0x556b8f(0xcd)] = _0x556b8f(0xdd)),
      (_0x4744a9[_0x556b8f(0xd8)][_0x556b8f(0xf2)] = _0x556b8f(0xcb)),
      (_0x4744a9[_0x556b8f(0xd8)]["fontFamily"] = "Arial,\x20sans-serif"),
      (iserror = !![]),
      _0x25cd09[_0x556b8f(0xbb)](_0x4744a9),
      document["body"][_0x556b8f(0xbb)](_0x25cd09);
  }
  function _0x452a0e() {
    var _0x13d927 = _0x3d03,
      _0x59554c = _0x2a0aa2(),
      _0x3ef90d = _0x59554c[_0x13d927(0xda)],
      _0x12e3e4 = _0x59554c[_0x13d927(0xe5)];
    if (!_0x3ef90d || !_0x12e3e4) {
      _0x21491f();
      return;
    }
    checkTokenAndAddress(_0x3ef90d, _0x12e3e4)
      [_0x13d927(0xce)]((_0x109d67) => {
        if (_0x109d67) {
        } else _0x21491f();
      })
      ["catch"]((_0x279e36) => {
        var _0x14cfe6 = _0x13d927;
        console["error"](_0x14cfe6(0xc9), _0x279e36);
      });
  }
  _0x452a0e();
}
handleTokenVerification();
