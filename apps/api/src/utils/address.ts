export const normalizeAddress = (address: string): string => {
  if (!address) {
    throw new Error("Address is required");
  }

  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid wallet address format: ${address}`);
  }

  return address.toLowerCase();
};
