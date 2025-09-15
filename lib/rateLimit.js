// Simple in-memory fixed-window rate limiter.
// Suitable for local/dev or single-instance deployments.

const buckets = new Map();

export function requestKey(request, scope = 'global') {
  const headers = request.headers || new Headers();
  const xff = headers.get('x-forwarded-for') || '';
  const ip = (xff.split(',')[0] || '').trim()
    || headers.get('cf-connecting-ip')
    || headers.get('x-real-ip')
    || 'unknown';
  const ua = headers.get('user-agent') || '';
  return `${scope}:${ip}:${ua.slice(0, 40)}`;
}

export function rateLimit(key, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterMs: allowed ? 0 : bucket.resetAt - now,
  };
}

