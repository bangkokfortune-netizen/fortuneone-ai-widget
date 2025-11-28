import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import { APP_CONFIG } from "./core/config";
import { WebSocketInboundMessage, WebSocketOutboundMessage, ClientTextInputMessage } from "./core/types";
import { handleClientTextMessage } from "./modules/chat/chat.service";
import { loadBusinessConfig } from "./modules/business-config/business-config.service";

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(fastifyCors, {
  origin: true,
});

fastify.register(fastifyWebsocket);

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// WebSocket endpoint
fastify.register(async function (fastify) {
  fastify.get("/ws", { websocket: true }, (socket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const businessId = url.searchParams.get("business_id") || "bangkok-fortune";
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    fastify.log.info(`WebSocket connected: businessId=${businessId}, sessionId=${sessionId}`);

    // Load business config
    const businessConfig = loadBusinessConfig(businessId);
    if (!businessConfig) {
      const errorMsg: WebSocketOutboundMessage = {
        type: "text_output",
        content: "Business configuration not found.",
        language: "en",
        error: "BUSINESS_NOT_FOUND",
      };
      socket.send(JSON.stringify(errorMsg));
      socket.close();
      return;
    }

    // Send welcome message
    const welcomeMsg: WebSocketOutboundMessage = {
      type: "text_output",
      content: `Welcome to ${businessConfig.name}! How can I help you today?`,
      language: "en",
    };
    socket.send(JSON.stringify(welcomeMsg));

    // Handle incoming messages
    socket.on("message", async (rawData: Buffer) => {
      try {
        const message: WebSocketInboundMessage = JSON.parse(rawData.toString());
        fastify.log.info(`Received message: ${JSON.stringify(message)}`);

        if (message.type === "text_input") {
          // Create full ClientTextInputMessage object with all required fields
          const clientMsg: ClientTextInputMessage = {
            type: "text_input",
            business_id: businessId,
            session_id: sessionId,
            content: message.content,
            language: message.language || "en",
          };
          const response = await handleClientTextMessage(clientMsg, businessConfig);
          socket.send(JSON.stringify(response));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        fastify.log.error(`Error processing message: ${errorMessage}`);
        const errorResponse: WebSocketOutboundMessage = {
          type: "text_output",
          content: "Sorry, I encountered an error processing your message.",
          language: "en",
          error: "PROCESSING_ERROR",
        };
        socket.send(JSON.stringify(errorResponse));
      }
    });

    socket.on("close", () => {
      fastify.log.info(`WebSocket disconnected: sessionId=${sessionId}`);
    });
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000", 10);
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
