"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const secretMiddleware = async (c, next) => {
    const code = c.req.query("code");
    if (code !== process.env.SHARED_SECRET) {
        return c.body("Unauthorized", 401);
    }
    return next();
};
exports.default = secretMiddleware;
