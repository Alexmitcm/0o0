// captchaClicker.js
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const walletaddress = urlParams.get("walletaddress");
  const token = urlParams.get("token");

  // Inject CSS styles into the head of the document
  const style = document.createElement("style");
  style.textContent = `
      html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: Arial, sans-serif;
      }

      /* Fullscreen overlay for background */
      .captcha-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(255, 255, 255, 0.5);
          z-index: 99999998;
      }

      /* CAPTCHA popup container */
      .captcha-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
          width: 300px;
          z-index: 99999999;
          opacity: 1;
          transition: opacity 0.5s ease-out;
      }

      .captcha-popup h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
      }

      .captcha-popup p {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
      }

      .captcha-popup input {
          width: 80%;
          padding: 10px;
          font-size: 16px;
          margin-bottom: 20px;
          border: 2px solid #e0e0e0;
          border-radius: 5px;
          outline: none;
      }

      .captcha-popup input:focus {
          border-color: #007bff;
      }

      .captcha-popup button {
          width: 100%;
          padding: 10px;
          background-color: #007bff;
          color: #ffffff;
          font-size: 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
      }

      .captcha-popup button:hover {
          background-color: #0056b3;
      }

      .success-message, .error-message {
          margin-top: 20px;
          font-size: 16px;
      }

      .success-message {
          color: #28a745;
      }

      .error-message {
          color: #ff4d4f;
      }

      .hidden {
          display: none;
      }
  `;
  document.head.appendChild(style);

  checkUserBan(walletaddress, token);

  // Click pattern tracking variables
  let clickTimes = [];
  let clickPositions = [];
  let captchaOpen = false; // Variable to check if CAPTCHA is already open

  document.addEventListener("click", (event) => {
    const currentTime = new Date().getTime();
    const clickPosition = { x: event.clientX, y: event.clientY };

    // Record the click details
    clickTimes.push(currentTime);
    clickPositions.push(clickPosition);

    // Keep the arrays at a reasonable length
    if (clickTimes.length > 10) clickTimes.shift();
    if (clickPositions.length > 10) clickPositions.shift();

    detectClicker();
  });

  function detectClicker() {
    if (clickTimes.length < 10 || captchaOpen) return; // Skip if CAPTCHA is already open

    // Check if click intervals are suspiciously consistent
    let consistentInterval = true;
    const interval = clickTimes[1] - clickTimes[0];

    for (let i = 2; i < clickTimes.length; i++) {
      if (Math.abs(clickTimes[i] - clickTimes[i - 1] - interval) > 50) {
        consistentInterval = false;
        break;
      }
    }

    // Check if click positions are repetitive
    let repetitivePosition = true;
    const referencePosition = clickPositions[0];

    for (let pos of clickPositions) {
      if (
        Math.abs(pos.x - referencePosition.x) > 5 ||
        Math.abs(pos.y - referencePosition.y) > 5
      ) {
        repetitivePosition = false;
        break;
      }
    }

    if (consistentInterval && repetitivePosition) {
      showCaptcha();
    }
  }

  function showCaptcha() {
    setBanStatus(true);
    if (captchaOpen) return; // If CAPTCHA is already open, do nothing
    captchaOpen = true; // Mark CAPTCHA as open

    const overlay = document.createElement("div");
    overlay.className = "captcha-overlay";
    const popup = document.createElement("div");
    popup.className = "captcha-popup";

    // Generate a random CAPTCHA question
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = num1 + num2;

    popup.innerHTML = `
        <h1>CAPTCHA Validation</h1>
        <p id="captcha-question">What is ${num1} + ${num2}?</p>
        <input type="number" id="captcha-answer" placeholder="Enter your answer" required>
        <button id="captcha-submit">Submit</button>
        <p id="result-message" class="hidden"></p>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    document
      .getElementById("captcha-submit")
      .addEventListener("click", function () {
        const userAnswer = parseInt(
          document.getElementById("captcha-answer").value
        );
        const resultMessage = document.getElementById("result-message");
        if (userAnswer === correctAnswer) {
          resultMessage.textContent = "CAPTCHA validation passed!";
          resultMessage.className = "success-message";
          resultMessage.classList.remove("hidden");

          setBanStatus(false);

          setTimeout(() => {
            popup.remove();
            overlay.remove();
            captchaOpen = false; // Reset CAPTCHA open status
          }, 2000);
        } else {
          resultMessage.textContent = "Incorrect answer, please try again.";
          resultMessage.className = "error-message";
          resultMessage.classList.remove("hidden");
        }
      });
  }

  function setBanStatus(isBanned) {
    fetch("${window.location.origin}/api/captcha-system/update-ban", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletaddress: walletaddress,
        token: token,
        isBanned: isBanned,
        action: "updateBan",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Ban status updated:", data);
      })
      .catch((error) => console.error("Error:", error));
  }

  function checkUserBan(walletaddress, token) {
    fetch("${window.location.origin}/api/captcha-system/update-ban", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletaddress: walletaddress,
        token: token,
        action: "check",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.banned) {
          alert(
            "You are currently banned due to repeated failed CAPTCHA attempts."
          );
          showCaptcha(); // Show CAPTCHA when banned
        }
      })
      .catch((error) => console.error("Error:", error));
  }
});
