import type { Instrumentation } from "next";

/**
 * Next.js instrumentation hook. We don't wire up OpenTelemetry tracing here
 * (logs are shipped to Loki via structured stdout — see lib/logger.ts); this
 * file exists to capture server-side request errors as structured log lines so
 * they end up in Loki instead of Next's default unstructured stderr output.
 */
export function register() {
  // No-op. Reserved for future telemetry setup.
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  // Lazy import keeps the logger (and its config import) out of the edge bundle
  // unless an error actually occurs.
  const { logger } = await import("./lib/logger");
  logger.error("unhandled request error", {
    err,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    renderSource: context.renderSource,
  });
};
