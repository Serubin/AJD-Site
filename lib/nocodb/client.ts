import { Api } from "nocodb-sdk";

/**
 * Factory for creating and caching a singleton NocoDB SDK Api instance.
 * Configured from environment variables:
 *   - NOCODB_BASE_URL: hostname of the NocoDB instance (without protocol)
 *   - NOCODB_API_TOKEN: API token for authentication
 */
export class NocoDBClientFactory {
  private static instance: Api<unknown> | null = null;

  static getClient(): Api<unknown> {
    if (!this.instance) {
      const baseURL = process.env.NOCODB_BASE_URL;
      const token = process.env.NOCODB_API_TOKEN;

      if (!baseURL || !token) {
        throw new Error(
          "Missing NocoDB configuration: NOCODB_BASE_URL and NOCODB_API_TOKEN must be set"
        );
      }

      this.instance = new Api({
        baseURL: `https://${baseURL}`,
        headers: {
          "xc-token": token,
        },
      });
    }
    return this.instance;
  }
}
