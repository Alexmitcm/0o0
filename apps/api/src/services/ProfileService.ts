import { LENS_API_URL } from "@hey/data/constants";
import logger from "../utils/logger";

interface Profile {
  id: string;
  handle: string;
  ownedBy: string;
  isDefault: boolean;
}

export class ProfileService {
  private lensApiUrl = LENS_API_URL;

  /**
   * Get all profiles owned by a wallet address using the official Lens GraphQL API
   */
  async getProfilesByWallet(
    walletAddress: string,
    accessToken?: string
  ): Promise<Profile[]> {
    try {
      logger.info(`Fetching profiles for wallet: ${walletAddress}`);

      const query = `
        query AccountsByOwner($request: AccountsBulkRequest!) {
          accountsBulk(request: $request) {
            address
            owner
            username(request: { autoResolve: true }) {
              localName
            }
          }
        }
      `;

      const variables = { request: { ownedBy: [walletAddress] } };

      const response = await fetch(this.lensApiUrl, {
        body: JSON.stringify({ query, variables }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error("Lens API Error:", errorBody);
        throw new Error(
          `Lens API request failed with status ${response.status}`
        );
      }

      const rawText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(rawText);
      } catch {
        logger.error(
          "Lens API returned non-JSON response:",
          rawText.slice(0, 500)
        );
        throw new Error("Invalid JSON from Lens API");
      }

      if (responseData.errors) {
        logger.error("GraphQL Errors:", responseData.errors);
        throw new Error("GraphQL query returned errors.");
      }

      const items = responseData.data?.accountsBulk || [];

      logger.info(`Found ${items.length} total accounts from Lens API`);

      // Filter profiles owned by the specified wallet
      const normalized = walletAddress.toLowerCase();
      const ownedProfiles = items.filter(
        (account: any) => account.owner?.toLowerCase() === normalized
      );

      logger.info(
        `Found ${ownedProfiles.length} profiles owned by ${walletAddress}`
      );

      return ownedProfiles.map((account: any) => ({
        handle: account.username?.localName || "",
        id: account.address,
        isDefault: false,
        ownedBy: account.owner
      }));
    } catch (error) {
      logger.error(
        `Error getting profiles for wallet ${walletAddress}:`,
        error
      );
      return [];
    }
  }

  /**
   * Validate if a wallet owns a specific profile
   * This method now fetches the actual profiles and checks ownership
   */
  async validateProfileOwnership(
    walletAddress: string,
    profileId: string,
    accessToken?: string
  ): Promise<boolean> {
    try {
      logger.info(
        `Validating profile ownership: wallet=${walletAddress}, profile=${profileId}`
      );

      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV !== "production";

      // Always try to use the Lens API first (with or without access token)
      try {
        // Get all profiles owned by the wallet
        const profiles = await this.getProfilesByWallet(
          walletAddress,
          accessToken
        );

        // Check if any profile matches the given profileId
        const isOwner = profiles.some(
          (profile) => profile.id.toLowerCase() === profileId.toLowerCase()
        );

        logger.info(
          `Profile ownership validation result (with Lens API): ${isOwner}`
        );

        // If API returns no profiles but we're in development, be lenient
        if (!isOwner && profiles.length === 0 && isDevelopment) {
          logger.info(
            "Development mode: No profiles found from API, allowing validation for testing"
          );
          return true;
        }

        return isOwner;
      } catch (apiError) {
        logger.warn(
          `Lens API failed, falling back to simple validation: ${apiError}`
        );

        // In development mode, be more permissive
        if (isDevelopment) {
          logger.info("Development mode: Using permissive fallback validation");

          // Allow if profile ID looks like a valid Ethereum address
          if (profileId.startsWith("0x") && profileId.length === 42) {
            logger.info(
              "Development validation: Valid profile format accepted"
            );
            return true;
          }
        }

        // Fallback to simple validation for backward compatibility
        // In Lens, profile ID is often the same as wallet address
        const normalizedWallet = walletAddress.toLowerCase();
        const normalizedProfile = profileId.toLowerCase();
        const isOwner = normalizedWallet === normalizedProfile;

        logger.info(
          `Profile ownership validation result (fallback): ${isOwner}`
        );
        return isOwner;
      }
    } catch (error) {
      logger.error(`Error validating profile ownership: ${error}`);
      return false;
    }
  }

  /**
   * Get profile details by profile ID
   * For development, returns a mock profile
   */
  async getProfileById(profileId: string): Promise<any> {
    try {
      logger.info(`Getting profile details for profileId: ${profileId}`);

      // For development mode, return a mock profile
      const isDevelopment = process.env.NODE_ENV !== "production";

      if (isDevelopment) {
        return {
          handle: `user_${profileId.slice(2, 8)}`,
          id: profileId,
          isDefault: true,
          metadata: {
            bio: "Development user profile",
            displayName: `User ${profileId.slice(2, 8)}`
          },
          ownedBy: profileId
        };
      }

      // In production, implement actual Lens API call
      const query = `
        query Profile($request: ProfileRequest!) {
          profile(request: $request) {
            id
            handle {
              localName
            }
            ownedBy {
              address
            }
            metadata {
              displayName
              bio
            }
          }
        }
      `;

      const variables = { request: { forProfileId: profileId } };

      const response = await fetch(this.lensApiUrl, {
        body: JSON.stringify({ query, variables }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Lens API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.profile || null;
    } catch (error) {
      logger.error(`Error getting profile ${profileId}:`, error);
      return null;
    }
  }
}

export const profileService = new ProfileService();
export default profileService;
