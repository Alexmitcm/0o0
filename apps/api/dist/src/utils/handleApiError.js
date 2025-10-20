"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("@hey/data/enums");
const errors_1 = require("@hey/data/errors");
const logger_1 = require("@hey/helpers/logger");
const apiError_1 = __importDefault(require("@/utils/apiError"));
const handleApiError = (ctx, error) => {
    const log = (0, logger_1.withPrefix)("[API]");
    log.error(error);
    if (error instanceof apiError_1.default) {
        ctx.status(error.statusCode);
        return ctx.json({ error: error.message, status: enums_1.Status.Error });
    }
    ctx.status(500);
    return ctx.json({ error: errors_1.ERRORS.SomethingWentWrong, status: enums_1.Status.Error });
};
exports.default = handleApiError;
