import { config } from "./config";

/**
 * Minimal structured logger. Emits one JSON object per line to stdout so that a
 * log scraper (Grafana Alloy / Promtail / the Loki Docker driver) can parse each
 * line and promote fields like `service` and `level` to Loki labels.
 *
 * Intentionally dependency-free and runtime-agnostic: the core write goes through
 * `console.log(JSON.stringify(record))`, which works in both the Node.js and edge
 * runtimes (so it is safe to use from middleware and instrumentation hooks).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Context value type accepted by log methods. */
export type LogContext = Record<string, unknown>;

/**
 * Keys whose values are scrubbed from log context to avoid leaking PII/secrets
 * into Loki. Matching is case-insensitive and substring-based so that e.g.
 * `toEmail`, `apiKey`, `auth_token` are all caught.
 */
const REDACT_KEYS = [
  "email",
  "phone",
  "token",
  "apikey",
  "authtoken",
  "accountsid",
  "password",
  "secret",
];

const REDACTED = "[redacted]";

function shouldRedact(key: string): boolean {
  const k = key.toLowerCase().replace(/_/g, "");
  return REDACT_KEYS.some((needle) => k.includes(needle));
}

function serializeError(err: Error): LogContext {
  return { name: err.name, message: err.message, stack: err.stack };
}

/**
 * Returns a JSON-safe copy of `value` with sensitive keys redacted and Errors
 * expanded into `{ name, message, stack }`. Recurses one level into plain
 * objects/arrays to keep cost bounded; deeper structures are kept as-is.
 */
function sanitize(value: unknown, depth = 0): unknown {
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) {
    return depth >= 2 ? value : value.map((v) => sanitize(v, depth + 1));
  }
  if (value && typeof value === "object") {
    if (depth >= 2) return value;
    const out: LogContext = {};
    for (const [k, v] of Object.entries(value as LogContext)) {
      out[k] = shouldRedact(k) ? REDACTED : sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

function sanitizeContext(context: LogContext): LogContext {
  const out: LogContext = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = shouldRedact(k) ? REDACTED : sanitize(v, 1);
  }
  return out;
}

class Logger {
  constructor(private readonly bindings: LogContext = {}) {}

  /** Returns a child logger that merges `bindings` into every record. */
  child(bindings: LogContext): Logger {
    return new Logger({ ...this.bindings, ...bindings });
  }

  debug(msg: string, context?: LogContext): void {
    this.log("debug", msg, context);
  }

  info(msg: string, context?: LogContext): void {
    this.log("info", msg, context);
  }

  warn(msg: string, context?: LogContext): void {
    this.log("warn", msg, context);
  }

  error(msg: string, context?: LogContext): void {
    this.log("error", msg, context);
  }

  private log(level: LogLevel, msg: string, context?: LogContext): void {
    const { logLevel, serviceName, nodeEnv } = config.app;
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[logLevel]) return;

    const record: LogContext = {
      level,
      time: new Date().toISOString(),
      service: serviceName,
      env: nodeEnv,
      msg,
      ...sanitizeContext({ ...this.bindings, ...context }),
    };

    // Single newline-delimited JSON line; console.log works in Node + edge.
    console.log(JSON.stringify(record));
  }
}

export const logger = new Logger();
