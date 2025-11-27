import dotenv from "dotenv";

dotenv.config();

export const APP_CONFIG = {
  port: Number(process.env.PORT || 4000),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
  squareAccessToken: process.env.SQUARE_ACCESS_TOKEN || "",
  squareLocationId: process.env.SQUARE_LOCATION_ID || ""
};

if (!APP_CONFIG.openaiApiKey) {
  console.warn("WARNING: OPENAI_API_KEY is not set in environment.");
}
