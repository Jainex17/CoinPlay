export const MONEY_SCALE = 100;
export const SHARE_SCALE = 100_000_000;

export function isReferenceQuoteFresh(referencePrice: unknown, updatedAt: unknown, maxAgeMs: number, nowMs = Date.now()): boolean {
  const price = typeof referencePrice === "number" ? referencePrice : Number(referencePrice);
  const timestamp = updatedAt instanceof Date ? updatedAt.getTime() : new Date(String(updatedAt ?? "")).getTime();
  return Number.isFinite(price) && price > 0 && Number.isFinite(timestamp) && nowMs - timestamp >= 0 && nowMs - timestamp <= maxAgeMs;
}

export function parseMoney(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    const scaled = value * MONEY_SCALE;
    if (Math.abs(scaled - Math.round(scaled)) > 1e-9) return null;
    return value > 0 ? Math.round(scaled) / MONEY_SCALE : null;
  }

  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseShares(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    const scaled = value * SHARE_SCALE;
    if (Math.abs(scaled - Math.round(scaled)) > 1e-6) return null;
    return Math.round(scaled) / SHARE_SCALE;
  }
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,8})?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? floorShares(parsed) : null;
}

export function floorMoney(value: number): number {
  return Math.floor((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

export function floorShares(value: number): number {
  return Math.floor((value + Number.EPSILON) * SHARE_SCALE) / SHARE_SCALE;
}

export function calculateBuyQuote(tokenReserve: number, baseReserve: number, baseIn: number) {
  const invariant = tokenReserve * baseReserve;
  const newBaseReserve = baseReserve + baseIn;
  const continuousTokensOut = tokenReserve - invariant / newBaseReserve;
  const tokensOut = Math.floor(continuousTokensOut);

  return {
    tokensOut,
    newTokenReserve: tokenReserve - tokensOut,
    newBaseReserve,
    executionPrice: tokensOut > 0 ? baseIn / tokensOut : 0,
  };
}

export function calculateSellQuote(tokenReserve: number, baseReserve: number, tokensIn: number) {
  const invariant = tokenReserve * baseReserve;
  const newTokenReserve = tokenReserve + tokensIn;
  const continuousBaseOut = baseReserve - invariant / newTokenReserve;
  const baseOut = floorMoney(continuousBaseOut);

  return {
    baseOut,
    newTokenReserve,
    newBaseReserve: baseReserve - baseOut,
    executionPrice: tokensIn > 0 ? baseOut / tokensIn : 0,
  };
}

export function getSpotPrice(tokenReserve: number, baseReserve: number): number {
  return tokenReserve > 0 ? baseReserve / tokenReserve : 0;
}

export function calculateReferenceBuyQuote(baseIn: number, referencePrice: number) {
  const sharesOut = referencePrice > 0 ? floorShares(baseIn / referencePrice) : 0;
  return {
    sharesOut,
    executionPrice: referencePrice,
  };
}

export function calculateReferenceSellQuote(sharesIn: number, referencePrice: number) {
  const baseOut = referencePrice > 0 ? floorMoney(sharesIn * referencePrice) : 0;
  return {
    baseOut,
    executionPrice: referencePrice,
  };
}
