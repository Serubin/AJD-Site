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
