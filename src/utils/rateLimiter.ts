import redis from "../init/redis";

export interface RateLimiterOptions {
  time: number;
  maxPoints: number;
  keyPrefix?: string;
}

export interface RateLimit {
  timestamp: number;
  points: number;
}

export class RateLimiter {
  private readonly time: number;
  private readonly maxPoints: number;
  private readonly keyPrefix: string;

  constructor(options: RateLimiterOptions) {
    this.time = options.time;
    this.maxPoints = options.maxPoints;
    this.keyPrefix = options.keyPrefix || "ratelimit";
  }

  private getRedisKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async check(key: string): Promise<boolean> {
    const redisKey = this.getRedisKey(key);
    const now = Date.now();

    try {
      // Get current rate limit data from Redis
      const data = await redis.get(redisKey);
      let userCooldown: RateLimit | null = null;

      if (data) {
        try {
          userCooldown = JSON.parse(data) as RateLimit;
        } catch {
          // If parse fails, treat as no cooldown
          userCooldown = null;
        }
      }

      if (!userCooldown) {
        // First request - set initial rate limit
        const newRateLimit: RateLimit = {
          timestamp: now,
          points: 1,
        };
        await redis.setex(redisKey, Math.ceil(this.time / 1000), JSON.stringify(newRateLimit));
        return true;
      }

      const timePassed = now - userCooldown.timestamp;

      if (userCooldown.points >= this.maxPoints && timePassed < this.time) {
        // Rate limit exceeded
        return false;
      } else if (timePassed > this.time) {
        // Time window has passed, reset
        const newRateLimit: RateLimit = {
          timestamp: now,
          points: 1,
        };
        await redis.setex(redisKey, Math.ceil(this.time / 1000), JSON.stringify(newRateLimit));
        return true;
      } else {
        // Increment points
        const updatedRateLimit: RateLimit = {
          timestamp: userCooldown.timestamp,
          points: userCooldown.points + 1,
        };
        const ttl = Math.ceil((this.time - timePassed) / 1000);
        await redis.setex(redisKey, ttl > 0 ? ttl : 1, JSON.stringify(updatedRateLimit));
        return true;
      }
    } catch (error) {
      console.error("Rate limiter error:", error);
      // On Redis error, allow the request (fail open)
      return true;
    }
  }

  async getRemainingPoints(key: string): Promise<number> {
    const redisKey = this.getRedisKey(key);

    try {
      const data = await redis.get(redisKey);
      if (!data) {
        return this.maxPoints;
      }

      const userCooldown = JSON.parse(data) as RateLimit;
      const now = Date.now();
      const timePassed = now - userCooldown.timestamp;

      if (timePassed > this.time) {
        return this.maxPoints;
      }

      return Math.max(0, this.maxPoints - userCooldown.points);
    } catch (error) {
      console.error("Rate limiter getRemainingPoints error:", error);
      return this.maxPoints;
    }
  }

  async getTimeUntilReset(key: string): Promise<number> {
    const redisKey = this.getRedisKey(key);

    try {
      const data = await redis.get(redisKey);
      if (!data) {
        return 0;
      }

      const userCooldown = JSON.parse(data) as RateLimit;
      const now = Date.now();
      const timePassed = now - userCooldown.timestamp;
      const remaining = this.time - timePassed;

      return remaining > 0 ? remaining : 0;
    } catch (error) {
      console.error("Rate limiter getTimeUntilReset error:", error);
      return 0;
    }
  }

  async reset(key: string): Promise<void> {
    const redisKey = this.getRedisKey(key);
    try {
      await redis.del(redisKey);
    } catch (error) {
      console.error("Rate limiter reset error:", error);
    }
  }

  async consume(key: string, points: number = 1): Promise<boolean> {
    const redisKey = this.getRedisKey(key);
    const now = Date.now();

    try {
      const data = await redis.get(redisKey);
      let userCooldown: RateLimit | null = null;

      if (data) {
        try {
          userCooldown = JSON.parse(data) as RateLimit;
        } catch {
          userCooldown = null;
        }
      }

      if (!userCooldown) {
        const newRateLimit: RateLimit = {
          timestamp: now,
          points: points,
        };
        await redis.setex(redisKey, Math.ceil(this.time / 1000), JSON.stringify(newRateLimit));
        return true;
      }

      const timePassed = now - userCooldown.timestamp;

      if (userCooldown.points + points > this.maxPoints && timePassed < this.time) {
        return false;
      } else if (timePassed > this.time) {
        const newRateLimit: RateLimit = {
          timestamp: now,
          points: points,
        };
        await redis.setex(redisKey, Math.ceil(this.time / 1000), JSON.stringify(newRateLimit));
        return true;
      } else {
        const updatedRateLimit: RateLimit = {
          timestamp: userCooldown.timestamp,
          points: userCooldown.points + points,
        };
        const ttl = Math.ceil((this.time - timePassed) / 1000);
        await redis.setex(redisKey, ttl > 0 ? ttl : 1, JSON.stringify(updatedRateLimit));
        return true;
      }
    } catch (error) {
      console.error("Rate limiter consume error:", error);
      return true;
    }
  }
}
