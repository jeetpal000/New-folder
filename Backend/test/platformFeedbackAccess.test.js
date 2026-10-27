import test from "node:test";
import assert from "node:assert/strict";
import { requirePlatformFeedbackAdmin } from "../src/middleware/requirePlatformFeedbackAdmin.js";

const originalAdminEmail = process.env.PLATFORM_ADMIN_EMAIL;

const runMiddleware = (email) => {
  const response = {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  requirePlatformFeedbackAdmin(
    { user: { email } },
    response,
    () => {
      nextCalled = true;
    },
  );
  return { response, nextCalled };
};

test("website feedback inbox fails closed when platform admin is not configured", () => {
  delete process.env.PLATFORM_ADMIN_EMAIL;
  try {
    const { response, nextCalled } = runMiddleware("jeetpal.infotech@gmail.com");
    assert.equal(response.statusCode, 503);
    assert.equal(nextCalled, false);
  } finally {
    if (originalAdminEmail === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAIL;
    } else {
      process.env.PLATFORM_ADMIN_EMAIL = originalAdminEmail;
    }
  }
});

test("website feedback inbox is limited to the configured platform owner email", () => {
  process.env.PLATFORM_ADMIN_EMAIL = "jeetpal.infotech@gmail.com";
  try {
    const denied = runMiddleware("school.admin@example.com");
    assert.equal(denied.response.statusCode, 403);
    assert.equal(denied.nextCalled, false);

    const allowed = runMiddleware("JEETPAL.INFOTECH@GMAIL.COM");
    assert.equal(allowed.response.statusCode, 200);
    assert.equal(allowed.nextCalled, true);
  } finally {
    if (originalAdminEmail === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAIL;
    } else {
      process.env.PLATFORM_ADMIN_EMAIL = originalAdminEmail;
    }
  }
});
