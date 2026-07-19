export type SmokeTargetEnvironment = Readonly<Record<string, string | undefined>>;

export interface ProductionSmokeTarget {
  readonly baseURL: string;
  readonly extraHTTPHeaders: Readonly<Record<string, string>>;
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function resolveProductionSmokeTarget(
  environment: SmokeTargetEnvironment,
): ProductionSmokeTarget {
  const rawTarget = environment.ENCORE_SMOKE_BASE_URL?.trim();
  if (!rawTarget) {
    throw new Error(
      "ENCORE_SMOKE_BASE_URL is required. Pass the deployed production URL explicitly.",
    );
  }

  let target: URL;
  try {
    target = new URL(rawTarget);
  } catch {
    throw new Error("ENCORE_SMOKE_BASE_URL must be an absolute URL.");
  }

  if (target.protocol !== "https:") {
    throw new Error("ENCORE_SMOKE_BASE_URL must use HTTPS.");
  }
  if (LOCAL_HOSTNAMES.has(target.hostname)) {
    throw new Error("ENCORE_SMOKE_BASE_URL must target a deployed host, not localhost.");
  }
  if (
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  ) {
    throw new Error("ENCORE_SMOKE_BASE_URL must contain only the production origin.");
  }

  const bypassSecret = environment.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  return {
    baseURL: target.origin,
    extraHTTPHeaders: bypassSecret
      ? {
          "x-vercel-protection-bypass": bypassSecret,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
  };
}
