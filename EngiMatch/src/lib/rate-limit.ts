// ══════════════════════════════════════════════════════════════════
// In-Memory Rate Limiter
// For production with multiple instances, replace with Redis.
// ══════════════════════════════════════════════════════════════════

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Check rate limit for a given identifier (typically IP address).
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + windowMs };
    store.set(identifier, newRecord);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Fallback — in Node.js environment this won't give real IP but prevents crashes
  return "unknown";
}

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);
