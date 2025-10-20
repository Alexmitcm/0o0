export const getEnvNumber = (name: string, defaultValue: number): number => {
  const v = process.env[name];
  if (!v) return defaultValue;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

export const CONFIG = {
  PREMIUM_STATUS_TTL_SECONDS: getEnvNumber(
    "PREMIUM_STATUS_TTL_SECONDS",
    60 * 30
  )
};
