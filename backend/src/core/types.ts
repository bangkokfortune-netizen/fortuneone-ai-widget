export type ClientTextInputMessage = {
  type: "text_input";
  business_id: string;
  session_id: string;
  content: string;
  language?: string;
};

export type BookingIntentType =
  | "BOOK_APPOINTMENT"
  | "ASK_AVAILABILITY"
  | "ASK_PRICE"
  | "ASK_PROMOTION"
  | "SMALL_TALK"
  | "OTHER";

export interface IntentResult {
  intent: BookingIntentType;
  service_name?: string;
  duration_minutes?: number;
  preferred_date?: string;
  preferred_time_range?: string;
  branch?: string;
  language?: string;
}

export type ServerTextOutputMessage = {
  type: "text_output";
  content: string;
  language: string;
  intent_result?: IntentResult;
  slots?: { time: string; bookable: boolean }[];
  booking_confirmation?: {
    booking_id: string;
    time: string;
    service_name: string;
  };
  error?: string;
};

export type WebSocketInboundMessage = ClientTextInputMessage;

export type WebSocketOutboundMessage = ServerTextOutputMessage;

export interface BusinessServiceConfig {
  id: string;
  name: string;
}

export interface PromotionConfig {
  name: string;
  details: string;
}

export interface BusinessConfig {
  business_id: string;
  name: string;
  language_default: string;
  language_supported: string[];
  location: string;
  address: string;
  phone: string;
  opening_hours: string;
  base_price: Record<string, number>;
  services: BusinessServiceConfig[];
  booking_link?: string;
  promotions?: PromotionConfig[];
}
