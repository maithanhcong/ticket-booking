-- =============================================================================
-- RAW SQL MIGRATION: Enable pgvector & Setup Semantic Search Index
-- =============================================================================
-- 1. Enable the vector extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verify / Ensure the embedding column exists on "Event" table
-- Note: Prisma will generate "Event" with `embedding vector(1536)` based on
-- `embedding Unsupported("vector(1536)")?` in schema.prisma.
-- If running manually or altering an existing table:
-- ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- 3. Create HNSW (Hierarchical Navigable Small World) index for ultra-fast
-- approximate nearest neighbor (ANN) cosine distance search.
-- HNSW offers superior recall and queries-per-second compared to IVFFlat.
CREATE INDEX IF NOT EXISTS "event_embedding_hnsw_idx"
ON "Event"
USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- QUERY HINT / REFERENCE FOR NESTJS SEMANTIC SEARCH:
-- =============================================================================
-- To query events ordered by cosine similarity in NestJS using Prisma.$queryRaw:
--
-- const queryEmbedding: number[] = await openAiService.generateEmbedding(searchPrompt);
-- const vectorString = `[${queryEmbedding.join(',')}]`;
--
-- const events = await prisma.$queryRaw`
--   SELECT 
--     id,
--     title,
--     slug,
--     description,
--     "startTime",
--     "bannerUrl",
--     1 - ("embedding" <=> ${vectorString}::vector) AS similarity
--   FROM "Event"
--   WHERE "isPublished" = true
--     AND "embedding" IS NOT NULL
--   ORDER BY "embedding" <=> ${vectorString}::vector ASC
--   LIMIT 10;
-- `;
-- =============================================================================
