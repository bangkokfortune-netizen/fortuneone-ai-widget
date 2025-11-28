import pLimit from 'p-limit';

// Create a rate limiter that allows max 2 concurrent OpenAI API calls
const openaiLimiter = pLimit(2);

// Retry delays in milliseconds (exponential backoff)
const RETRY_DELAYS = [100, 250, 500, 1000];

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a function with rate limiting and exponential retry logic
 * @param fn - The async function to execute
 * @param retryCount - Current retry attempt (internal use)
 * @returns The result of the function
 */
export async function withRateLimitAndRetry<T>(
  fn: () => Promise<T>,
  retryCount: number = 0
): Promise<T> {
  return openaiLimiter(async () => {
    try {
      console.log(`[RateLimiter] OpenAI call queued (concurrent: ${openaiLimiter.activeCount + 1}/${openaiLimiter.concurrency})`);
      const result = await fn();
      console.log('[RateLimiter] OpenAI call completed successfully');
      return result;
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.response?.status === 429 || 
                    error?.message?.includes('429') || error?.message?.includes('rate limit');
      
      if (is429 && retryCount < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(`[RateLimiter] Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_DELAYS.length})`);
        await sleep(delay);
        return withRateLimitAndRetry(fn, retryCount + 1);
      }
      
      console.error('[RateLimiter] OpenAI call failed after all retries:', error?.message || error);
      throw error;
    }
  });
}

export { openaiLimiter };
