var style = document.createElement("style");
style.innerHTML = `
    body, html {
        height: 100%;
        margin: 0;
    }

    #clockContainer {
        top: 0 !important;
        position: absolute;
        top: 50%;

        background-color: #f0f0f0;
        border: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
    }

    #coinsContainer {
        display: flex;
        align-items: center;
        background-color: #F63C01;
        padding: 5px;
        box-sizing: border-box;
    }

    #coinsIcon {
        width: 20px;
        height: 20px;
        margin-right: 5px;
    }

    #coinsAmount {
        font-size: 1rem;
        width: 100%;
        height: 100%;
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
    
    
`;
document.head.appendChild(style);

// Flags to manage states
var timerRunning = false;
var idleTimer;
var idleTime = 15000; // 5 seconds
var elapsedTime = 0;
var coinsToSend = 10; // Number of coins to send
var apiUrl = window.location.origin + "/api/coin-system/update"; // API endpoint
var iserror = false;

// Function to update the counter
function updateCounter() {
  var startTime = new Date().getTime() - elapsedTime;
  timerRunning = true;
  idleTimer = setTimeout(function () {
    timerRunning = false;
    document.getElementById("clock").innerText = "Don't be idle";
  }, idleTime);
  var timerInterval = setInterval(function () {
    if (!timerRunning) {
      clearInterval(timerInterval);
      return;
    }
    var currentTime = new Date().getTime();
    elapsedTime = currentTime - startTime;
    var hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    var minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    document.getElementById("clock").innerText =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    // Check if 60 seconds have passed and timer is running
    if (seconds === 0 && minutes % 1 === 0 && timerRunning) {
      sendCoins(coinsToSend); // Send coins
    }
  }, 1000); // Update every second
}

// Function to send coins to the API
function sendCoins(amount) {
  if (!iserror) {
    var formData = new FormData();
    formData.append("wallet_address", getWalletAddressFromQueryParams()); // Replace with your wallet address
    formData.append("amount", amount);

    fetch(apiUrl, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("There was a problem with your fetch operation:", error);
      });
    getCoinsAndUpdateUI(getWalletAddressFromQueryParams());
  }
}

// Function to initialize the counter
function initCounter() {
  updateCounter(); // Start the counter
}

// Create clock container
var clockContainer = document.createElement("div");
clockContainer.id = "clockContainer";

// Create coins container
var coinsContainer = document.createElement("div");
coinsContainer.id = "coinsContainer";

// Create coins icon
var coinsIcon = document.createElement("img");
coinsIcon.src = "/games-main/Coinicon.png";
coinsIcon.id = "coinsIcon";

// Create coins amount div
var coinsAmount = document.createElement("div");
coinsAmount.id = "coinsAmount";
coinsAmount.innerText = "100"; // Static number for now
coinsAmount.style.width = "100%";
coinsAmount.style.height = "100%";

// Append coins icon and coins amount to coins container
coinsContainer.appendChild(coinsIcon);
coinsContainer.appendChild(coinsAmount);

// Create clock div
var clock = document.createElement("div");
clock.id = "clock";

// Append coins container and clock to clock container
clockContainer.appendChild(coinsContainer);
clockContainer.appendChild(clock);

// Append clock container to body
document.body.appendChild(clockContainer);

// Initialize counter
initCounter();

// Event listeners to track user interaction
document.addEventListener("click", function () {
  if (!timerRunning) {
    updateCounter();
  }
  clearInterval(idleTimer);
  idleTimer = setTimeout(function () {
    timerRunning = false;
    document.getElementById("clock").innerText = "Don't be idle";
  }, idleTime);
});

document.addEventListener("touchstart", function () {
  if (!timerRunning) {
    updateCounter();
  }
  clearInterval(idleTimer);
  idleTimer = setTimeout(function () {
    timerRunning = false;
    document.getElementById("clock").innerText = "Don't be idle";
  }, idleTime);
});
function getQueryParams() {
  var queryParams = {};
  var queryString = window.location.search.substring(1);
  var params = queryString.split("&");
  for (var i = 0; i < params.length; i++) {
    var pair = params[i].split("=");
    queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return queryParams;
}
function getWalletAddressFromQueryParams() {
  var queryParams = getQueryParams();
  if (queryParams.hasOwnProperty("walletaddress")) {
    return queryParams["walletaddress"];
  } else {
    return null;
  }
}
function getCoinsAndUpdateUI(walletAddress) {
  var apiUrl = window.location.origin + "/api/coin-system/" + walletAddress;

  // Create FormData object and append wallet_address parameter
  var formData = new FormData();
  formData.append("walletaddress", walletAddress);

  fetch(apiUrl, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data && data.user && data.user.coins) {
        var coins = data.user.coins;
        document.getElementById("coinsAmount").innerText = coins;
      } else {
        console.error("Invalid response data:", data);
      }
    })
    .catch((error) => {
      console.error("There was a problem with your fetch operation:", error);
    });
}

getCoinsAndUpdateUI(getWalletAddressFromQueryParams());

function checkTokenAndAddress(walletaddress, token) {
  return new Promise((resolve, reject) => {
    // Endpoint URL
    const url = window.location.origin + "/api/captcha-system/validate";

    // Data to be sent in the POST request
    const data = new URLSearchParams();
    data.append("walletaddress", walletaddress);
    data.append("token", token);

    // Options for the fetch request
    const options = {
      method: "POST",
      body: data,
    };

    // Sending the POST request
    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error("Network response was not ok.");
        }
      })
      .then((data) => {
        // Handling the response
        if (data === "valid") {
          resolve(true); // Resolve with true if token and wallet address are valid
        } else if (data === "invalid") {
          resolve(false); // Resolve with false if token and wallet address are invalid
        } else {
          reject(new Error("Unexpected response from server."));
        }
      })
      .catch((error) => {
        reject(error); // Reject with the error if any error occurs during the request
      });
  });
}

function handleTokenVerification() {
  // Function to extract query parameters from the URL
  function getQueryParams() {
    var queryParams = {};
    var queryString = window.location.search.substring(1);
    var params = queryString.split("&");
    for (var i = 0; i < params.length; i++) {
      var pair = params[i].split("=");
      queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return queryParams;
  }

  // Function to display error message in fullscreen div
  function displayErrorMessage() {
    // Create error div
    var errorDiv = document.createElement("div");
    errorDiv.id = "errorDiv";
    errorDiv.className = "fullscreen-error";

    // Create inner message
    var errorMessage = document.createElement("div");
    errorMessage.innerText = "Error. Reload page";
    errorMessage.style.color = "white";
    errorMessage.style.fontFamily = "Arial, sans-serif";
    iserror = true;
    // Append inner message to error div
    errorDiv.appendChild(errorMessage);

    // Append error div to document body
    document.body.appendChild(errorDiv);
  }

  // Function to check if the token matches the hash
  function checkTokenHash() {
    var queryParams = getQueryParams();
    var walletAddress = queryParams["walletaddress"];
    var token = queryParams["token"];

    if (!walletAddress || !token) {
      // If either wallet address or token is missing, display error message
      displayErrorMessage();

      return;
    }
    checkTokenAndAddress(walletAddress, token)
      .then((isValid) => {
        if (isValid) {
          // Do something if token and wallet address are valid
        } else {
          displayErrorMessage();
          // Do something if token and wallet address are invalid
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Call the function to check token hash on page load
  checkTokenHash();
}

handleTokenVerification();
