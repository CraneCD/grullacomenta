import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional environment variables
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'critical']).optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).optional(),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  
  // GitHub
  GITHUB_ID: z.string(),
  GITHUB_SECRET: z.string(),
  
  // Google
  GOOGLE_ID: z.string(),
  GOOGLE_SECRET: z.string(),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, env } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      console.error(`Missing or invalid environment variables: ${missingVars}`);
    } else {
      console.error('Error validating environment variables:', error);
    }
    return { success: false, error } as const;
  }
}

// Get validated environment variables
export function getEnv(): Env {
  const result = validateEnv();
  if (!result.success) {
    throw new Error('Environment validation failed');
  }
  return result.env;
}

// Export validated environment variables
export const env = getEnv(); 