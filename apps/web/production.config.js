// Production Configuration for Netlify
// This file contains the production environment variables

export const productionConfig = {
  NEXT_PUBLIC_LENS_NETWORK: "testnet",
  VITE_API_URL:
    process.env.VITE_API_URL || "https://your-api-domain.vercel.app",
  VITE_IS_PRODUCTION: true,
  VITE_LENS_NETWORK: "testnet",
  VITE_WALLETCONNECT_PROJECT_ID: "587ccfb9fd2ef35aab33026fe031fda7"
};

// Instructions for Netlify Environment Variables:
/*
1. Go to Netlify Dashboard
2. Select your site
3. Go to Site settings > Environment variables
4. Add these variables:

VITE_IS_PRODUCTION=true
VITE_API_URL=https://your-api-domain.vercel.app
NEXT_PUBLIC_LENS_NETWORK=testnet
VITE_LENS_NETWORK=testnet
VITE_WALLETCONNECT_PROJECT_ID=587ccfb9fd2ef35aab33026fe031fda7

5. Redeploy your site
*/
