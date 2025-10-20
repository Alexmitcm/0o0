"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.failAction = exports.completeAction = exports.createAction = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
const createAction = async (adminUserId, actionType, data) => {
    return client_1.default.adminAction.create({
        data: {
            actionType,
            adminUserId,
            metadata: data.metadata,
            reason: data.reason,
            status: "Pending",
            targetProfileId: data.targetProfileId,
            targetWallet: data.targetWallet
        }
    });
};
exports.createAction = createAction;
const completeAction = async (actionId, result = { success: true }) => {
    await client_1.default.adminAction.update({
        data: {
            completedAt: new Date(),
            result: result || undefined,
            status: "Completed"
        },
        where: { id: actionId }
    });
};
exports.completeAction = completeAction;
const failAction = async (actionId, error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger_1.default.error("Admin action failed:", error);
    await client_1.default.adminAction.update({
        data: {
            completedAt: new Date(),
            errorMessage: message,
            status: "Failed"
        },
        where: { id: actionId }
    });
};
exports.failAction = failAction;
