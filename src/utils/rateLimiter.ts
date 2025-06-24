interface RateLimitInfo {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil: number;
}

export class RateLimiter {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_MINUTES = 5; // 5 minutes lockout

  static getRateLimitInfo(email: string): RateLimitInfo {
    const stored = localStorage.getItem(`rateLimit_${email}`);
    return stored ? JSON.parse(stored) : { attempts: 0, lastAttemptTime: 0, lockedUntil: 0 };
  }

  static isRateLimited(email: string): { limited: boolean; waitTime: number } {
    const info = this.getRateLimitInfo(email);
    const now = Date.now();

    if (now < info.lockedUntil) {
      return { limited: true, waitTime: Math.ceil((info.lockedUntil - now) / 1000 / 60) };
    }

    return { limited: false, waitTime: 0 };
  }

  static recordFailedAttempt(email: string): number {
    const info = this.getRateLimitInfo(email);
    const now = Date.now();
    
    // Reset attempts if last attempt was more than 24 hours ago
    if (now - info.lastAttemptTime > 24 * 60 * 60 * 1000) {
      info.attempts = 0;
    }

    info.attempts += 1;
    info.lastAttemptTime = now;

    if (info.attempts >= this.MAX_ATTEMPTS) {
      // Fixed 5-minute lockout
      info.lockedUntil = now + (this.LOCKOUT_MINUTES * 60 * 1000);
    }

    localStorage.setItem(`rateLimit_${email}`, JSON.stringify(info));
    return info.attempts;
  }

  static resetAttempts(email: string): void {
    localStorage.removeItem(`rateLimit_${email}`);
  }
} 