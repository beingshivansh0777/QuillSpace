import Redis from "ioredis";
import logger from "./logger.js";

// Defaults to localhost for plain "npm run server" local dev. Inside Docker
// Compose, the "server" service gets REDIS_URL=redis://redis:6379 injected
// via docker-compose.yml (container hostname "redis", not localhost).
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => {
  // Logged once per error event, but never thrown — every cache* helper
  // below independently swallows failures too, so a Redis outage degrades
  // the app to "no caching" instead of crashing requests.
  logger.error({ err: err.message }, "Redis connection error — falling back to DB-only mode");
});

// ---- Safe wrappers — always use these, never the raw client, in controllers ----

export const cacheGet = async (key) => {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null; // cache miss on any failure — caller just hits the DB as normal
  }
};

export const cacheSet = async (key, value, ttlSeconds) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    // silent — caching is a performance optimization, never a hard dependency
  }
};

export const cacheDel = async (...keys) => {
  try {
    const flat = keys.flat().filter(Boolean);
    if (flat.length) await redis.del(flat);
  } catch (error) {
    // silent
  }
};

// Deletes every key matching a pattern, e.g. "blogs:all:page:*" — needed
// because paginated caches use one key per page, and a write doesn't know
// in advance which pages happen to be cached right now.
//
// Uses KEYS rather than SCAN for simplicity — fine at this app's scale
// (thousands of keys, not millions). If this ever becomes a bottleneck on
// a much larger keyspace, swap to a cursor-based SCAN loop instead.
export const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch (error) {
    // silent
  }
};

export default redis;