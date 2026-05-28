import { z } from 'zod';

const schema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // NextAuth
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_URL: z.string().url('AUTH_URL must be a valid URL').optional(),
  AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required'),
  AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required'),

  // App config
  OWNER_EMAIL: z.string().email('OWNER_EMAIL must be a valid email address'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  UPLOADS_DIR: z.string().optional(),

  // Web Push (optional — all three required together or all absent)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
});

function parseEnv() {
  // Allow skipping validation in CI build steps where env vars aren't available.
  // Never set this in production — the app will crash at runtime instead of startup.
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return schema.parse({
      DATABASE_URL: 'postgresql://ci/ci',
      AUTH_SECRET: 'ci-placeholder-secret-32-chars-long',
      AUTH_GOOGLE_ID: 'ci',
      AUTH_GOOGLE_SECRET: 'ci',
      OWNER_EMAIL: 'ci@example.com',
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    });
  }

  const result = schema.safeParse(process.env);

  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${lines}\n\nFix your .env file before starting the server.`);
  }

  const env = result.data;

  // VAPID vars must all be present or all absent
  const vapidVars = [env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT];
  const vapidProvided = vapidVars.filter(Boolean).length;
  if (vapidProvided > 0 && vapidProvided < 3) {
    throw new Error(
      'Invalid environment variables:\n  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must all be set or all be absent.',
    );
  }

  return env;
}

export const env = parseEnv();

export const pushEnabled =
  !!env.VAPID_PUBLIC_KEY && !!env.VAPID_PRIVATE_KEY && !!env.VAPID_SUBJECT;
