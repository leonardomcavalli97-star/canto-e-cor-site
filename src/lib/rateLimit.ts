import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpeza esporádica pra não vazar memória com IPs antigos.
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * Limitador por IP simples, em memória. Não é distribuído entre instâncias
 * serverless (reseta em cold start), mas barra scripts abusivos na maioria
 * dos casos reais para um site de baixo tráfego.
 */
export function rateLimit(req: NextRequest, key: string, limit: number, windowMs: number) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { limited: false as const };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { limited: true as const, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { limited: false as const };
}
