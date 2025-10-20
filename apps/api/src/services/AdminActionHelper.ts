import prisma from "../prisma/client";
import logger from "../utils/logger";

export const createAction = async (
  adminUserId: string,
  actionType:
    | "ForceUnlinkProfile"
    | "ForceLinkProfile"
    | "GrantPremium"
    | "UpdateFeatureAccess"
    | "AddAdminNote",
  data: {
    targetWallet: string;
    reason: string;
    targetProfileId?: string;
    metadata?: any;
  }
) => {
  return prisma.adminAction.create({
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

export const completeAction = async (
  actionId: string,
  result: Record<string, unknown> | null = { success: true }
) => {
  await prisma.adminAction.update({
    data: {
      completedAt: new Date(),
      result: result || undefined,
      status: "Completed"
    },
    where: { id: actionId }
  });
};

export const failAction = async (actionId: string, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error("Admin action failed:", error);
  await prisma.adminAction.update({
    data: {
      completedAt: new Date(),
      errorMessage: message,
      status: "Failed"
    },
    where: { id: actionId }
  });
};
