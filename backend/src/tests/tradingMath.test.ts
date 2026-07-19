import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBuyQuote,
  calculateReferenceBuyQuote,
  calculateReferenceSellQuote,
  calculateSellQuote,
  getSpotPrice,
  isReferenceQuoteFresh,
  parseMoney,
  parseShares,
} from "../lib/tradingMath.js";

test("accepts cent precision and rejects invalid money", () => {
  assert.equal(parseMoney("0.01"), 0.01);
  assert.equal(parseMoney("10.25"), 10.25);
  assert.equal(parseMoney("10.257"), null);
  assert.equal(parseMoney(10.257), null);
  assert.equal(parseMoney(10.25), 10.25);
  assert.equal(parseMoney("-1"), null);
});

test("rejects numeric share amounts beyond supported precision", () => {
  assert.equal(parseShares(0.12345678), 0.12345678);
  assert.equal(parseShares(0.123456789), null);
  assert.equal(parseShares("0.123456789"), null);
});

test("1000 same-coin buys preserve positive reserves", () => {
  let tokenReserve = 1_000_000_000;
  let baseReserve = 1_000;

  for (let i = 0; i < 1_000; i += 1) {
    const quote = calculateBuyQuote(tokenReserve, baseReserve, 1.00);
    assert.ok(quote.tokensOut > 0);
    tokenReserve = quote.newTokenReserve;
    baseReserve = quote.newBaseReserve;
    assert.ok(tokenReserve > 0);
    assert.ok(baseReserve > 0);
  }

  assert.ok(getSpotPrice(tokenReserve, baseReserve) > 0);
});

test("1000 concurrent same-coin requests can be serialized safely", async () => {
  let tokenReserve = 1_000_000_000;
  let baseReserve = 1_000;
  let queue = Promise.resolve();

  const submitBuy = () => {
    let result = 0;
    const operation = queue.then(() => {
      const quote = calculateBuyQuote(tokenReserve, baseReserve, 1.00);
      assert.ok(quote.tokensOut > 0);
      tokenReserve = quote.newTokenReserve;
      baseReserve = quote.newBaseReserve;
      result = quote.tokensOut;
    });
    queue = operation.then(() => undefined);
    return operation.then(() => result);
  };

  const results = await Promise.all(Array.from({ length: 1_000 }, submitBuy));
  assert.equal(results.length, 1_000);
  assert.ok(results.every((tokens) => tokens > 0));
  assert.ok(tokenReserve > 0);
  assert.ok(baseReserve > 0);
});

test("cent-rounded sells never pay more than the pool has", () => {
  const quote = calculateSellQuote(999_000_000, 1_001, 1_000_000);
  assert.ok(quote.baseOut >= 0);
  assert.ok(quote.baseOut <= 1_001);
  assert.ok(quote.newBaseReserve > 0);
});

test("reference-priced assets use the stored quote without a pool", () => {
  const buy = calculateReferenceBuyQuote(1_000, 200.25);
  assert.equal(buy.sharesOut, 4.9937578);
  assert.equal(buy.executionPrice, 200.25);

  const sell = calculateReferenceSellQuote(buy.sharesOut, buy.executionPrice);
  assert.equal(sell.baseOut, 999.99);
});

test("reference quote freshness rejects missing and stale timestamps", () => {
  const now = Date.parse("2026-07-17T10:00:00.000Z");
  assert.equal(isReferenceQuoteFresh(200, "2026-07-17T09:59:00.000Z", 300_000, now), true);
  assert.equal(isReferenceQuoteFresh(200, "2026-07-17T09:50:00.000Z", 300_000, now), false);
  assert.equal(isReferenceQuoteFresh(200, undefined, 300_000, now), false);
});
