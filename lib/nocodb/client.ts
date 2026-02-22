import { Api } from "nocodb-sdk";
import { config } from "@/lib/config";

/**
 * Factory for creating and caching a singleton NocoDB SDK Api instance.
 * Configured via config.nocodb (env: nocodb__base_url, nocodb__api_token).
 */
export class NocoDBClientFactory {
  private static instance: Api<unknown> | null = null;

  static getClient(): Api<unknown> {
    if (!this.instance) {
      const { baseUrl, apiToken } = config.nocodb;
      // #region agent log
      const payload = { location: "lib/nocodb/client.ts:getClient", message: "NocoDB client init", data: { baseUrlHadProtocol: baseUrl.startsWith("http") }, timestamp: Date.now(), hypothesisId: "D" };
      fetch("http://127.0.0.1:7243/ingest/870d7da7-617e-49a8-920c-3352a422e2b1", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
      try { console.log(JSON.stringify(payload)); } catch (_) {}
      // #endregion
      this.instance = new Api({
        baseURL: `https://${baseUrl}`,
        headers: {
          "xc-token": apiToken,
        },
      });
    }
    return this.instance;
  }
}
