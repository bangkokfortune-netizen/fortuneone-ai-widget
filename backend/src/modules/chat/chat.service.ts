import OpenAI from "openai";
import { APP_CONFIG } from "../../core/config";
import { withRateLimitAndRetry } from "../../core/rate-limiter";
import {
  BusinessConfig,
  ClientTextInputMessage,
  IntentResult,
  ServerTextOutputMessage
} from "../../core/types";
import { handleSquareIntent } from "../square/square.service";

const openai = new OpenAI({
  apiKey: APP_CONFIG.openaiApiKey
});

function buildSystemPrompt(cfg: BusinessConfig): string {
  return [
    `You are FortuneOneAI, a helpful AI receptionist for "${cfg.name}" located in ${cfg.location}.`,
    'Use ONLY the provided business configuration for services, prices, hours, and promotions. Never make up prices or availability.',
    'If the user asks about booking or availability, you must (when appropriate) emit a JSON object called IntentResult describing the user\'s intent.',
    'IntentResult JSON fields: intent, service_name, duration_minutes, preferred_date, preferred_time_range, branch, language.',
    'Supported intents: BOOK_APPOINTMENT, ASK_AVAILABILITY, ASK_PRICE, ASK_PROMOTION, SMALL_TALK, OTHER.',
    'Always respond in the same language as the user (currently supports English \'en\' and Thai \'th\').',
    'Format your response as TWO clear parts:',
    '1) A friendly natural-language reply (assistant text).',
    '2) On a new line, a raw JSON object named IntentResult, with no commentary around it.',
    `Business configuration:\n${JSON.stringify(cfg, null, 2)}`
  ].join("\n");
}

function detectLanguageFromMessage(msg: string, fallback: string): string {
  if (msg.match(/[\u0E00-\u0E7F]/)) return "th";
  return fallback || "en";
}

function extractIntentFromText(text: string): IntentResult | undefined {
  const jsonMatch = text.match(/\{[\s\S]*\}$/m);
  if (!jsonMatch) return undefined;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as IntentResult;
    return parsed;
  } catch {
    return undefined;
  }
}

function stripIntentJsonFromText(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}$/m);
  if (!jsonMatch) return text.trim();
  return text.slice(0, jsonMatch.index).trim();
}

export async function handleClientTextMessage(
  msg: ClientTextInputMessage,
  cfg: BusinessConfig
): Promise<ServerTextOutputMessage> {
  const userLanguage =
    msg.language || detectLanguageFromMessage(msg.content, cfg.language_default);

  const systemPrompt = buildSystemPrompt(cfg);

  try {
    // Wrap OpenAI call with rate limiting and exponential retry
    const completion = await withRateLimitAndRetry(() => 
      openai.chat.completions.create({
        model: APP_CONFIG.openaiModel,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `User language code: ${userLanguage}. User message: ${msg.content}`
          }
        ],
        temperature: 0.3
      })
    );

    const rawText = completion.choices[0]?.message?.content || "";
    const intent = extractIntentFromText(rawText);
    const cleanReply = stripIntentJsonFromText(rawText);

    let response: ServerTextOutputMessage = {
      type: "text_output",
      content: cleanReply || "Sorry, I could not generate a response.",
      language: userLanguage,
      intent_result: intent
    };

    if (intent && (intent.intent === "ASK_AVAILABILITY" || intent.intent === "BOOK_APPOINTMENT")) {
      try {
        const squareResult = await handleSquareIntent(intent, cfg);
        response = { ...response, ...squareResult };
      } catch (err) {
        response.error = "There was an error checking availability. Please try again.";
        console.error("Square integration error", err);
      }
    }

    return response;
  } catch (error: any) {
    console.error("[ChatService] OpenAI call failed:", error?.message || error);
    
    // Return a graceful error message instead of crashing
    return {
      type: "text_output",
      content: "I'm currently experiencing high demand. Please wait a moment and try again.",
      language: userLanguage,
      error: "rate_limit_exceeded"
    };
  }
}
