// Define the main function to initialize the CAPTCHA popup system
function initializeCaptchaPopup() {
  // Create style dynamically
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
            background-color: rgba(255, 255, 255, 0.5); /* White overlay with 0.5 opacity */
            z-index: 99999998; /* Behind the captcha popup */
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
            z-index: 99999999; /* Highest z-index */
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

        /* Success message in green */
        .success-message {
            margin-top: 20px;
            color: #28a745;
            font-size: 16px;
        }

        /* Error message in red */
        .error-message {
            margin-top: 20px;
            color: #ff4d4f;
            font-size: 16px;
        }

        /* Hidden state for the captcha popup */
        .hidden {
            display: none;
        }
    `;
  document.head.appendChild(style);

  // Create the overlay and CAPTCHA form dynamically
  const overlay = document.createElement("div");
  overlay.className = "captcha-overlay";
  document.body.appendChild(overlay);

  const popup = document.createElement("div");
  popup.className = "captcha-popup";
  popup.innerHTML = `
        <h1>CAPTCHA Validation</h1>
        <p id="captcha-question">Loading CAPTCHA...</p>
        <input type="number" id="captcha-answer" placeholder="Enter your answer" required>
        <button id="captcha-submit">Submit</button>
        <p id="result-message"></p>
    `;
  document.body.appendChild(popup);

  // Function to fetch the CAPTCHA question
  function fetchCaptcha() {
    const urlParams = new URLSearchParams(window.location.search);
    const walletaddress = urlParams.get("walletaddress"); // Extract walletaddress from the URL
    fetch(
      "${window.location.origin}/api/captcha-system/captcha?walletaddress=" +
        walletaddress
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          // Display wait message but keep the form visible
          document.getElementById("captcha-question").textContent = data.error;
          document.getElementById("captcha-answer").disabled = true;
          document.getElementById("captcha-answer").placeholder =
            "Please wait...";
          document.getElementById("result-message").textContent = "";
        } else {
          // Display new CAPTCHA and enable input
          document.getElementById("captcha-question").textContent =
            data.captcha;
          document.getElementById("captcha-answer").disabled = false;
          document.getElementById("captcha-answer").value = "";
          document.getElementById("captcha-answer").placeholder =
            "Enter your answer";
          document.getElementById("result-message").textContent = "";
        }
      })
      .catch((error) => {
        console.error("Error fetching CAPTCHA:", error);
        document.getElementById("captcha-question").textContent =
          "Error loading CAPTCHA.";
      });
  }

  // Call fetchCaptcha on page load
  fetchCaptcha();

  // Handle form submission to validate the CAPTCHA
  document
    .getElementById("captcha-submit")
    .addEventListener("click", function (event) {
      event.preventDefault();

      const answer = document.getElementById("captcha-answer").value;

      // Get the current URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const walletaddress = urlParams.get("walletaddress"); // Extract walletaddress from the URL

      // Now modify your fetch request to include the walletaddress in the body
      fetch(
        "${window.location.origin}/api/captcha-system/captcha",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `answer=${answer}&walletaddress=${walletaddress}`, // Append walletaddress to the body
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const resultMessage = document.getElementById("result-message");

          // If the answer is correct
          if (data.success) {
            resultMessage.textContent = "Captcha validation passed!";
            resultMessage.className = "success-message";

            // Fade out the form with ease-out transition
            popup.style.opacity = 0;
            overlay.style.opacity = 0;

            // After the fade-out animation, set display: none for both popup and overlay
            setTimeout(() => {
              popup.classList.add("hidden");
              overlay.classList.add("hidden");
            }, 500); // 500ms matches the transition duration
          } else {
            // If the answer is incorrect or user needs to wait
            resultMessage.textContent = data.message;
            resultMessage.className = "error-message";

            // If user needs to wait, disable the answer input
            if (data.error) {
              document.getElementById("captcha-answer").disabled = true;
              document.getElementById("captcha-answer").placeholder =
                "Please wait...";
            }
          }
        })
        .catch((error) => {
          console.error("Error submitting CAPTCHA:", error);
          document.getElementById("result-message").textContent =
            "Error submitting your answer.";
          document.getElementById("result-message").className = "error-message";
        });
    });
}

// Call the main function when the page loads
initializeCaptchaPopup();
