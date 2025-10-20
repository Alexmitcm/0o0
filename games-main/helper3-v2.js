// Updated helper3.js with new API endpoints - Version 2
// This file replaces the old helper3.js to fix the 404 errors

// Function to get query parameters from URL
function getQueryParams() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  return params;
}

// Function to get wallet address from query parameters
function getWalletAddressFromQueryParams() {
  const params = getQueryParams();
  if (Object.hasOwn(params, "walletaddress")) {
    const walletAddress = params["walletaddress"];
    console.log("Wallet address:", walletAddress);
    // Return null for guest users to prevent API calls
    if (walletAddress === "guest") {
      console.log("Guest user detected, skipping wallet-specific features");
      return null;
    }
    return walletAddress;
  }
  console.error("Missing walletaddress parameter in the query string");
  return null;
}

// Function to fetch user data from API and update UI
function fetchUserData() {
  const walletAddress = getWalletAddressFromQueryParams();
  if (!walletAddress) return;

  // Use new API endpoint
  const url = `${window.location.origin}/api/coin-system/${walletAddress}`;

  fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "GET"
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      if (data.success && data.user) {
        const userData = data.user;
        const staminaLevel = userData.levelValue || 0;
        const todaysPointsValue = userData.todaysPoints || 0;

        // Update UI elements if they exist
        const coinsElement = document.getElementById("coinsAmountValue");
        const pointsElement = document.getElementById("todaysPointsValue");
        const levelElement = document.getElementById("levelValueValue");

        if (coinsElement) coinsElement.innerText = `${userData.coins}`;
        if (pointsElement) pointsElement.innerText = `${todaysPointsValue}`;
        if (levelElement) levelElement.innerText = `${staminaLevel}`;

        // Update message based on today's points value
        updatePointsExceededMessage(todaysPointsValue);

        console.log("User data loaded successfully:", data);
      } else {
        console.error("Invalid response format:", data);
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });
}

// Function to update points exceeded message
function updatePointsExceededMessage(todaysPoints) {
  const messageElement = document.getElementById("pointsExceededMessage");
  if (messageElement) {
    if (todaysPoints >= 100) {
      messageElement.style.display = "block";
      messageElement.textContent = "You have exceeded today's point limit!";
    } else {
      messageElement.style.display = "none";
    }
  }
}

// Function to update coins (equivalent to CoinUpdate)
function updateCoins(amount, coinType = "Experience") {
  const walletAddress = getWalletAddressFromQueryParams();
  if (!walletAddress) return;

  const apiUrl = `${window.location.origin}/api/coin-system/update`;

  fetch(apiUrl, {
    body: JSON.stringify({
      amount,
      coinType,
      walletAddress
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        console.log("Coins updated successfully:", data);
        // Refresh user data
        fetchUserData();
      } else {
        console.error("Failed to update coins:", data);
      }
    })
    .catch((error) => {
      console.error("Error updating coins:", error);
    });
}

// Function to validate token (equivalent to Validate)
function validateToken(walletAddress, token) {
  if (!walletAddress || !token) return;

  const apiUrl = `${window.location.origin}/api/captcha-system/validate`;

  const formData = new FormData();
  formData.append("walletaddress", walletAddress);
  formData.append("token", token);

  fetch(apiUrl, {
    body: formData,
    method: "POST"
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        console.log("Token validated successfully:", data);
      } else {
        console.error("Token validation failed:", data);
      }
    })
    .catch((error) => {
      console.error("Error validating token:", error);
    });
}

// Initialize counter when page loads
function initCounter() {
  console.log("Initializing counter...");
  fetchUserData();
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCounter);
} else {
  initCounter();
}

// Export functions for global use
window.fetchUserData = fetchUserData;
window.updateCoins = updateCoins;
window.validateToken = validateToken;
window.getWalletAddressFromQueryParams = getWalletAddressFromQueryParams;

console.log("Helper3 v2 loaded successfully with new API endpoints");
