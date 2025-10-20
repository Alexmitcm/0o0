// Initialization and settings
const style = document.createElement("style");
style.innerHTML = `
    /* Reset and base styles */
    body, html {
        height: 100%;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: #f2f2f7;
    }

    /* Clock Container */
    #clockContainer {
        border-radius: 15px;
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 999999;
        background-color: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 240px;
        padding: 10px;
        box-sizing: border-box;
    }

    /* Dropdown Container */
    #dropdownContainer {
        width: 100%;
        position: relative; /* Ensure positioning for toggle button */
        cursor: pointer; /* Indicate that the container is clickable */
    }

    /* Toggle Button */
    #toggleButton {
        background-color: transparent;
        color: #b53365;
        padding: 6px;
        font-size: 1rem;
        border: none;
        transform: rotate(0deg);
        cursor: pointer;
        transition: background-color 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 30px;
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: white;
        border-radius: 50%;
        box-shadow: 0 0px 2px 1px rgba(0, 0, 0, 0.1);
        pointer-events: none; /* Make toggle button non-interactive to allow container clicks */
    }

    #toggleButton:hover {
        /* Optional: Add hover effects if needed */
    }

    /* Coins Container */
    #coinsContainer {
        display: none; /* Hidden by default */
        flex-direction: column;
        align-items: center;
        background-color: #f0f0f5;
        padding: 10px 15px;
        box-sizing: border-box;
        width: 100%;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: max-height 0.3s ease-out, opacity 0.3s ease;
    }

    /* Data Boxes Container */
    .dataBox {
        width: 100%;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        padding: 8px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .dataBox:nth-child(3) {
        margin-bottom: 0 !important;
    }

    /* Data Box Icons */
    .dataBox img {
        width: 20px;
        height: 20px;
        margin-right: 8px;
    }

    /* Data Box Text */
    .dataBox .dataText {
        display: flex;
        align-items: center;
        flex: 1;
    }

    .dataBox .dataLabel {
        font-size: 0.9rem;
        color: #666;
    }

    .dataBox .dataValue {
        font-size: 1rem;
        color: #333;
        margin-left: 5px;
    }

    /* Clock */
    #clock {
        font-size: 1.5rem;
        border-radius: 10px;
        width: 100%;
        background-color: #f0f0f5;
        color: #333;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px;
        box-sizing: border-box;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    /* Fullscreen Error */
    .fullscreen-error {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 69, 58, 0.95); /* iOS-like alert color */
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 1.2rem;
        padding: 20px;
        box-sizing: border-box;
        text-align: center;
    }

    /* Points Exceeded Message */
    #pointsExceededMessage {
        font-size: 0.9rem;
        color: #ff3b30; /* iOS red color */
        margin-top: 8px;
        display: none;
        text-align: center;
    }

    /* Smooth transitions for showing/hiding coins container */
    #coinsContainer.show {
        display: flex;
        opacity: 1;
        max-height: 500px; /* Arbitrary large value for transition */
    }

    #coinsContainer.hide {
        opacity: 0;
        max-height: 0;
        overflow: hidden;
    }

    /* Icon Rotation for Toggle */
    #toggleButton.rotated {
        transform: rotate(360deg); /* Rotate 360deg degrees when rotated */
    }

    /* Responsive Design for Mobile */
    @media (max-width: 480px) {
        #clockContainer {
            width: 200px;
            padding: 8px;
        }

        #toggleButton {
            width: 25px;
            height: 25px;
            font-size: 0.9rem;
        }

        #clock {
            font-size: 1.2rem;
            padding: 6px;
        }

        .dataBox {
            padding: 6px;
        }

        .dataBox .dataLabel {
            font-size: 0.8rem;
        }

        .dataBox .dataValue {
            font-size: 0.9rem;
        }

        #pointsExceededMessage {
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(style);

// Timer and settings
let timerRunning = false;
let idleTimer;
let idleTime = 15000; // Idle time in milliseconds
let elapsedTime = 0;
const coinsToSend = 10;
const apiUrl = "${window.location.origin}/api/coin-system/update";
let isError = false;

// Function to update the counter
function updateCounter() {
  const startTime = new Date().getTime() - elapsedTime;
  timerRunning = true;
  idleTimer = setTimeout(() => {
    timerRunning = false;
    document.getElementById("clock").innerText = "Don't be idle";
  }, idleTime);

  const interval = setInterval(() => {
    if (!timerRunning) {
      clearInterval(interval);
      return;
    }
    const currentTime = new Date().getTime();
    elapsedTime = currentTime - startTime;
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    document.getElementById("clock").innerText =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");
    if (seconds === 0 && minutes % 1 === 0 && timerRunning) {
      sendCoins(coinsToSend);
      fetchUserData(); // Fetch user data every minute
    }
  }, 1000);
}

// Function to send coins and update UI
function sendCoins(amount) {
  if (!isError) {
    const formData = new FormData();
    formData.append("wallet_address", getWalletAddressFromQueryParams());
    formData.append("amount", amount);
    fetch(apiUrl, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        // Check if the content type is JSON, if not, handle it as text
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          return response.text(); // Handle plain text response
        }
      })
      .then((data) => {
        if (typeof data === "string") {
          // Handle non-JSON response
          console.log(`Response: ${data}`);
          // You may need to parse or extract information from the text if needed
        } else {
          // Update the UI with the response data
          document.getElementById(
            "coinsAmountValue"
          ).innerText = `${data.coins}`;
          document.getElementById(
            "todaysPointsValue"
          ).innerText = `${data.todaysPoints}`;
          document.getElementById(
            "levelValueValue"
          ).innerText = `${data.levelValue}`;
          console.log(data.message);
        }
      })
      .catch((error) => {
        console.error("There was a problem with your fetch operation:", error);
      });
  }
}

// Function to initialize the counter
function initCounter() {
  updateCounter();
  fetchUserData();
}

// Create and append elements to the DOM
const clockContainer = document.createElement("div");
clockContainer.id = "clockContainer";

// Dropdown container with a toggle button
const dropdownContainer = document.createElement("div");
dropdownContainer.id = "dropdownContainer";

// Toggle Button with only icon
const toggleButton = document.createElement("button");
toggleButton.id = "toggleButton";
toggleButton.innerHTML = "&#9660;"; // Down arrow
toggleButton.setAttribute("aria-expanded", "false");

// Coins Container
const coinsContainer = document.createElement("div");
coinsContainer.id = "coinsContainer";
coinsContainer.classList.add("hide"); // Initially hidden

// Function to create a data box
function createDataBox(iconSrc, label, valueId, initialValue) {
  const dataBox = document.createElement("div");
  dataBox.className = "dataBox";

  const dataText = document.createElement("div");
  dataText.className = "dataText";

  const icon = document.createElement("img");
  icon.src = iconSrc;
  icon.alt = `${label} Icon`;

  const labelDiv = document.createElement("div");
  labelDiv.className = "dataLabel";
  labelDiv.innerText = label;

  dataText.appendChild(icon);
  dataText.appendChild(labelDiv);

  const valueDiv = document.createElement("div");
  valueDiv.className = "dataValue";
  valueDiv.id = valueId;
  valueDiv.innerText = initialValue;

  dataBox.appendChild(dataText);
  dataBox.appendChild(valueDiv);

  return dataBox;
}

// Create Data Boxes
const coinsDataBox = createDataBox(
  "${window.location.origin}/games-main",
  "Coins",
  "coinsAmountValue",
  "0"
);

const todaysPointsDataBox = createDataBox(
  "${window.location.origin}/games-main", // Replace with actual icon URL
  "Remaining Coins",
  "todaysPointsValue",
  "0"
);

const levelValueDataBox = createDataBox(
  "${window.location.origin}/games-main", // Replace with actual icon URL
  "Max Stamina",
  "levelValueValue",
  "0"
);

// Add the message div for the points limit exceeded
const pointsExceededMessage = document.createElement("div");
pointsExceededMessage.id = "pointsExceededMessage";
pointsExceededMessage.innerText =
  "Today's total points exceeded the allowed limit.";
// pointsExceededMessage.style.display = "none"; // Initially hidden (handled by CSS)

// Append data boxes to the coins container
coinsContainer.appendChild(coinsDataBox);
coinsContainer.appendChild(todaysPointsDataBox);
coinsContainer.appendChild(levelValueDataBox);
coinsContainer.appendChild(pointsExceededMessage); // Append message to the container

// Append the toggle button and coins container to the dropdown container
dropdownContainer.appendChild(toggleButton);
dropdownContainer.appendChild(coinsContainer);

// Clock Element
const clock = document.createElement("div");
clock.id = "clock";
clock.innerText = "00:00:00";

// Append dropdown container and clock to the main clock container
clockContainer.appendChild(dropdownContainer);
clockContainer.appendChild(clock);
document.body.appendChild(clockContainer);

// Initialize counter and add event listeners for user interaction
initCounter();

function resetIdleTimer() {
  if (!timerRunning) updateCounter();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    timerRunning = false;
    document.getElementById("clock").innerText = "Don't be idle";
  }, idleTime);
}

// Event listeners for user interaction
document.addEventListener("click", resetIdleTimer);
document.addEventListener("touchstart", resetIdleTimer);
document.addEventListener("touchend", resetIdleTimer);
document.addEventListener("mousemove", resetIdleTimer);
document.addEventListener("touchmove", resetIdleTimer);

// Function to get query parameters from the URL
function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const queryArray = queryString.split("&");
  for (let i = 0; i < queryArray.length; i++) {
    const pair = queryArray[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
}

// Function to get wallet address from query parameters
function getWalletAddressFromQueryParams() {
  const params = getQueryParams();
  if (params.hasOwnProperty("walletaddress")) {
    console.log(params["walletaddress"]);
    return params["walletaddress"];
  } else {
    console.error("Missing walletaddress parameter in the query string");
    return null;
  }
}

// Function to fetch user data from API and update UI
function fetchUserData() {
  const walletAddress = getWalletAddressFromQueryParams();
  if (!walletAddress) return;

  const url = "${window.location.origin}/api/coin-system/";
  const formData = new FormData();
  formData.append("walletaddress", walletAddress);

  fetch(url, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      const userData = data.user;
      const staminaLevel = parseInt(userData.staminaLevel);
      const todaysPointsValue = staminaLevel - parseInt(userData.todaysPoints);

      document.getElementById(
        "coinsAmountValue"
      ).innerText = `${userData.coins}`;
      document.getElementById(
        "todaysPointsValue"
      ).innerText = `${todaysPointsValue}`;
      document.getElementById("levelValueValue").innerText = `${staminaLevel}`;

      // Update message based on today's points value
      updatePointsExceededMessage(todaysPointsValue);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });
}

// Update the UI based on `todaysPointsValue`
function updatePointsExceededMessage(todaysPointsValue) {
  const messageElement = document.getElementById("pointsExceededMessage");
  if (todaysPointsValue === 0) {
    messageElement.style.display = "block";
  } else {
    messageElement.style.display = "none";
  }
}

// Function to check token and address
function checkTokenAndAddress(walletAddress, token) {
  return new Promise((resolve, reject) => {
    const apiUrl = "${window.location.origin}/api/captcha-system/validate";
    const params = new URLSearchParams();
    params.append("walletaddress", walletAddress);
    params.append("token", token);
    const fetchOptions = {
      method: "POST",
      body: params,
    };
    fetch(apiUrl, fetchOptions)
      .then((response) => {
        if (response.ok)
          return response.text(); // Expecting a plain text response
        else throw new Error("Network response was not ok");
      })
      .then((data) => {
        if (data === "valid") resolve(true);
        else if (data === "invalid") resolve(false);
        else reject(new Error("Unexpected response from server."));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Function to handle token verification
function handleTokenVerification() {
  function showError() {
    const errorDiv = document.createElement("div");
    errorDiv.id = "errorDiv";
    errorDiv.className = "fullscreen-error";
    const messageDiv = document.createElement("div");
    messageDiv.innerText = "Error. Reload page";
    errorDiv.appendChild(messageDiv);
    document.body.appendChild(errorDiv);
    isError = true;
  }

  const params = getQueryParams();
  const walletAddress = params["walletaddress"];
  const token = params["token"];

  if (!walletAddress || !token) {
    showError();
    return;
  }

  checkTokenAndAddress(walletAddress, token)
    .then((isValid) => {
      if (!isValid) showError();
    })
    .catch((error) => {
      console.error("Error:", error);
      showError();
    });
}

// Run token verification
handleTokenVerification();

// Add click event listener to the dropdownContainer to handle toggle
clockContainer.addEventListener("click", () => {
  const coinsContainer = document.getElementById("coinsContainer");
  const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    // Hide the coins container
    coinsContainer.classList.remove("show");
    coinsContainer.classList.add("hide");
    document
      .getElementById("clock")
      .style.setProperty("margin-top", "0", "important");

    // Update the toggle button appearance
    toggleButton.innerHTML = "&#9660;"; // Down arrow
    toggleButton.classList.remove("rotated");
    toggleButton.setAttribute("aria-expanded", "false");
  } else {
    // Show the coins container
    coinsContainer.classList.remove("hide");
    coinsContainer.classList.add("show");
    document
      .getElementById("clock")
      .style.setProperty("margin-top", "10px", "important");

    // Update the toggle button appearance
    toggleButton.innerHTML = "&#9650;"; // Up arrow
    toggleButton.classList.add("rotated");
    toggleButton.setAttribute("aria-expanded", "true");
  }
});
