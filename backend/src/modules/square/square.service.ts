import fetch from "node-fetch";
import { APP_CONFIG } from "../../core/config";
import { IntentResult, BusinessConfig } from "../../core/types";

/**
 * Square Service - Handles Square API integration
 * Placeholder implementation for booking appointments
 */

interface SquareSlot {
  time: string;
  bookable: boolean;
}

export async function handleSquareIntent(
  intent: IntentResult,
  cfg: BusinessConfig
): Promise<{ slots?: SquareSlot[]; booking_confirmation?: { booking_id: string; time: string; service_name: string } }> {
  const { squareAccessToken, squareLocationId } = APP_CONFIG;

  if (!squareAccessToken || !squareLocationId) {
    console.warn("Square credentials not configured");
    return {};
  }

  switch (intent.intent) {
    case "BOOK_APPOINTMENT":
      return await bookAppointment(intent);
    case "ASK_AVAILABILITY":
      return await checkAvailability(intent);
    default:
      return {};
  }
}

async function checkAvailability(
  intent: IntentResult
): Promise<{ slots?: SquareSlot[] }> {
  // Placeholder - In production, call Square Bookings API
  // GET /v2/bookings/availability/search
  const { squareAccessToken, squareLocationId } = APP_CONFIG;

  console.log(`[Square] Checking availability for ${intent.service_name} on ${intent.preferred_date}`);

  // Mock response - replace with actual Square API call
  const mockSlots: SquareSlot[] = [
    { time: "10:00 AM", bookable: true },
    { time: "11:00 AM", bookable: true },
    { time: "2:00 PM", bookable: true },
    { time: "3:00 PM", bookable: false },
    { time: "4:00 PM", bookable: true },
  ];

  return { slots: mockSlots };
}

async function bookAppointment(
  intent: IntentResult
): Promise<{ booking_confirmation?: { booking_id: string; time: string; service_name: string } }> {
  // Placeholder - In production, call Square Bookings API
  // POST /v2/bookings
  const { squareAccessToken, squareLocationId } = APP_CONFIG;

  console.log(`[Square] Booking appointment for ${intent.service_name} at ${intent.preferred_time_range}`);

  // Mock response - replace with actual Square API call
  const mockBookingId = `BK-${Date.now()}`;
  
  return {
    booking_confirmation: {
      booking_id: mockBookingId,
      time: intent.preferred_time_range || "2:00 PM",
      service_name: intent.service_name || "Thai Massage",
    },
  };
}
