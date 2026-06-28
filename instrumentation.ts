import type { Instrumentation } from "next";

/**
 * Next.js instrumentation hook. We don't wire up OpenTelemetry tracing here
 * (logs are shipped to Loki via structured stdout — see lib/logger.ts); this
 * file exists to capture server-side request errors as structured log lines so
 * they end up in Loki instead of Next's default unstructured stderr output.
 */
export async function register() {
  // Filter the transitive DEP0169 (`url.parse()`) deprecation warning. The
  // patch touches Node-only `process.emitWarning`, so it lives in its own module
  // loaded via a dynamic import guarded to the Node.js runtime — this keeps the
  // Node API out of the Edge bundle (the same lazy-import approach used by
  // onRequestError below). See lib/silenceUrlParseDeprecation.ts for details.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./lib/silenceUrlParseDeprecation");
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
