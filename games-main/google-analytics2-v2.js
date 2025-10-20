// Updated google analytics2.js with new API endpoints - Version 2
// This file replaces the old google analytics2.js to fix the 400 errors

// Function to get wallet address from query parameters
function getWalletAddressFromQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const walletAddress = params.get("walletaddress");

  if (walletAddress && walletAddress !== "guest") {
    console.log("Wallet address:", walletAddress);
    return walletAddress;
  }

  console.log(
    "No valid wallet address found, skipping wallet-specific features"
  );
  return null;
}

// Function to generate a simple token
function generateToken() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Function to check user ban status
function checkUserBan(walletaddress, token) {
  // Skip if no wallet address or token
  if (!walletaddress || !token) {
    console.log("Skipping user ban check - missing wallet address or token");
    return;
  }

  // Use new API endpoint
  const url = `${window.location.origin}/api/captcha-system/check-ban`;

  fetch(url, {
    body: JSON.stringify({
      action: "check",
      token: token,
      walletaddress: walletaddress
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success && data.banned) {
        alert(
          "You are currently banned due to repeated failed CAPTCHA attempts."
        );
        showCaptcha(); // Show CAPTCHA when banned
      }
    })
    .catch((error) => {
      console.error("Error checking user ban status:", error);
      // Don't show captcha on error, just log it
    });
}

// Function to update ban status
function setBanStatus(walletaddress, token, isBanned) {
  if (!walletaddress || !token) {
    console.log("Skipping ban status update - missing wallet address or token");
    return;
  }

  fetch(`${window.location.origin}/api/captcha-system/update-ban`, {
    body: JSON.stringify({
      action: "updateBan",
      isBanned: isBanned,
      token: token,
      walletaddress: walletaddress
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Ban status updated:", data);
    })
    .catch((error) => {
      console.error("Error updating ban status:", error);
    });
}

// Function to show captcha
function showCaptcha() {
  console.log("Showing captcha...");
  // Implement captcha display logic here
}

// Initialize when page loads
function initAnalytics() {
  console.log("Initializing analytics...");

  const walletaddress = getWalletAddressFromQueryParams();
  const token = generateToken();

  // Only check user ban if we have a valid wallet address (not guest)
  if (walletaddress && walletaddress !== "guest") {
    checkUserBan(walletaddress, token);
  }
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnalytics);
} else {
  initAnalytics();
}

// Export functions for global use
window.checkUserBan = checkUserBan;
window.setBanStatus = setBanStatus;
window.showCaptcha = showCaptcha;
window.getWalletAddressFromQueryParams = getWalletAddressFromQueryParams;

console.log("Google Analytics2 v2 loaded successfully with new API endpoints");
