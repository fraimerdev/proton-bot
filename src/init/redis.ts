import Redis from "ioredis";
import Logger from "../utils/logger";

const redis = new Redis({
  showFriendlyErrorStack: true,
});

redis.on("connect", () => {
  Logger.success("Redis connected successfully");
});

redis.on("error", (err) => {
  Logger.error("Redis connection error:", err);
});

redis.on("close", () => {
  Logger.info("Redis connection closed");
});

export default redis;
