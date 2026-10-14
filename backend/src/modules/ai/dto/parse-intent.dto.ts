import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ParseIntentDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  eventId?: string;
}

export type IntentType = 'INQUIRY' | 'BOOKING_COMMIT';
export type ResponseType = 'EVENT_LIST' | 'SEAT_OPTIONS';

export interface EventSummaryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  city: string;
  minPrice: number;
  coverImage: string;
  description: string;
}

export interface BookingOption {
  id: string;
  label: string;
  tier: 'VIP' | 'STANDARD' | 'BUDGET';
  rationale: string;
  seats: RecommendedSeatOutput[];
  seatIds: string[];
  totalPrice: number;
  averagePrice: number;
  eventId?: string;
}

export interface ExtractedBookingIntent {
  queryLevel: ResponseType;
  category: string | null;
  eventName: string | null;
  city: string | null;
  maxPrice: number | null;
  quantity: number;
  intentType: IntentType;
  preferences: {
    viewDirection: 'CENTER' | 'SIDE' | 'BALCONY' | 'ANY';
    nearAisle: boolean;
  };
}

export interface RecommendedSeatOutput {
  id: string;
  sectionName: string;
  row: string;
  seatNumber: string;
  price: number;
  status: string;
  x?: number;
  y?: number;
}

export interface AiBookingResponse {
  type: ResponseType;
  intent: ExtractedBookingIntent;
  options?: BookingOption[];
  recommendedSeatIds?: string[];
  recommendedSeats?: RecommendedSeatOutput[];
  events?: EventSummaryItem[];
  rationale: string;
  dynamicMultiplier?: number;
  targetEventId?: string;
}
