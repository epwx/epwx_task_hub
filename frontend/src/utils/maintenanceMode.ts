import "server-only";

import { existsSync } from "fs";
import path from "path";

const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

export function isMaintenanceModeEnabled() {
  const envValue = process.env.MAINTENANCE_MODE?.trim().toLowerCase();

  if (envValue && TRUTHY_VALUES.has(envValue)) {
    return true;
  }

  const maintenanceFlagPath = path.join(process.cwd(), ".maintenance");
  return existsSync(maintenanceFlagPath);
}