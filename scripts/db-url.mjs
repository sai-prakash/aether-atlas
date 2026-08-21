// @ts-check
/**
 * Resolve a Postgres URL from the names Vercel + Neon actually inject.
 * Empty/whitespace counts as unset.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string | undefined}
 */
export function resolveDatabaseUrl(env = process.env) {
  const keys = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
  ];
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/** @param {NodeJS.ProcessEnv} [env] */
export function hostedOnVercel(env = process.env) {
  return Boolean(env.VERCEL);
}
