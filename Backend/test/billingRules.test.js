import crypto from "crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { verifyRazorpaySignature } from "../src/utils/razorpaySignatures.js";

test("verifies authentic Razorpay HMAC signatures and rejects invalid input", () => {
  const secret = "test-webhook-secret";
  const message = "order_123|payment_456";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  assert.equal(verifyRazorpaySignature(secret, message, signature), true);
  assert.equal(verifyRazorpaySignature(secret, `${message}!`, signature), false);
  assert.equal(verifyRazorpaySignature(secret, message, "bad"), false);
  assert.equal(verifyRazorpaySignature("", message, signature), false);
});
