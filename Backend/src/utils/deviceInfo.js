// utils/deviceInfo.js

import {UAParser} from "ua-parser-js";

export const getDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";

  const parser = new UAParser(userAgent);

  const result = parser.getResult();

  const browser = result.browser.name
    ? `${result.browser.name} ${result.browser.version || ""}`.trim()
    : "Unknown Browser";

  const os = result.os.name
    ? `${result.os.name} ${result.os.version || ""}`.trim()
    : "Unknown OS";

  let device = "Desktop";

  if (result.device.type === "mobile") {
    device = "Mobile";
  } else if (result.device.type === "tablet") {
    device = "Tablet";
  }

  return {
    browser,
    os,
    device,
  };
};


// utils/clientIp.js

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown"
  );
};