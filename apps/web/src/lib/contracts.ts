// Smart Contract Addresses
// Mainnet contract addresses
export const CONTRACT_ADDRESSES = {
  DEV_VAULT: "0xC5f4e1A09493a81e646062dBDc3d5B14E769F407", // Dev Vault Contract
  GAME_VAULT: "0x65f83111e525C8a577C90298377e56E72C24aCb2", // Balanced Game Vault
  MAIN_NODE: "0xF2193988CB18b74695ECD43120534705D4b2ec96", // Main Node Contract
  REFERRAL: "0x3bC03e9793d2E67298fb30871a08050414757Ca7",
  TETHER: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
  UNBALANCED_GAME_VAULT: "0x10E7F9feB9096DCBb94d59D6874b07657c965981" // Unbalanced Game Vault
} as const;

// Common roles for access control
export const ROLES = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  KEEPER_ROLE:
    "0x4f78afe9dfc9a0cb0441c27b9405070cd2a48b490636a7bdd09f355e33a5d7de"
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  CHAIN_ID: 1, // Mainnet - change as needed
  EXPLORER_URL: "https://etherscan.io", // Replace with actual explorer URL
  RPC_URL: "https://eth-mainnet.g.alchemy.com/v2/your-api-key" // Replace with actual RPC URL
} as const;
