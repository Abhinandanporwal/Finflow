import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"], // Track usage based on Clerk user ID
  rules: [
    tokenBucket({
      mode: "LIVE",      // Live enforcement mode
      refillRate: 50,    // Tokens added per interval
      interval: 3600,    // Interval in seconds (1 hour)
      capacity: 50,      // Maximum tokens available
    }),
  ],
});

export default aj;
