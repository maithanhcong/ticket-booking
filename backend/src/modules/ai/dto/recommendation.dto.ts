import { IsOptional, IsString, IsArray } from 'class-validator';

export class RecommendationQueryDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  favoriteIds?: string[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  bannerUrl: string;
  minPrice: number;
  startTime: string;
  venueName: string;
  city: string;
  similarityScore: number;
  matchPercentage: number;
  aiBadge: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  profileSource: 'user_history' | 'wishlist' | 'category_affinity' | 'trending_general';
  confidenceScore: number;
}
