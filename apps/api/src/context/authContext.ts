import parseJwt from "@hey/helpers/parseJwt";
import type { JwtPayload } from "@hey/types/jwt";
import type { Context, Next } from "hono";

const authContext = async (ctx: Context, next: Next) => {
  const token = ctx.req.raw.headers.get("X-Access-Token");
  
  if (!token) {
    ctx.set("account", null);
    ctx.set("token", null);
    return next();
  }

  try {
    const payload: JwtPayload = parseJwt(token);
    
    if (!payload.act.sub) {
      ctx.set("account", null);
      ctx.set("token", null);
      return next();
    }

    ctx.set("account", payload.act.sub);
    ctx.set("token", token);
  } catch (error) {
    console.log("[DEBUG] JWT parsing failed:", error);
    ctx.set("account", null);
    ctx.set("token", null);
  }
  
  return next();
};

export const getAuthContext = (ctx: Context) => {
  return {
    walletAddress: ctx.get("account") || null,
    token: ctx.get("token") || null
  };
};

export default authContext;
