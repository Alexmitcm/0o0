import { IS_MAINNET } from "@hey/data/constants";
import { Status } from "@hey/data/enums";
import { LENS_MAINNET_RPCS, LENS_TESTNET_RPCS } from "@hey/data/rpcs";
import { Hono } from "hono";
import logger from "../utils/logger";

const rpcRouter = new Hono();

// Health check endpoint
rpcRouter.get("/", (c) => {
  return c.json({
    message: "RPC proxy is running",
    network: IS_MAINNET ? "mainnet" : "testnet",
    status: "ok"
  });
});

// RPC proxy endpoint
rpcRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const rpcs = IS_MAINNET ? LENS_MAINNET_RPCS : LENS_TESTNET_RPCS;

    logger.info(
      `RPC proxy request: ${IS_MAINNET ? "mainnet" : "testnet"}, method: ${body.method}`
    );

    // Try each RPC endpoint until one succeeds
    for (const rpcUrl of rpcs) {
      try {
        logger.info(`Trying RPC endpoint: ${rpcUrl}`);
        const response = await fetch(rpcUrl, {
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        if (response.ok) {
          const data = await response.json();
          logger.info(`RPC request successful via: ${rpcUrl}`);
          return c.json(data);
        }
      } catch {
        // Continue to next RPC if this one fails
        logger.warn(`RPC endpoint failed: ${rpcUrl}`);
      }
    }

    // If all RPCs fail, return error
    return c.json(
      {
        error: "All RPC endpoints failed",
        status: Status.Error
      },
      500
    );
  } catch {
    return c.json(
      {
        error: "Invalid request body",
        status: Status.Error
      },
      400
    );
  }
});

export default rpcRouter;
