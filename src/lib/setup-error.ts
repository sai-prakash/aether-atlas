/** Thrown when production has no Postgres URL. Safe to import from UI. */
export class SetupRequiredError extends Error {
  constructor(message = "DATABASE_URL is not set. Connect Neon Free in Vercel Storage, then redeploy.") {
    super(message);
    this.name = "SetupRequiredError";
  }
}

export function isSetupRequiredError(err: unknown): boolean {
  if (err instanceof SetupRequiredError) return true;
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  const message = "message" in err ? String(err.message) : "";
  return (
    name === "SetupRequiredError" ||
    message.includes("DATABASE_URL is not set") ||
    message.includes("pglite.data")
  );
}
