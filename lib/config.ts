import { z } from "zod";

/**
 * Environment variable names follow the pattern: component__variable_name
 * (double underscore between segments, snake_case). See .env.example and
 * the plan for the full mapping from config paths to env keys.
 */

const envSchema = z.object({
  app__base_url: z.string().url().optional(),
  app__node_env: z.enum(["development", "production", "test"]).optional(),
  nocodb__base_url: z.string().optional(),
  nocodb__api_token: z.string().optional(),
  nocodb__users__table_id: z.string().optional(),
  nocodb__users__view_id: z.string().optional(),
  nocodb__cms__table_id: z.string().optional(),
  nocodb__cms__view_id: z.string().optional(),
  nocodb__presigned_links__table_id: z.string().optional(),
  nocodb__presigned_links__view_id: z.string().optional(),
  features__whatsapp_link: z.string().optional(),
  features__geocodio_api_key: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse({
    app__base_url: process.env.app__base_url,
    app__node_env: process.env.app__node_env,
    nocodb__base_url: process.env.nocodb__base_url,
    nocodb__api_token: process.env.nocodb__api_token,
    nocodb__users__table_id: process.env.nocodb__users__table_id,
    nocodb__users__view_id: process.env.nocodb__users__view_id,
    nocodb__cms__table_id: process.env.nocodb__cms__table_id,
    nocodb__cms__view_id: process.env.nocodb__cms__view_id,
    nocodb__presigned_links__table_id:
      process.env.nocodb__presigned_links__table_id,
    nocodb__presigned_links__view_id:
      process.env.nocodb__presigned_links__view_id,
    features__whatsapp_link: process.env.features__whatsapp_link,
    features__geocodio_api_key: process.env.features__geocodio_api_key,
  });
  return cachedEnv;
}

/**
 * Centralized config. All values are read from env vars named
 * component__variable_name. Lazy validation: getters throw only when
 * a feature is used and its required vars are missing.
 */
export const config = {
  /** App-level (base URL, node env). Always available; base URL defaults to localhost. */
  get app() {
    const e = getEnv();
    const nodeEnv =
      e.app__node_env ??
      (process.env.NODE_ENV as "development" | "production" | "test" | undefined) ??
      "development";
    return {
      baseUrl: e.app__base_url ?? "http://localhost:3000",
      nodeEnv,
      isProduction: nodeEnv === "production",
    };
  },

  /**
   * NocoDB client (base URL + API token). Required for any NocoDB feature.
   * Env: nocodb__base_url, nocodb__api_token.
   */
  get nocodb() {
    const e = getEnv();
    if (!e.nocodb__base_url || !e.nocodb__api_token) {
      throw new Error(
        "Missing NocoDB configuration: nocodb__base_url and nocodb__api_token must be set"
      );
    }
    return {
      baseUrl: e.nocodb__base_url,
      apiToken: e.nocodb__api_token,
    };
  },

  /**
   * Users feature (table/view IDs). Required for get-involved / users.
   * Env: nocodb__users__table_id, nocodb__users__view_id.
   */
  get users(): { tableId: string; viewId: string } {
    const e = getEnv();
    if (!e.nocodb__users__table_id || !e.nocodb__users__view_id) {
      throw new Error(
        "Missing Users configuration: nocodb__users__table_id and nocodb__users__view_id must be set"
      );
    }
    return {
      tableId: e.nocodb__users__table_id,
      viewId: e.nocodb__users__view_id,
    };
  },

  /**
   * CMS feature (table/view IDs). Optional; returns null if not set.
   * Env: nocodb__cms__table_id, nocodb__cms__view_id.
   */
  get cms(): { tableId: string; viewId: string } | null {
    const e = getEnv();
    if (!e.nocodb__cms__table_id || !e.nocodb__cms__view_id) return null;
    return {
      tableId: e.nocodb__cms__table_id,
      viewId: e.nocodb__cms__view_id,
    };
  },

  /**
   * Presigned links feature (table/view IDs). Required when using presigned links.
   * Env: nocodb__presigned_links__table_id, nocodb__presigned_links__view_id.
   */
  get presignedLinks(): { tableId: string; viewId: string } {
    const e = getEnv();
    if (
      !e.nocodb__presigned_links__table_id ||
      !e.nocodb__presigned_links__view_id
    ) {
      throw new Error(
        "Missing PresignedLinks configuration: nocodb__presigned_links__table_id and nocodb__presigned_links__view_id must be set"
      );
    }
    return {
      tableId: e.nocodb__presigned_links__table_id,
      viewId: e.nocodb__presigned_links__view_id,
    };
  },

  /**
   * Optional feature flags / URLs. Env: features__whatsapp_link, features__geocodio_api_key.
   */
  get features() {
    const e = getEnv();
    return {
      whatsappLink:
      e.features__whatsapp_link ?? undefined,
      geocodioApiKey: e.features__geocodio_api_key,
    };
  },
};
