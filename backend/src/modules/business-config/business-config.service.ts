import path from "path";
import fs from "fs";
import { BusinessConfig } from "../../core/types";

const CONFIG_DIR = path.join(__dirname);

const cache: Record<string, BusinessConfig> = {};

export function loadBusinessConfig(businessId: string): BusinessConfig | null {
  if (cache[businessId]) return cache[businessId];
  const fileName = 'business-config.' + businessId + '.json';
  const fullPath = path.join(CONFIG_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  const parsed = JSON.parse(raw) as BusinessConfig;
  cache[businessId] = parsed;
  return parsed;
}
