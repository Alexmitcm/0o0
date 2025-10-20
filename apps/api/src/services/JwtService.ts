import jwt from "jsonwebtoken";
import logger from "../utils/logger";

export interface JwtPayload {
  walletAddress: string;
  status: "Standard" | "Premium";
  linkedProfileId?: string;
  iat?: number;
  exp?: number;
}

export class JwtService {
  private readonly secret: string;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET environment variable is required but not set"
      );
    }
    this.secret = jwtSecret;
  }

  /**
   * Generate JWT token with user data
   */
  generateToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
    try {
      const token = jwt.sign(payload, this.secret, {
        audience: "hey-pro-client",
        expiresIn: "7d", // Token expires in 7 days
        issuer: "hey-pro-api"
      });

      logger.debug(`JWT token generated for wallet: ${payload.walletAddress}`);
      return token;
    } catch (error) {
      logger.error("Error generating JWT token:", error);
      throw new Error("Failed to generate authentication token");
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        audience: "hey-pro-client",
        issuer: "hey-pro-api"
      }) as JwtPayload;

      logger.debug(`JWT token verified for wallet: ${decoded.walletAddress}`);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn("JWT token expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn("Invalid JWT token");
      } else {
        logger.error("Error verifying JWT token:", error);
      }
      return null;
    }
  }

  /**
   * Decode JWT token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error("Error decoding JWT token:", error);
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  refreshToken(token: string): string | null {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      // Generate new token with same payload but new expiration
      const { iat: _iat, exp: _exp, ...payload } = decoded;
      return this.generateToken(payload);
    } catch (error) {
      logger.error("Error refreshing JWT token:", error);
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (!decoded.exp) {
        return null;
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      logger.error("Error getting token expiration:", error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return true;
      }
      return expiration < new Date();
    } catch (error) {
      logger.error("Error checking token expiration:", error);
      return true;
    }
  }
}

export default new JwtService();
