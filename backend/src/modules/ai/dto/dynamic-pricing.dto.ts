export interface DynamicPricingResponse {
  eventId: string;
  baseMultiplier: number;
  surgeMultiplier: number;
  capacityRatio: number;
  velocityLast5Min: number;
  hoursUntilEvent: number;
  demandLevel: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' | 'SURGE';
  headline: string;
  description: string;
  demandNotice?: string;
}
