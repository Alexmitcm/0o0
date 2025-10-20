function addCSS() {
  var style = document.createElement("style");
  style.textContent = `
              #ban-overlay {
                  display: none;
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background-color: rgba(0, 0, 0); /* semi-transparent black background */
                  color: white;
                  text-align: center;
                  font-size: 2em;
                  z-index: 99999999999999999999999999999999999999999999 !important;
                  padding: 5rem 0px;
              }
          `;
  document.head.appendChild(style);
}

// Function to dynamically add the ban overlay
function addBanOverlay() {
  var banOverlay = document.createElement("div");
  banOverlay.id = "ban-overlay";
  banOverlay.innerHTML = 'You are banned for <span id="remaining-time"></span>';
  document.body.appendChild(banOverlay);
}

// Call the functions to add CSS styles and ban overlay
addCSS();
addBanOverlay();

document.addEventListener("DOMContentLoaded", (event) => {
  let clickTimes = [];
  let lastMouseX = 0;
  let lastMouseY = 0;
  let movementDistance = 0;

  const walletAddress = new URLSearchParams(window.location.search).get(
    "walletaddress"
  );
  const token = new URLSearchParams(window.location.search).get("token");

  if (!walletAddress) {
    return;
  }

  const checkForAutoClicker = () => {
    let currentTime = new Date().getTime();

    // Record the click time
    clickTimes.push(currentTime);

    // Keep only the last 10 click times
    if (clickTimes.length > 10) {
      clickTimes.shift();
    }

    // Calculate intervals between clicks
    if (clickTimes.length === 10) {
      let intervals = [];
      for (let i = 1; i < clickTimes.length; i++) {
        intervals.push(clickTimes[i] - clickTimes[i - 1]);
      }

      // Check if intervals are nearly the same (threshold can be adjusted)
      let threshold = 50; // 50 ms threshold
      let isEqualIntervals = intervals.every(
        (val, i, arr) => Math.abs(val - arr[0]) < threshold
      );

      // Check for low mouse movement
      let isLowMovement = movementDistance < 10;

      if (isEqualIntervals && isLowMovement) {
        checkBanStatus();

        // Update cheat_count in the database
        fetch(
          `${window.location.origin}/api/captcha-system/validate?walletaddress=${walletAddress}&token=${token}`
        )
          .then((response) => response.json())
          .then((data) => {
            // Reset clickTimes after the captcha API call
            clickTimes = [];
          })
          .catch((error) => console.error("Error:", error));
      }
    }
  };

  const handleClickOrTouch = (event) => {
    let x = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    let y = event.clientY || (event.touches && event.touches[0].clientY) || 0;

    // Calculate mouse movement
    if (lastMouseX !== 0 && lastMouseY !== 0) {
      movementDistance += Math.sqrt(
        Math.pow(x - lastMouseX, 2) + Math.pow(y - lastMouseY, 2)
      );
    }

    // Update last mouse position
    lastMouseX = x;
    lastMouseY = y;

    checkForAutoClicker();
  };

  document.addEventListener("click", handleClickOrTouch);
  document.addEventListener("touchend", handleClickOrTouch);

  document.addEventListener("mousemove", (event) => {
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    movementDistance = 0; // Reset movement distance when mouse moves
  });

  document.addEventListener("touchmove", (event) => {
    lastMouseX = event.touches[0].clientX;
    lastMouseY = event.touches[0].clientY;
    movementDistance = 0; // Reset movement distance when touch moves
  });
});

function getQueryParamValue(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
// Replace 'your_wallet_address' with the actual wallet address of the user
const walletAddress = getQueryParamValue("walletaddress");

function checkBanStatus() {
  fetch(`${window.location.origin}/api/captcha-system/check-ban`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wallet_address: walletAddress }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.banned) {
        document.getElementById("ban-overlay").style.display = "block";
        document.getElementById("remaining-time").textContent =
          data.remaining_time;
        startCountdown(data.remaining_time);
      } else {
        document.getElementById("ban-overlay").style.display = "none";
      }
    })
    .catch((error) => console.error("Error:", error));
}

function startCountdown(remainingTime) {
  const banOverlay = document.getElementById("ban-overlay");
  const remainingTimeSpan = document.getElementById("remaining-time");
  const [hours, minutes, seconds] = remainingTime.split(":").map(Number);
  let totalSeconds = hours * 3600 + minutes * 60 + seconds;

  function updateCountdown() {
    if (totalSeconds > 0) {
      totalSeconds--;
      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(totalSeconds % 60).padStart(2, "0");
      remainingTimeSpan.textContent = `${h}:${m}:${s}`;
    } else {
      banOverlay.style.display = "none";
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

document.addEventListener("DOMContentLoaded", checkBanStatus);
