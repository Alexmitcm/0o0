// Initialization and settings
const style = document.createElement("style");
style.innerHTML = `
    body, html {
        height: 100%;
        margin: 0;
    }
    #clockContainer {
        top: 0 !important;
        position: absolute;
        top: 50%;
        z-index: 999999;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
    }
    #dropdownContainer {
        width: 100%;
        text-align: center;
    }
    #toggleButton {
        background-color: #4CAF50;
        color: white;
        padding: 10px;
        font-size: 1rem;
        border: none;
        cursor: pointer;
        width: 100%;
    }
    #coinsContainer {
        display: none; /* Hidden by default */
        flex-direction: column;
        align-items: center;
        background-color: #F63C01;
        padding: 5px;
        box-sizing: border-box;
        width: 100%;
        transition: max-height 0.3s ease-out;
    }
    #coinsIcon {
        width: 20px;
        height: 20px;
        margin-right: 5px;
    }
    #coinsAmount {
        font-size: 1rem;
        color: white;
        font-family: cursive;
    }
    #todaysPoints {
        font-size: 0.8rem;
        color: white;
        font-family: cursive;
    }
    #levelValue {
        font-size: 0.8rem;
        color: white;
        font-family: cursive;
    }
    #clock {
        font-size: 1rem;
        width: 100%;
        height: 100%;
        background-color: #585FF9;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: cursive;
        padding: 5px;
        box-sizing: border-box;
    }
    .fullscreen-error {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 1);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
    }
    #pointsExceededMessage {

        font-size: 1rem;
        color: black;
        font-family: cursive;
        display: none;
    }
`;
document.head.appendChild(style);

// Timer and settings
let timerRunning = false;
let idleTimer;
const idleTime = 15000; // Idle time in milliseconds
let elapsedTime = 0;
const coinsToSend = 10;
const apiUrl = `${window.location.origin}/api/coin-system/update`;
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
      body: formData,
      method: "POST"
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        // Check if the content type is JSON, if not, handle it as text
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        }
        return response.text(); // Handle plain text response
      })
      .then((data) => {
        if (typeof data === "string") {
          // Handle non-JSON response
          console.log(`Response: ${data}`);
          // You may need to parse or extract information from the text if needed
        } else {
          // Update the UI with the response data
          document.getElementById("coinsAmount").innerText =
            `Coins: ${data.coins}`;
          document.getElementById("todaysPoints").innerText =
            `Remaining Coins: ${data.todaysPoints}`;
          document.getElementById("levelValue").innerText =
            `Max Stamina: ${data.levelValue}`;
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

const toggleButton = document.createElement("button");
toggleButton.id = "toggleButton";
toggleButton.innerText = "Show Details";
toggleButton.onclick = () => {
  const coinsContainer = document.getElementById("coinsContainer");
  if (coinsContainer.style.display === "none") {
    coinsContainer.style.display = "flex";
    toggleButton.innerText = "Hide Details";
  } else {
    coinsContainer.style.display = "none";
    toggleButton.innerText = "Show Details";
  }
};

const coinsContainer = document.createElement("div");
coinsContainer.id = "coinsContainer";
coinsContainer.style.display = "none";

const coinsIcon = document.createElement("img");
coinsIcon.src = `${window.location.origin}/games-main/Coinicon.png`;
coinsIcon.id = "coinsIcon";

const coinsAmount = document.createElement("div");
coinsAmount.id = "coinsAmount";
coinsAmount.innerText = "Coins: 0";

const todaysPoints = document.createElement("div");
todaysPoints.id = "todaysPoints";
todaysPoints.innerText = "Remaining Coins: 0";

const levelValue = document.createElement("div");
levelValue.id = "levelValue";
levelValue.innerText = "Max Stamina: 0";

// Add the message div for the points limit exceeded
const pointsExceededMessage = document.createElement("div");
pointsExceededMessage.id = "pointsExceededMessage";
pointsExceededMessage.innerText =
  "Today's total points exceeded the allowed limit.";
pointsExceededMessage.style.display = "none"; // Initially hidden

// Append elements to the coins container
coinsContainer.appendChild(coinsIcon);
coinsContainer.appendChild(coinsAmount);
coinsContainer.appendChild(todaysPoints);
coinsContainer.appendChild(levelValue);
coinsContainer.appendChild(pointsExceededMessage); // Append message to the container

// Append the toggle button and coins container to the dropdown container
dropdownContainer.appendChild(toggleButton);
dropdownContainer.appendChild(coinsContainer);

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
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return params;
}

// Function to get wallet address from query parameters
function getWalletAddressFromQueryParams() {
  const params = getQueryParams();
  if (Object.hasOwn(params, "walletaddress")) {
    console.log(params["walletaddress"]);
    return params["walletaddress"];
  }
  console.error("Missing walletaddress parameter in the query string");
  return null;
}

// Function to fetch user data from API and update UI
function fetchUserData() {
  const walletAddress = getWalletAddressFromQueryParams();
  if (!walletAddress) return;

  const url = `${window.location.origin}/api/coin-system/${walletAddress}`;
  const formData = new FormData();
  formData.append("walletaddress", walletAddress);

  fetch(url, {
    body: formData,
    method: "POST"
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      const userData = data.user;
      const staminaLevel = Number.parseInt(userData.staminaLevel);
      const todaysPointsValue =
        staminaLevel - Number.parseInt(userData.todaysPoints);

      document.getElementById("coinsAmount").innerText =
        `Coins: ${userData.coins}`;
      document.getElementById("todaysPoints").innerText =
        `Remaining Coins: ${todaysPointsValue}`;
      document.getElementById("levelValue").innerText =
        `Max Stamina: ${staminaLevel}`;

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
    const apiUrl = `${window.location.origin}/api/captcha-system/validate`;
    const params = new URLSearchParams();
    params.append("walletaddress", walletAddress);
    params.append("token", token);
    const fetchOptions = {
      body: params,
      method: "POST"
    };
    fetch(apiUrl, fetchOptions)
      .then((response) => {
        if (response.ok) return response.text();
        throw new Error("Network response was not ok");
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
