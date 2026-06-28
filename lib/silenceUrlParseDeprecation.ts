/**
 * Silence the Node DEP0169 (`url.parse()`) deprecation warning as an import
 * side effect. The legacy call comes from `follow-redirects` (latest 1.15.x
 * still uses it at index.js:572), pulled in transitively via axios -> nocodb-sdk,
 * and fires when a server component (e.g. the /join-us CMS fetch) follows a
 * redirect. It is not reachable from our own code and has no upstream fix, so we
 * filter it at the source.
 *
 * We monkeypatch `process.emitWarning` rather than passing --no-deprecation so
 * that *only* this one warning is dropped and every other deprecation still
 * surfaces. This module lives apart from instrumentation.ts and is loaded via a
 * dynamic import guarded to the Node.js runtime, keeping the Node-only
 * `process.emitWarning` reference out of the Edge bundle.
 */

export {};

const PATCHED = Symbol.for("aj4d.silenceUrlParseDeprecation");

type PatchFlag = { [PATCHED]?: true };

if (!(process as PatchFlag)[PATCHED]) {
  (process as PatchFlag)[PATCHED] = true;

  const originalEmitWarning = process.emitWarning.bind(process);
  process.emitWarning = ((
    warning: string | Error,
    ...args: unknown[]
  ): void => {
    const opts = args.find((a) => a && typeof a === "object") as
      | { code?: string }
      | undefined;
    const code =
      opts?.code ??
      args.find((a) => typeof a === "string" && a.startsWith("DEP"));
    const text = typeof warning === "string" ? warning : warning.message;
    if (code === "DEP0169" || text.includes("url.parse()")) return;
    return originalEmitWarning(warning as string, ...(args as []));
  }) as typeof process.emitWarning;
}
