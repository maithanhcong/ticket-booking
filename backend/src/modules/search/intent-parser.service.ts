import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ExtractedIntent } from './dto/search-query.dto';

@Injectable()
export class IntentParserService {
  private readonly logger = new Logger(IntentParserService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;

  private readonly knownGenres = [
    'rock', 'pop', 'jazz', 'classical', 'symphony', 'orchestral',
    'edm', 'electronic', 'hiphop', 'rap', 'metal', 'indie',
    'acoustic', 'esports', 'r&b', 'ambient', 'techno'
  ];

  private readonly knownCities = [
    'hanoi', 'ha noi', 'ho chi minh', 'saigon', 'da nang', 'hai phong',
    'seattle', 'los angeles', 'san francisco', 'new york', 'london',
    'tokyo', 'singapore', 'berlin', 'paris', 'sydney'
  ];

  /**
   * Parse natural language query string into structured SQL filters and semantic vector
   */
  async parseIntent(query: string): Promise<ExtractedIntent> {
    if (!query || query.trim().length === 0) {
      return {
        rawQuery: '',
        cleanedText: '',
        embedding: this.generateDeterministicMockEmbedding('general live events'),
      };
    }

    const lower = query.toLowerCase().trim();
    let cleaned = lower;

    let city: string | undefined;
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    let genre: string | undefined;
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // 1. Extract Location
    for (const c of this.knownCities) {
      // Check word boundary
      const regex = new RegExp(`\\b(in|at|o|tai)?\\s*${c}\\b`, 'i');
      if (regex.test(cleaned)) {
        city = c.replace(/\b(in|at|o|tai)\s*/i, '').trim();
        // Normalize common aliases
        if (city === 'ha noi') city = 'Hanoi';
        else if (city === 'saigon' || city === 'ho chi minh') city = 'Ho Chi Minh';
        else {
          city = city.charAt(0).toUpperCase() + city.slice(1);
        }
        cleaned = cleaned.replace(regex, ' ').trim();
        break;
      }
    }

    // 2. Extract Budget / Price
    // Example: "under 500k", "duoi 500k", "< 500.000", "below $100", "under 500k vnd"
    const rangeRegex = /(?:between|from|tu)\s+(\d+(?:[.,]\d+)?)\s*(k|vnd|đ|\$)?\s*(?:and|to|den|-)\s*(\d+(?:[.,]\d+)?)\s*(k|vnd|đ|\$)?/i;
    const rangeMatch = cleaned.match(rangeRegex);
    if (rangeMatch) {
      minPrice = this.normalizePrice(rangeMatch[1], rangeMatch[2]);
      maxPrice = this.normalizePrice(rangeMatch[3], rangeMatch[4]);
      cleaned = cleaned.replace(rangeRegex, ' ').trim();
    } else {
      const underRegex = /(?:under|below|less than|duoi|nho hon|<)\s*(\$?\d+(?:[.,]\d+)?)\s*(k|vnd|đ|usd|\$)?/i;
      const underMatch = cleaned.match(underRegex);
      if (underMatch) {
        maxPrice = this.normalizePrice(underMatch[1].replace('$', ''), underMatch[2]);
        cleaned = cleaned.replace(underRegex, ' ').trim();
      }

      const overRegex = /(?:over|above|more than|tren|lon hon|>)\s*(\$?\d+(?:[.,]\d+)?)\s*(k|vnd|đ|usd|\$)?/i;
      const overMatch = cleaned.match(overRegex);
      if (overMatch) {
        minPrice = this.normalizePrice(overMatch[1].replace('$', ''), overMatch[2]);
        cleaned = cleaned.replace(overRegex, ' ').trim();
      }
    }

    // 3. Extract Genre / Category
    for (const g of this.knownGenres) {
      const genreRegex = new RegExp(`\\b${g}\\b`, 'i');
      if (genreRegex.test(cleaned)) {
        genre = g;
        // Do not remove genre completely so semantic embedding still captures it
        break;
      }
    }

    // 4. Extract Relative Time Markers
    const now = new Date();
    if (/\b(this weekend|cuoi tuan nay)\b/i.test(cleaned)) {
      const day = now.getDay();
      const daysUntilFriday = (5 - day + 7) % 7;
      startDate = new Date(now.getTime() + daysUntilFriday * 86400000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + 3 * 86400000);
      endDate.setHours(23, 59, 59, 999);
      cleaned = cleaned.replace(/\b(this weekend|cuoi tuan nay)\b/i, ' ').trim();
    } else if (/\b(tomorrow|ngay mai)\b/i.test(cleaned)) {
      startDate = new Date(now.getTime() + 86400000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      cleaned = cleaned.replace(/\b(tomorrow|ngay mai)\b/i, ' ').trim();
    } else if (/\b(today|hom nay)\b/i.test(cleaned)) {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      cleaned = cleaned.replace(/\b(today|hom nay)\b/i, ' ').trim();
    }

    // Clean extra punctuation and double whitespace
    cleaned = cleaned.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // 5. Generate 1536-dim Embedding Vector
    const embedding = await this.getEmbedding(cleaned || query);

    return {
      rawQuery: query,
      cleanedText: cleaned,
      genre,
      city,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      embedding,
    };
  }

  private normalizePrice(valStr: string, unitStr?: string): number {
    let val = parseFloat(valStr.replace(/,/g, ''));
    const unit = (unitStr || '').toLowerCase();

    if (unit === 'k' || val < 1000 && !unit.includes('$')) {
      // In Vietnamese currency context, 500k -> 500,000
      if (unit === 'k' || val <= 1000) {
        val = val * 1000;
      }
    }
    return val;
  }

  /**
   * Generates embedding vector via OpenAI API if key is available,
   * otherwise uses deterministic high-dimensional semantic hashing.
   */
  async getEmbedding(text: string): Promise<number[]> {
    if (this.openaiApiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
            dimensions: 1536,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return data.data[0].embedding;
        } else {
          this.logger.warn(`OpenAI embedding API returned status ${res.status}. Falling back to deterministic unit vector.`);
        }
      } catch (err) {
        this.logger.warn(`Failed to contact OpenAI: ${err.message}. Using deterministic unit vector.`);
      }
    }

    return this.generateDeterministicMockEmbedding(text);
  }

  /**
   * Deterministic 1536-dimensional L2-normalized unit vector generator.
   * Maps word n-grams into cosine hyperspace so that similar tokens yield higher cosine similarity.
   */
  generateDeterministicMockEmbedding(text: string): number[] {
    const DIMENSIONS = 1536;
    const vector = new Float64Array(DIMENSIONS);
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);

    if (tokens.length === 0) tokens.push('event');

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      // Generate multiple hash seeds per token
      for (let seed = 0; seed < 4; seed++) {
        const hash = crypto.createHash('sha256').update(`${token}:${seed}`).digest();
        for (let i = 0; i < 16; i++) {
          const index = hash.readUInt16BE(i * 2) % DIMENSIONS;
          const val = (hash[i] / 255.0) - 0.5;
          vector[index] += val * (1 / (t + 1));
        }
      }
    }

    // L2 Normalization so Euclidean norm ||v|| = 1.0 (vital for cosine distance <=>)
    let norm = 0;
    for (let i = 0; i < DIMENSIONS; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    const result = new Array<number>(DIMENSIONS);
    if (norm === 0) {
      result.fill(1 / Math.sqrt(DIMENSIONS));
      return result;
    }

    for (let i = 0; i < DIMENSIONS; i++) {
      result[i] = Number((vector[i] / norm).toFixed(6));
    }

    return result;
  }
}
