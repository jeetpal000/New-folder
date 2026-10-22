import crypto from "crypto";

export const verifyRazorpaySignature = (secret, message, signature) => {
  if (
    typeof secret !== "string" ||
    !secret ||
    !(typeof message === "string" || Buffer.isBuffer(message)) ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest();
  const provided = Buffer.from(signature, "hex");
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};
