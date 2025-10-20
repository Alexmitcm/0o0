"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const logger_1 = require("@hey/helpers/logger");
const jose_1 = require("jose");
const jwksUri = `${constants_1.LENS_API_URL.replace("/graphql", "")}/.well-known/jwks.json`;
const JWKS = (0, jose_1.createRemoteJWKSet)(new URL(jwksUri), {
    cacheMaxAge: 60 * 60 * 12
});
const unauthorized = (c) => c.body("Unauthorized", 401);
const authMiddleware = async (c, next) => {
    const log = (0, logger_1.withPrefix)("[API]");
    const token = c.get("token");
    if (!token) {
        log.warn("missing token");
        return unauthorized(c);
    }
    try {
        await (0, jose_1.jwtVerify)(token, JWKS);
    }
    catch {
        log.warn("invalid token");
        return unauthorized(c);
    }
    return next();
};
exports.default = authMiddleware;
