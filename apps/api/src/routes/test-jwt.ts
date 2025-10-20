import { Status } from "@hey/data/enums";
import type { Context } from "hono";
import JwtService from "../services/JwtService";

const generateTestJwt = async (c: Context) => {
  try {
    const { walletAddress } = await c.req.json();

    if (!walletAddress) {
      return c.json(
        {
          error: "walletAddress is required",
          status: Status.Error,
          success: false
        },
        400
      );
    }

    // Generate a test JWT with the provided data
    const token = JwtService.generateToken({
      status: "Standard",
      walletAddress
    });

    return c.json(
      {
        data: {
          status: "Standard",
          token,
          walletAddress
        },
        status: Status.Success,
        success: true
      },
      200
    );
  } catch (error) {
    console.error("Error generating test JWT:", error);

    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate test JWT",
        status: Status.Error,
        success: false
      },
      500
    );
  }
};

export default generateTestJwt;
