import "server-only";

import { createHash } from "node:crypto";

type RateLimitStore = Map<string, number[]>;

const MAX_RATE_LIMIT_KEYS = 10_000;

const globalForRateLimit = globalThis as unknown as {
  gianRateLimits?: RateLimitStore;
};

const store: RateLimitStore = (globalForRateLimit.gianRateLimits ??= new Map<
  string,
  number[]
>());

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function setTimestamps(key: string, timestamps: number[]): void {
  if (!store.has(key) && store.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  store.set(key, timestamps);
}

function recentTimestamps(key: string, windowMs: number, now: number) {
  const timestamps = store.get(key);
  if (!timestamps) return [];

  const cutoff = now - windowMs;
  const recent = timestamps.filter((timestamp) => timestamp > cutoff);

  if (recent.length === 0) {
    store.delete(key);
  } else if (recent.length !== timestamps.length) {
    store.set(key, recent);
  }

  return recent;
}

export function anonymizedRateLimitKey(
  namespace: string,
  value: string,
): string {
  const digest = createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
  return `${namespace}:${digest}`;
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const recent = recentTimestamps(key, windowMs, now);

  if (recent.length >= limit) {
    const retryAt = (recent[0] ?? now) + windowMs;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1_000)),
    };
  }

  recent.push(now);
  setTimestamps(key, recent);

  return { allowed: true, retryAfterSeconds: 0 };
}

export function inspectRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const recent = recentTimestamps(key, windowMs, now);
  if (recent.length < limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAt = (recent[0] ?? now) + windowMs;
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1_000)),
  };
}

export function clearRateLimit(key: string): void {
  store.delete(key);
}

function normalizedIpHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function requesterIp(headers: Headers): string | null {
  const cloudflare = normalizedIpHeader(headers.get("cf-connecting-ip"));
  const realIp = normalizedIpHeader(headers.get("x-real-ip"));
  // The rightmost X-Forwarded-For entry is the connection closest to the app.
  // This avoids trusting attacker-controlled values prepended to the chain.
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .at(-1);
  const candidate = cloudflare ?? realIp ?? forwarded;

  if (!candidate || candidate.length > 128) return null;
  return candidate;
}
